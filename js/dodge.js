/**
 * dodge.js — SPEC-1302: probabilidad de esquiva combinada (pasiva + botón).
 *
 * Módulo puro, sin DOM ni estado: Fácil conserva la esquiva pasiva tal como
 * era (sin tope, sin penalización a la magia); Aventura/Difícil/Imposible
 * suman el botón "Esquivar" y topan la probabilidad final en una sola tirada.
 */

export const DODGE_BUTTON_BONUS = 0.35;
export const DODGE_MIN = 0.10;
export const DODGE_MAX = 0.85;
export const MAGIC_DODGE_MULT = 0.5;
export const EXPOSED_DAMAGE_MULT = 1.25;
// Acciones enemigas que pasan por la tirada de evasión en enemyTurn().
export const DODGEABLE_ACTIONS = new Set(["attack", "power_attack", "magic", "channeled_magic", "stunning_blow"]);

export function isTacticalDifficulty(difficulty) {
  return difficulty !== "easy";
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function computeDodgeChance({ passive = 0, buttonActive = false, isMagic = false, tactical = false }) {
  if (!tactical) return passive; // Fácil: comportamiento original, intacto
  let chance = buttonActive
    ? clamp(passive + DODGE_BUTTON_BONUS, DODGE_MIN, DODGE_MAX)
    : Math.min(passive, DODGE_MAX);
  if (isMagic) chance *= MAGIC_DODGE_MULT;
  return chance;
}
