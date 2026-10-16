/**
 * archetypes.js — SPEC-1303: arquetipos tácticos de enemigo (físicos, mágicos y de ataque especial).
 *
 * Módulo puro, sin DOM ni estado: cada mecánica es una función de
 * (arquetipo, escala de dificultad, ...) → número, para poder testearla sin
 * montar un combate. combat.js / enemyAI.js / ui.js solo las llaman.
 *
 * Escala: easy=0 (sin arquetipos, comportamiento original), adventure=1,
 * hard=2, impossible=3. Jefes nunca reciben arquetipo.
 */

// id de enemigo -> arquetipo. No se edita enemies.js (mismo patrón que
// ENEMY_COMBAT_DATA). Entrega 1 = físicos, 2 = mágicos, 3 = ataque especial;
// la expansión suma el resto de candidatos de la spec.
export const ENEMY_ARCHETYPE = {
  // Familia A — físicos
  orc: "wrecker", cave_troll: "wrecker", stone_charger: "wrecker",
  wolf: "skirmisher", goblin: "skirmisher", thief: "skirmisher", jungle_tiger: "skirmisher",
  guard: "guardian", dwarf_warrior: "guardian", stone_golem: "guardian",
  goblin_shaman: "channeler", elf: "channeler", sea_serpent: "channeler",
  // Familia B — mágicos por escuela
  pyro_elemental: "pyromancer", Inferno_elemental: "pyromancer", lava_golem: "pyromancer",
  frozen_spirit: "cryomancer", ice_giant: "cryomancer",
  warlock: "drainer", imp: "drainer", vampire: "drainer",
  genie: "stormcaller", jungle_spirit: "stormcaller",
  // Familia C — ataque especial
  giant_spider: "poisoner", vine_serpent: "poisoner",
  beholder: "blinder", medusa: "blinder", sand_worm: "blinder",
  mountain_giant: "stunner", gorilla_warrior: "stunner",
  cultist: "cursed", dark_knight: "cursed", diablo: "cursed",
};

export const ARCHETYPES = {
  wrecker:    { icon: "🔨", family: "physical", nameKey: "archWreckerName",    tipKey: "archWreckerTip",    adviceKey: "archWreckerAdvice" },
  skirmisher: { icon: "⚡", family: "physical", nameKey: "archSkirmisherName", tipKey: "archSkirmisherTip", adviceKey: "archSkirmisherAdvice" },
  guardian:   { icon: "🛡️", family: "physical", nameKey: "archGuardianName",   tipKey: "archGuardianTip",   adviceKey: "archGuardianAdvice" },
  channeler:  { icon: "🔮", family: "physical", nameKey: "archChannelerName",  tipKey: "archChannelerTip",  adviceKey: "archChannelerAdvice" },
  pyromancer: { icon: "🔥", family: "magic", nameKey: "archPyromancerName", tipKey: "archPyromancerTip", adviceKey: "archPyromancerAdvice" },
  cryomancer: { icon: "❄️", family: "magic", nameKey: "archCryomancerName", tipKey: "archCryomancerTip", adviceKey: "archCryomancerAdvice" },
  drainer:    { icon: "🌑", family: "magic", nameKey: "archDrainerName",    tipKey: "archDrainerTip",    adviceKey: "archDrainerAdvice" },
  stormcaller:{ icon: "⚡", family: "magic", nameKey: "archStormcallerName",tipKey: "archStormcallerTip",adviceKey: "archStormcallerAdvice" },
  poisoner:   { icon: "☠️", family: "special", nameKey: "archPoisonerName", tipKey: "archPoisonerTip",   adviceKey: "archPoisonerAdvice" },
  blinder:    { icon: "🙈", family: "special", nameKey: "archBlinderName",  tipKey: "archBlinderTip",    adviceKey: "archBlinderAdvice" },
  stunner:    { icon: "💫", family: "special", nameKey: "archStunnerName",  tipKey: "archStunnerTip",    adviceKey: "archStunnerAdvice" },
  cursed:     { icon: "💔", family: "special", nameKey: "archCursedName",   tipKey: "archCursedTip",     adviceKey: "archCursedAdvice" },
};

// Índice = escala (0 = Fácil, sin efecto). Aventura < Difícil < Imposible.
export const WRECKER_DEFEND_MULT = [null, 0.75, 0.85, 1.0];  // daño que pasa de un golpe pesado con Defender activo
export const SKIRMISHER_DODGE_BONUS = [0, 0.15, 0.10, 0.05]; // esquiva extra contra su ataque normal
export const GUARDIAN_REFLECT_PCT = [0, 0.30, 0.40, 0.50];   // % del daño físico devuelto mientras defiende
export const CHANNELER_MULT = [1, 1.5, 1.75, 2.0];           // daño del hechizo tras canalizar

// Familia B — mágicos
export const PYROMANCER_BURN_MULT = [1, 1.0, 1.25, 1.5];      // daño por tick de su quemadura
export const CRYOMANCER_FROST_PENALTY = [0, 0.15, 0.20, 0.25]; // esquiva que quita la escarcha
export const FROST_TURNS = 2;                                  // tiradas de esquiva que dura
export const DRAINER_HEAL_PCT = [0, 0.50, 0.60, 0.75];         // % del daño que cura al enemigo
export const STORM_DEFEND_MULT = 0.4;                          // Defender vs su magia: -60% (en vez de -50%)
// Familia C — ataque especial
export const STATUS_CHANCE_MULT = [1, 1.0, 1.15, 1.3];         // chance de estado (veneno/ceguera/debilidad)
export const STUN_IMMUNITY_TURNS = 2;                          // turnos sin poder ser aturdido tras un stun
const STATUS_ARCHETYPES = new Set(["poisoner", "blinder", "cursed"]);

// Estado que un arquetipo aporta a enemigos que no lo tienen en ENEMY_STATUS_EFFECTS.
const ARCHETYPE_STATUS = {
  poisoner: { type: "poison", chance: 0.30, damage: 3, turns: 3 },
  stunner:  { type: "stun",   chance: 0,    turns: 1 }, // solo vía "stunning_blow" (telegrafiado)
};

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

// ── Familia B — mágicos ─────────────────────────────────

/** Daño por tick de la quemadura de un Pirómano. */
export function pyromancerBurnDamage(archetype, scale, baseDamage) {
  if (archetype !== "pyromancer") return baseDamage;
  return Math.max(1, Math.floor(baseDamage * (PYROMANCER_BURN_MULT[scale] || 1)));
}

/** El hielo y el agua apagan al Pirómano: cancelan su siguiente quemadura. */
export function dousesPyromancer(archetype, damageType) {
  return archetype === "pyromancer" && (damageType === "ice" || damageType === "water");
}

/** Puntos de esquiva que quita la escarcha de un Criomante (0 sin escarcha). */
export function frostDodgePenalty(scale, frostActive) {
  return frostActive ? (CRYOMANCER_FROST_PENALTY[scale] || 0) : 0;
}

/** ¿Este golpe del Criomante deja escarcha? Solo magia y golpe pesado, nunca el ataque normal. */
export function cryomancerAppliesFrost(archetype, scale, action) {
  return archetype === "cryomancer" && scale >= 1 && (action === "magic" || action === "power_attack");
}

/** El fuego disipa la escarcha. */
export function fireDispelsFrost(archetype, damageType) {
  return archetype === "cryomancer" && damageType === "fire";
}

/** Vida que recupera un Drenador por el daño que causó. */
export function drainerHeal(archetype, scale, damageDealt) {
  if (archetype !== "drainer" || damageDealt <= 0) return 0;
  return Math.floor(damageDealt * (DRAINER_HEAL_PCT[scale] || 0));
}

/** Los hechizos de un Tormentoso no se esquivan. */
export function stormUndodgeable(archetype, scale, isMagic) {
  return archetype === "stormcaller" && scale >= 1 && !!isMagic;
}

/** Multiplicador de Defender contra la magia de un Tormentoso, o null si no aplica. */
export function stormDefendMult(archetype, scale, isMagic) {
  return archetype === "stormcaller" && scale >= 1 && isMagic ? STORM_DEFEND_MULT : null;
}

// ── Familia C — ataque especial ─────────────────────────

/** Estado de respaldo que aporta el arquetipo cuando el enemigo no tiene uno propio. */
export function archetypeStatus(archetype) {
  return ARCHETYPE_STATUS[archetype] || null;
}

/** ×chance del estado de Envenenador/Cegador/Maldito. */
export function statusChanceMult(archetype, scale) {
  return STATUS_ARCHETYPES.has(archetype) ? (STATUS_CHANCE_MULT[scale] || 1) : 1;
}

/** El Maldito alarga su debilidad un turno en Imposible. */
export function statusExtraTurns(archetype, scale, type) {
  return archetype === "cursed" && scale === 3 && type === "weakness" ? 1 : 0;
}

/** ¿El arquetipo puede preparar un ataque de estado aunque su behavior no sea "status"? */
export function usesStatusLayer(archetype) {
  return STATUS_ARCHETYPES.has(archetype);
}
