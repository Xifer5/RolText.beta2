import { gameState } from "./state.js";

export const SPECIALIZATIONS = {
  // Warrior
  sword_master: {
    id: "sword_master", class: "warrior",
    name: "Maestro de Espadas", emoji: "🗡️",
    desc: "+15% daño cortante. Dominas las técnicas de esgrima avanzada.",
    bonuses: { dmgType: "slash", dmgBonus: 0.15 }
  },
  mace_master: {
    id: "mace_master", class: "warrior",
    name: "Maestro de Mazos", emoji: "🔨",
    desc: "+20% daño contundente. Tus golpes rompen cualquier armadura.",
    bonuses: { dmgType: "blunt", dmgBonus: 0.20 }
  },
  shield_master: {
    id: "shield_master", class: "warrior",
    name: "Maestro de Escudos", emoji: "🛡️",
    desc: "+25% reducción de daño físico recibido. Eres un bastión inamovible.",
    bonuses: { physicalDefenseBonus: 0.25 }
  },
  // Mage
  fire_school: {
    id: "fire_school", class: "mage",
    name: "Escuela de Fuego", emoji: "🔥",
    desc: "+20% daño de fuego. Hechizos de fuego cuestan -15% MP.",
    bonuses: { dmgType: "fire", dmgBonus: 0.20, mpDiscount: 0.15 }
  },
  ice_school: {
    id: "ice_school", class: "mage",
    name: "Escuela de Hielo", emoji: "❄️",
    desc: "+15% daño de hielo. Los congelamientos duran 1 turno extra.",
    bonuses: { dmgType: "ice", dmgBonus: 0.15, extraFrozenTurn: true }
  },
  lightning_school: {
    id: "lightning_school", class: "mage",
    name: "Escuela de Rayo", emoji: "⚡",
    desc: "+20% daño de rayo. +10% probabilidad de golpe crítico.",
    bonuses: { dmgType: "lightning", dmgBonus: 0.20, critBonus: 0.10 }
  },
  // Rogue
  assassin: {
    id: "assassin", class: "rogue",
    name: "Asesino", emoji: "☠️",
    desc: "+25% daño perforante. Ataques normales pueden envenenar al enemigo.",
    bonuses: { dmgType: "pierce", dmgBonus: 0.25, poisonOnAttack: true }
  },
  duelist: {
    id: "duelist", class: "rogue",
    name: "Duelista", emoji: "⚔️",
    desc: "+15% probabilidad de evasión. 25% de contraatacar al esquivar.",
    bonuses: { evasionBonus: 0.15, counterattack: true }
  },
  explorer: {
    id: "explorer", class: "rogue",
    name: "Explorador", emoji: "🧭",
    desc: "+10% oro de enemigos. +15% probabilidad de huir con éxito.",
    bonuses: { goldBonus: 0.10, fleeBonus: 0.15 }
  }
};

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
