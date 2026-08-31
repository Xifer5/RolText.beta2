/**
 * combatFeedback.js — Helpers de feedback/presentación de combate
 *
 * Extraído de combat.js (modularización post SPEC-1110, ver
 * errores/registro_de_errores.md / project_polish_sprint en memoria):
 * notas de resistencia, tipo de floating-text, maestría de daño, y el
 * "Anillo de Último Aliento" (evita la muerte una vez por combate).
 * Cero dependencia de otros módulos combat-* — es una hoja del árbol de
 * imports, la pueden usar combat.js y cualquiera de los otros módulos
 * de combate sin crear ciclos.
 */
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { showFloatingText, updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { showToast } from "./toast.js";
import { t, formatText } from "./i18n.js";
import { addMasteryXP } from "./mastery.js";
import {
  ENEMY_COMBAT_DATA, DAMAGE_TYPE_EMOJI, DAMAGE_TYPES,
  getResistanceLabel, getWeakestResistance, getEffectiveResistances
} from "./damageTypes.js";

export function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// SPEC-1103: resistencias efectivas del enemigo `enemyId` — usa el bono en
// memoria del rasgo "Antiguo" cuando `enemyId` es el enemigo actual de combate
// (gameState.currentEnemy); si no (ej. llamado en tests con un id arbitrario,
// sin combate en curso), cae a la base estática de ENEMY_COMBAT_DATA.
export function resistancesFor(enemyId) {
  const enemy = gameState.currentEnemy;
  return (enemy && enemy.id === enemyId) ? getEffectiveResistances(enemy) : ENEMY_COMBAT_DATA[enemyId]?.resistances;
}

// SPEC-1110: tipo de floating-text según crítico > vulnerable > resistido >
// normal — mismo umbral (±20) que resistanceAdviceFor(), para que el efecto
// visual solo dispare cuando la resistencia es lo bastante fuerte como para
// que el consejo táctico ya la señale.
export function damageFloatType(isCrit, damageType, resistances) {
  if (isCrit) return "critical";
  const res = resistances?.[damageType] ?? 0;
  if (res <= -20) return "vulnerable";
  if (res >= 20) return "resisted";
  return "";
}

// Nota "(🔥 Vuln. 30%)" para el log cuando el enemigo resiste o es vulnerable
export function resistanceNote(enemyId, damageType) {
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
export function maybeResistanceAdvice(enemy, damageType) {
  if (!enemy || enemy._resAdviceShown) return;
  const advice = resistanceAdviceFor(enemy.id, damageType);
  if (!advice) return;
  enemy._resAdviceShown = true;
  addMessage(formatText(advice.key, advice.params), "system");
}

export function grantMasteryXP(damageType, amount = 5) {
  const tierUp = addMasteryXP(damageType, amount);
  if (tierUp) {
    const label = DAMAGE_TYPES[tierUp.type] || tierUp.type;
    const msg = formatText(t('masteryTierUp'), { type: label, tier: `${tierUp.tier.emoji} ${tierUp.tier.title}` });
    addMessage(msg, "milestone"); // SPEC-1212: subir de tier de maestría es un hito, no un mensaje de rutina
    showToast(msg);
    playSound("level_up");
  }
}

// SPEC-1106: Anillo de Último Aliento — una vez por combate, evita la
// derrota dejando al jugador en 1 HP en vez de 0. Se llama en TODOS los
// puntos donde el jugador puede morir (ataque normal, devorar, sobrecarga,
// tics de veneno/quemadura/sangrado), cada uno reemplaza su chequeo
// `if (p.hp <= 0)` por `if (p.hp <= 0 && !tryLastBreath())`. El flag de "ya
// usado" vive en `gameState.currentEnemy` (mismo patrón que hasGuard/
// guardBroken: estado efímero por-combate, se reinicia solo con cada
// enemigo nuevo).
export function tryLastBreath() {
  const enemy = gameState.currentEnemy;
  if (!enemy || enemy.lastBreathUsed) return false;
  if (gameState.equipment?.ring?.special !== "lastBreath") return false;
  enemy.lastBreathUsed = true;
  gameState.player.hp = 1;
  addMessage(t('lastBreathMsg'), "system");
  showFloatingText("1 HP!", window.innerWidth/2, window.innerHeight/2, "#fbbf24", "2em", "critical");
  updateUI();
  return true;
}
