// lootTables.js
// Sistema de loot escalable para Pixel Quest Echoes

// -----------------------------------------------------
// Rarezas
// -----------------------------------------------------
export const RARITY = {
  COMMON: "common",
  UNCOMMON: "uncommon",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
};


// -----------------------------------------------------
// Tablas de loot por bioma
// -----------------------------------------------------
export const biomeLoot = {
  forest: [
    { item: "herb", chance: 0.40, rarity: RARITY.COMMON },
    { item: "wolf_pelt", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "goblin_dagger", chance: 0.10, rarity: RARITY.RARE },
    { item: "fungus_core", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "axe", chance: 0.25, rarity: RARITY.UNCOMMON },
    {item: "health_potion", chance: 0.30, rarity: RARITY.COMMON },
    { item: "wooden_shield", chance: 0.25, rarity: RARITY.UNCOMMON },
  ],

  cave: [
    { item: "iron_ore", chance: 0.45, rarity: RARITY.COMMON },
    { item: "bat_wing", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "crystal_shard", chance: 0.12, rarity: RARITY.RARE },
    { item: "golem_fragment", chance: 0.05, rarity: RARITY.EPIC },
    { item: "katana", chance: 0.25, rarity: RARITY.UNCOMMON },
   
  ],
  garden: [
    { item: "flower_petals", chance: 0.40, rarity: RARITY.COMMON },
    { item: "fairy_dust", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "nature_essence", chance: 0.10, rarity: RARITY.RARE },
    { item: "hammer", chance: 0.30, rarity: RARITY.COMMON },
    { item: "elven_bow", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "mana_potion", chance: 0.25, rarity: RARITY.UNCOMMON },

    ],

  mountain: [
    { item: "ice_crystal", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "wyvern_scale", chance: 0.15, rarity: RARITY.RARE },
    { item: "giant_bone", chance: 0.10, rarity: RARITY.RARE },
    { item: "ancient_relic", chance: 0.03, rarity: RARITY.EPIC },
    { item: "divine_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "stone_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "big_health_potion", chance: 0.25, rarity: RARITY.UNCOMMON },

  ],

  ruins: [
    { item: "enchanted_dust", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "runestone", chance: 0.20, rarity: RARITY.RARE },
    { item: "ancient_core", chance: 0.08, rarity: RARITY.EPIC },
    { item: "arcane_relic", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "wand", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "big_mana_potion", chance: 0.25, rarity: RARITY.UNCOMMON },
  
  ],

  swamp: [
    { item: "poison_gland", chance: 0.40, rarity: RARITY.COMMON },
    { item: "acid_sac", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "necrotic_bone", chance: 0.12, rarity: RARITY.RARE },
    { item: "toxic_heart", chance: 0.04, rarity: RARITY.EPIC },
    { item: "chainmail", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "wand", chance: 0.25, rarity: RARITY.UNCOMMON },
  ],

  desert: [
    { item: "sandstone_fragment", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "linchorn_scale", chance: 0.18, rarity: RARITY.RARE },
    { item: "desert_essence", chance: 0.07, rarity: RARITY.EPIC },
    { item: "pharaohs_scepter", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "ethereal_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "elemental_wand", chance: 0.25, rarity: RARITY.UNCOMMON },
  ],
  jungle: [
    { item: "forest_emblem_upgraded", chance: 0.40, rarity: RARITY.COMMON },
    { item: "tiger_blade", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "gorilla_heart", chance: 0.10, rarity: RARITY.RARE },
    { item: "ancient_idol", chance: 0.03, rarity: RARITY.EPIC },
    { item: "nature_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "bless_staff", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "arcane_robe", chance: 0.25, rarity: RARITY.UNCOMMON },

  ], 

  volcano: [
    { item: "magma_fragment", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "inferno_emblem_upgraded", chance: 0.15, rarity: RARITY.RARE },
    { item: "dragon_scale", chance: 0.07, rarity: RARITY.EPIC },
    { item: "heart_of_inferno", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "flame_staff", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "plate_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "ring_of_inferno", chance: 0.25, rarity: RARITY.UNCOMMON },
  
  ],

  tundra: [
    { item: "frost_shard", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "ice_essence", chance: 0.18, rarity: RARITY.RARE },
    { item: "glacial_core", chance: 0.06, rarity: RARITY.EPIC },
    { item: "demon_blade", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "ring_of_elven", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "ice_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "crystal_blade", chance: 0.25, rarity: RARITY.UNCOMMON },

  ],

  beach: [
    { item: "herb", chance: 0.40, rarity: RARITY.COMMON },
    { item: "ancient_relic", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "runestone", chance: 0.10, rarity: RARITY.RARE },
    { item: "fungus_core", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "trident", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "sea_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "serpent_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    
  ],
  catacomb: [
    { item: "necrotic_bone", chance: 0.40, rarity: RARITY.COMMON },
    { item: "dark_essence", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "soul_fragment", chance: 0.12, rarity: RARITY.RARE },
    { item: "shadow_heart", chance: 0.04, rarity: RARITY.EPIC },
    { item: "dark_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
   ],
  
  dungeon: [
    { item: "iron_ore", chance: 0.45, rarity: RARITY.COMMON },
    { item: "crystal_shard", chance: 0.12, rarity: RARITY.RARE },
    { item: "golem_fragment", chance: 0.05, rarity: RARITY.EPIC },
    { item: "katana", chance: 0.25, rarity: RARITY.UNCOMMON },
    
  ],
  
  treasure_keep: [
    { item: "golden_key", chance: 0.50, rarity: RARITY.RARE },
    { item: "treasure_map", chance: 0.30, rarity: RARITY.EPIC },
    { item: "ancient_guardian_core", chance: 0.10, rarity: RARITY.LEGENDARY },
    { item: "treasure_guardian_heart", chance: 0.10, rarity: RARITY.LEGENDARY },
    { item: "royal_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "royal_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "saint_grial", chance: 0.05, rarity: RARITY.EPIC },

  ],

  inferno: [
    { item: "dragon_heart", chance: 0.50, rarity: RARITY.EPIC },
    { item: "inferno_gem", chance: 0.30, rarity: RARITY.LEGENDARY },
    { item: "saint_grial", chance: 0.90, rarity: RARITY.LEGENDARY },
    { item: "dragon_king_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "dragon_king_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "dragon_king_crown", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "ring_of_inferno", chance: 0.25, rarity: RARITY.UNCOMMON },
  ],
   
};


// -----------------------------------------------------
// Loot específico de bosses y mini-bosses
// -----------------------------------------------------
export const bossLoot = {
  forest_titan: [
    { item: "titan_branch", chance: 1.00, rarity: RARITY.RARE },
    { item: "forest_emblem", chance: 0.25, rarity: RARITY.EPIC },
  ],

  cave_devourer: [
    { item: "devourer_fang", chance: 1.00, rarity: RARITY.RARE },
    { item: "earthbreaker_core", chance: 0.15, rarity: RARITY.EPIC },
  ],

  mountain_colossus: [
    { item: "colossus_heart", chance: 1.00, rarity: RARITY.RARE },
    { item: "mountain_emblem", chance: 0.25, rarity: RARITY.EPIC },
  ],

  ancient_construct: [
    { item: "construct_eye", chance: 1.00, rarity: RARITY.RARE },
    { item: "arcane_emblem", chance: 0.20, rarity: RARITY.LEGENDARY },
  ],

  swamp_abomination: [
    { item: "abomination_core", chance: 1.00, rarity: RARITY.RARE },
    { item: "plague_emblem", chance: 0.20, rarity: RARITY.EPIC },
  ],

  inferno_dragon: [
    { item: "inferno_eye", chance: 1.00, rarity: RARITY.EPIC },
    { item: "inferno_emblem", chance: 0.15, rarity: RARITY.LEGENDARY },
  ],

  frost_wyrm: [
    { item: "wyrm_tail", chance: 1.00, rarity: RARITY.EPIC },
    { item: "tundra_emblem", chance: 0.20, rarity: RARITY.LEGENDARY },
  ],
};


// -----------------------------------------------------
// Loot por enemigo específico (opcional)
// -----------------------------------------------------
export const enemyLoot = {
  wolf: [
    { item: "wolf_pelt", chance: 0.30, rarity: RARITY.COMMON }
  ],
  goblin: [
    { item: "rusty_coin", chance: 0.50, rarity: RARITY.COMMON },
    { item: "goblin_dagger", chance: 0.10, rarity: RARITY.UNCOMMON }
  ],
  slime: [
    { item: "slime_gel", chance: 0.50, rarity: RARITY.COMMON }
  ]
};


// -----------------------------------------------------
// Función principal: obtener loot según contexto
// -----------------------------------------------------
export function getLoot(enemyId, biomeId) {
  const drops = [];

  // 1. Loot específico del enemigo
  if (enemyLoot[enemyId]) {
    drops.push(...enemyLoot[enemyId]);
  }

  // 2. Loot del bioma
  if (biomeLoot[biomeId]) {
    drops.push(...biomeLoot[biomeId]);
  }

  // 3. Loot especial si es un boss
  if (bossLoot[enemyId]) {
    drops.push(...bossLoot[enemyId]);
  }

  // 4. Filtrar por probabilidad
  const awarded = drops.filter(drop => Math.random() <= drop.chance);

  // 5. Devolver lista de items ganados
  return awarded.map(d => d.item);
}

