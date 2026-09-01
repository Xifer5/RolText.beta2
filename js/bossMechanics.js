/**
 * bossMechanics.js — Mecánicas propias de boss (SPEC-1101)
 *
 * Extraído de combat.js (modularización post SPEC-1110, ver
 * errores/registro_de_errores.md / project_polish_sprint en memoria):
 * telegraph de acciones cargadas (Cave Devourer, Ancient Construct,
 * Mountain Colossus, Frost Wyrm), fases de Dragon King, y la guardia de
 * raíces de Forest Titan (Romper Guardia + su resolución de daño).
 *
 * Depende de combat.js (applyDamageToEnemy/tickBuffs/enemyTurn — la
 * llamada de vuelta a combat.js es circular a propósito: todas las
 * referencias cruzadas ocurren dentro de cuerpos de función invocados en
 * tiempo de juego, nunca en la evaluación top-level del módulo, así que
 * el ciclo es seguro en ES modules) y de combatRewards.js (endCombat).
 */
import { gameState } from "./state.js";
import { calculateTotalStats } from "./stats.js";
import { addMessage } from "./story.js";
import { showFloatingText, shakeScreen, updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { t, formatText } from "./i18n.js";
import { recordRun } from "./runLog.js";
import { DEFEND_DAMAGE_MULT } from "./enemyAI.js";
import { applyResistance, getWeaponDamageType, getEffectiveResistances, ENEMY_COMBAT_DATA } from "./damageTypes.js";
import { delay, tryLastBreath } from "./combatFeedback.js";
import { endCombat } from "./combatRewards.js";
import { showGameOver } from "./endings.js";
import { applyDamageToEnemy, tickBuffs, enemyTurn } from "./combat.js";

// SPEC-1101: mecánicas de boss — % del maxHp actual del jugador
const DEVOUR_HP_PCT = 0.35;
const OVERLOAD_HP_PCT = 0.35;
// SPEC-1101: Forest Titan — guardia de raíces
const GUARD_BREAK_CHANCE = 0.75;
const GUARD_BREAK_DMG_MULT = 0.5;   // "Romper Guardia" pega más flojo que un ataque normal
const GUARD_BREAK_DURATION = 2;     // turnos sin guardia tras romperla
// SPEC-1101: Frost Wyrm — duración de la congelación de magia
const ARCANE_FREEZE_DURATION = 3;

// SPEC-1101: contadores de turno propios (no RNG) para Cave Devourer /
// Ancient Construct — se telegrafían como cualquier otra acción, así el
// jugador siempre los ve venir con 1 turno de antelación.
export function rollForcedBossAction(enemy) {
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
  // SPEC-1219 (Fase 4 del plan docs/PLAN-HISTORIA-FASE4.md) — Dragon King,
  // fases 2/3 del clímax: reusan el forzado de cave_devourer/ancient_construct
  // tal cual, solo gateado por enemy.bossPhase en vez de enemy.id. La fase 1
  // reusa la guardia de forest_titan (hasGuard, ver startCombat() en
  // combat.js); la fase 4 no fuerza nada nuevo, queda a pura agresión (ver
  // enemyAI.js case "boss_phased").
  if (enemy.id === "dragon_king") {
    if (enemy.bossPhase === 2) {
      enemy.turnsSinceDevour = enemy.turnsSinceDevour ?? 0;
      if (enemy.turnsSinceDevour >= 2) return "devour";
      enemy.turnsSinceDevour++;
    }
    if (enemy.bossPhase === 3) {
      enemy.turnsSinceOverload = enemy.turnsSinceOverload ?? 0;
      if (enemy.turnsSinceOverload >= 3) return "overload";
      enemy.turnsSinceOverload++;
    }
  }
  return null;
}

// SPEC-1101/1219 — Dragon King: mensaje de flavor al escalar de fase (ahora
// 4 en vez de 3, ver plan docs/PLAN-HISTORIA-FASE4.md). Nunca retrocede si
// el HP sube (no hay regen en dragon_king, pero por si acaso). Cada
// escalada de fase también apaga la guardia de fase 1 (hasGuard) para
// dragon_king específicamente — forest_titan, el otro usuario de hasGuard,
// no tiene fases y no se ve afectado por esta condición.
export function updateBossPhase(enemy) {
  if (ENEMY_COMBAT_DATA[enemy.id]?.behavior !== "boss_phased") return;
  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const phase = hpRatio > 0.75 ? 1 : hpRatio > 0.5 ? 2 : hpRatio > 0.25 ? 3 : 4;
  const prev = enemy.bossPhase || 1;
  if (phase > prev) {
    enemy.bossPhase = phase;
    addMessage(formatText(t(`dragonKingPhase${phase}`), { enemy: enemy.type }), "combat");
    shakeScreen();
    if (enemy.id === "dragon_king") enemy.hasGuard = false;
  } else if (!enemy.bossPhase) {
    enemy.bossPhase = 1;
  }
}

// SPEC-1101 — Cave Devourer: "devorar" cada 3er turno (contador propio, no
// RNG), telegrafiado con antelación por rollEnemyIntent como cualquier otra
// acción. Daño = % del maxHp actual del jugador, pasado por el mismo
// defenseMult que un ataque normal — Defender lo reduce a la mitad sin
// lógica especial de "¿respondió bien?". Devuelve true si el jugador murió
// (el llamador ya no debe telegrafiar la próxima acción).
export function resolveDevour(enemy, p) {
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
  if (p.hp <= 0 && !tryLastBreath()) {
    p.hp = 0;
    gameState.isGameOver = true;
    gameState.isInCombat = false;
    playSound("player_die");
    addMessage(t('combatStatusEffectsDefeat'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => showGameOver(), 800);
    return true;
  }
  return false;
}

// SPEC-1101 — Ancient Construct: "sobrecarga" cada 4to turno, daño mágico
// fijo. Mismo patrón de contador que devour, pero se contrarresta con
// Defender (no con aturdir, para diferenciarlo de Cave Devourer).
export function resolveOverload(enemy, p) {
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
  if (p.hp <= 0 && !tryLastBreath()) {
    p.hp = 0;
    gameState.isGameOver = true;
    gameState.isInCombat = false;
    playSound("player_die");
    addMessage(t('combatStatusEffectsDefeat'), "combat");
    recordRun("defeat");
    updateUI();
    setTimeout(() => showGameOver(), 800);
    return true;
  }
  return false;
}

// SPEC-1101 — Frost Wyrm: congela la magia del jugador cada 3er turno
// (contador propio, no daño). Bloquea el botón Magia en UI y en lógica
// (playerMagic ya chequea playerDebuffs.arcaneFreeze).
export function resolveFreezeMagic(enemy) {
  if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
  gameState.playerDebuffs.arcaneFreeze = { turns: ARCANE_FREEZE_DURATION };
  addMessage(formatText(t("enemyFreezesMagic"), { enemy: enemy.type }), "combat");
  showFloatingText(t('arcaneFreezeIcon'), window.innerWidth/2, window.innerHeight/2 - 40, "#93C5FD", "1.8em");
}

// SPEC-1101 — Forest Titan: golpe especial de daño bajo que puede romper la
// guardia de raíces. Solo visible/disponible cuando enemy.hasGuard (ver
// toggleBreakGuardButton en ui.js).
export async function playerBreakGuard() {
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
