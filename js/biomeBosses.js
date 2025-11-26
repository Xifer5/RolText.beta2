// biomeBosses.js
// Define los jefes (bosses) y mini-jefes de cada bioma
// Compatible con biomes.js y el sistema de combate

export const biomeBosses = {
  forest: {
    boss: "forest_titan",
    miniBosses: ["alpha_wolf", "shaman_goblin"],
    spawnChance: 0.10, // probabilidad de aparición por encuentro
  },

  cave: {
    boss: "cave_devourer",
    miniBosses: ["crystal_golem", "shadow_bat"],
    spawnChance: 0.12,
  },

  mountain: {
    boss: "mountain_colossus",
    miniBosses: ["wyvern_elder", "stone_charger"],
    spawnChance: 0.08,
  },

  ruins: {
    boss: "ancient_construct",
    miniBosses: ["arcane_beholder", "golem_guardian"],
    spawnChance: 0.15,
  },

  swamp: {
    boss: "swamp_abomination",
    miniBosses: ["toxic_hydra", "zombie_lord"],
    spawnChance: 0.14,
  },

  volcano: {
    boss: "inferno_dragon",
    miniBosses: ["lava_golem", "pyro_elemental"],
    spawnChance: 0.18,
  },

  tundra: {
    boss: "frost_wyrm",
    miniBosses: ["ice_giant", "frozen_spirit"],
    spawnChance: 0.09,
  }
};


// -----------------------------------------------------
// Función para seleccionar un jefe o mini-jefe
// Se integra con tu sistema de combate actual
// -----------------------------------------------------

export function trySpawnBoss(biomeId) {
  const biome = biomeBosses[biomeId];
  if (!biome) return null;

  // Probabilidad base del bioma
  if (Math.random() > biome.spawnChance) return null;

  // Seleccionar boss o mini-boss
  const isBoss = Math.random() < 0.3; // 30% de probabilidad de ser el boss principal

  if (isBoss) {
    return biome.boss;
  } else {
    const mini = biome.miniBosses;
    return mini[Math.floor(Math.random() * mini.length)];
  }
}


// -----------------------------------------------------
// Función principal usada desde tu sistema de combate
// -----------------------------------------------------
// Uso sugerido:
// const bossId = getBossForBiome(location.biome);
// if (bossId) startCombat(bossId);

export function getBossForBiome(biomeId) {
  const biome = biomeBosses[biomeId];
  if (!biome) return null;

  // Probabilidad dinámica (puede ajustarse según progreso del jugador)
  if (Math.random() <= biome.spawnChance) {
    return trySpawnBoss(biomeId);
  }

  return null;
}

