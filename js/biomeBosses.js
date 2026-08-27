// biomeBosses.js
// Define los jefes (bosses) y mini-jefes de cada bioma
// Compatible con biomes.js y el sistema de combate
import { isEnemyAvailable } from "./timeOfDay.js";

export const biomeBosses = {
  forest: {
    boss: "forest_titan",
    miniBosses: ["wolf", "goblin_shaman"],
    spawnChance: 0.10, // probabilidad de aparición por encuentro
  },

  cave: {
    boss: "cave_devourer",
    miniBosses: ["stone_golem", "cave_bat"],
    spawnChance: 0.12,
  },

  mountain: {
    boss: "mountain_colossus",
    miniBosses: ["wyvern", "stone_charger"],
    spawnChance: 0.08,
  },

  ruin: {
    boss: "ancient_construct",
    miniBosses: ["beholder", "ancient_guardian"],
    spawnChance: 0.15,
  },

  swamp: {
    boss: "swamp_abomination",
    miniBosses: ["hydra", "zombie"],
    spawnChance: 0.14,
  },

  volcano: {
    boss: "inferno_dragon",
    miniBosses: ["lava_golem", "pyro_elemental"],
    spawnChance: 0.18,
  },

  tundra: {
    boss: "frost_wyrm",
    miniBosses: ["ice_giant", "frozen_spirit"], // nuevos, ver enemies.js
    spawnChance: 0.09,
  }
};


// -----------------------------------------------------
// Función para seleccionar un jefe o mini-jefe
// Se integra con tu sistema de combate actual
// -----------------------------------------------------

// SPEC-1104: robar la bolsa → más emboscadas (+50%); liberar el eco en el
// bosque → protección del bosque (-50%, solo bioma forest). Ambos se
// componen en movement.js y llegan acá como un único multiplicador.
export const AMBUSH_CHANCE_MULT = 1.5;

export function trySpawnBoss(biomeId, ambushMult = 1) {
  const biome = biomeBosses[biomeId];
  if (!biome) return null;

  // Probabilidad base del bioma, ajustada por el multiplicador de emboscadas
  if (Math.random() > biome.spawnChance * ambushMult) return null;

  // Seleccionar boss o mini-boss
  const isBoss = Math.random() < 0.3; // 30% de probabilidad de ser el boss principal

  if (isBoss) {
    return biome.boss;
  } else {
    // SPEC-0701: no elegir un mini-boss exclusivo de día/noche fuera de su horario
    const mini = biome.miniBosses.filter(isEnemyAvailable);
    if (!mini.length) return null;
    return mini[Math.floor(Math.random() * mini.length)];
  }
}


// SPEC-1104: identifica positivamente un mini-boss (nunca el boss principal
// de zona, que vive en biome.boss, ni dragon_king, que no está en ninguna
// lista miniBosses[]) — usado para habilitar el botón "Perdonar" solo en ellos.
export function isMiniBossId(enemyId) {
  return Object.values(biomeBosses).some(b => b.miniBosses.includes(enemyId));
}

