/**
 * weaponTechniques.js — SPEC-1304: técnicas por arma.
 *
 * El arma equipada pertenece a una FAMILIA por forma (hoja, perforante,
 * contundente, bastón, apoyo), independiente de su elemento. Cada familia
 * tiene 2 técnicas activas (con enfriamiento, sin MP) y 1 pasiva, que se
 * desbloquean por XP de maestría de la familia. Solo existen fuera de Fácil.
 *
 * Todo lo numérico es una función pura (RNG inyectable) para testearla sin
 * montar un combate; techniqueActions.js / combat.js / playerCombatActions.js
 * solo la llaman.
 */
import { gameState } from "./state.js";
import { isTacticalDifficulty } from "./dodge.js";

// arma (item.id) -> familia. Mapa explícito: elven_bow, burnt_book y
// pharaohs_scepter devuelven "slash" en getWeaponDamageType por datos
// antiguos, así que no se puede derivar la familia del tipo de daño.
export const WEAPON_FAMILY = {
  // Hoja
  sword: "blade", iron_sword: "blade", axe: "blade", vine_whip: "blade", cutlass: "blade",
  tiger_blade: "blade", captain_sword: "blade", crystal_blade: "blade", royal_sword: "blade",
  katana: "blade", ravenous_sword: "blade", demon_blade: "blade", dark_sword: "blade",
  lava_sword: "blade", inferno_blade: "blade", dragon_king_sword: "blade",
  divine_sword: "blade", excalibur: "blade",
  // Perforante
  goblin_dagger: "piercing", dagger: "piercing", trident: "piercing", serpent_sword: "piercing", elven_bow: "piercing",
  // Contundente
  hammer: "blunt", war_hammer: "blunt", giant_club: "blunt",
  // Bastón ofensivo
  staff: "staff", wand: "staff", elemental_wand: "staff", water_staff: "staff", ocean_staff: "staff",
  flame_staff: "staff", pyro_staff: "staff", burnt_book: "staff", pharaohs_scepter: "staff", nature_staff: "staff",
  // Báculo de apoyo
  bless_staff: "support", healing_staff: "support", spirit_staff: "support", saint_grail: "support",
};

export const FAMILY_META = {
  blade:    { emoji: "🗡️", nameKey: "famBlade" },
  piercing: { emoji: "🏹", nameKey: "famPiercing" },
  blunt:    { emoji: "🔨", nameKey: "famBlunt" },
  staff:    { emoji: "🔮", nameKey: "famStaff" },
  support:  { emoji: "✨", nameKey: "famSupport" },
};

// XP de familia para: técnica 1, técnica 2, pasiva. Son datos: se calibran en playtest.
export const FAMILY_UNLOCK_XP = [100, 400, 1000];
export const FAMILY_XP_PREFIX = "fam_";

// Tipo(s) de daño legado cuyo XP también cuenta para la familia (saves previos).
const LEGACY_TYPES = {
  blade: ["slash"], piercing: ["pierce"], blunt: ["blunt"], staff: ["magic"], support: ["light", "holy"],
};

export const TECHNIQUES = {
  blade_cross_slash:  { family: "blade",    slot: 1,         cooldown: 3, emoji: "⚔️", nameKey: "techBladeCrossSlash",  descKey: "techBladeCrossSlashDesc" },
  blade_riposte:      { family: "blade",    slot: 2,         cooldown: 4, emoji: "🤺", nameKey: "techBladeRiposte",     descKey: "techBladeRiposteDesc" },
  blade_keen:         { family: "blade",    slot: "passive", cooldown: 0, emoji: "✨", nameKey: "techBladeKeen",        descKey: "techBladeKeenDesc" },
  pierce_precise:     { family: "piercing", slot: 1,         cooldown: 3, emoji: "🎯", nameKey: "techPiercePrecise",    descKey: "techPiercePreciseDesc" },
  pierce_venom:       { family: "piercing", slot: 2,         cooldown: 4, emoji: "☠️", nameKey: "techPierceVenom",      descKey: "techPierceVenomDesc" },
  pierce_opportunist: { family: "piercing", slot: "passive", cooldown: 0, emoji: "👁️", nameKey: "techPierceOpportunist", descKey: "techPierceOpportunistDesc" },
  blunt_crush:        { family: "blunt",    slot: 1,         cooldown: 3, emoji: "💥", nameKey: "techBluntCrush",       descKey: "techBluntCrushDesc" },
  blunt_quake:        { family: "blunt",    slot: 2,         cooldown: 5, emoji: "🌋", nameKey: "techBluntQuake",       descKey: "techBluntQuakeDesc" },
  blunt_deadweight:   { family: "blunt",    slot: "passive", cooldown: 0, emoji: "⚓", nameKey: "techBluntDeadweight",  descKey: "techBluntDeadweightDesc" },
  staff_burst:        { family: "staff",    slot: 1,         cooldown: 3, emoji: "⚡", nameKey: "techStaffBurst",       descKey: "techStaffBurstDesc" },
  staff_overload:     { family: "staff",    slot: 2,         cooldown: 4, emoji: "🌀", nameKey: "techStaffOverload",    descKey: "techStaffOverloadDesc" },
  staff_flow:         { family: "staff",    slot: "passive", cooldown: 0, emoji: "💧", nameKey: "techStaffFlow",        descKey: "techStaffFlowDesc" },
  support_heal:       { family: "support",  slot: 1,         cooldown: 4, emoji: "💚", nameKey: "techSupportHeal",      descKey: "techSupportHealDesc" },
  support_shield:     { family: "support",  slot: 2,         cooldown: 5, emoji: "🛡️", nameKey: "techSupportShield",    descKey: "techSupportShieldDesc" },
  support_devotion:   { family: "support",  slot: "passive", cooldown: 0, emoji: "🙏", nameKey: "techSupportDevotion",  descKey: "techSupportDevotionDesc" },
};

const SLOT_INDEX = { 1: 0, 2: 1, passive: 2 };

// ── Valores de las técnicas (datos de partida, no balance final) ──
export const TECH_NUMBERS = {
  crossSlashMult: 1.4, crossSlashBleed: { turns: 2, damage: 3 },
  preciseMult: 1.2, precisePen: 0.4,
  venomMult: 1.0, venomPoison: { turns: 3, damage: 3 },
  crushMult: 1.5, crushShred: { pct: 0.25, turns: 3 },
  quakeMult: 1.3, quakeStunChance: 0.4, quakeBossShred: { pct: 0.25, turns: 2 },
  burstMult: 1.5,
  overloadBuff: 2,
  healPct: 0.12,
  shieldTurns: 2,
  riposteTurns: 2,
  keenCrit: 0.10, opportunistBonus: 0.15, deadweightPen: 0.10, flowMp: 2, devotionHeal: 0.25,
};

/** Familia del arma (objeto item) o null. */
export function getWeaponFamily(weapon) {
  return (weapon && WEAPON_FAMILY[weapon.id]) || null;
}

/** XP de familia: el mayor entre el contador propio y el XP legado del tipo de daño principal. */
export function familyXp(family, weaponMastery = {}) {
  let xp = weaponMastery?.[FAMILY_XP_PREFIX + family]?.xp || 0;
  for (const type of LEGACY_TYPES[family] || []) xp = Math.max(xp, weaponMastery?.[type]?.xp || 0);
  return xp;
}

function isUnlocked(tech, xp) {
  return xp >= FAMILY_UNLOCK_XP[SLOT_INDEX[tech.slot]];
}

/** Ids de técnicas (activas y pasivas) desbloqueadas con el arma dada. [] en Fácil. */
export function unlockedTechniques(weapon, weaponMastery, difficulty) {
  if (!isTacticalDifficulty(difficulty)) return [];
  const family = getWeaponFamily(weapon);
  if (!family) return [];
  const xp = familyXp(family, weaponMastery);
  return Object.entries(TECHNIQUES)
    .filter(([, tech]) => tech.family === family && isUnlocked(tech, xp))
    .map(([id]) => id);
}

/** Técnicas que se desbloquean al pasar de oldXp a newXp en una familia. */
export function newlyUnlocked(family, oldXp, newXp) {
  return Object.entries(TECHNIQUES)
    .filter(([, tech]) => tech.family === family
      && oldXp < FAMILY_UNLOCK_XP[SLOT_INDEX[tech.slot]] && newXp >= FAMILY_UNLOCK_XP[SLOT_INDEX[tech.slot]])
    .map(([id]) => id);
}

export function techniqueReady(id, cooldowns = {}) {
  return !(cooldowns[id] > 0);
}

/** Bonos de las pasivas desbloqueadas (todo 0 si no hay ninguna). */
export function computePassives(weapon, weaponMastery, difficulty) {
  const ids = new Set(unlockedTechniques(weapon, weaponMastery, difficulty));
  const N = TECH_NUMBERS;
  return {
    critBonus:     ids.has("blade_keen") ? N.keenCrit : 0,
    exposedBonus:  ids.has("pierce_opportunist") ? N.opportunistBonus : 0,
    defPen:        ids.has("blunt_deadweight") ? N.deadweightPen : 0,
    mpPerTurn:     ids.has("staff_flow") ? N.flowMp : 0,
    healBonus:     ids.has("support_devotion") ? N.devotionHeal : 0,
    cleanse:       ids.has("support_devotion"),
  };
}

const NO_PASSIVES = { critBonus: 0, exposedBonus: 0, defPen: 0, mpPerTurn: 0, healBonus: 0, cleanse: false };

/** Pasivas del equipo actual (lee gameState). */
export function currentPassives() {
  const weapon = gameState.equipment?.rightHand;
  if (!weapon) return NO_PASSIVES;
  return computePassives(weapon, gameState.weaponMastery, gameState.difficulty);
}

/**
 * Resultado puro de una técnica activa.
 * ctx: { attack, magicAttack, maxHp, enemy, passives } — rng inyectable.
 * Devuelve un descriptor que techniqueActions.js aplica con el pipeline normal de combate.
 */
export function resolveTechnique(id, ctx, rng = Math.random) {
  const tech = TECHNIQUES[id];
  if (!tech || tech.slot === "passive") return null;
  const N = TECH_NUMBERS;
  const variance = 0.9 + 0.2 * rng();
  const phys = (mult) => Math.max(1, Math.floor((ctx.attack || 1) * mult * variance));
  const out = { id, rawDamage: 0, defPen: 0, kind: "physical" };

  switch (id) {
    case "blade_cross_slash":
      out.rawDamage = phys(N.crossSlashMult);
      out.debuff = { type: "bleed", ...N.crossSlashBleed };
      break;
    case "blade_riposte":
      out.buffs = { defend_stance: 2, riposte: N.riposteTurns };
      break;
    case "pierce_precise":
      out.rawDamage = phys(N.preciseMult);
      out.defPen = N.precisePen;
      break;
    case "pierce_venom":
      out.rawDamage = phys(N.venomMult);
      out.debuff = { type: "poison", ...N.venomPoison };
      break;
    case "blunt_crush":
      out.rawDamage = phys(N.crushMult);
      out.breakGuard = true;
      out.defShred = { ...N.crushShred };
      break;
    case "blunt_quake": {
      out.rawDamage = phys(N.quakeMult);
      const durable = !!(ctx.enemy?.isBoss || ctx.enemy?.isMiniBoss);
      if (durable) out.defShred = { ...N.quakeBossShred };
      else out.stun = rng() < N.quakeStunChance;
      out.stunResisted = durable;
      break;
    }
    case "staff_burst":
      out.kind = "magic";
      out.rawDamage = Math.max(1, Math.floor((ctx.magicAttack || 1) * N.burstMult * variance));
      break;
    case "staff_overload":
      out.buffs = { focused: N.overloadBuff };
      break;
    case "support_heal": {
      const bonus = 1 + (ctx.passives?.healBonus || 0);
      out.heal = Math.max(1, Math.floor((ctx.maxHp || 1) * N.healPct * bonus));
      out.cleanse = !!ctx.passives?.cleanse;
      break;
    }
    case "support_shield":
      out.buffs = { arcane_shield: N.shieldTurns };
      break;
    default:
      return null;
  }
  return out;
}

/** Daño tras la defensa del enemigo (con penetración 0..1). Mínimo 1. */
export function damageAfterDefense(rawDamage, enemyDefense, pen = 0) {
  const def = Math.floor((enemyDefense || 0) * (1 - Math.min(1, Math.max(0, pen))));
  return Math.max(1, rawDamage - def);
}
