import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";
import { calculateTotalStats, calculateMagicAttack, applyDerivedMaxes } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI, showFloatingText, shakeScreen } from "./ui.js";
import { getLoot } from "./lootTables.js";
import { allItems } from "./items.js";
import { SKILLS_BY_CLASS } from "./classes.js";
import { recordEnemyKill, recordBossKill } from "./bestiary.js";
import { checkAchievements } from "./achievements.js";
import { saveGame } from "./saveSystem.js";
import { playSound, playMusic } from "./sounds.js";
import { showToast } from "./toast.js";
import { t, formatText, localizeText } from "./i18n.js";
import { getDifficultyConfig } from "./difficulty.js";
import { getMasteryBonus, addMasteryXP } from "./mastery.js";
import { getActiveSpec, canSpecialize } from "./specializations.js";
import { showSpecializationModal } from "./specModal.js";
import { maybeShowHint } from "./onboarding.js";
import { decideNextAction, isIntentHidden, POWER_ATTACK_MULT, DEFEND_DAMAGE_MULT, REGEN_PCT, ENRAGE_ATK_MULT } from "./enemyAI.js";
import { consumeEchoReward } from "./echoIntro.js";
import { cruelAtkMult, isIntentAlwaysHidden, modifierXpMult, scarceGoldMult, filterLoot } from "./modifiers.js";
import { showEnding } from "./endings.js";
import { recordRun } from "./runLog.js";
import {
  applyResistance, getWeaponDamageType, getResistanceLabel, getWeakestResistance,
  ENEMY_COMBAT_DATA, PHYSICAL_TYPES, DAMAGE_TYPE_EMOJI, DAMAGE_TYPES, getEffectiveResistances
} from "./damageTypes.js";

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Tipo de daño de cada habilidad de clase (para resistencias y bonos de especialización)
const SKILL_DAMAGE_TYPES = {
  fireball: "fire", meteor: "fire",
  icebolt: "ice",
  arcane_storm: "magic", singularity: "magic", arcane_bolt: "magic",
  backstab: "pierce", shadow_strike: "pierce", double_strike: "pierce",
  death_dance: "slash",
  bash: "blunt", power_strike: "blunt",
  whirlwind: "slash", berserker_rage: "slash", avatar_of_war: "slash",
};

// SPEC-1101: aturdimiento reusable — 15% en todo golpe crítico del jugador
// (hoy solo playerAttack tiene crits; playerMagic no rola crítico).
const STUN_ON_CRIT_CHANCE = 0.15;
// SPEC-1101: veneno acumulativo — tope de stacks (Swamp Abomination y cualquier
// otro enemigo con status "poison" ya se benefician del mismo sistema).
const POISON_MAX_STACKS = 5;
// SPEC-1101: mecánicas de boss — % del maxHp actual del jugador
const DEVOUR_HP_PCT = 0.35;
const OVERLOAD_HP_PCT = 0.35;
// SPEC-1101: Forest Titan — guardia de raíces
const GUARD_DAMAGE_MULT = 0.4;      // reduce daño físico entrante 60%
const GUARD_BREAK_CHANCE = 0.75;
const GUARD_BREAK_DMG_MULT = 0.5;   // "Romper Guardia" pega más flojo que un ataque normal
const GUARD_BREAK_DURATION = 2;     // turnos sin guardia tras romperla
// SPEC-1101: Frost Wyrm — duración de la congelación de magia
const ARCANE_FREEZE_DURATION = 3;

// SPEC-1102: icono/label/color por tipo de debuff de jugador (tick de daño)
const DEBUFF_TICK_META = {
  poison: { icon: "☠️", label: "Veneno",     color: "#4ade80" },
  burn:   { icon: "🔥", label: "Quemadura",  color: "#fb923c" },
  bleed:  { icon: "🩸", label: "Sangrado",   color: "#f87171" },
};

// SPEC-1102: Interrumpir — solo tiene sentido contra una acción "grande"
// telegrafiada, nunca contra attack/defend/regen/enrage/status.
const INTERRUPTIBLE_ACTIONS = new Set(["power_attack", "magic", "overload", "devour", "freeze_magic"]);
const INTERRUPT_MP_COST = 8;
const INTERRUPT_CHANCE = 0.6;
// SPEC-1102: contraataque universal vía Defender (independiente del bono de Duelista)
const DEFEND_COUNTER_CHANCE = 0.3;
const DEFEND_COUNTER_DMG_MULT = 0.5;
// SPEC-1103: rasgos aleatorios de enemigo (solo no-boss) — rejugabilidad
const ENEMY_TRAIT_CHANCE = 0.25;
const ENEMY_TRAITS = ["furious", "thief", "ancient", "regenerator", "coward"];
const THIEF_GOLD_STEAL_PCT = 0.15;
const COWARD_HP_THRESHOLD = 0.2;
const COWARD_FLEE_CHANCE = 0.6;

function maybeStunEnemy(enemy) {
  if (!enemy || enemy.hp <= 0) return false;
  if (gameState.activeDebuffs?.stunned) return false;
  if (Math.random() >= STUN_ON_CRIT_CHANCE) return false;
  if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
  gameState.activeDebuffs.stunned = { turns: 1 };
  addMessage(formatText(t('enemyStunnedByPlayer'), { enemy: enemy.type }), "combat");
  return true;
}

// SPEC-1103: resistencias efectivas del enemigo `enemyId` — usa el bono en
// memoria del rasgo "Antiguo" cuando `enemyId` es el enemigo actual de combate
// (gameState.currentEnemy); si no (ej. llamado en tests con un id arbitrario,
// sin combate en curso), cae a la base estática de ENEMY_COMBAT_DATA.
function resistancesFor(enemyId) {
  const enemy = gameState.currentEnemy;
  return (enemy && enemy.id === enemyId) ? getEffectiveResistances(enemy) : ENEMY_COMBAT_DATA[enemyId]?.resistances;
}

// Nota "(🔥 Vuln. 30%)" para el log cuando el enemigo resiste o es vulnerable
function resistanceNote(enemyId, damageType) {
  const res = resistancesFor(enemyId)?.[damageType] ?? 0;
  if (!res) return "";
  return ` (${DAMAGE_TYPE_EMOJI[damageType] || ""} ${getResistanceLabel(res)})`;
}

// SPEC-0904 — recomendación táctica cuando el golpe fue resistido (≥20%).
// Pura: decide QUÉ aconsejar; null si no procede.
export function resistanceAdviceFor(enemyId, damageType) {
  const res = resistancesFor(enemyId);
  if (!res || (res[damageType] ?? 0) < 20) return null;
  const bad = DAMAGE_TYPES[damageType] || damageType;
  const weakest = getWeakestResistance(res);
  if (weakest && weakest.value < 0) {
    return { key: "combatResistAdviceVuln", params: { bad, good: DAMAGE_TYPES[weakest.type] || weakest.type } };
  }
  return { key: "combatResistAdvice", params: { bad } };
}

// Una sola vez por combate, para no llenar el log
function maybeResistanceAdvice(enemy, damageType) {
  if (!enemy || enemy._resAdviceShown) return;
  const advice = resistanceAdviceFor(enemy.id, damageType);
  if (!advice) return;
  enemy._resAdviceShown = true;
  addMessage(formatText(advice.key, advice.params), "system");
}

function grantMasteryXP(damageType, amount = 5) {
  const tierUp = addMasteryXP(damageType, amount);
  if (tierUp) {
    const label = DAMAGE_TYPES[tierUp.type] || tierUp.type;
    const msg = formatText(t('masteryTierUp'), { type: label, tier: `${tierUp.tier.emoji} ${tierUp.tier.title}` });
    addMessage(msg, "stat");
    showToast(msg);
    playSound("level_up");
  }
}

// ── Status effects que cada enemigo puede aplicar al jugador ────────
const ENEMY_STATUS_EFFECTS = {
  slime:             { type: "poison", chance: 0.30, damage: 3,  turns: 2 },
  fungedBeast:       { type: "poison", chance: 0.20, damage: 3,  turns: 2 },
  cave_bat:          { type: "poison", chance: 0.25, damage: 4,  turns: 2 },
  goblin_shaman:     { type: "burn",   chance: 0.35, damage: 5,  turns: 2 },
  warlock:           { type: "burn",   chance: 0.40, damage: 8,  turns: 3 },
  vampire:           { type: "stun",   chance: 0.25, turns: 1 },
  medusa:            { type: "stun",   chance: 0.30, turns: 1 },
  lava_golem:        { type: "burn",   chance: 0.35, damage: 8,  turns: 2 },
  Inferno_elemental: { type: "burn",   chance: 0.40, damage: 10, turns: 2 },
  pyro_elemental:    { type: "burn",   chance: 0.45, damage: 10, turns: 2 },
  inferno_dragon:    { type: "burn",   chance: 0.50, damage: 12, turns: 3 },
  dragon_king:       { type: "burn",   chance: 0.45, damage: 15, turns: 3 },
  // SPEC-1101: Swamp Abomination — veneno acumulativo (sistema compartido de
  // stacks); behavior "status" ya le da ~50% de elegir "status" como acción
  // (aplicación garantizada), + este chance en cualquier otra acción.
  swamp_abomination: { type: "poison", chance: 0.30, damage: 6, turns: 3 },
  // SPEC-1102: sangrado — enemigos de garras/hoja cortante (attackDamageType
  // "slash" en damageTypes.js), no acumula stacks (mismo patrón que quemadura).
  jungle_tiger:      { type: "bleed",  chance: 0.35, damage: 5,  turns: 3 },
  pirate_captain:    { type: "bleed",  chance: 0.30, damage: 6,  turns: 3 },
};

export function setupCombat() {
  window.addEventListener("pixel:attack", () => handleAction(playerAttack));
  window.addEventListener("pixel:magic",  () => handleAction(playerMagic));
  window.addEventListener("pixel:defend", () => handleAction(playerDefend));
  window.addEventListener("pixel:breakGuard", () => handleAction(playerBreakGuard));
  window.addEventListener("pixel:interrupt", () => handleAction(playerInterrupt));
  window.addEventListener("pixel:flee",   () => handleAction(tryFlee));
  window.addEventListener("pixel:startCombat", (e) => startCombat(e.detail?.enemyId, e.detail?.isBoss));
  window.addEventListener("pixel:useSkill", (e) => handleAction(() => useSkill(e.detail?.skillId)));
}

let busy = false;
async function handleAction(fn) {
  if (busy || !gameState.isInCombat) return;
  busy = true;
  // Stun: player loses this turn
  if (gameState.playerDebuffs?.stun?.turns > 0) {
    gameState.playerDebuffs.stun.turns--;
    if (gameState.playerDebuffs.stun.turns <= 0) delete gameState.playerDebuffs.stun;
    addMessage(t('combatStunned'), "combat");
    updateUI();
    await delay(600);
    await enemyTurn();
    busy = false;
    return;
  }
  await fn();
  busy = false;
}

export function getRandomEncounter(locationId) {
  const loc = window.worldMap?.[locationId];
  if (!loc) return null;
  const list = loc.enemies || [];
  const rate = typeof loc.encounterRate === "number" ? loc.encounterRate : 0.25;
  if (!list.length) return null;
  if (Math.random() < rate) return list[Math.floor(Math.random() * list.length)];
  return null;
}

// SPEC-1101: contadores de turno propios (no RNG) para Cave Devourer /
// Ancient Construct — se telegrafían como cualquier otra acción, así el
// jugador siempre los ve venir con 1 turno de antelación.
function rollForcedBossAction(enemy) {
  if (enemy.id === "cave_devourer") {
    enemy.turnsSinceDevour = enemy.turnsSinceDevour ?? 0;
    if (enemy.turnsSinceDevour >= 2) return "devour";
    enemy.turnsSinceDevour++;
  }
  if (enemy.id === "ancient_construct") {
    enemy.turnsSinceOverload = enemy.turnsSinceOverload ?? 0;
    if (enemy.turnsSinceOverload >= 3) return "overload";
    enemy.turnsSinceOverload++;
  }
  if (enemy.id === "mountain_colossus") {
    enemy.turnsSinceSlam = enemy.turnsSinceSlam ?? 0;
    if (enemy.turnsSinceSlam >= 3) { enemy.turnsSinceSlam = 0; return "power_attack"; }
    enemy.turnsSinceSlam++;
  }
  if (enemy.id === "frost_wyrm") {
    enemy.turnsSinceFreeze = enemy.turnsSinceFreeze ?? 0;
    if (enemy.turnsSinceFreeze >= 3) return "freeze_magic";
    enemy.turnsSinceFreeze++;
  }
  return null;
}

// SPEC-1101 — Dragon King: mensaje de flavor al escalar de fase. Nunca
// retrocede si el HP sube (no hay regen en dragon_king, pero por si acaso).
function updateBossPhase(enemy) {
  if (ENEMY_COMBAT_DATA[enemy.id]?.behavior !== "boss_phased") return;
  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const phase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
  const prev = enemy.bossPhase || 1;
  if (phase > prev) {
    enemy.bossPhase = phase;
    addMessage(formatText(t(`dragonKingPhase${phase}`), { enemy: enemy.type }), "combat");
    shakeScreen();
  } else if (!enemy.bossPhase) {
    enemy.bossPhase = 1;
  }
}

// SPEC-0802: pre-decide la próxima acción del enemigo (y si un jefe la oculta)
// para que el chip de intent siempre anuncie futuro, nunca pasado.
function rollEnemyIntent() {
  const enemy = gameState.currentEnemy;
  if (!enemy || enemy.hp <= 0) return;
  updateBossPhase(enemy);
  const forced = rollForcedBossAction(enemy);
  if (forced) {
    enemy.nextAction = forced;
    enemy.intentHidden = isIntentAlwaysHidden(gameState) || isIntentHidden(enemy);
    return;
  }
  // SPEC-1103: rasgo "Regenerador" — cuenta turnos desde el último daño de fuego
  enemy.turnsSinceFireHit = (enemy.turnsSinceFireHit ?? 99) + 1;
  enemy.nextAction = decideNextAction({
    behavior: ENEMY_COMBAT_DATA[enemy.id]?.behavior,
    isBoss: enemy.isBoss,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    magicAttack: enemy.magicAttack,
    hasStatusEffect: !!ENEMY_STATUS_EFFECTS[enemy.id],
    lastAction: enemy.lastAction,
    enraged: enemy.enraged,
    hasRegenTrait: enemy.trait === "regenerator",
    recentlyBurned: (enemy.turnsSinceFireHit ?? 99) < 2
  });
  enemy.intentHidden = isIntentAlwaysHidden(gameState) || isIntentHidden(enemy);
}

export function startCombat(enemyType, isBoss = false) {
  const base = enemyData?.[enemyType];
  if (!base) { addMessage(formatText(t('enemyUnknownError'), { type: enemyType }), "system"); return; }

  const lvl = gameState.player.level - 1;
  const lvlMult = isBoss
    ? 1.6 + lvl * 0.08   // jefes escalan más fuerte
    : 1   + lvl * 0.05;
  const diff = getDifficultyConfig(gameState.difficulty);
  const scaledHp  = Math.floor((base.maxHp  ?? base.hp  ?? 10)  * lvlMult * diff.hp);
  const scaledAtk = Math.floor((base.attack ?? 5) * (isBoss ? 1.4 + lvl * 0.04 : 1) * diff.atk * cruelAtkMult(gameState));
  const scaledDef = Math.floor((base.defense ?? 0) * diff.def);

  gameState.currentEnemy = {
    id: enemyType,
    ...base,
    hp:      scaledHp,
    maxHp:   scaledHp,
    attack:  scaledAtk,
    defense: scaledDef,
    isBoss,
    // SPEC-1101: estado propio por-boss, en memoria (no toca el save, mismo
    // patrón que nextAction/enraged/isDefending)
    hasGuard: enemyType === "forest_titan",
    guardBroken: 0,
    turnsSinceDevour: 0,
    turnsSinceOverload: 0,
    turnsSinceFireHit: 99
  };

  // SPEC-1103: rasgos aleatorios de enemigo (solo no-boss, rejugabilidad)
  if (!isBoss && Math.random() < ENEMY_TRAIT_CHANCE) {
    const trait = ENEMY_TRAITS[Math.floor(Math.random() * ENEMY_TRAITS.length)];
    gameState.currentEnemy.trait = trait;
    if (trait === "furious") {
      gameState.currentEnemy.attack = Math.max(1, Math.floor(gameState.currentEnemy.attack * 1.35));
      gameState.currentEnemy.defense = Math.max(0, Math.floor(gameState.currentEnemy.defense * 0.75));
    } else if (trait === "ancient") {
      gameState.currentEnemy.traitResistances = { physical: 30, light: -30 };
    }
    const traitKey = { furious: "traitFurious", thief: "traitThief", ancient: "traitAncient", regenerator: "traitRegenerator", coward: "traitCoward" }[trait];
    gameState.currentEnemy.type = `${gameState.currentEnemy.type} ${t(traitKey)}`;
  }

  gameState.isInCombat = true;
  gameState.activeDebuffs  = {};
  gameState.playerDebuffs  = {};

  if (isBoss) {
    addMessage(formatText(t('bossAppears'), { enemy: gameState.currentEnemy.type }), "combat");
    showFloatingText(t('bossAlert'), window.innerWidth / 2 - 40, window.innerHeight / 2 - 100, "#ff4444", "1.8em");
    if (enemyType === "dragon_king") {
      setTimeout(() => addMessage(t("dragonKingQuestion"), "system"), 900);
    }
  } else {
    addMessage(formatText(t('enemyAppears'), { enemy: gameState.currentEnemy.type }), "combat");
  }
  playSound("combat_start");
  playMusic("combat");
  rollEnemyIntent(); // SPEC-0802: primer telegraph antes de pintar el panel
  updateUI();
  maybeShowHint("first_combat"); // SPEC-0801: primer combate
}

// ── Player Actions ──────────────────────────────────────
// SPEC-1101: Defender universal — versión gratuita y de 1 turno del mismo
// defend_stance que ya usa la skill "Postura Defensiva" del Guerrero (que
// sigue siendo mejor: 3 turnos + cura 15% HP, por su costo de MP/nivel).
async function playerDefend() {
  if (!gameState.activeBuffs) gameState.activeBuffs = {};
  // tickBuffs() de abajo resta 1 antes de que enemyTurn() lo lea — necesita
  // 2 para sobrevivir hasta el chequeo de defenseMult (mismo patrón que
  // buffTurns:3 en useSkill, que en la práctica cubre 1 ataque enemigo).
  gameState.activeBuffs.defend_stance = Math.max(gameState.activeBuffs.defend_stance || 0, 2);
  addMessage(t('combatDefendMsg'), "combat");
  playSound("defend");

  tickBuffs();
  updateUI();
  await delay(500); await enemyTurn();
}

// SPEC-1101 — Forest Titan: golpe especial de daño bajo que puede romper la
// guardia de raíces. Solo visible/disponible cuando enemy.hasGuard (ver
// toggleBreakGuardButton en ui.js).
async function playerBreakGuard() {
  const enemy = gameState.currentEnemy;
  if (!enemy?.hasGuard) return;
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const weaponType = getWeaponDamageType(gameState.equipment?.rightHand);
  const enemyRes = getEffectiveResistances(enemy);
  const rawDmg = Math.max(1, Math.floor(stats.attack * GUARD_BREAK_DMG_MULT) - (enemy.defense || 0));
  const dmg = applyResistance(Math.max(1, rawDmg), weaponType, enemyRes);

  playSound("attack");
  // Ataque especial: no pasa por la reducción de guardia (todo su punto es romperla)
  applyDamageToEnemy(dmg);
  playSound("hit");

  const broke = !(enemy.guardBroken > 0) && Math.random() < GUARD_BREAK_CHANCE;
  if (broke) {
    enemy.guardBroken = GUARD_BREAK_DURATION;
    addMessage(formatText(t('breakGuardSuccess'), { enemy: enemy.type, damage: dmg }), "combat");
  } else {
    addMessage(formatText(t('breakGuardFail'), { enemy: enemy.type, damage: dmg }), "combat");
  }
  showFloatingText(`-${dmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#FDBA74", "2em");
  shakeScreen();

  tickBuffs();
  updateUI();
  if (enemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700); await enemyTurn();
}

// SPEC-1102 — Interrumpir: cancela la acción cargada del enemigo. Solo
// disponible cuando enemy.nextAction es "grande" (ver toggleInterruptButton
// en ui.js, mismo patrón condicional que "Romper Guardia").
async function playerInterrupt() {
  const enemy = gameState.currentEnemy;
  if (!enemy || !INTERRUPTIBLE_ACTIONS.has(enemy.nextAction)) return;
  if ((gameState.player.mp || 0) < INTERRUPT_MP_COST) {
    addMessage(t('notEnoughMana'), "system");
    return;
  }
  gameState.player.mp -= INTERRUPT_MP_COST;

  const success = Math.random() < INTERRUPT_CHANCE;
  if (success) {
    // La acción interrumpida no debe poder re-telegrafiarse de inmediato —
    // resetea el contador de turno del boss correspondiente (si aplica).
    if (enemy.id === "cave_devourer")    enemy.turnsSinceDevour = 0;
    if (enemy.id === "ancient_construct") enemy.turnsSinceOverload = 0;
    if (enemy.id === "frost_wyrm")        enemy.turnsSinceFreeze = 0;
    enemy.nextAction = "interrupted";
    addMessage(formatText(t('interruptSuccess'), { enemy: enemy.type }), "combat");
  } else {
    addMessage(formatText(t('interruptFail'), { enemy: enemy.type }), "combat");
  }

  tickBuffs();
  updateUI();
  await delay(500); await enemyTurn();
}

async function playerAttack() {
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const enemy = gameState.currentEnemy;
  const spec = getActiveSpec();
  const weaponType = getWeaponDamageType(gameState.equipment?.rightHand);
  const enemyRes = getEffectiveResistances(enemy);

  // Warcry buff + maestría de arma + bono de especialización por tipo de daño
  const masteryBonus = getMasteryBonus(weaponType);
  const specDmgBonus = spec?.bonuses?.dmgType === weaponType ? (spec.bonuses.dmgBonus || 0) : 0;
  const atkMult = (gameState.activeBuffs?.warcry > 0 ? 1.3 : 1.0) * (1 + masteryBonus + specDmgBonus);
  const rawDmg = Math.floor(stats.attack * atkMult);
  const defense = enemy.defense || 0;
  const variance = 0.9 + Math.random() * 0.2;

  // Rogue: chance of double strike
  let extraHit = 0;
  if (gameState.player.class === "rogue" && gameState.player.level >= 15 && Math.random() < 0.3) {
    extraHit = applyResistance(Math.max(1, Math.floor(rawDmg * 0.7)), weaponType, enemyRes);
  }

  // Critical hit: 10% base + AGI * 0.5% (rogues +10%, spec critBonus)
  const critChance = 0.10
    + (gameState.player.agility || 0) * 0.005
    + (gameState.player.class === "rogue" ? 0.10 : 0)
    + (spec?.bonuses?.critBonus || 0);
  const isCrit  = Math.random() < critChance;
  const critMul = isCrit ? 1.75 : 1.0;

  const dmg = applyResistance(Math.max(1, Math.floor((rawDmg - defense) * variance * critMul)), weaponType, enemyRes);
  const total = dmg + extraHit;

  playSound("attack");
  applyDamageToEnemy(total, weaponType);
  playSound("hit");

  const critLabel = isCrit ? " 💥 ¡CRÍTICO!" : "";
  addMessage(formatText(t('attackEnemy'), {
    enemy: enemy.type,
    damage: dmg,
    extra: extraHit ? ` + ${extraHit} (${t('doubleStrike')})` : "",
    crit: critLabel
  }) + resistanceNote(enemy.id, weaponType), "combat");
  maybeResistanceAdvice(enemy, weaponType);
  if (isCrit) maybeStunEnemy(enemy);

  grantMasteryXP(weaponType);

  // Asesino: los ataques normales pueden envenenar
  if (spec?.bonuses?.poisonOnAttack && enemy.hp > 0 && Math.random() < 0.25 && !gameState.activeDebuffs?.poison) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs.poison = { turns: 2, damage: Math.max(2, Math.floor(stats.attack * 0.15)) };
    addMessage(formatText(t('specPoisonMsg'), { enemy: enemy.type }), "combat");
  }
  showFloatingText(`-${total}${isCrit ? "!" : ""}`,
    window.innerWidth/2+50, window.innerHeight/2-50,
    "#ef4444", "2em", isCrit ? "critical" : "");
  shakeScreen();

  tickBuffs();
  updateUI();
  if (enemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700); await enemyTurn();
}

async function playerMagic() {
  // SPEC-1101: Frost Wyrm congela la magia — el botón se deshabilita en UI,
  // pero el atajo de teclado "2" no respeta `disabled`, así que se bloquea
  // acá también. No consume el turno (mismo patrón que "sin MP suficiente").
  if (gameState.playerDebuffs?.arcaneFreeze) {
    addMessage(t('arcaneFreezeBlocksMagic'), "system");
    showFloatingText(t('arcaneFreezeIcon'), window.innerWidth/2, window.innerHeight/2, "#93C5FD");
    return;
  }

  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const spec = getActiveSpec();
  const enemy = gameState.currentEnemy;
  let cost = gameState.player.class === "mage" && gameState.player.level >= 10 ? 7 : 10;
  if (spec?.bonuses?.mpDiscount) cost = Math.max(1, Math.round(cost * (1 - spec.bonuses.mpDiscount)));

  if ((gameState.player.mp || 0) < cost) {
    addMessage(t('notEnoughMana'), "system");
    showFloatingText(t('noMana'), window.innerWidth/2, window.innerHeight/2, "#818cf8");
    return;
  }

  gameState.player.mp -= cost;
  const mult = gameState.player.class === "mage" && gameState.player.level >= 20 ? 2.0 : 1.0;
  // Escuela de magia: el ataque mágico toma el elemento de la especialización
  const magicType = spec?.bonuses?.dmgType || "magic";
  const magicBonus = 1 + getMasteryBonus(magicType) + (spec?.bonuses?.dmgBonus || 0);
  // SPEC-1102: Concentrarse — +50% al próximo hechizo, se consume acá (no
  // decae por turnos: si el jugador no lanza magia mientras esté activo,
  // simplemente expira solo sin bonus).
  const wasFocused = gameState.activeBuffs?.focused > 0;
  const focusMult = wasFocused ? 1.5 : 1.0;
  if (wasFocused) delete gameState.activeBuffs.focused;
  let dmg = Math.max(1, Math.floor(calculateMagicAttack(stats) * mult * magicBonus * focusMult * (0.9 + Math.random()*0.2)));
  dmg = applyResistance(dmg, magicType, getEffectiveResistances(enemy));

  playSound("magic");
  applyDamageToEnemy(dmg, magicType);
  playSound("hit");
  addMessage(formatText(t('castMagic'), { damage: dmg }) + resistanceNote(enemy.id, magicType) + (wasFocused ? ` ${t('focusedBonusTag')}` : ""), "combat");
  maybeResistanceAdvice(enemy, magicType);
  grantMasteryXP(magicType);
  showFloatingText(`-${dmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#818cf8", "2.4em");
  shakeScreen();

  tickBuffs();
  updateUI();
  if (gameState.currentEnemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700); await enemyTurn();
}

async function useSkill(skillId) {
  const p = gameState.player;
  const skills = SKILLS_BY_CLASS[p.class] || [];
  const skill = skills.find(s => s.id === skillId);
  if (!skill) { addMessage(t('skillNotFound'), "system"); return; }
  if (p.level < skill.levelReq) { addMessage(formatText(t('skillLevelRequired'), { level: skill.levelReq }), "system"); return; }
  const spec = getActiveSpec();
  let mpCost = skill.mpCost;
  if (spec?.bonuses?.mpDiscount) mpCost = Math.max(1, Math.round(mpCost * (1 - spec.bonuses.mpDiscount)));
  if ((p.mp || 0) < mpCost) { addMessage(t('noMana'), "system"); return; }

  const stats = calculateTotalStats(p, gameState.equipment);
  const result = skill.effect(stats, gameState.currentEnemy, p);

  p.mp -= mpCost;
  playSound("skill");
  addMessage(`${skill.emoji} ${result.msg}`, "combat");

  // Apply damage
  if (result.damage) {
    let dmg = result.ignoresDef ? result.damage : Math.max(1, result.damage - (gameState.currentEnemy?.defense || 0));
    const skillType = SKILL_DAMAGE_TYPES[skill.id];
    if (skillType) {
      const specBonus = spec?.bonuses?.dmgType === skillType ? (spec.bonuses.dmgBonus || 0) : 0;
      dmg = Math.max(1, Math.floor(dmg * (1 + getMasteryBonus(skillType) + specBonus)));
      dmg = applyResistance(dmg, skillType, getEffectiveResistances(gameState.currentEnemy));
      maybeResistanceAdvice(gameState.currentEnemy, skillType);
      grantMasteryXP(skillType);
    }
    applyDamageToEnemy(dmg, skillType || "physical");
    playSound("hit");
    showFloatingText(`-${dmg}`, window.innerWidth/2+60, window.innerHeight/2-60, "#fbbf24", "2.2em");
    shakeScreen();
  }

  // Apply heal
  if (result.heal) {
    p.hp = Math.min(p.maxHp, (p.hp || 0) + result.heal);
    showFloatingText(`+${result.heal}`, window.innerWidth/2-60, window.innerHeight/2-40, "#4ade80", "1.8em", "heal");
  }

  // Apply buffs
  if (result.buff) {
    if (!gameState.activeBuffs) gameState.activeBuffs = {};
    gameState.activeBuffs[result.buff] = result.buffTurns || 3;
  }

  // Apply debuffs to enemy
  if (result.debuff) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    let debuffTurns = result.debuffTurns || 2;
    // Escuela de Hielo: los congelamientos duran 1 turno extra
    if (result.debuff === "frozen" && spec?.bonuses?.extraFrozenTurn) debuffTurns += 1;
    gameState.activeDebuffs[result.debuff] = {
      turns: debuffTurns,
      damage: result.debuffDmg || 0
    };
  }

  // Escape (smoke bomb)
  if (result.escape) {
    endCombat(false, true);
    return;
  }

  tickBuffs();
  updateUI();

  if (gameState.currentEnemy?.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700);
  await enemyTurn();
}

async function tryFlee() {
  const agiMod = (gameState.player.agility || 0) * 0.02;
  const chance = 0.4 + agiMod
    + (gameState.player.class === "rogue" ? 0.15 : 0)
    + (getActiveSpec()?.bonuses?.fleeBonus || 0);
  if (Math.random() < chance) {
    playSound("flee");
    // SPEC-1103: rasgo "Ladrón" — roba oro cuando el jugador huye con éxito
    const enemy = gameState.currentEnemy;
    if (enemy?.trait === "thief" && gameState.player.gold > 0) {
      const stolen = Math.max(1, Math.floor(gameState.player.gold * THIEF_GOLD_STEAL_PCT));
      gameState.player.gold = Math.max(0, gameState.player.gold - stolen);
      addMessage(formatText(t('enemyStealsGold'), { enemy: enemy.type, gold: stolen }), "system");
    }
    addMessage(t('fleeSuccess'), "system");
    endCombat(false, true);
  } else {
    addMessage(t('fleeFail'), "system");
    await delay(500); await enemyTurn();
  }
}

// ── Enemy Turn ─────────────────────────────────────────
// SPEC-1103: rasgo "Cobarde" — bajo COWARD_HP_THRESHOLD, chance por turno de
// huir sin dar recompensa (simétrico a tryFlee() del jugador). true = huyó.
function checkCowardFlee(enemy) {
  if (enemy.trait !== "coward" || enemy.hp <= 0) return false;
  if (enemy.hp / enemy.maxHp >= COWARD_HP_THRESHOLD) return false;
  if (Math.random() >= COWARD_FLEE_CHANCE) return false;
  addMessage(formatText(t('enemyFleesCoward'), { enemy: enemy.type }), "system");
  endCombat(false, false, true);
  return true;
}

async function enemyTurn() {
  if (!gameState.currentEnemy || gameState.isGameOver) return;
  const enemy = gameState.currentEnemy;
  const p = gameState.player;
  const stats = calculateTotalStats(p, gameState.equipment);

  // SPEC-0802: la guardia expira al empezar su turno — así los ticks de
  // veneno/quemadura de abajo hacen daño completo
  enemy.isDefending = false;

  // SPEC-1101: la guardia de raíces (Forest Titan) se restaura sola pasados
  // los turnos de "Romper Guardia"
  if (enemy.guardBroken > 0) {
    enemy.guardBroken--;
    if (enemy.guardBroken <= 0) addMessage(formatText(t('enemyGuardRestored'), { enemy: enemy.type }), "system");
  }

  // SPEC-1103: rasgo "Cobarde" — huye solo (sin recompensa) bajo cierto % de HP
  if (checkCowardFlee(enemy)) return;

  // Tick player debuffs (poison/burn damage)
  if (processPlayerDebuffs()) return;

  // Apply poison damage to enemy
  if (gameState.activeDebuffs?.poison) {
    const poisonInfo = gameState.activeDebuffs.poison;
    const poisonDmg = poisonInfo.damage || 3;
    applyDamageToEnemy(poisonDmg);
    addMessage(formatText(t('enemyPoisonDamage'), { enemy: enemy.type, damage: poisonDmg }), "combat");
    poisonInfo.turns--;
    if (poisonInfo.turns <= 0) { delete gameState.activeDebuffs.poison; addMessage(t('poisonWearsOff'), "system"); }
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // Apply burn damage to enemy
  if (gameState.activeDebuffs?.burn) {
    const burnInfo = gameState.activeDebuffs.burn;
    const burnDmg = burnInfo.damage || 3;
    applyDamageToEnemy(burnDmg);
    addMessage(formatText(t('enemyBurnDamage'), { enemy: enemy.type, damage: burnDmg }), "combat");
    burnInfo.turns--;
    if (burnInfo.turns <= 0) { delete gameState.activeDebuffs.burn; addMessage(t('burnWearsOff'), "system"); }
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // Frozen: enemy attacks less
  const frozenDebuff = gameState.activeDebuffs?.frozen;
  const frozenMult = frozenDebuff ? 0.75 : 1.0;
  if (frozenDebuff) {
    frozenDebuff.turns--;
    if (frozenDebuff.turns <= 0) { delete gameState.activeDebuffs.frozen; addMessage(t('frozenWearsOff'), "system"); }
  }

  // SPEC-1101: aturdido — pierde el turno por completo (no telegrafía nada nuevo hasta que expire)
  if (gameState.activeDebuffs?.stunned) {
    const stunInfo = gameState.activeDebuffs.stunned;
    addMessage(formatText(t("enemyStunned"), { enemy: enemy.type }), "combat");
    stunInfo.turns--;
    if (stunInfo.turns <= 0) delete gameState.activeDebuffs.stunned;
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-0802: ejecuta la acción telegrafiada (el chip mostró esto al jugador)
  const action = enemy.nextAction || "attack";
  enemy.lastAction = action;

  if (action === "defend") {
    enemy.isDefending = true;
    addMessage(formatText(t("enemyDefends"), { enemy: enemy.type }), "combat");
    rollEnemyIntent();
    updateUI();
    return;
  }
  if (action === "regen") {
    const heal = Math.max(1, Math.floor(enemy.maxHp * REGEN_PCT));
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
    addMessage(formatText(t("enemyRegens"), { enemy: enemy.type, heal }), "combat");
    showFloatingText(`+${heal}`, window.innerWidth / 2 + 50, window.innerHeight / 2 - 80, "#4ade80", "1.6em");
    rollEnemyIntent();
    updateUI();
    return;
  }
  if (action === "enrage") {
    enemy.enraged = true;
    enemy.attack = Math.max(1, Math.floor(enemy.attack * ENRAGE_ATK_MULT));
    addMessage(formatText(t("enemyEnrages"), { enemy: enemy.type }), "combat");
    shakeScreen();
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Frost Wyrm: congela la magia del jugador cada 3er turno
  // (contador propio, no daño). Bloquea el botón Magia en UI y en lógica
  // (playerMagic ya chequea playerDebuffs.arcaneFreeze).
  if (action === "freeze_magic") {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    gameState.playerDebuffs.arcaneFreeze = { turns: ARCANE_FREEZE_DURATION };
    addMessage(formatText(t("enemyFreezesMagic"), { enemy: enemy.type }), "combat");
    showFloatingText(t('arcaneFreezeIcon'), window.innerWidth/2, window.innerHeight/2 - 40, "#93C5FD", "1.8em");
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1102: acción cancelada por "Interrumpir" — el enemigo no actúa este turno
  if (action === "interrupted") {
    addMessage(formatText(t("enemyInterrupted"), { enemy: enemy.type }), "combat");
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Cave Devourer: "devorar" cada 3er turno (contador propio, no
  // RNG), telegrafiado con antelación por rollEnemyIntent como cualquier otra
  // acción. Daño = % del maxHp actual del jugador, pasado por el mismo
  // defenseMult que un ataque normal — Defender lo reduce a la mitad sin
  // lógica especial de "¿respondió bien?".
  if (action === "devour") {
    const devourMult = gameState.activeBuffs?.defend_stance > 0 ? DEFEND_DAMAGE_MULT : 1.0;
    if (gameState.activeBuffs?.defend_stance > 0) {
      gameState.activeBuffs.defend_stance--;
      if (gameState.activeBuffs.defend_stance <= 0) delete gameState.activeBuffs.defend_stance;
    }
    const devourDmg = Math.max(1, Math.floor((p.maxHp || 100) * DEVOUR_HP_PCT * devourMult));
    p.hp = Math.max(0, (p.hp || 0) - devourDmg);
    playSound("player_hurt");
    addMessage(formatText(t("enemyDevours"), { enemy: enemy.type, damage: devourDmg }), "combat");
    showFloatingText(`-${devourDmg}`, window.innerWidth/2, window.innerHeight/2, "#ef4444", "2.2em", "critical");
    shakeScreen();
    enemy.turnsSinceDevour = 0;
    if (p.hp <= 0) {
      p.hp = 0;
      gameState.isGameOver = true;
      gameState.isInCombat = false;
      playSound("player_die");
      addMessage(t('combatStatusEffectsDefeat'), "combat");
      recordRun("defeat");
      updateUI();
      setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
      return;
    }
    rollEnemyIntent();
    updateUI();
    return;
  }

  // SPEC-1101 — Ancient Construct: "sobrecarga" cada 4to turno, daño mágico
  // fijo. Mismo patrón de contador que devour, pero se contrarresta con
  // Defender (no con aturdir, para diferenciarlo de Cave Devourer).
  if (action === "overload") {
    const overloadMult = gameState.activeBuffs?.defend_stance > 0 ? DEFEND_DAMAGE_MULT : 1.0;
    if (gameState.activeBuffs?.defend_stance > 0) {
      gameState.activeBuffs.defend_stance--;
      if (gameState.activeBuffs.defend_stance <= 0) delete gameState.activeBuffs.defend_stance;
    }
    const overloadDmg = Math.max(1, Math.floor((p.maxHp || 100) * OVERLOAD_HP_PCT * overloadMult));
    p.hp = Math.max(0, (p.hp || 0) - overloadDmg);
    playSound("player_hurt");
    addMessage(formatText(t("enemyOverloads"), { enemy: enemy.type, damage: overloadDmg }), "combat");
    showFloatingText(`-${overloadDmg}`, window.innerWidth/2, window.innerHeight/2, "#818cf8", "2.2em", "critical");
    shakeScreen();
    enemy.turnsSinceOverload = 0;
    if (p.hp <= 0) {
      p.hp = 0;
      gameState.isGameOver = true;
      gameState.isInCombat = false;
      playSound("player_die");
      addMessage(t('combatStatusEffectsDefeat'), "combat");
      recordRun("defeat");
      updateUI();
      setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
      return;
    }
    rollEnemyIntent();
    updateUI();
    return;
  }

  const useMagic = action === "magic" && enemy.magicAttack;
  const powerMult = action === "power_attack" ? POWER_ATTACK_MULT : 1.0;
  const atkBase = useMagic ? (enemy.magicAttack || 5) : (enemy.attack || 5);
  const atkVal = Math.floor(atkBase * powerMult * frozenMult);

  // Player defense (warrior stance halves damage)
  // SPEC-1102: se guarda ANTES de decrementar — el contraataque universal de
  // Defender depende de que la guardia haya estado activa este turno.
  const wasDefending = gameState.activeBuffs?.defend_stance > 0;
  const defenseMult = wasDefending ? 0.5 : 1.0;
  if (gameState.activeBuffs?.defend_stance > 0) {
    gameState.activeBuffs.defend_stance--;
    if (gameState.activeBuffs.defend_stance <= 0) delete gameState.activeBuffs.defend_stance;
  }

  // Arcane shield absorbs 40%
  const shieldMult = gameState.activeBuffs?.arcane_shield > 0 ? 0.6 : 1.0;
  if (gameState.activeBuffs?.arcane_shield > 0) {
    delete gameState.activeBuffs.arcane_shield;
    addMessage(t('arcaneShieldAbsorbs'), "system");
  }

  // Rogue evasion (+ especialización Duelista)
  const spec = getActiveSpec();
  const evasionChance = (stats.agility || 0) * 0.01
    + (p.class === "rogue" ? 0.1 : 0)
    + (p.level >= 5 && p.class === "rogue" ? 0.25 : 0)
    + (spec?.bonuses?.evasionBonus || 0);
  if (Math.random() < evasionChance) {
    addMessage(formatText(t('enemyAttackDodged'), { enemy: enemy.type }), "combat");
    // Duelista: 25% de contraatacar al esquivar
    if (spec?.bonuses?.counterattack && Math.random() < 0.25) {
      const counterDmg = Math.max(1, Math.floor((stats.attack || 1) * 0.5));
      applyDamageToEnemy(counterDmg, "physical");
      playSound("attack");
      addMessage(formatText(t('counterattackMsg'), { damage: counterDmg }), "combat");
      showFloatingText(`-${counterDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#fbbf24", "1.6em");
      if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
    }
    rollEnemyIntent(); // SPEC-0802: la acción esquivada se consumió
    updateUI(); return;
  }

  // Tipo de daño del enemigo vs resistencias del jugador (clase + equipo)
  const enemyCombat = ENEMY_COMBAT_DATA[enemy.id];
  const atkType = useMagic
    ? (enemyCombat?.magicDamageType || "magic")
    : (enemyCombat?.attackDamageType || "physical");

  const defVal = Math.floor(stats.defense || 0);
  const variance = 0.85 + Math.random() * 0.3;
  const rawDmg = Math.max(0, atkVal - defVal);
  let finalDmg = Math.max(1, Math.floor(rawDmg * variance * defenseMult * shieldMult));
  // Maestro de Escudos: -25% daño físico recibido
  if (spec?.bonuses?.physicalDefenseBonus && PHYSICAL_TYPES.has(atkType)) {
    finalDmg = Math.max(1, Math.floor(finalDmg * (1 - spec.bonuses.physicalDefenseBonus)));
  }
  finalDmg = applyResistance(finalDmg, atkType, stats.resistances);

  p.hp = Math.max(0, (p.hp || 0) - finalDmg);
  playSound("player_hurt");

  const attackLabel = useMagic ? t('magicAttackLabel')
    : action === "power_attack" ? t('powerAttackLabel')
    : t('physicalAttackLabel');
  addMessage(formatText(t('enemyUsedAttack'), { enemy: enemy.type, attack: attackLabel, damage: finalDmg }), "combat");
  showFloatingText(`-${finalDmg}`, window.innerWidth/2-80, window.innerHeight/2, "#fca5a5", "1.8em");
  shakeScreen();

  updateUI();

  if (p.hp <= 0) {
    p.hp = 0;
    gameState.isGameOver = true;
    gameState.isInCombat = false;
    playSound("player_die");
    addMessage(t('combatGameOverDefeated'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
    return;
  }

  // SPEC-1102: contraataque universal vía Defender — 30%, cualquier clase,
  // independiente del 25% de Duelista al esquivar (ese ya se resolvió arriba
  // en la rama de evasión y no llega hasta acá).
  if (wasDefending && Math.random() < DEFEND_COUNTER_CHANCE) {
    const counterDmg = Math.max(1, Math.floor((stats.attack || 1) * DEFEND_COUNTER_DMG_MULT));
    applyDamageToEnemy(counterDmg, "physical");
    playSound("attack");
    addMessage(formatText(t('defendCounterMsg'), { enemy: enemy.type, damage: counterDmg }), "combat");
    showFloatingText(`-${counterDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#93C5FD", "1.6em");
    if (enemy.hp <= 0) { await delay(300); return endCombat(true); }
  }

  // Apply a new status effect if enemy has one and player doesn't already have it
  // SPEC-0802: la acción "status" telegrafiada garantiza el intento de efecto
  const se = ENEMY_STATUS_EFFECTS[enemy.id];
  if (se && Math.random() < (action === "status" ? 1 : se.chance)) {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    // SPEC-1101: el veneno acumula stacks (tope 5) en vez de solo refrescar/
    // ignorarse — cada stack nueva multiplica el daño por turno.
    if (se.type === "poison") {
      const existing = gameState.playerDebuffs.poison;
      const stacks = Math.min(POISON_MAX_STACKS, (existing?.stacks || 0) + 1);
      gameState.playerDebuffs.poison = { turns: se.turns, damage: se.damage, stacks };
      addMessage(formatText(t(stacks > 1 ? 'enemyPoisonStackEffect' : 'enemyPoisonEffect'), {
        enemy: enemy.type, damage: se.damage * stacks, turns: se.turns, stacks
      }), "combat");
      updateUI();
    } else if (!gameState.playerDebuffs[se.type]) {
      if (se.type === "stun") {
        gameState.playerDebuffs.stun = { turns: se.turns };
        addMessage(formatText(t('enemyStunEffect'), { enemy: enemy.type }), "combat");
      } else if (se.type === "burn") {
        gameState.playerDebuffs.burn = { turns: se.turns, damage: se.damage };
        addMessage(formatText(t('enemyBurnEffect'), { enemy: enemy.type, damage: se.damage, turns: se.turns }), "combat");
      } else if (se.type === "bleed") {
        // SPEC-1102: sangrado — mismo patrón que quemadura, no acumula stacks
        gameState.playerDebuffs.bleed = { turns: se.turns, damage: se.damage };
        addMessage(formatText(t('enemyBleedEffect'), { enemy: enemy.type, damage: se.damage, turns: se.turns }), "combat");
      }
      updateUI();
    }
  }

  // SPEC-0802: telegraph de la próxima acción
  rollEnemyIntent();
  updateUI();
}

// ── Helpers ─────────────────────────────────────────────
// Returns true if player died from debuff damage
function processPlayerDebuffs() {
  const debuffs = gameState.playerDebuffs;
  if (!debuffs || !Object.keys(debuffs).length) return false;
  const p = gameState.player;

  // SPEC-1101: arcaneFreeze no hace daño, solo bloquea Magia mientras dure —
  // necesita decrementarse aunque no tenga `damage` (el loop de abajo lo salta).
  if (debuffs.arcaneFreeze) {
    debuffs.arcaneFreeze.turns--;
    if (debuffs.arcaneFreeze.turns <= 0) {
      delete debuffs.arcaneFreeze;
      addMessage(t('arcaneFreezeWearsOff'), "system");
    }
  }

  for (const key of Object.keys({ ...debuffs })) {
    if (key === "stun" || key === "arcaneFreeze") continue;
    const data = debuffs[key];
    if (!data?.damage) continue;

    // SPEC-1101: el veneno escala con stacks acumuladas (1 si no aplica al resto)
    const tickDamage = key === "poison" ? data.damage * (data.stacks || 1) : data.damage;
    p.hp = Math.max(0, p.hp - tickDamage);
    // SPEC-1102: sangrado se suma a veneno/quemadura en este lookup (antes era un ternario de 2 opciones)
    const meta  = DEBUFF_TICK_META[key] || DEBUFF_TICK_META.burn;
    const icon  = meta.icon;
    const label = meta.label;
    addMessage(formatText(t('playerDebuffDamage'), { icon, label, damage: tickDamage }), "combat");
    showFloatingText(`-${tickDamage}`,
      window.innerWidth/2 - 80, window.innerHeight/2 - 20,
      meta.color, "1.6em");

    data.turns--;
    if (data.turns <= 0) {
      delete debuffs[key];
      addMessage(formatText(t('statusEffectEnds'), { label: label.toLowerCase() }), "system");
    }
    if (p.hp <= 0) break;
  }

  updateUI();
  if (p.hp <= 0) {
    p.hp = 0;
    gameState.isGameOver  = true;
    gameState.isInCombat  = false;
    gameState.playerDebuffs = {};
    playSound("player_die");
    addMessage(t('combatStatusEffectsDefeat'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
    return true;
  }
  return false;
}

// damageType es opcional: solo lo pasan los ataques reales del jugador (no
// los ticks de veneno/quemadura sobre el enemigo) — así la guardia de Forest
// Titan bloquea ataques, nunca daño continuo.
function applyDamageToEnemy(dmg, damageType) {
  const enemy = gameState.currentEnemy;
  if (!enemy) return;
  // SPEC-1103: rasgo "Regenerador" — recibir fuego bloquea su regen próxima
  if (damageType === "fire") enemy.turnsSinceFireHit = 0;
  let final = dmg;
  // SPEC-0802: en guardia recibe la mitad del daño del jugador (mín. 1)
  if (enemy.isDefending && dmg > 1) {
    final = Math.max(1, Math.ceil(dmg * DEFEND_DAMAGE_MULT));
    addMessage(formatText(t("enemyBlocksDamage"), { enemy: enemy.type, blocked: dmg - final }), "combat");
  }
  // SPEC-1101: guardia de raíces (Forest Titan) — reduce daño físico 60%
  // mientras esté activa; "Romper Guardia" la desactiva unos turnos.
  if (enemy.hasGuard && !(enemy.guardBroken > 0) && damageType && PHYSICAL_TYPES.has(damageType) && final > 1) {
    const reduced = Math.max(1, Math.ceil(final * GUARD_DAMAGE_MULT));
    addMessage(formatText(t("enemyGuardBlocks"), { enemy: enemy.type, blocked: final - reduced }), "combat");
    final = reduced;
  }
  enemy.hp = Math.max(0, (enemy.hp || 0) - final);
  updateUI();
}

function tickBuffs() {
  if (!gameState.activeBuffs) return;
  for (const k in gameState.activeBuffs) {
    gameState.activeBuffs[k]--;
    if (gameState.activeBuffs[k] <= 0) delete gameState.activeBuffs[k];
  }
}

// SPEC-1103: enemyFled=true cuando un enemigo con rasgo "Cobarde" huyó solo —
// el mensaje ya lo emitió checkCowardFlee(); acá solo evita confundirlo con
// una huida del jugador (fled) y documenta que tampoco entrega recompensas
// (ya cubierto por el gate `if (victory && enemy)` de más abajo).
function endCombat(victory, fled = false, enemyFled = false) {
  const enemy = gameState.currentEnemy;
  gameState.isInCombat = false;
  gameState.activeDebuffs = {};
  gameState.playerDebuffs = {};

  if (victory && enemy) {
    playSound("enemy_die");
    const diff = getDifficultyConfig(gameState.difficulty);
    const xp = Math.max(1, Math.floor((enemy.experience || 10) * diff.xpMult * modifierXpMult(gameState)));
    let gold = Math.max(0, Math.floor((enemy.gold || 5) * diff.goldMult * scarceGoldMult(gameState)));
    // Explorador: +10% oro
    const goldBonus = getActiveSpec()?.bonuses?.goldBonus;
    if (goldBonus) gold = Math.floor(gold * (1 + goldBonus));
    gameState.player.experience = (gameState.player.experience || 0) + xp;
    gameState.player.gold = (gameState.player.gold || 0) + gold;

    addMessage(formatText(t('victoryRewards'), { xp, gold }), "stat");

    // SPEC-0902: recompensa del eco tras el combate guionizado del bosque
    consumeEchoReward();

    // Boss death message (narrative payoff from enemies.js deathMessage field)
    if (enemy.isBoss && enemy.deathMessage) {
      setTimeout(() => addMessage(formatText(t("bossDiesMessage"), { message: enemy.deathMessage }), "system"), 400);
    }

    // Dragon King epilogue — climax of the main story
    if (enemy.id === "dragon_king") {
      gameState.mainQuestCompleted = true;
      setTimeout(() => addMessage(t("dragonKingThanks"),  "system"), 1200);
      setTimeout(() => addMessage(t("dragonKingTwist1"),  "system"), 2800);
      setTimeout(() => addMessage(t("dragonKingTwist2"),  "system"), 4400);
      setTimeout(() => addMessage(t("dragonKingEpilogue"),"system"), 6200);
      // SPEC-1001: el final refleja tus decisiones (el modal estaba huérfano — nadie lo abría)
      // SPEC-1003: la crónica se escribe tras cerrar el resto de endCombat (kills ya contadas)
      setTimeout(() => recordRun("victory"), 100);
      setTimeout(() => showEnding(), 7800);
    }

    // Record kill for bestiary
    recordEnemyKill(enemy.id);
    if (enemy.isBoss) {
      recordBossKill();
      setTimeout(() => { saveGame(); showToast(t('victorySaved')); }, 800);
    }

    // Loot
    try {
      const biomeId = window.worldMap?.[gameState.currentLocationId]?.biome;
      const loot = filterLoot(getLoot(enemy.id, biomeId), gameState);
      if (Array.isArray(loot) && loot.length) {
        loot.forEach(item => {
          gameState.inventory[item] = (gameState.inventory[item] || 0) + 1;
        });
        playSound("loot");
        addMessage(formatText(t('lootObtained'), { items: loot.map(i => localizeText(allItems[i]?.name) ?? i.replace(/_/g, " ")).join(", ") }), "loot");
        maybeShowHint("first_loot"); // SPEC-0801: primer botín
      }
    } catch(e) {}

    // Level up
    if (gameState.player.experience >= (gameState.player.nextLevelXp || 100)) {
      levelUp();
    }
  } else if (fled) {
    addMessage(t('fleeSuccess'), "system");
  }

  checkAchievements();
  gameState.currentEnemy = null;
  // Restaura música del bioma actual al terminar el combate
  const zoneBiome = window.worldMap?.[gameState.currentLocationId]?.biome;
  playMusic(zoneBiome || "none");
  updateUI();
}

function levelUp() {
  const p = gameState.player;
  p.level = (p.level || 1) + 1;
  p.experience = Math.max(0, (p.experience || 0) - (p.nextLevelXp || 100));
  p.nextLevelXp = Math.floor((p.nextLevelXp || 100) * 1.5);
  p.statPoints = (p.statPoints || 0) + 5;

  // Class-based HP/MP growth
  const hpGain = p.class === "warrior" ? 15 : p.class === "mage" ? 6 : 10;
  const mpGain = p.class === "mage" ? 12 : p.class === "rogue" ? 5 : 3;
  p.permanentHpBonus = (p.permanentHpBonus || 0) + hpGain;
  p.permanentMpBonus = (p.permanentMpBonus || 0) + mpGain;
  applyDerivedMaxes();
  p.hp = p.maxHp;
  p.mp = p.maxMp;

  // Update profile card
  const profileRole = document.querySelector(".profile-role");
  if (profileRole) profileRole.textContent = `${t('levelBadgePrefix')} ${p.level} ${(p.className || "").toUpperCase()}`;

  playSound("level_up");
  addMessage(formatText(t('levelUp'), { level: p.level }), "stat");

  // Especialización disponible a partir de nivel 10
  if (canSpecialize(p)) {
    addMessage(t('specUnlockedMsg'), "stat");
    setTimeout(() => showSpecializationModal(), 1500);
  }

  checkAchievements();
  // Autoguardar en cada level up
  setTimeout(() => {
    saveGame();
    showToast(t('autoSaveToast'));
  }, 1200);
  showFloatingText(t('levelUpText') || "⭐ LEVEL UP!", window.innerWidth/2 - 60, window.innerHeight/2 - 80, "#fbbf24", "2em");
}
