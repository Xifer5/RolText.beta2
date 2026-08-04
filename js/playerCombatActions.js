/**
 * playerCombatActions.js — Acciones del jugador en combate
 *
 * Extraído de combat.js (modularización post SPEC-1110, ver
 * errores/registro_de_errores.md / project_polish_sprint en memoria):
 * Atacar, Magia, Defender, Interrumpir, Perdonar, Huir y el uso de skills
 * de clase. Depende de combat.js (applyDamageToEnemy/tickBuffs/enemyTurn —
 * ciclo seguro, ver nota en bossMechanics.js), combatFeedback.js,
 * combatRewards.js (endCombat) y enemyTraits.js (applyThiefGoldSteal).
 */
import { gameState } from "./state.js";
import { calculateTotalStats, calculateMagicAttack } from "./stats.js";
import { addMessage } from "./story.js";
import { showFloatingText, shakeScreen, updateUI } from "./ui.js";
import { SKILLS_BY_CLASS } from "./classes.js";
import { playSound } from "./sounds.js";
import { t, formatText } from "./i18n.js";
import { getMasteryBonus } from "./mastery.js";
import { getActiveSpec } from "./specializations.js";
import { applyResistance, getWeaponDamageType, getEffectiveResistances } from "./damageTypes.js";
import { delay, damageFloatType, resistanceNote, maybeResistanceAdvice, grantMasteryXP } from "./combatFeedback.js";
import { endCombat } from "./combatRewards.js";
import { applyThiefGoldSteal } from "./enemyTraits.js";
import { applyDamageToEnemy, tickBuffs, enemyTurn } from "./combat.js";

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
// SPEC-1102: Interrumpir — solo tiene sentido contra una acción "grande"
// telegrafiada, nunca contra attack/defend/regen/enrage/status.
const INTERRUPTIBLE_ACTIONS = new Set(["power_attack", "magic", "overload", "devour", "freeze_magic"]);
const INTERRUPT_MP_COST = 8;
const INTERRUPT_CHANCE = 0.6;
// SPEC-1104: perdonar mini-boss — botón condicional bajo este umbral de HP
const SPARE_HP_THRESHOLD = 0.25;

function maybeStunEnemy(enemy) {
  if (!enemy || enemy.hp <= 0) return false;
  if (gameState.activeDebuffs?.stunned) return false;
  if (Math.random() >= STUN_ON_CRIT_CHANCE) return false;
  if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
  gameState.activeDebuffs.stunned = { turns: 1 };
  addMessage(formatText(t('enemyStunnedByPlayer'), { enemy: enemy.type }), "combat");
  return true;
}

// SPEC-1101: Defender universal — versión gratuita y de 1 turno del mismo
// defend_stance que ya usa la skill "Postura Defensiva" del Guerrero (que
// sigue siendo mejor: 3 turnos + cura 15% HP, por su costo de MP/nivel).
export async function playerDefend() {
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

// SPEC-1102: Interrumpir — cancela la acción cargada del enemigo. Solo
// disponible cuando enemy.nextAction es "grande" (ver toggleInterruptButton
// en ui.js, mismo patrón condicional que "Romper Guardia").
export async function playerInterrupt() {
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

// SPEC-1104 — Perdonar: solo mini-bosses reales (nunca el boss de zona),
// solo bajo SPARE_HP_THRESHOLD. Termina el combate sin oro/XP/loot ni kill
// registrada — la recompensa real es que puede volver como aliado más
// adelante (ver miniBossReunion.js). Reusa el mecanismo "sin recompensa" de
// endCombat(victory, fled, enemyFled) de SPEC-1103 (mismo efecto: sin premio,
// sin mensaje de fleeSuccess — el mensaje ya se emitió acá).
export async function playerSpare() {
  const enemy = gameState.currentEnemy;
  if (!enemy?.isMiniBoss) return;
  if (enemy.hp / enemy.maxHp >= SPARE_HP_THRESHOLD) return;

  if (!gameState.worldFlags) gameState.worldFlags = {};
  gameState.worldFlags["spared_" + enemy.id] = true;
  addMessage(formatText(t('mercySuccess'), { enemy: enemy.type }), "system");
  endCombat(false, false, true);
}

export async function playerAttack() {
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const enemy = gameState.currentEnemy;
  const spec = getActiveSpec();
  const weaponType = getWeaponDamageType(gameState.equipment?.rightHand);
  const enemyRes = getEffectiveResistances(enemy);

  // Warcry buff + maestría de arma + bono de especialización por tipo de daño
  const masteryBonus = getMasteryBonus(weaponType);
  const specDmgBonus = spec?.bonuses?.dmgType === weaponType ? (spec.bonuses.dmgBonus || 0) : 0;
  // SPEC-1105: Berserker — daño físico sin importar el arma, más furia bajo cierto % de HP
  const specDmgBonusAll = spec?.bonuses?.dmgBonusAll || 0;
  const isEnraged = !!spec?.bonuses?.enrageThreshold && (gameState.player.hp / (stats.maxHp || 1)) < spec.bonuses.enrageThreshold;
  const enrageMult = isEnraged ? (spec.bonuses.enrageDmgMult || 1) : 1;
  const atkMult = (gameState.activeBuffs?.warcry > 0 ? 1.3 : 1.0) * (1 + masteryBonus + specDmgBonus + specDmgBonusAll) * enrageMult;
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

  // SPEC-1105: Asesino — daño adicional al ejecutar enemigos debilitados
  const executeMult = (spec?.bonuses?.executeBonus && enemy.maxHp > 0 && (enemy.hp / enemy.maxHp) < 0.3)
    ? (1 + spec.bonuses.executeBonus) : 1;
  const dmg = applyResistance(Math.max(1, Math.floor((rawDmg - defense) * variance * critMul * executeMult)), weaponType, enemyRes);
  const total = dmg + extraHit;

  playSound("attack");
  applyDamageToEnemy(total, weaponType);
  playSound("hit");

  const critLabel = isCrit ? " 💥 ¡CRÍTICO!" : "";
  // SPEC-1110: log destacado en críticos — mismo mensaje, tipo distinto
  addMessage(formatText(t('attackEnemy'), {
    enemy: enemy.type,
    damage: dmg,
    extra: extraHit ? ` + ${extraHit} (${t('doubleStrike')})` : "",
    crit: critLabel
  }) + resistanceNote(enemy.id, weaponType), isCrit ? "combat-crit" : "combat");
  maybeResistanceAdvice(enemy, weaponType);
  if (isCrit) maybeStunEnemy(enemy);

  grantMasteryXP(weaponType);

  // Asesino: los ataques normales pueden envenenar
  if (spec?.bonuses?.poisonOnAttack && enemy.hp > 0 && Math.random() < 0.25 && !gameState.activeDebuffs?.poison) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs.poison = { turns: 2, damage: Math.max(2, Math.floor(stats.attack * 0.15)) };
    addMessage(formatText(t('specPoisonMsg'), { enemy: enemy.type }), "combat");
  }
  // SPEC-1105: Trampero — los ataques normales pueden desangrar al enemigo
  if (spec?.bonuses?.bleedOnAttack && enemy.hp > 0 && Math.random() < spec.bonuses.bleedOnAttack && !gameState.activeDebuffs?.bleed) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs.bleed = { turns: 3, damage: Math.max(2, Math.floor(stats.attack * 0.12)) };
    addMessage(formatText(t('trapperBleedMsg'), { enemy: enemy.type }), "combat");
  }
  // SPEC-1105: Trampero — cada golpe desgasta la defensa del enemigo (tope 3 veces por combate)
  if (spec?.bonuses?.enemyDefenseShred && enemy.hp > 0) {
    enemy._defenseShredStacks = enemy._defenseShredStacks || 0;
    if (enemy._defenseShredStacks < 3) {
      enemy._defenseShredStacks++;
      enemy.defense = Math.max(0, Math.floor(enemy.defense * (1 - spec.bonuses.enemyDefenseShred)));
      addMessage(formatText(t('trapperShredMsg'), { enemy: enemy.type }), "combat");
    }
  }
  showFloatingText(`-${total}${isCrit ? "!" : ""}`,
    window.innerWidth/2+50, window.innerHeight/2-50,
    "#ef4444", "2em", damageFloatType(isCrit, weaponType, enemyRes));
  shakeScreen();

  tickBuffs();
  updateUI();
  if (enemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700); await enemyTurn();
}

export async function playerMagic() {
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
  // SPEC-1106: Libro Quemado — más costo de maná, a cambio de más daño de fuego
  const burntBook = gameState.equipment?.rightHand?.special === "burntBook" ? gameState.equipment.rightHand : null;
  if (burntBook) cost = Math.max(1, Math.round(cost * burntBook.mpCostMult));

  if ((gameState.player.mp || 0) < cost) {
    addMessage(t('notEnoughMana'), "system");
    showFloatingText(t('noMana'), window.innerWidth/2, window.innerHeight/2, "#818cf8");
    return;
  }

  gameState.player.mp -= cost;
  const mult = gameState.player.class === "mage" && gameState.player.level >= 20 ? 2.0 : 1.0;
  // Escuela de magia: el ataque mágico toma el elemento de la especialización
  const magicType = spec?.bonuses?.dmgType || "magic";
  const burntBookFireBonus = (burntBook && magicType === "fire") ? burntBook.fireDmgBonus : 0;
  const magicBonus = 1 + getMasteryBonus(magicType) + (spec?.bonuses?.dmgBonus || 0) + burntBookFireBonus;
  // SPEC-1102: Concentrarse — +50% al próximo hechizo, se consume acá (no
  // decae por turnos: si el jugador no lanza magia mientras esté activo,
  // simplemente expira solo sin bonus).
  const wasFocused = gameState.activeBuffs?.focused > 0;
  const focusMult = wasFocused ? 1.5 : 1.0;
  if (wasFocused) delete gameState.activeBuffs.focused;
  // SPEC-1105: crítico mágico — mismo cálculo base que playerAttack(), sin el
  // +10% de clase pícaro (ese bono es específico del físico de rogue).
  const magicCritChance = 0.10 + (gameState.player.agility || 0) * 0.005 + (spec?.bonuses?.critBonus || 0);
  const isMagicCrit = Math.random() < magicCritChance;
  const magicCritMul = isMagicCrit ? 1.75 : 1.0;
  let dmg = Math.max(1, Math.floor(calculateMagicAttack(stats) * mult * magicBonus * focusMult * magicCritMul * (0.9 + Math.random()*0.2)));
  dmg = applyResistance(dmg, magicType, getEffectiveResistances(enemy));

  playSound("magic");
  applyDamageToEnemy(dmg, magicType);
  playSound("hit");
  addMessage(formatText(t('castMagic'), { damage: dmg }) + resistanceNote(enemy.id, magicType) + (wasFocused ? ` ${t('focusedBonusTag')}` : "") + (isMagicCrit ? " 💥 ¡CRÍTICO!" : ""), isMagicCrit ? "combat-crit" : "combat");
  maybeResistanceAdvice(enemy, magicType);
  grantMasteryXP(magicType);
  showFloatingText(`-${dmg}${isMagicCrit ? "!" : ""}`, window.innerWidth/2+50, window.innerHeight/2-50, "#818cf8", "2.4em", damageFloatType(isMagicCrit, magicType, getEffectiveResistances(enemy)));
  shakeScreen();

  // SPEC-1105: Nigromante — roba vida del daño mágico infligido
  if (spec?.bonuses?.lifeStealOnMagic) {
    const healed = Math.max(1, Math.floor(dmg * spec.bonuses.lifeStealOnMagic));
    const p = gameState.player;
    p.hp = Math.min(stats.maxHp, (p.hp || 0) + healed);
    addMessage(formatText(t('necromancerLifeStealMsg'), { heal: healed }), "combat");
  }
  // SPEC-1105: Nigromante — el crítico mágico maldice al enemigo (-15% ataque, 2 turnos)
  if (spec?.bonuses?.curseOnMagicCrit && isMagicCrit && enemy.hp > 0) {
    enemy.cursedDebuff = { turns: 2 };
    addMessage(formatText(t('necromancerCurseMsg'), { enemy: enemy.type }), "combat");
  }
  // SPEC-1105: Cronomante — probabilidad de cancelar la próxima acción del enemigo
  if (spec?.bonuses?.enemyStunOnHitChance && enemy.hp > 0 && Math.random() < spec.bonuses.enemyStunOnHitChance) {
    enemy.nextAction = "interrupted";
    addMessage(formatText(t('chronomancerStunMsg'), { enemy: enemy.type }), "combat");
  }

  tickBuffs();
  updateUI();
  if (gameState.currentEnemy.hp <= 0) { await delay(400); return endCombat(true); }
  // SPEC-1105: Cronomante — probabilidad de actuar de nuevo sin pasar el turno
  if (spec?.bonuses?.extraTurnChance && Math.random() < spec.bonuses.extraTurnChance) {
    addMessage(t('chronomancerExtraTurnMsg'), "system");
    await delay(500);
    return;
  }
  await delay(700); await enemyTurn();
}

export async function useSkill(skillId) {
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
    showFloatingText(`-${dmg}`, window.innerWidth/2+60, window.innerHeight/2-60, "#fbbf24", "2.2em",
      damageFloatType(false, skillType, getEffectiveResistances(gameState.currentEnemy)));
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

export async function tryFlee() {
  const agiMod = (gameState.player.agility || 0) * 0.02;
  const chance = 0.4 + agiMod
    + (gameState.player.class === "rogue" ? 0.15 : 0);
  if (Math.random() < chance) {
    playSound("flee");
    // SPEC-1103: rasgo "Ladrón" — roba oro cuando el jugador huye con éxito
    applyThiefGoldSteal(gameState.currentEnemy);
    addMessage(t('fleeSuccess'), "system");
    endCombat(false, true);
  } else {
    addMessage(t('fleeFail'), "system");
    await delay(500); await enemyTurn();
  }
}
