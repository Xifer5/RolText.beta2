/**
 * archetypes.js — SPEC-1303: arquetipos tácticos de enemigo (entrega 1: físicos).
 *
 * Módulo puro, sin DOM ni estado: cada mecánica es una función de
 * (arquetipo, escala de dificultad, ...) → número, para poder testearla sin
 * montar un combate. combat.js / enemyAI.js / ui.js solo las llaman.
 *
 * Escala: easy=0 (sin arquetipos, comportamiento original), adventure=1,
 * hard=2, impossible=3. Jefes nunca reciben arquetipo.
 */

// id de enemigo -> arquetipo. No se edita enemies.js (mismo patrón que
// ENEMY_COMBAT_DATA). Entrega 1: un enemigo de prueba por arquetipo.
export const ENEMY_ARCHETYPE = {
  orc:           "wrecker",
  wolf:          "skirmisher",
  guard:         "guardian",
  goblin_shaman: "channeler",
};

export const ARCHETYPES = {
  wrecker:    { icon: "🔨", family: "physical", nameKey: "archWreckerName",    tipKey: "archWreckerTip",    adviceKey: "archWreckerAdvice" },
  skirmisher: { icon: "⚡", family: "physical", nameKey: "archSkirmisherName", tipKey: "archSkirmisherTip", adviceKey: "archSkirmisherAdvice" },
  guardian:   { icon: "🛡️", family: "physical", nameKey: "archGuardianName",   tipKey: "archGuardianTip",   adviceKey: "archGuardianAdvice" },
  channeler:  { icon: "🔮", family: "physical", nameKey: "archChannelerName",  tipKey: "archChannelerTip",  adviceKey: "archChannelerAdvice" },
};

// Índice = escala (0 = Fácil, sin efecto). Aventura < Difícil < Imposible.
export const WRECKER_DEFEND_MULT = [null, 0.75, 0.85, 1.0];  // daño que pasa de un golpe pesado con Defender activo
export const SKIRMISHER_DODGE_BONUS = [0, 0.15, 0.10, 0.05]; // esquiva extra contra su ataque normal
export const GUARDIAN_REFLECT_PCT = [0, 0.30, 0.40, 0.50];   // % del daño físico devuelto mientras defiende
export const CHANNELER_MULT = [1, 1.5, 1.75, 2.0];           // daño del hechizo tras canalizar

const SCALES = { easy: 0, adventure: 1, hard: 2, impossible: 3 };

export function archetypeScale(difficulty) {
  return SCALES[difficulty] ?? 0;
}

/** null si el enemigo no tiene arquetipo, es jefe, o la dificultad es Fácil. */
export function getArchetype(enemyId, difficulty, isBoss = false) {
  if (isBoss || archetypeScale(difficulty) === 0) return null;
  return ENEMY_ARCHETYPE[enemyId] || null;
}

/** Multiplicador de Defender contra el golpe pesado de un Rompeguardia, o null si no aplica. */
export function wreckerDefendMult(archetype, scale, action) {
  if (archetype !== "wrecker" || action !== "power_attack" || scale < 1) return null;
  return WRECKER_DEFEND_MULT[scale];
}

/** Puntos de esquiva extra del jugador contra el ataque normal de un Asaltante. */
export function skirmisherDodgeBonus(archetype, scale, action) {
  if (archetype !== "skirmisher" || action !== "attack") return 0;
  return SKIRMISHER_DODGE_BONUS[scale] || 0;
}

/** Daño devuelto al jugador por golpear a un Guardián en guardia. Nunca letal (deja ≥1 HP). */
export function guardianReflect({ archetype, scale, isDefending, isPhysical, dmg, playerHp }) {
  if (archetype !== "guardian" || !isDefending || !isPhysical || dmg <= 1) return 0;
  const raw = Math.floor(dmg * (GUARDIAN_REFLECT_PCT[scale] || 0));
  return Math.max(0, Math.min(raw, playerHp - 1));
}

/** Multiplicador del hechizo que sigue a "channel". */
export function channelerMult(scale) {
  return CHANNELER_MULT[scale] || 1;
}
