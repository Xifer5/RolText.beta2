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
import {
  applyResistance, getWeaponDamageType, getResistanceLabel,
  ENEMY_COMBAT_DATA, PHYSICAL_TYPES, DAMAGE_TYPE_EMOJI, DAMAGE_TYPES
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

// Nota "(🔥 Vuln. 30%)" para el log cuando el enemigo resiste o es vulnerable
function resistanceNote(enemyId, damageType) {
  const res = ENEMY_COMBAT_DATA[enemyId]?.resistances?.[damageType] ?? 0;
  if (!res) return "";
  return ` (${DAMAGE_TYPE_EMOJI[damageType] || ""} ${getResistanceLabel(res)})`;
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
};

export function setupCombat() {
  window.addEventListener("pixel:attack", () => handleAction(playerAttack));
  window.addEventListener("pixel:magic",  () => handleAction(playerMagic));
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

// SPEC-0802: pre-decide la próxima acción del enemigo (y si un jefe la oculta)
// para que el chip de intent siempre anuncie futuro, nunca pasado.
function rollEnemyIntent() {
  const enemy = gameState.currentEnemy;
  if (!enemy || enemy.hp <= 0) return;
  enemy.nextAction = decideNextAction({
    behavior: ENEMY_COMBAT_DATA[enemy.id]?.behavior,
    isBoss: enemy.isBoss,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    magicAttack: enemy.magicAttack,
    hasStatusEffect: !!ENEMY_STATUS_EFFECTS[enemy.id],
    lastAction: enemy.lastAction,
    enraged: enemy.enraged
  });
  enemy.intentHidden = isIntentHidden(enemy);
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
  const scaledAtk = Math.floor((base.attack ?? 5) * (isBoss ? 1.4 + lvl * 0.04 : 1) * diff.atk);
  const scaledDef = Math.floor((base.defense ?? 0) * diff.def);

  gameState.currentEnemy = {
    id: enemyType,
    ...base,
    hp:      scaledHp,
    maxHp:   scaledHp,
    attack:  scaledAtk,
    defense: scaledDef,
    isBoss
  };
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
async function playerAttack() {
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const enemy = gameState.currentEnemy;
  const spec = getActiveSpec();
  const weaponType = getWeaponDamageType(gameState.equipment?.rightHand);
  const enemyRes = ENEMY_COMBAT_DATA[enemy.id]?.resistances;

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
  applyDamageToEnemy(total);
  playSound("hit");

  const critLabel = isCrit ? " 💥 ¡CRÍTICO!" : "";
  addMessage(formatText(t('attackEnemy'), {
    enemy: enemy.type,
    damage: dmg,
    extra: extraHit ? ` + ${extraHit} (${t('doubleStrike')})` : "",
    crit: critLabel
  }) + resistanceNote(enemy.id, weaponType), "combat");

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
  let dmg = Math.max(1, Math.floor(calculateMagicAttack(stats) * mult * magicBonus * (0.9 + Math.random()*0.2)));
  dmg = applyResistance(dmg, magicType, ENEMY_COMBAT_DATA[enemy.id]?.resistances);

  playSound("magic");
  applyDamageToEnemy(dmg);
  playSound("hit");
  addMessage(formatText(t('castMagic'), { damage: dmg }) + resistanceNote(enemy.id, magicType), "combat");
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
      dmg = applyResistance(dmg, skillType, ENEMY_COMBAT_DATA[gameState.currentEnemy?.id]?.resistances);
      grantMasteryXP(skillType);
    }
    applyDamageToEnemy(dmg);
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
    addMessage(t('fleeSuccess'), "system");
    endCombat(false, true);
  } else {
    addMessage(t('fleeFail'), "system");
    await delay(500); await enemyTurn();
  }
}

// ── Enemy Turn ─────────────────────────────────────────
async function enemyTurn() {
  if (!gameState.currentEnemy || gameState.isGameOver) return;
  const enemy = gameState.currentEnemy;
  const p = gameState.player;
  const stats = calculateTotalStats(p, gameState.equipment);

  // SPEC-0802: la guardia expira al empezar su turno — así los ticks de
  // veneno/quemadura de abajo hacen daño completo
  enemy.isDefending = false;

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

  const useMagic = action === "magic" && enemy.magicAttack;
  const powerMult = action === "power_attack" ? POWER_ATTACK_MULT : 1.0;
  const atkBase = useMagic ? (enemy.magicAttack || 5) : (enemy.attack || 5);
  const atkVal = Math.floor(atkBase * powerMult * frozenMult);

  // Player defense (warrior stance halves damage)
  const defenseMult = gameState.activeBuffs?.defend_stance > 0 ? 0.5 : 1.0;
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
      applyDamageToEnemy(counterDmg);
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
    updateUI();
    setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
    return;
  }

  // Apply a new status effect if enemy has one and player doesn't already have it
  // SPEC-0802: la acción "status" telegrafiada garantiza el intento de efecto
  const se = ENEMY_STATUS_EFFECTS[enemy.id];
  if (se && Math.random() < (action === "status" ? 1 : se.chance)) {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    if (!gameState.playerDebuffs[se.type]) {
      if (se.type === "stun") {
        gameState.playerDebuffs.stun = { turns: se.turns };
        addMessage(formatText(t('enemyStunEffect'), { enemy: enemy.type }), "combat");
      } else if (se.type === "poison") {
        gameState.playerDebuffs.poison = { turns: se.turns, damage: se.damage };
        addMessage(formatText(t('enemyPoisonEffect'), { enemy: enemy.type, damage: se.damage, turns: se.turns }), "combat");
      } else if (se.type === "burn") {
        gameState.playerDebuffs.burn = { turns: se.turns, damage: se.damage };
        addMessage(formatText(t('enemyBurnEffect'), { enemy: enemy.type, damage: se.damage, turns: se.turns }), "combat");
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

  for (const key of Object.keys({ ...debuffs })) {
    if (key === "stun") continue;
    const data = debuffs[key];
    if (!data?.damage) continue;

    p.hp = Math.max(0, p.hp - data.damage);
    const icon  = key === "poison" ? "☠️" : "🔥";
    const label = key === "poison" ? "Veneno" : "Quemadura";
    addMessage(formatText(t('playerDebuffDamage'), { icon, label, damage: data.damage }), "combat");
    showFloatingText(`-${data.damage}`,
      window.innerWidth/2 - 80, window.innerHeight/2 - 20,
      key === "poison" ? "#4ade80" : "#fb923c", "1.6em");

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
    updateUI();
    setTimeout(() => document.getElementById("gameOverModal")?.classList.remove("hidden"), 800);
    return true;
  }
  return false;
}

function applyDamageToEnemy(dmg) {
  const enemy = gameState.currentEnemy;
  if (!enemy) return;
  let final = dmg;
  // SPEC-0802: en guardia recibe la mitad del daño del jugador (mín. 1)
  if (enemy.isDefending && dmg > 1) {
    final = Math.max(1, Math.ceil(dmg * DEFEND_DAMAGE_MULT));
    addMessage(formatText(t("enemyBlocksDamage"), { enemy: enemy.type, blocked: dmg - final }), "combat");
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

function endCombat(victory, fled = false) {
  const enemy = gameState.currentEnemy;
  gameState.isInCombat = false;
  gameState.activeDebuffs = {};
  gameState.playerDebuffs = {};

  if (victory && enemy) {
    playSound("enemy_die");
    const diff = getDifficultyConfig(gameState.difficulty);
    const xp = Math.max(1, Math.floor((enemy.experience || 10) * diff.xpMult));
    let gold = Math.max(0, Math.floor((enemy.gold || 5) * diff.goldMult));
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
      setTimeout(() => addMessage(t("dragonKingThanks"),  "system"), 1200);
      setTimeout(() => addMessage(t("dragonKingTwist1"),  "system"), 2800);
      setTimeout(() => addMessage(t("dragonKingTwist2"),  "system"), 4400);
      setTimeout(() => addMessage(t("dragonKingEpilogue"),"system"), 6200);
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
      const loot = getLoot(enemy.id, biomeId);
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
