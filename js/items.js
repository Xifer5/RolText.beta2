// items.js
export const allItems = {
  // Pociones
  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores 25 HP.",
    icon: "❤️",
    type: "consumable",
    price: 10,
  },
  mana_potion: {
    id: "mana_potion",
    name: "Mana Potion",
    description: "Restores 10 MP.",
    icon: "🔵",
    type: "consumable",
    price: 12,
  },
  elixir_potion: {
    id: "elixir_potion",
    name: "Elixir Potion",
    description: "Restores 50 HP. and 30 MP.",
    icon: "✨",
    type: "consumable",
    price: 30,
  },
  big_health_potion: {
    id: "big_health_potion",
    name: "Big Health Potion",
    description: "Restores 75 HP.",
    icon: "❤️‍🔥",
    type: "consumable",
    price: 35,
  },

  big_mana_potion: {
    id: "big_mana_potion",
    name: "Big Mana Potion",
    description: "Restores 50 MP.",
    icon: "🔷",
    type: "consumable",
    price: 25,
  },

  // Armas
  sword: {
    id: "sword",
    name: "Sword",
    description: "A sturdy blade. +5 ATK",
    slot: "rightHand",
    attack: 5,
    price: 30,
    icon: "🗡️",
  },
  axe: {
    id: "axe",
    name: "Battle Axe",
    description: "A heavy axe. +8 ATK",
    slot: "rightHand",
    attack: 8,
    price: 50,
    icon: "🪓",
  },
  hammer: {
    id: "hammer",
    name: "Battle Hammer",
    description: "A heavy hammer. +10 ATK",
    slot: "rightHand",
    attack: 10,
    price: 70,
    icon: "🔨",
  },
  katana: {
    id: "katana",
    name: "Katana",
    description: "A ceremonial katana. +15 ATK",
    slot: "rightHand",
    attack: 15,
    price: 100,
    icon: "⚔️",
  },
  divine_sword: {
    id: "divine_sword",
    name: "Divine Sword",
    description: "A divine weapon. +20 ATK",
    slot: "rightHand",
    attack: 30,
    price: 150,
    icon: "⚜️",
  },
  staff: {
    id: "staff",
    name: "Magic Staff",
    description: "A staff imbued with magic. +3 INT, +2 MAG",
    slot: "rightHand",
    intelligence: 3,
    magic: 2,
    price: 45,
    icon: "🌟",
  },
  wand: {
    id: "wand",
    name: "Magic Wand",
    description: "A wand imbued with magic. +5 INT, +3 MAG",
    slot: "rightHand",
    intelligence: 5,
    magic: 3,
    price: 65,
    icon: "🔮",
  },
  elemental_wand: {
    id: "elemental_wand",
    name: "Elemental Wand",
    description: "A elemental wand imbued with magic of elemnts. +7 INT, +5 MAG",
    slot: "rightHand",
    intelligence: 7,
    magic: 5,
    price: 85,
  },
  bless_staff: {
    id: "bless_staff",
    name: "Bless Staff",
    description: "A blessed staff imbued with magic. +10 INT, +7 MAG",
    slot: "rightHand",
    intelligence: 10,
    magic: 7,
    price: 120,
  },

  // Armaduras
  armor: {
    id: "armor",
    name: "Leather Armor",
    description: "Simple armor. +3 DEF",
    slot: "armor",
    defense: 3,
    price: 40,
  },
  chainmail: {
    id: "chainmail",
    name: "Chainmail Armor",
    description: "Strong armor. +10 DEF",
    slot: "armor",
    defense: 10,
    price: 80,
  },
  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    description: "Strong armor. +20 DEF",
    slot: "armor",
    defense: 20,
    price: 300,
  },
  robe: {
    id: "robe",
    name: "Mage Robe",
    description: "Enchanted robe. +2 INT, +1 DEF",
    slot: "armor",
    intelligence: 2,
    defense: 1,
    price: 35,
  },
  gown: {
    id: "gown",
    name: "Mage Gown",
    description: "Enchanted gown. +5 INT, +3 DEF",
    slot: "armor",
    intelligence: 5,
    defense: 3,
    price: 50,
  },
  arcane_robe: {
    id: "arcane_robe",
    name: "Arcane Mage Robe",
    description: "Enchanted arcane robe. +8 INT, +5 DEF",
    slot: "armor",
    intelligence: 8,
    defense: 5,
    price: 80,
  },

  // Accesorios
  ring_strength: {
    id: "ring_strength",
    name: "Ring of Strength",
    description: "Increases physical power. +2 STR",
    slot: "accessory",
    strength: 2,
    price: 60,
  },
  ring_agility: {
    id: "ring_agility",
    name: "Ring of Agility",
    description: "Enhances movement. +2 AGI",
    slot: "accessory",
    agility: 2,
    price: 60,
  },
  ring_intelligence: {
    id: "ring_intelligence",
    name: "Ring of Intelligence",
    description: "Boosts magical power. +2 INT",
    slot: "accessory",
    intelligence: 2,
    price: 60,
  },
  ring_of_knowledge: {
    id: "ring_of_knowledge",
    name: "Ring of  Knowledge",
    description: "Boosts magical power. +10 INT",
    slot: "accessory",
    intelligence: 10,
    price: 600,
  },
   ring_of_power: {
    id: "ring_of_power",
    name: "Ring of Power",
    description: "Increases physical power. +10 STR",
    slot: "accessory",
    strength: 10,
    price: 600,
  },

  ring_of_elven: {
    id: "ring_of_elven",
    name: "Ring of Elven",
    description: "Enhances movement. +10 AGI",
    slot: "accessory",
    agility: 10,
    price: 600,
  },


  saint_grial: {
    id: "saint_grial",
    name: "Saint Grial",
    description: "This is the Quest object. Boosts attack and magical power. +30 STR +20 AGI +20 INT",
    slot: "accessory",
    intelligence: 20,
    agility: 20,
    strength: 30,
    hpBonus: 80,
    price: 60,

  },

  excalibur: {
      id: "excalibur",
      name: "Excalibur Sword",
      description: "An EPIC divine weapon. +50 ATK, +20 STR, +20 AGI, +20 INT, +50 MAX HP, +20 DEF",
      slot: "rightHand",
      attack: 50,
      strenght: 20,
      agility: 20,
      intelligence: 20,
      price: 1000,
      mxHP: 50,
      defence: 20,
      icon: "⚜️",
  },
  
  // =====================
  // ⭐ Loot común por bioma
  // =====================

  herb: {
    id: "herb",
    name: "Healing Herb",
    type: "material",
    rarity: "common",
    price: 5
  },

  wolf_pelt: {
    id: "wolf_pelt",
    name: "Wolf Pelt",
    type: "material",
    rarity: "uncommon",
    price: 8
  },

  goblin_dagger: {
    id: "goblin_dagger",
    name: "Goblin Dagger",
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 3,
    price: 20
  },

  fungus_core: {
    id: "fungus_core",
    name: "Fungus Core",
    type: "material",
    rarity: "rare",
    price: 18
  },

  iron_ore: {
    id: "iron_ore",
    name: "Iron Ore",
    type: "material",
    rarity: "common",
    price: 5
  },

  bat_wing: {
    id: "bat_wing",
    name: "Bat Wing",
    type: "material",
    rarity: "uncommon",
    price: 8
  },

  crystal_shard: {
    id: "crystal_shard",
    name: "Crystal Shard",
    type: "material",
    rarity: "rare",
    price: 20
  },

  golem_fragment: {
    id: "golem_fragment",
    name: "Golem Fragment",
    type: "material",
    rarity: "epic",
    price: 35
  },

  ice_crystal: {
    id: "ice_crystal",
    name: "Ice Crystal",
    type: "material",
    rarity: "uncommon",
    price: 15
  },

  wyvern_scale: {
    id: "wyvern_scale",
    name: "Wyvern Scale",
    type: "material",
    rarity: "rare",
    price: 35
  },

  giant_bone: {
    id: "giant_bone",
    name: "Giant Bone",
    type: "material",
    rarity: "rare",
    price: 25
  },

  ancient_relic: {
    id: "ancient_relic",
    name: "Ancient Relic",
    type: "material",
    rarity: "epic",
    price: 50
  },

  enchanted_dust: {
    id: "enchanted_dust",
    name: "Enchanted Dust",
    type: "material",
    rarity: "uncommon",
    price: 12
  },

  runestone: {
    id: "runestone",
    name: "Runestone",
    type: "material",
    rarity: "rare",
    price: 30
  },

  ancient_core: {
    id: "ancient_core",
    name: "Ancient Core",
    type: "material",
    rarity: "epic",
    price: 40
  },

  arcane_relic: {
    id: "arcane_relic",
    name: "Arcane Relic",
    type: "material",
    rarity: "legendary",
    price: 100
  },

  poison_gland: {
    id: "poison_gland",
    name: "Poison Gland",
    type: "material",
    rarity: "common",
    price: 6
  },

  acid_sac: {
    id: "acid_sac",
    name: "Acid Sac",
    type: "material",
    rarity: "uncommon",
    price: 10
  },

  necrotic_bone: {
    id: "necrotic_bone",
    name: "Necrotic Bone",
    type: "material",
    rarity: "rare",
    price: 22
  },

  toxic_heart: {
    id: "toxic_heart",
    name: "Toxic Heart",
    type: "material",
    rarity: "epic",
    price: 45
  },

  magma_fragment: {
    id: "magma_fragment",
    name: "Magma Fragment",
    type: "material",
    rarity: "uncommon",
    price: 18
  },

  pyro_core: {
    id: "pyro_core",
    name: "Pyro Core",
    type: "material",
    rarity: "rare",
    price: 28
  },

  dragon_scale: {
    id: "dragon_scale",
    name: "Dragon Scale",
    type: "material",
    rarity: "epic",
    price: 75
  },

  heart_of_inferno: {
    id: "heart_of_inferno",
    name: "Heart of the Inferno",
    type: "material",
    rarity: "legendary",
    price: 150
  },

  frost_shard: {
    id: "frost_shard",
    name: "Frost Shard",
    type: "material",
    rarity: "uncommon",
    price: 14
  },

  ice_essence: {
    id: "ice_essence",
    name: "Ice Essence",
    type: "material",
    rarity: "rare",
    price: 24
  },

  glacial_core: {
    id: "glacial_core",
    name: "Glacial Core",
    type: "material",
    rarity: "epic",
    price: 60
  },


  // =====================
  // ⭐ Loot de Jefes
  // =====================

  titan_branch: {
    id: "titan_branch",
    name: "Titan Branch",
    type: "material",
    rarity: "rare",
    price: 40
  },

  forest_emblem: {
    id: "forest_emblem",
    name: "Forest Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    magic: 5,
    defense: 2,
    hpBonus: 20,
    price: 90
  },

  devourer_fang: {
    id: "devourer_fang",
    name: "Devourer Fang",
    type: "material",
    rarity: "rare",
    price: 45
  },

  earthbreaker_core: {
    id: "earthbreaker_core",
    name: "Earthbreaker Core",
    type: "material",
    rarity: "epic",
    price: 100
  },

  colossus_heart: {
    id: "colossus_heart",
    name: "Colossus Heart",
    type: "material",
    rarity: "rare",
    price: 55
  },

  mountain_emblem: {
    id: "mountain_emblem",
    name: "Mountain Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    defense: 4,
    hpBonus: 30,
    price: 120
  },

  construct_eye: {
    id: "construct_eye",
    name: "Construct Eye",
    type: "material",
    rarity: "rare",
    price: 50
  },

  arcane_emblem: {
    id: "arcane_emblem",
    name: "Arcane Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    magic: 8,
    defense: 3,
    price: 150
  },

  abomination_core: {
    id: "abomination_core",
    name: "Abomination Core",
    type: "material",
    rarity: "rare",
    price: 48
  },

  plague_emblem: {
    id: "plague_emblem",
    name: "Plague Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    strength: 3,
    magic: 3,
    price: 120
  },

  inferno_eye: {
    id: "inferno_eye",
    name: "Inferno Eye",
    type: "material",
    rarity: "epic",
    price: 85
  },

  inferno_emblem: {
    id: "inferno_emblem",
    name: "Inferno Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    attack: 5,
    magic: 5,
    price: 200
  },

  wyrm_tail: {
    id: "wyrm_tail",
    name: "Frost Wyrm Tail",
    type: "material",
    rarity: "epic",
    price: 70
  },

  tundra_emblem: {
    id: "tundra_emblem",
    name: "Tundra Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    defense: 5,
    magic: 4,
    price: 180
  },
  // Crafting Results
iron_sword: {
  id: "iron_sword",
  name: "Iron Sword",
  type: "weapon",
  rarity: "uncommon",
  slot: "rightHand",
  attack: 6,
  icon: "🔪",
  price: 40
},

crystal_blade: {
  id: "crystal_blade",
  name: "Crystal Blade",
  type: "weapon",
  rarity: "rare",
  slot: "rightHand",
  attack: 18,
  magic: 3,
  icon: "💎",
  price: 200
},

healing_elixir: {
  id: "healing_elixir",
  name: "Healing Elixir",
  type: "consumable",
  rarity: "rare",
  restoreHp: 60,
  icon: "🩹",
  price: 45
},

mana_elixir: {
  id: "mana_elixir",
  name: "Mana Elixir",
  type: "consumable",
  rarity: "uncommon",
  restoreMp: 40,
  icon: "🧿",
  price: 40
},

forest_emblem_upgraded: {
  id: "forest_emblem_upgraded",
  name: "Forest Emblem+",
  type: "accessory",
  slot: "accessory",
  rarity: "epic",
  magic: 10,
  defense: 5,
  price: 180
  , icon: "🌿"
},

inferno_emblem_upgraded: {
  id: "inferno_emblem_upgraded",
  name: "Inferno Emblem+",
  type: "accessory",
  slot: "accessory",
  rarity: "legendary",
  strength : 10,
  agility: 10,
  intelligence: 10,
  attack: 10,
  magic: 10,
  price: 300
  , icon: "🔥"
},

rusty_coin: {
  id: "rusty_coin",
  name: "Rusty Coin",
  type: "material",
  rarity: "common",
  price: 5
},

trident: {
  id: "trident",
  name: "Trident",
  type: "weapon",
  rarity: "rare",
  slot: "rightHand",
  attack: 12,
  price: 100
},

sea_armor: {
  id: "sea_armor",
  name: "Sea Armor",
  type: "armor",
  rarity: "epic",
  slot: "armor",
  defense: 12,
  price: 150
},
water_staff: {
  id: "water_staff",
  name: "Water Staff",
  type: "weapon",
  rarity: "rare",
  slot: "rightHand",
  intelligence: 10,
  magic: 8,
  price: 90
},
aqua_robe: {
  id: "aqua_robe",
  name: "Aqua Robe",
  type: "armor",
  rarity: "epic",
  slot: "armor",
  intelligence: 12,
  defense: 6,
  price: 130
},
serpent_sword: {
  id: "serpent_sword",
  name: "Serpent Sword",
  type: "weapon",
  rarity: "epic",
  slot: "rightHand",
  attack: 15,
  price: 120
},
stone_armor: {
  id: "stone_armor",
  name: "Stone Armor",
  type: "armor",
  rarity: "epic",
  slot: "armor",
  defense: 14,
  price: 160
},
ocean_staff: {
  id: "ocean_staff",
  name: "Ocean Staff",
  type: "weapon",
  rarity: "epic",
  slot: "rightHand",
  intelligence: 15,
  magic: 10,
  price: 140
},
coral_robe: {
  id: "coral_robe",
  name: "Coral Robe",
  type: "armor",
  rarity: "epic",
  slot: "armor",
  intelligence: 10,
  defense: 8,
  price: 150
},
cutlass: {
  id: "cutlass",
  name: "Cutlass",
  type: "weapon",
  rarity: "rare",
  slot: "rightHand",
  attack: 11,
  price: 95
},
leather_armor: {
  id: "leather_armor",
  name: "Leather Armor",
  type: "armor",
  rarity: "uncommon",
  slot: "armor",
  defense: 7,
  price: 70
  },
captain_sword: {
    id: "captain_sword",
    name: "Captain Sword",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 16,
    price: 130
  },
  captain_coat: {
    id: "captain_coat",
    name: "Captain Coat",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 13,
    price: 140
  },
  flame_staff: {
    id: "flame_staff",
    name: "Flame Staff",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 18,
    magic: 12,
    price: 160
  },
  fire_robe: {
    id: "fire_robe",
    name: "Fire Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 9,
    price: 170
  },
  giant_club: {
    id: "giant_club",
    name: "Giant Club",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 14,
    price: 125
  },
  jungle_armor: {
    id: "jungle_armor",
    name: "Jungle Armor",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 12,
    price: 135
  },
  tiger_blade: {
    id: "tiger_blade",
    name: "Tiger Blade",
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 10,
    price: 90
  },
  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    type: "armor",
    rarity: "uncommon",
    slot: "armor",
    defense: 7,
    price: 70
  },
  vine_whip: {
    id: "vine_whip",
    name: "Vine Whip",
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 11,
    price: 95
  },
  nature_robe: {
    id: "nature_robe",
    name: "Nature Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 12,
    defense: 6,
    price: 130
  },
  spirit_staff: {
    id: "spirit_staff",
    name: "Spirit Staff",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 15,
    magic: 10,
    price: 140
  },
  ethereal_robe: {
    id: "ethereal_robe",
    name: "Ethereal Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 8,
    price: 150
  },
  demon_blade: {
    id: "demon_blade",
    name: "Demon Blade",
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 20,
    price: 200
  },
  dark_armor: {
    id: "dark_armor",
    name: "Dark Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 15,
    price: 220
  },
  slime_gel: {
    id: "slime_gel",
    name: "Slime Gel",
    type: "material",
    rarity: "common",
    price: 4
  },
  golden_key: {
    id: "golden_key",
    name: "Golden Key",
    type: "key_item",
    rarity: "rare",
    price: 100
  },
  treasure_map: {
    id: "treasure_map",
    name: "Treasure Map",
    type: "key_item",
    rarity: "uncommon",
    price: 50
  },
  ancient_guardian_core: {
    id: "ancient_guardian_core",
    name: "Ancient Guardian Core",
    type: "material",
    rarity: "legendary",
    price: 200
  },
  treasure_guardian_core: {
    id: "treasure_guardian_core",
    name: "Treasure Guardian Core",
    type: "material",
    rarity: "epic",
    price: 120
  },
  treasure_guardian_heart: {
    id: "treasure_guardian_heart",
    name: "Treasure Guardian Heart",
    type: "material",
    rarity: "rare",
    price: 80
  },
  royal_sword: {
    id: "royal_sword",
    name: "Royal Sword",
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 25,
    price: 300
  },
  royal_armor: {
    id: "royal_armor",
    name: "Royal Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 20,
    price: 350
  },
  dragon_heart: {
    id: "dragon_heart",
    name: "Dragon Heart",
    type: "material",
    rarity: "legendary",
    price: 250
  },
  inferno_gem: {
    id: "inferno_gem",
    name: "Inferno Gem",
    type: "material",
    rarity: "legendary",
    price: 220
  },
  dragon_king_crown: {
    id: "dragon_king_crown",
    name: "Dragon King Crown",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    intelligence: 15,
    strength: 15,
    agility: 15,
    price: 400
  },
  dragon_king_sword: {
    id: "dragon_king_sword",
    name: "Dragon King Sword",
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 50,
    price: 500
  },
  dragon_king_armor: {
    id: "dragon_king_armor",
    name: "Dragon King Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 50,
    price: 500
  },
  ring_of_inferno: {
    id: "ring_of_inferno",
    name: "Ring of Inferno",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    strength: 15,
    agility: 15,
    intelligence: 15,
    attack: 15,
    magic: 15,
    price: 350
  },
  






};

// Inventarios de tienda por ubicación
export const shopInventories = {
  // town shop (adventurer's supply)
  shop: [
    "health_potion",
    "mana_potion",
    "sword",
    "armor",
    "staff",
    "robe",
    "ring_strength",
    "ring_agility",
    "ring_intelligence",
  ],
  // castle quartermaster has stronger gear (higher level / pricier)
  castle_shop: [
    "iron_sword",
    "plate_armor",
    "divine_sword",
    "royal_armor",
    "ring_of_power",
    "ring_of_knowledge",
  ],
  // port vendors focus on sea / exploration items and trinkets
  port: [
    "trident",
    "sea_armor",
    "water_staff",
    "cutlass",
    "rusty_coin",
    "treasure_map",
  ]
};

// Backwards-compatibility: default shopInventory maps to town 'shop'
export const shopInventory = shopInventories.shop;


export function addItemToInventory(inventory, itemId, qty = 1) {
  inventory[itemId] = (inventory[itemId] || 0) + qty;
}

export function removeItemFromInventory(inventory, itemId, qty = 1) {
  if (!inventory[itemId]) return false;
  inventory[itemId] -= qty;
  if (inventory[itemId] <= 0) delete inventory[itemId];
  return true;
}