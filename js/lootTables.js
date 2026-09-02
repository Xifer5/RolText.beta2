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
    { item: "echo_amulet", chance: 0.05, rarity: RARITY.EPIC },
    { item: "fungus_core", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "axe", chance: 0.25, rarity: RARITY.UNCOMMON },
    {item: "health_potion", chance: 0.30, rarity: RARITY.COMMON },
    { item: "wooden_shield", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "forest_emblem_upgraded", chance: 0.05, rarity: RARITY.LEGENDARY },
    { item: "forest_emblem", chance: 0.15, rarity: RARITY.RARE },
    { item: "leather_hat", chance: 0.15, rarity: RARITY.COMMON },
    { item: "leather_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "leather_gloves", chance: 0.15, rarity: RARITY.COMMON },
  

  ],

  cave: [
    { item: "iron_ore", chance: 0.45, rarity: RARITY.COMMON },
    { item: "bat_wing", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "crystal_shard", chance: 0.12, rarity: RARITY.RARE },
    { item: "golem_fragment", chance: 0.05, rarity: RARITY.EPIC },
    { item: "ravenous_sword", chance: 0.05, rarity: RARITY.EPIC },
    { item: "katana", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "shield", chance: 0.25, rarity: RARITY.COMMON },
    { item: "helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "iron_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],
  garden: [
    { item: "flower_petals", chance: 0.40, rarity: RARITY.COMMON },
    { item: "fairy_dust", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "nature_essence", chance: 0.10, rarity: RARITY.RARE },
    // SPEC-1225: mq_03_ecos (Eryndel, "Ecos del Pasado") pide este item y su
    // propio diálogo dice "las criaturas que custodian este jardín lo
    // portan" -- pero ancient_core solo existía en la tabla de "ruins",
    // un bioma sin relación con esta misión. El jugador no tenía forma real
    // de completarla salvo tropezar con él por accidente en otra zona.
    { item: "ancient_core", chance: 0.06, rarity: RARITY.EPIC },
    // SPEC-1226: imp (enemies.js `drops: ["gown"]`) nunca conectado a
    // ningún sistema real de loot.
    { item: "gown", chance: 0.20, rarity: RARITY.UNCOMMON },
    { item: "hammer", chance: 0.30, rarity: RARITY.COMMON },
    { item: "elven_bow", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "mana_potion", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "shield_of_elves", chance: 0.25, rarity: RARITY.COMMON },
    { item: "iron_helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "iron_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "iron_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
    ],

  mountain: [
    { item: "ice_crystal", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "wyvern_scale", chance: 0.15, rarity: RARITY.RARE },
    { item: "giant_bone", chance: 0.10, rarity: RARITY.RARE },
    { item: "ancient_relic", chance: 0.03, rarity: RARITY.EPIC },
    { item: "divine_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "stone_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "big_health_potion", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "strong_shield", chance: 0.25, rarity: RARITY.COMMON },
    { item: "mountain_emblem", chance: 0.15, rarity: RARITY.RARE },
    { item: "plate_helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "plate_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "plate_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],

  ruins: [
    { item: "enchanted_dust", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "runestone", chance: 0.20, rarity: RARITY.RARE },
    { item: "ancient_core", chance: 0.08, rarity: RARITY.EPIC },
    { item: "arcane_relic", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "ring_last_breath", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "wand", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "big_mana_potion", chance: 0.25, rarity: RARITY.COMMON },
    { item: "iron_shield", chance: 0.25, rarity: RARITY.COMMON },
    { item: "arcane_emblem", chance: 0.15, rarity: RARITY.RARE },
    { item: "Magic_hat", chance: 0.15, rarity: RARITY.COMMON },
    { item: "magic_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "magic_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],

  swamp: [
    { item: "poison_gland", chance: 0.40, rarity: RARITY.COMMON },
    { item: "acid_sac", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "necrotic_bone", chance: 0.12, rarity: RARITY.RARE },
    { item: "toxic_heart", chance: 0.04, rarity: RARITY.EPIC },
    { item: "cloak_of_mist", chance: 0.05, rarity: RARITY.EPIC },
    { item: "chainmail", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "wand", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "plague_emblem", chance: 0.15, rarity: RARITY.RARE },
    { item: "acolyte_hat", chance: 0.15, rarity: RARITY.COMMON },
    { item: "strength_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "strength_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],

  desert: [
    { item: "sandstone_fragment", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "linchorn_scale", chance: 0.18, rarity: RARITY.RARE },
    { item: "desert_essence", chance: 0.07, rarity: RARITY.EPIC },
    { item: "pharaohs_scepter", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "ethereal_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "elemental_wand", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "dark_mage_hat", chance: 0.15, rarity: RARITY.COMMON },
    { item: "black_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "black_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],

  jungle: [
    { item: "forest_emblem_upgraded", chance: 0.40, rarity: RARITY.COMMON },
    { item: "tiger_blade", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "gorilla_heart", chance: 0.10, rarity: RARITY.RARE },
    { item: "ancient_idol", chance: 0.03, rarity: RARITY.EPIC },
    // SPEC-1226: vine_serpent/gorilla_warrior (enemies.js `drops`, nunca
    // conectado a ningún sistema real) prometían estos 3 -- solo el resto
    // de su lista (nature_robe) era alcanzable en otro lado.
    { item: "vine_whip", chance: 0.08, rarity: RARITY.RARE },
    { item: "giant_club", chance: 0.06, rarity: RARITY.EPIC },
    { item: "jungle_armor", chance: 0.06, rarity: RARITY.EPIC },
    // SPEC-1226: jungle_tiger (enemies.js `drops`) prometía esto también.
    { item: "leather_armor", chance: 0.22, rarity: RARITY.UNCOMMON },
    { item: "nature_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "bless_staff", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "arcane_robe", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "spirit_staff", chance: 0.15, rarity: RARITY.EPIC },
    { item: "viking_helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "black_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "black_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ], 

  volcano: [
    { item: "magma_fragment", chance: 0.35, rarity: RARITY.UNCOMMON },
    { item: "inferno_emblem_upgraded", chance: 0.15, rarity: RARITY.RARE },
    { item: "dragon_scale", chance: 0.07, rarity: RARITY.EPIC },
    { item: "heart_of_inferno", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "burnt_book", chance: 0.05, rarity: RARITY.EPIC },
    // SPEC-1226: Inferno_elemental (enemies.js `drops`) prometía fire_robe
    // junto a flame_staff -- solo flame_staff era alcanzable en otro lado.
    { item: "fire_robe", chance: 0.06, rarity: RARITY.EPIC },
    { item: "flame_staff", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "plate_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "ring_of_inferno", chance: 0.10, rarity: RARITY.LEGENDARY },
    { item: "tower_shield", chance: 0.20, rarity: RARITY.UNCOMMON },
    { item: "inferno_emblem", chance: 0.15, rarity: RARITY.RARE },
    { item: "demon_blade", chance: 0.10, rarity: RARITY.EPIC },
    { item: "dark_armor", chance: 0.10, rarity: RARITY.EPIC },
    { item: "divine_helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "divine_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "divine_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
  ],

  tundra: [
    { item: "frost_shard", chance: 0.30, rarity: RARITY.UNCOMMON },
    { item: "ice_essence", chance: 0.18, rarity: RARITY.RARE },
    { item: "glacial_core", chance: 0.06, rarity: RARITY.EPIC },
    { item: "demon_blade", chance: 0.02, rarity: RARITY.LEGENDARY },
    { item: "ring_of_elven", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "ice_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "crystal_blade", chance: 0.15, rarity: RARITY.EPIC },
    { item: "tundra_emblem", chance: 0.15, rarity: RARITY.LEGENDARY },
    { item: "giant_orc_helmet", chance: 0.15, rarity: RARITY.LEGENDARY },
    
  
  ],

  beach: [
    { item: "herb", chance: 0.40, rarity: RARITY.COMMON },
    { item: "ancient_relic", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "runestone", chance: 0.10, rarity: RARITY.RARE },
    { item: "fungus_core", chance: 0.25, rarity: RARITY.UNCOMMON },
    // SPEC-1226: pirate_captain/mermaid/sea_serpent (enemies.js `drops`)
    // prometían estos 5 -- solo water_staff (sibling de aqua_robe) era
    // alcanzable en otro lado.
    { item: "captain_sword", chance: 0.06, rarity: RARITY.EPIC },
    { item: "captain_coat", chance: 0.06, rarity: RARITY.EPIC },
    { item: "ocean_staff", chance: 0.06, rarity: RARITY.EPIC },
    { item: "coral_robe", chance: 0.06, rarity: RARITY.EPIC },
    { item: "aqua_robe", chance: 0.06, rarity: RARITY.EPIC },
    // SPEC-1226: pirate (enemies.js `drops`) prometía esto también.
    { item: "leather_armor", chance: 0.22, rarity: RARITY.UNCOMMON },
    { item: "trident", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "sea_armor", chance: 0.25, rarity: RARITY.UNCOMMON },
    { item: "serpent_sword", chance: 0.25, rarity: RARITY.UNCOMMON },
    {item: "spartan_helmet", chance: 0.15, rarity: RARITY.COMMON },
    { item: "plate_boots", chance: 0.15, rarity: RARITY.COMMON },
    { item: "plate_bracers", chance: 0.15, rarity: RARITY.COMMON },
  
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

  // SPEC-1226: dragon_king (enemies.js `drops: ["saint_grail", "excalibur",
  // "dragon_heart"]`) no tenía NINGUNA entrada en bossLoot. "saint_grail" es
  // un typo de "saint_grial" (el item real, ya obtenible en otro lado) y
  // "dragon_heart" ya está en biomeLoot.inferno -- pero excalibur (arma
  // absurdamente poderosa, +50 ATK/+20 a todo/+50 HP máx) no existía en
  // NINGÚN sistema real. El jefe final del juego no tenía su recompensa
  // insignia conectada a nada.
  dragon_king: [
    { item: "excalibur", chance: 0.30, rarity: RARITY.LEGENDARY },
  ],

  valdris_corrupted: [
    { item: "corrupted_grimoire", chance: 1.00, rarity: RARITY.RARE },
    { item: "valdris_seal", chance: 0.25, rarity: RARITY.LEGENDARY },
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

  // 4. Filtrar por probabilidad con una ligera mejora de drop para hacer el loot más entretenido
  const awarded = drops.filter(drop => Math.random() <= Math.min(1, drop.chance * 1));

  // 5. Garantizar al menos un ítem si no se obtiene nada por azar
  if (awarded.length === 0 && drops.length) {
    const guaranteed = drops.filter(drop => drop.rarity === RARITY.COMMON);
    awarded.push(guaranteed.length ? guaranteed[Math.floor(Math.random() * guaranteed.length)] : drops[Math.floor(Math.random() * drops.length)]);
  }

  // 6. Devolver lista de items ganados
  return awarded.map(d => d.item);
}

