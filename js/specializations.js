import { gameState } from "./state.js";

// SPEC-1105: reemplaza las 9 especializaciones planas (SPEC-0606) por 9
// sub-builds con identidad fuerte (roadmap "siguiente nivel" ítem #5) — cada
// una gana 3 mecánicas que interactúan en vez de 1-3 bonuses sueltos.
export const SPECIALIZATIONS = {
  // Warrior
  tank: {
    id: "tank", class: "warrior",
    name: "Tanque", emoji: "🛡️",
    desc: "-30% daño físico recibido. +20% HP máximo. 15% de contraatacar cualquier golpe recibido.",
    bonuses: { physicalDefenseBonus: 0.30, maxHpBonus: 0.20, counterattackOnHit: 0.15 }
  },
  berserker: {
    id: "berserker", class: "warrior",
    name: "Berserker", emoji: "😡",
    desc: "+25% daño físico (cualquier arma). Bajo 30% HP, +25% daño adicional. A cambio, +15% daño físico recibido.",
    bonuses: { dmgBonusAll: 0.25, enrageThreshold: 0.3, enrageDmgMult: 1.25, physicalDefensePenalty: 0.15 }
  },
  holy_knight: {
    id: "holy_knight", class: "warrior",
    name: "Caballero Sagrado", emoji: "✝️",
    desc: "+20% daño sagrado. Cura 10% del HP faltante al matar un enemigo. -30% probabilidad de sufrir efectos de estado.",
    bonuses: { dmgType: "holy", dmgBonus: 0.20, healOnKill: 0.10, debuffResistPct: 0.30 }
  },
  // Mage
  elementalist: {
    id: "elementalist", class: "mage",
    name: "Elementalista", emoji: "🔥",
    desc: "+20% daño de fuego. Los congelamientos duran 1 turno extra. +10% probabilidad de golpe crítico.",
    bonuses: { dmgType: "fire", dmgBonus: 0.20, extraFrozenTurn: true, critBonus: 0.10 }
  },
  necromancer: {
    id: "necromancer", class: "mage",
    name: "Nigromante", emoji: "💀",
    desc: "+20% daño oscuro. Robas 15% del daño mágico como HP. Los críticos mágicos maldicen al enemigo (-15% ataque, 2 turnos).",
    bonuses: { dmgType: "dark", dmgBonus: 0.20, lifeStealOnMagic: 0.15, curseOnMagicCrit: true }
  },
  chronomancer: {
    id: "chronomancer", class: "mage",
    name: "Cronomante", emoji: "⏳",
    desc: "Hechizos cuestan -25% MP. 10% de actuar de nuevo tras lanzar magia. 20% de que tu hechizo cancele la próxima acción del enemigo.",
    bonuses: { mpDiscount: 0.25, extraTurnChance: 0.10, enemyStunOnHitChance: 0.20 }
  },
  // Rogue
  assassin: {
    id: "assassin", class: "rogue",
    name: "Asesino", emoji: "☠️",
    desc: "+25% daño perforante. Ataques normales pueden envenenar al enemigo. +50% daño contra enemigos bajo 30% HP.",
    bonuses: { dmgType: "pierce", dmgBonus: 0.25, poisonOnAttack: true, executeBonus: 0.50 }
  },
  trapper: {
    id: "trapper", class: "rogue",
    name: "Trampero", emoji: "🪤",
    desc: "Ataques normales pueden desangrar al enemigo. Cada golpe reduce su defensa (hasta 3 veces). +10% probabilidad de evasión.",
    bonuses: { bleedOnAttack: 0.35, enemyDefenseShred: 0.15, evasionBonus: 0.10 }
  },
  duelist: {
    id: "duelist", class: "rogue",
    name: "Duelista", emoji: "⚔️",
    desc: "+15% probabilidad de evasión. 25% de contraatacar al esquivar, con +30% de daño.",
    bonuses: { evasionBonus: 0.15, counterattack: true, counterDmgBonus: 0.30 }
  }
};

// SPEC-1105: saves viejos pueden traer un id de especialización que ya no
// existe (ej. "sword_master") — se resetea a null para que el jugador pueda
// volver a elegir entre las 9 nuevas. Mismo patrón que migratePermanentBonuses
// de stats.js. Devuelve true si migró (para que el caller decida si guardar).
export function migrateUnknownSpecialization(player) {
  if (!player || player.specialization == null) return false;
  if (SPECIALIZATIONS[player.specialization]) return false;
  player.specialization = null;
  return true;
}

export function getClassSpecializations(classId) {
  return Object.values(SPECIALIZATIONS).filter(s => s.class === classId);
}

export function canSpecialize(player) {
  return (player.level || 0) >= 10 && !player.specialization;
}

export function chooseSpecialization(specId) {
  const spec = SPECIALIZATIONS[specId];
  if (!spec) return null;
  if (spec.class !== gameState.player.class) return null;
  if (!canSpecialize(gameState.player)) return null;
  gameState.player.specialization = specId;
  return spec;
}

export function getActiveSpec() {
  const specId = gameState.player?.specialization;
  return specId ? (SPECIALIZATIONS[specId] || null) : null;
}
