// items.js
// Item icons
// - You can set `icon` to an emoji/text OR to a filename like 'sword.png'.
// - Filenames are resolved with a base path defined by `window.ASSET_BASE` or the default './img/items/'.
// - Avoid hard-coded absolute paths containing local folder names (e.g. 'pruebas/6.1/img/...') so the game can be hosted elsewhere.
export const allItems = {
  // Pociones
  health_potion: {
    id: "health_potion",
    name: { en: "Health Potion", es: "Poción de Salud" },
    description: { en: "Restores 25 HP.", es: "Restaura 25 HP." },
    restoreHp: 25,
    icon: "./img/potionRed.png",
    type: "consumable",
    price: 10
  },
  mana_potion: {
    id: "mana_potion",
    name: { en: "Mana Potion", es: "Poción de Maná" },
    description: { en: "Restores 10 MP.", es: "Restaura 10 MP." },
    restoreMp: 20,
    icon: "./img/potionBlue.png",
    type: "consumable",
    price: 12
  },
  healing_elixir: {
    id: "healing_elixir",
    name: { en: "Healing Elixir", es: "Elixir de Curación" },
    type: "consumable",
    rarity: "rare",
    restoreHp: 60,
    icon: "🩹",
    price: 45
  },

  mana_elixir: {
    id: "mana_elixir",
    name: { en: "Mana Elixir", es: "Elixir de Maná" },
    type: "consumable",
    rarity: "uncommon",
    restoreMp: 50,
    icon: "🧿",
    price: 40
  },
  greater_elixir: {
    id: "greater_elixir",
    name: { en: "Greater Elixir", es: "Elixir Superior" },
    type: "consumable",
    rarity: "rare",
    restoreHp: 100,
    restoreMp: 50,
    icon: "✨",
    price: 90
  },
  antidote: {
    id: "antidote",
    name: { en: "Antidote", es: "Antídoto" },
    description: { en: "Cures poison.", es: "Cura el veneno." },
    type: "consumable",
    curesPoison: true,
    icon: "💚",
    price: 15
  },
  remedy: {
    id: "remedy",
    name: { en: "Remedy", es: "Remedio" },
    description: { en: "Cures burn.", es: "Cura la quemadura." },
    type: "consumable",
    curesBurn: true,
    icon: "🧊",
    price: 18
  },
  panacea: {
    id: "panacea",
    name: { en: "Panacea", es: "Panacea" },
    description: { en: "Cures all negative effects and restores 20 HP.", es: "Cura todos los efectos negativos y restaura 20 HP." },
    type: "consumable",
    rarity: "uncommon",
    curesAll: true,
    restoreHp: 20,
    icon: "🌟",
    price: 45
  },
  //weapons
  goblin_dagger: {
    id: "goblin_dagger",
    name: { en: "Goblin Dagger", es: "Daga Goblin" },
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 3,
    price: 20,
    icon: "./img/dagger.png",
  },
  sword: {
    id: "sword",
    name: { en: "Sword", es: "Espada" },
    description: { en: "A sturdy blade. +5 ATK", es: "Una hoja resistente. +5 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 4,
    price: 30,
    icon: "./img/swordWood.png"
  },
  axe: {
    id: "axe",
    name: { en: "Axe", es: "Hacha" },
    description: { en: "A heavy axe. +7 ATK", es: "Un hacha pesada. +7 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 5,
    price: 35,
    icon: "./img/axe.png"
  },
  hammer: {
    id: "hammer",
    name: { en: "Hammer", es: "Martillo" },
    description: { en: "A heavy hammer. +9 ATK", es: "Un martillo pesado. +9 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 6,
    price: 45,
    icon: "./img/hammer.png"
  },
  vine_whip: {
    id: "vine_whip",
    name: { en: "Vine Whip", es: "Látigo de Vid" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 7,
    price: 95
  },
  giant_club: {
    id: "giant_club",
    name: { en: "Giant Club", es: "Club Gigante" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 8,
    price: 125,
    icon: "./img/giantClub.png",
  },
  cutlass: {
    id: "cutlass",
    name: { en: "Cutlass", es: "Alfanje" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 9,
    price: 95
  },
  trident: {
    id: "trident",
    name: "Trident",
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 10,
    price: 100,
    icon: "./img/trident.png",
  },
  tiger_blade: {
    id: "tiger_blade",
    name: { en: "Tiger Blade", es: "Hoja Tigre" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 12,
    price: 90,
    icon: "./img/tiguerBlade.png",
  },

  captain_sword: {
    id: "captain_sword",
    name: { en: "Captain Sword", es: "Espada del Capitán" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 13,
    price: 130,
    icon: "./img/sword2.png",
  },
  serpent_sword: {
    id: "serpent_sword",
    name: { en: "Serpent Sword", es: "Espada Serpiente" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 14,
    price: 120,
    icon: "./img/swordSerpent.png",
  },
  crystal_blade: {
    id: "crystal_blade",
    name: { en: "Crystal Blade", es: "Hoja de Cristal" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 15,
    magic: 3,
    icon: "./img/swordCrystal.png",
    price: 200
  },


  royal_sword: {
    id: "royal_sword",
    name: { en: "Royal Sword", es: "Espada Real" },
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 25,
    price: 300,
    icon: "./img/upg_sword.png",
  },
  katana: {
    id: "katana",
    name: { en: "Katana", es: "Katana" },
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 20,
    price: 200,
    icon: "./img/katana1.png",
  },
  demon_blade: {
    id: "demon_blade",
    name: { en: "Demon Blade", es: "Hoja Demonio" },
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 25,
    price: 300,
    icon: "./img/swordDark.png",
  },

  divine_sword: {
    id: "divine_sword",
    name: "Divine Sword",
    description: "A divine weapon. +20 ATK",
    slot: "rightHand",
    type: "weapon",
    attack: 30,
    price: 150,
    icon: "./img/swordDivine.png",
  },
  excalibur: {
    id: "excalibur",
    name: "Excalibur Sword",
    description: "An EPIC divine weapon. +50 ATK, +20 STR, +20 AGI, +20 INT, +50 MAX HP, +20 DEF",
    slot: "rightHand",
    type: "weapon",
    attack: 50,
    strength: 20,
    agility: 20,
    intelligence: 20,
    price: 1000,
    hpBonus: 50,
    defense: 20,
    icon: "./img/escalibur.png",
  },
  // Crafting Results
  iron_sword: {
    id: "iron_sword",
    name: "Iron Sword",
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 6,
    icon: "🗡",
    price: 40,
    icon: "./img/swordIron.png",
  },


  dragon_king_sword: {
    id: "dragon_king_sword",
    name: "Dragon King Sword",
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 50,
    price: 500,
    icon: "./img/swordOgre.png",
  },
  //magic weapons
  staff: {
    id: "staff",
    name: "Magic Staff",
    type: "weapon",
    description: "A staff imbued with magic. +3 INT, +5 MAG",
    slot: "rightHand",
    intelligence: 3,
    magic: 5,
    mp: 5,
    price: 45,
    icon: "./img/staff2.png",
  },
  wand: {
    id: "wand",
    name: "Magic Wand",
    type: "weapon",
    description: "A wand imbued with magic. +5 INT, +8 MAG",
    slot: "rightHand",
    intelligence: 4,
    magic: 8,
    mp: 8,
    price: 65,
    icon: "./img/wand.png"
  },
  elemental_wand: {
    id: "elemental_wand",
    name: "Elemental Wand",
    type: "weapon",
    description: "A elemental wand imbued with magic of elemnts. +7 INT, +10 MAG",
    slot: "rightHand",
    intelligence: 7,
    magic: 10,
    mp: 10,
    price: 85,
    icon: "./img/upg_wand.png",
  },
  bless_staff: {
    id: "bless_staff",
    name: "Bless Staff",
    type: "weapon",
    description: "A blessed staff imbued with magic. +10 INT, +15 MAG",
    slot: "rightHand",
    intelligence: 10,
    magic: 15,
    mp: 15,
    price: 120,
    icon: "./img/staff3.png",
  },
  water_staff: {
    id: "water_staff",
    name: "Water Staff",
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    intelligence: 10,
    magic: 14,
    mp: 14,
    price: 90,
    icon: "./img/staff3.png",
  },
  ocean_staff: {
    id: "ocean_staff",
    name: "Ocean Staff",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 15,
    magic: 20,
    mp: 20,
    price: 140,
    icon: "./img/staffWater.png",
  },
  flame_staff: {
    id: "flame_staff",
    name: "Flame Staff",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 20,
    magic: 30,
    mp: 30,
    price: 160,
    icon: "./img/flameStaff.png",
  },
  spirit_staff: {
    id: "spirit_staff",
    name: "Spirit Staff",
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 15,
    magic: 10,
    mp: 10,
    price: 140,
    icon: "./img/staffAnima.png",
  },

  //shields
  wooden_shield: {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "Basic shield. +2 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 1,
    price: 15,
    icon: "./img/shieldWood.png"
  },
  shield: {
    id: "shield",
    name: "Wooden Shield",
    description: "Basic shield. +3 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 2,
    price: 20,
    icon: "./img/shieldWood.png"
  },
  shield_of_elves: {
    id: "shield_of_elves",
    name: "Shield of the Elf",
    description: "An Elf shield. +8 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 3,
    price: 80,
    icon: "./img/shieldElven1.png"
  },
  iron_shield: {
    id: "iron_shield",
    name: "Iron Shield",
    description: "Basic iron shield. +7 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 4,
    price: 80,
    icon: "./img/shield5.png"
  },
  strong_shield: {
    id: "strong_shield",
    name: "Strong Shield",
    description: "A very strong Shield. +10 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 5,
    price: 100,
    icon: "./img/shieldPlate2.png"
  },
  tower_shield: {
    id: "tower_shield",
    name: "tower_shield",
    description: "A very strong Shield. +15 DEF",
    slot: "leftHand",
    type: "shield",
    defense: 10,
    price: 150,
    icon: "./img/shieldTower.png"
  },
  //boots
  boots_leather: {
    id: "boots_leather",
    name: "Leather Boots",
    description: "Simple boots. +2 AGI",
    slot: "boots",
    type: "boots",
    agility: 2,
    price: 18,
    icon: "./img/bootsLeather.png"
  },
  boots: {
    id: "boots",
    name: "Boots",
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 1,
    price: 40,
    description: "Common boots that give +2 DEF",
    icon: "./img/boots7.png"
  },
  leather_boots: {
    id: "leather_boots",
    name: "Leather Boots",
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 2,
    price: 40,
    description: "leather boots that give +4 DEF",
    icon: "./img/bootsLeather.png"
  },
  iron_boots: {
    id: "iron_boots",
    name: "Iron Boots",
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 3,
    price: 90,
    description: "Iron boots that give +5 DEF",
    icon: "./img/boots1.png"
  },
  plate_boots: {
    id: "plate_boots",
    name: "Plate Boots",
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 5,
    price: 100,
    description: "Plate boots that give +7 DEF",
    icon: "./img/boots3.png"
  },
  magic_boots: {
    id: "magic_boots",
    name: "MAgic Boots",
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 5,
    intelligence: 5,
    price: 420,
    description: "Magic boots that give +6 DEF, +5 INT",
    icon: "./img/bootsMagic.png"
  },
  strength_boots: {
    id: "strength_boots",
    name: "Strength Boots",
    type: "boots",
    slot: "boots",
    rarity: "rare",
    defense: 5,
    strength: 5,
    price: 420,
    description: "Strength boots that give +6 DEF, +5 STR",
    icon: "./img/bootsMagic.png"
  },
  black_boots: {
    id: "black_boots",
    name: "Black Boots",
    type: "boots",
    slot: "boots",
    rarity: "rare",
    defense: 8,
    price: 400,
    description: "Black boots that give +8 DEF",
    icon: "./img/bootsBlack.png"
  },
  divine_boots: {
    id: "divine_boots",
    name: "Divine Boots",
    type: "boots",
    slot: "boots",
    rarity: "epic",
    defense: 10,
    price: 500,
    description: "Divine boots that give +10 DEF",
    icon: "./img/bootsBlack.png"
  },
  //arms
  gloves: {
    id: "gloves",
    name: "Gloves",
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 1,
    price: 30,
    description: "A common gloves that give +2 DEF",
    icon: "./img/arm2.png"
  },
  leather_gloves: {
    id: "leather_gloves",
    name: "Leather Gloves",
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 2,
    price: 40,
    description: "A leather gloves that give +4 DEF",
    icon: "./img/arm1.png"
  },

  bracers: {
    id: "bracers",
    name: "Bracers",
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 3,
    price: 50,
    description: "Just basic bracers that give +5 DEF",
    icon: "./img/arm4.png"
  },

  iron_bracers: {
    id: "iron_bracers",
    name: "Iron Bracers",
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 4,
    price: 60,
    description: "Iron bracers that give +6 DEF",
    icon: "./img/arm5.png"
  },

  plate_bracers: {
    id: "plate_bracers",
    name: "Plate Bracers",
    type: "arms",
    slot: "arms",
    rarity: "uncommon",
    defense: 5,
    price: 100,
    description: "Good Plate bracers that give +8 DEF",
    icon: "./img/armBattle.png"
  },

  magic_bracers: {
    id: "magic_bracers",
    name: "Magic Bracers",
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 5,
    intelligence: 5,
    price: 300,
    description: "Magic bracers that give +5 DEF and +5 INT",
    icon: "./img/armGem.png",
  },
  strength_bracers: {
    id: "strength_bracers",
    name: "Strength Bracers",
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 5,
    strength: 5,
    price: 400,
    description: "Strenght bracers that give +6 DEF and +5 STR",
    icon: "./img/armBronce.png",
  },
  black_bracers: {
    id: "black_bracers",
    name: "Black Bracers",
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 8,
    strength: 6,
    price: 500,
    description: "Black bracers that give +8 DEF and +6 STR",
    icon: "./img/armBronc2.png",
  },
  divine_bracers: {
    id: "divine_bracers",
    name: "Divine Bracers",
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 10,
    strength: 10,
    price: 1000,
    description: "Divine bracers that give +10 DEF and +10 STR",
    icon: "./img/armAngel.png",
  },
  arms_bracelet: {
    id: "arms_bracelet",
    name: "Iron Bracelet",
    description: "Bracelet for arms. +2 DEF",
    slot: "arms",
    type: "arms",
    defense: 2,
    price: 15,
    icon: "./img/braceletIron.png"
  },
  //ring
  ring_silver: {
    id: "ring_silver",
    name: "Silver Ring",
    description: "A shiny ring. +4 MAG",
    slot: "ring",
    type: "ring",
    magic: 10,
    mp: 10,
    price: 25,
    icon: "./img/ringSilver.png"
  },
  ring_strength: {
    id: "ring_strength",
    name: "Ring of Strength",
    description: "Increases physical power. +2 STR",
    slot: "ring",
    type: "ring",
    strength: 2,
    price: 60,
    icon: "./img/ringRedGem.png",
  },
  ring_agility: {
    id: "ring_agility",
    name: "Ring of Agility",
    description: "Enhances movement. +2 AGI",
    slot: "ring",
    type: "ring",
    agility: 2,
    price: 60,
    icon: "./img/ringIron.png",
  },
  ring_intelligence: {
    id: "ring_intelligence",
    name: "Ring of Intelligence",
    description: "Boosts magical power. +2 INT",
    slot: "ring",
    type: "ring",
    intelligence: 2,
    price: 60,
    icon: "./img/ringGemBlue.png",
  },
  ring_of_knowledge: {
    id: "ring_of_knowledge",
    name: "Ring of Knowledge",
    description: "Boosts magical power. +10 INT",
    slot: "ring",
    type: "ring",
    intelligence: 10,
    price: 600,
    icon: "./img/ring4silver.png",
  },
  ring_of_power: {
    id: "ring_of_power",
    name: "Ring of Power",
    description: "Increases physical power. +10 STR",
    slot: "ring",
    type: "ring",
    strength: 10,
    price: 600,
    icon: "./img/ringLord.png",
  },
  ring_of_elven: {
    id: "ring_of_elven",
    name: "Ring of Elven",
    description: "Enhances movement. +10 AGI",
    slot: "ring",
    type: "ring",
    agility: 10,
    price: 600,
    icon: "./img/ringStar.png",
  },
  ring_of_inferno: {
    id: "ring_of_inferno",
    name: "Ring of Inferno",
    type: "ring",
    slot: "ring",
    rarity: "legendary",
    strength: 15,
    agility: 15,
    intelligence: 15,
    attack: 15,
    magic: 15,
    mp: 15,
    hp: 15,
    price: 350,
    icon: "./img/ringMagma.png"
  },

  //helmet
  helmet_leather: {
    id: "helmet_leather",
    name: "Leather Helmet",
    description: "Simple helmet. +2 DEF",
    slot: "head",
    type: "helmet",
    defense: 1,
    price: 22,
    icon: "./img/helmetLeather.png"
  },
  helmet: {
    id: "helmet",
    name: "Helmet",
    type: "helmet",
    slot: "head",
    rarity: "common",
    defense: 2,
    price: 70,
    description: "A common helmet that give +5 DEF",
    icon: "./img/helmet.png"
  },
  iron_helmet: {
    id: "iron_helmet",
    name: "Iron Helmet",
    type: "helmet",
    slot: "head",
    rarity: "common",
    defense: 3,
    price: 80,
    description: "An Iron helmet that give +6 DEF",
    icon: "./img/helmet3.png"
  },
  plate_helmet: {
    id: "plate_helmet",
    name: "Plate Helmet",
    type: "helmet",
    slot: "head",
    rarity: "uncommon",
    defense: 5,
    price: 90,
    description: "A Plate helmet that give +7 DEF",
    icon: "./img/helmet2.png"
  },

  viking_helmet: {
    id: "viking_helmet",
    name: "Viking Helmet",
    type: "helmet",
    slot: "head",
    rarity: "rare",
    defense: 6,
    attack: 5,
    price: 600,
    description: "A Viking helmet that give +8 DEF, +5 ATK",
    icon: "./img/helmetViking.png"
  },
  spartan_helmet: {
    id: "spartan_helmet",
    name: "Spartan Helmet",
    type: "helmet",
    slot: "head",
    rarity: "rare",
    defense: 7,
    attack: 7,
    price: 800,
    description: "A Spartan helmet that give +10 DEF, +7 ATK",
    icon: "./img/helmetSpartan.png"
  },
  giant_orc_helmet: {
    id: "giant_orc_helmet",
    name: "SGiant Orc Helmet",
    type: "helmet",
    slot: "head",
    rarity: "epic",
    defense: 10,
    attack: 10,
    price: 800,
    description: "the helmet of the Giant Orc that rules in the mountain that give +15 DEF, +10 ATK",
    icon: "./img/helmetOrc.png"
  },
  divine_helmet: {
    id: "divine_helmet",
    name: "Divine Helmet",
    type: "helmet",
    slot: "head",
    rarity: "epic",
    defense: 12,
    attack: 15,
    price: 2000,
    description: "the Divine Helmet blessed by the Gods that give +20 DEF, +15 ATK",
    icon: "./img/helmetBless.png"
  },

  //hemets MAGIC
  hat: {
    id: "hat",
    name: "Hat",
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 1,
    price: 40,
    description: "Common hat that give +2 DEF",
    icon: "./img/hat1.png"
  },
  leather_hat: {
    id: "leather_hat",
    name: "Leather Hat",
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 2,
    price: 60,
    description: "Leather hat that give +4 DEF",
    icon: "./img/hat2.png"
  },

  Magic_hat: {
    id: "magic_hat",
    name: "MAgic Hat",
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 2,
    intelligence: 5,
    price: 200,
    description: "Magic hat that give +4 DEF, +5 INT",
    icon: "./img/hatMage.png"
  },
  acolyte_hat: {
    id: "acolyte_hat",
    name: "The Hat of the Acolyte",
    type: "hat",
    slot: "head",
    rarity: "rare",
    defense: 3,
    intelligence: 8,
    price: 600,
    description: "Only an Acolyte can use this item that give +5 DEF, +8 INT",
    icon: "./img/hatMage2.png"
  },
  dark_mage_hat: {
    id: "dark_mage_hat",
    name: "The Dark Hat",
    type: "hat",
    slot: "head",
    rarity: "epic",
    defense: 4,
    intelligence: 10,
    price: 1000,
    description: "The Dark Hat, only the high dark mages use this that give +10 DEF, +10 INT",
    icon: "./img/helmetBlackMage.png"
  },

  //accessory
  emblem_hero: {
    id: "emblem_hero",
    name: "Hero Emblem",
    description: "Emblem for heroes. +2 STR",
    slot: "accessory",
    type: "accessory",
    strength: 2,
    price: 40,
    icon: "./img/emblemHero.png"
  },
  // Armaduras
  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    type: "armor",
    rarity: "uncommon",
    slot: "armor",
    defense: 2,
    price: 70,
    icon: "./img/armorLeather.png",
  },
  armor: {
    id: "armor",
    name: "Leather Armor",
    description: "Simple armor. +5 DEF",
    slot: "armor",
    type: "armor",
    defense: 4,
    price: 40,
    icon: "./img/armorLeather4.png",
  },
  dark_armor: {
    id: "dark_armor",
    name: "Dark Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 20,
    price: 220,
    icon: "./img/armorDark2.png",
  },
  jungle_armor: {
    id: "jungle_armor",
    name: "Jungle Armor",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 8,
    price: 135,
    icon: "./img/armorBarbarian.png",
  },
  chainmail: {
    id: "chainmail",
    name: "Chainmail Armor",
    description: "Strong armor. +10 DEF",
    slot: "armor",
    type: "armor",
    defense: 10,
    price: 80,
    icon: "./img/armor2.png",
  },
  sea_armor: {
    id: "sea_armor",
    name: "Sea Armor",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 12,
    price: 150,
    icon: "./img/armorSea.png",
  },
  captain_coat: {
    id: "captain_coat",
    name: "Captain Coat",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 13,
    price: 140,
    icon: "./img/robeDarkBattle.png",
  },
  royal_armor: {
    id: "royal_armor",
    name: "Royal Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 18,
    price: 350,
    icon: "./img/armor8.png",
  },
  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    description: "Strong armor. +20 DEF",
    slot: "armor",
    type: "armor",
    defense: 20,
    price: 300,
    icon: "./img/armor8.png",
  },
  stone_armor: {
    id: "stone_armor",
    name: "Stone Armor",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 14,
    price: 160,
    icon: "./img/armorStone.png",
  },

  dragon_king_armor: {
    id: "dragon_king_armor",
    name: "Dragon King Armor",
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 50,
    price: 500,
    icon: "./img/dragonKingArmor.png",
  },
  //armor magic
  robe: {
    id: "robe",
    name: "Mage Robe",
    description: "Enchanted robe. +2 INT, +1 DEF",
    slot: "armor",
    type: "armor",
    intelligence: 2,
    defense: 1,
    price: 35,
    icon: "./img/robe.png",
  },
  gown: {
    id: "gown",
    name: "Mage Gown",
    description: "Enchanted gown. +5 INT, +3 DEF",
    slot: "armor",
    type: "armor",
    intelligence: 5,
    defense: 3,
    price: 50,
    icon: "./img/robe2.png",
  },
  arcane_robe: {
    id: "arcane_robe",
    name: "Arcane Mage Robe",
    description: "Enchanted arcane robe. +8 INT, +5 DEF",
    slot: "armor",
    type: "armor",
    intelligence: 8,
    defense: 5,
    price: 80,
    icon: "./img/robeGreen.png",
  },
  aqua_robe: {
    id: "aqua_robe",
    name: "Aqua Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 12,
    defense: 6,
    price: 130,
    icon: "./img/aquaRobe.png",
  },
  coral_robe: {
    id: "coral_robe",
    name: "Coral Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 10,
    defense: 8,
    price: 150,
    icon: "./img/coralRobe.png",
  },
  fire_robe: {
    id: "fire_robe",
    name: "Fire Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 9,
    price: 170,
    icon: "./img/coralRobe.png",
  },
  nature_robe: {
    id: "nature_robe",
    name: "Nature Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 12,
    defense: 6,
    price: 130,
    icon: "./img/robeGreen2.png",
  },

  ethereal_robe: {
    id: "ethereal_robe",
    name: "Ethereal Robe",
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 8,
    price: 150,
    icon: "./img/robeMerlin2.png",
  },

  // Accesorios
  saint_grial: {
    id: "saint_grial",
    name: "Saint Grial",
    description: "This is the Quest object. Boosts attack and magical power. +30 STR +20 AGI +20 INT",
    slot: "accessory",
    type: "accessory",
    intelligence: 20,
    agility: 20,
    strength: 30,
    hpBonus: 80,
    price: 60,
    icon: "./img/saintGrial.png",

  },
  dragon_king_crown: {
    id: "dragon_king_crown",
    name: "Dragon King Crown",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    intelligence: 25,
    strength: 25,
    agility: 25,
    price: 4000,
    icon: "./img/dragonKingCrow.png",
  },



  // =====================
  // ⭐ Loot común por bioma
  // =====================

  herb: {
    id: "herb",
    name: "Healing Herb",
    type: "material",
    rarity: "common",
    price: 5,
    icon: "./img/herbs.png",


  },

  wolf_pelt: {
    id: "wolf_pelt",
    name: "Wolf Pelt",
    type: "material",
    rarity: "uncommon",
    price: 8,
    icon: "./img/wolfPelt.png",
  },

  fungus_core: {
    id: "fungus_core",
    name: "Fungus Core",
    type: "material",
    rarity: "rare",
    price: 18,
    icon: "./img/fungusCore.png",
  },

  iron_ore: {
    id: "iron_ore",
    name: { en: "Divine Sword", es: "Espada Divina" },
    description: { en: "A divine weapon. +20 ATK", es: "Un arma divina. +20 ATK" },
    rarity: "common",
    price: 5,
    icon: "./img/ironOre.png",
  },

  bat_wing: {
    id: "bat_wing",
    name: "Bat Wing",
    name: { en: "Excalibur", es: "Excalibur" },
    description: { en: "An EPIC divine weapon. +50 ATK, +20 STR, +20 AGI, +20 INT, +50 MAX HP, +20 DEF", es: "Un arma divina ÉPICA. +50 ATK, +20 STR, +20 AGI, +20 INT, +50 MAX HP, +20 DEF" },
    price: 8,
    icon: "./img/batWing.png",
  },

  crystal_shard: {
    id: "crystal_shard",
    name: "Crystal Shard",
    type: "material",
    rarity: "rare",
    price: 20,
    icon: "./img/cristalShard.png",
  },

  golem_fragment: {
    id: "golem_fragment",
    name: "Golem Fragment",
    type: "material",
    rarity: "epic",
    price: 35,
    icon: "./img/golemFragment.png"
  },

  ice_crystal: {
    id: "ice_crystal",
    name: "Ice Crystal",
    type: "material",
    rarity: "uncommon",
    price: 15,
    icon: "./img/iceCristal.png",
  },

  wyvern_scale: {
    id: "wyvern_scale",
    name: "Wyvern Scale",
    type: "material",
    rarity: "rare",
    price: 35,
    icon: "./img/wyvernScale.png",
  },

  giant_bone: {
    id: "giant_bone",
    name: "Giant Bone",
    type: "material",
    rarity: "rare",
    price: 25,
    icon: "./img/giantBone.png",
  },

  ancient_relic: {
    id: "ancient_relic",
    name: "Ancient Relic",
    type: "material",
    rarity: "epic",
    price: 50,
    icon: "./img/ancientRelic.png",
  },

  enchanted_dust: {
    id: "enchanted_dust",
    name: "Enchanted Dust",
    type: "material",
    rarity: "uncommon",
    price: 12,
    icon: "./img/enchantedDust.png",
  },

  runestone: {
    id: "runestone",
    name: "Runestone",
    type: "material",
    rarity: "rare",
    price: 30,
    icon: "./img/runeBlack.png",

  },

  ancient_core: {
    id: "ancient_core",
    name: "Ancient Core",
    type: "material",
    rarity: "epic",
    price: 40,
    icon: "./img/runeSpirit.png",

  },

  arcane_relic: {
    id: "arcane_relic",
    name: "Arcane Relic",
    type: "material",
    rarity: "legendary",
    price: 100,
    icon: "./img/rune1.png",
  },

  poison_gland: {
    id: "poison_gland",
    name: "Poison Gland",
    type: "material",
    rarity: "common",
    price: 6,
    icon: "./img/poisonGland.png"

  },

  acid_sac: {
    id: "acid_sac",
    name: "Acid Sac",
    type: "material",
    rarity: "uncommon",
    price: 10,
    icon: "./img/acidSac.png"
  },

  necrotic_bone: {
    id: "necrotic_bone",
    name: "Necrotic Bone",
    type: "material",
    rarity: "rare",
    price: 22,
    icon: "./img/necroticBone.png",

  },

  toxic_heart: {
    id: "toxic_heart",
    name: "Toxic Heart",
    type: "material",
    rarity: "epic",
    price: 45,
    icon: "./img/toxicHeart.png",
  },

  magma_fragment: {
    id: "magma_fragment",
    name: "Magma Fragment",
    type: "material",
    rarity: "uncommon",
    price: 18,
    icon: "./img/magmaFragment.png",
  },

  pyro_core: {
    id: "pyro_core",
    name: "Pyro Core",
    type: "material",
    rarity: "rare",
    price: 28,
    icon: "./img/pyroCore.png",
  },

  dragon_scale: {
    id: "dragon_scale",
    name: "Dragon Scale",
    type: "material",
    rarity: "epic",
    price: 75,
    icon: "./img/dragonScale.png",
  },

  heart_of_inferno: {
    id: "heart_of_inferno",
    name: "Heart of the Inferno",
    type: "material",
    rarity: "legendary",
    price: 150,
    icon: "./img/heartOfInferno.png",
  },

  frost_shard: {
    id: "frost_shard",
    name: "Frost Shard",
    type: "material",
    rarity: "uncommon",
    price: 14,
    icon: "./img/frostShard.png",
  },

  ice_essence: {
    id: "ice_essence",
    name: "Ice Essence",
    type: "material",
    rarity: "rare",
    price: 24,
    icon: "./img/iceEssence.png",

  },

  glacial_core: {
    id: "glacial_core",
    name: "Glacial Core",
    type: "material",
    rarity: "epic",
    price: 60,
    icon: "./img/frostShard.png",
  },


  // =====================
  // ⭐ Loot de Jefes
  // =====================

  titan_branch: {
    id: "titan_branch",
    name: "Titan Branch",
    type: "material",
    rarity: "rare",
    price: 40,
    icon: "./img/titanBranch.png",

  },

  forest_emblem: {
    id: "forest_emblem",
    name: "Forest Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    description: "A forest Emblem that give +5 Magic, +2 DEF.",
    magic: 5,
    defense: 2,
    hpBonus: 20,
    price: 90,
    icon: "./img/runeGreen.png",
  },

  devourer_fang: {
    id: "devourer_fang",
    name: "Devourer Fang",
    type: "material",
    rarity: "rare",
    price: 45,
    icon: "./img/devourerFang.png",
  },

  earthbreaker_core: {
    id: "earthbreaker_core",
    name: "Earthbreaker Core",
    type: "material",
    rarity: "epic",
    price: 100,
    icon: "./img/earthbreakerCore.png"
  },

  colossus_heart: {
    id: "colossus_heart",
    name: "Colossus Heart",
    type: "material",
    rarity: "rare",
    price: 55,
    icon: "./img/colossusHeart.png",
  },

  mountain_emblem: {
    id: "mountain_emblem",
    name: "Mountain Emblem",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    defense: 4,
    hpBonus: 30,
    price: 120,
    description: "The Mountain Emblem gives +4 DEF",
    icon: "./img/runeKey.png"
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
    price: 150,
    description: "The Arcane Emblem gives +3 DEF, +8 Magic",
    icon: "./img/runeMagic.png"
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
    price: 120,
    description: "The Plague Emblem gives +3 STR, +3 Magic",
    icon: "./img/runeRed.png"
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
    price: 200,
    description: "The Inferno Emblem gives +5 ATK, +5 Magic",
    icon: "./img/runeRed2.png"

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
    price: 180,
    description: "The Tundra Emblem gives +5 DEF, +4 Magic",
    icon: "./img/runePurple.png"
  },

  forest_emblem_upgraded: {
    id: "forest_emblem_upgraded",
    name: "Forest Emblem+",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    magic: 10,
    defense: 5,
    price: 180,
    description: "The Forest Emblem gives +5 DEF, +10 Magic",
    icon: "./img/runeGreen2.png"
  },

  inferno_emblem_upgraded: {
    id: "inferno_emblem_upgraded",
    name: "Inferno Emblem+",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    strength: 10,
    agility: 10,
    intelligence: 10,
    attack: 10,
    magic: 10,
    price: 300,
    escription: "The Inferno Emblem gives +10 STR, +10 AGI, +10 INT, +10 ATK, +10 Magic",
    icon: "./img/runeFire.png"

  },

  rusty_coin: {
    id: "rusty_coin",
    name: "Rusty Coin",
    type: "material",
    rarity: "common",
    price: 5,
    icon: "🪙"
  },























  // ...existing code...




  slime_gel: {
    id: "slime_gel",
    name: "Slime Gel",
    type: "material",
    rarity: "common",
    price: 4,

  },
  golden_key: {
    id: "golden_key",
    name: "Golden Key",
    type: "key_item",
    rarity: "rare",
    price: 100,
    icon: "./img/goldenKey.png",

  },
  treasure_map: {
    id: "treasure_map",
    name: "Treasure Map",
    type: "key_item",
    rarity: "uncommon",
    price: 50,
    icon: "./img/map.png",
  },
  world_map: {
    id: "world_map",
    name: "World Map",
    type: "key_item",
    rarity: "epic",
    price: 150,
    description: "A map that shows the entire world. Useful for navigation and finding hidden locations.",
    icon: "./img/Map.png",
  },

  ancient_guardian_core: {
    id: "ancient_guardian_core",
    name: "Ancient Guardian Core",
    type: "material",
    rarity: "legendary",
    price: 200,
    icon: "./img/ancientGuardianCore.png",

  },
  treasure_guardian_core: {
    id: "treasure_guardian_core",
    name: "Treasure Guardian Core",
    type: "material",
    rarity: "epic",
    price: 120,
    icon: "./img/ancientGuardianCore.png",
  },
  treasure_guardian_heart: {
    id: "treasure_guardian_heart",
    name: "Treasure Guardian Heart",
    type: "material",
    rarity: "rare",
    price: 80,
    icon: "./img/heart.png",
  },
  dragon_heart: {
    id: "dragon_heart",
    name: "Dragon Heart",
    type: "material",
    rarity: "legendary",
    price: 250,
    icon: "./img/heartOfInferno.png",
  },
  inferno_gem: {
    id: "inferno_gem",
    name: "Inferno Gem",
    type: "material",
    rarity: "legendary",
    price: 220,
    icon: "./img/infernoGem.png",
  },

  // ── Pergaminos de habilidad (SPEC-0607) ──────────────
  scroll_of_rally: {
    id: "scroll_of_rally",
    name: "Pergamino: Reagruparse",
    type: "scroll",
    icon: "📜",
    teachesSkill: "rally",
    description: "Enseña la habilidad universal Reagruparse (+20% HP, elimina debuff).",
    price: 150,
    rarity: "uncommon"
  },
  scroll_of_power: {
    id: "scroll_of_power",
    name: "Pergamino: Golpe Potente",
    type: "scroll",
    icon: "📜",
    teachesSkill: "power_strike",
    description: "Enseña la habilidad universal Golpe Potente (ignora defensa, 50% crit).",
    price: 200,
    rarity: "uncommon"
  },
  scroll_of_arcane: {
    id: "scroll_of_arcane",
    name: "Pergamino: Descarga Arcana",
    type: "scroll",
    icon: "📜",
    teachesSkill: "arcane_bolt",
    description: "Enseña la habilidad universal Descarga Arcana (2× magia pura).",
    price: 250,
    rarity: "rare"
  },

}

// Inventarios de tienda por ubicación
// Class-specific shop items (injected into shop based on player class)
export const classShopBonus = {
  warrior: ["sword","axe","hammer","armor","helmet","shield","health_potion","iron_ore","wolf_pelt"],
  mage:    ["mana_potion","mana_elixir","healing_elixir","enchanted_dust","crystal_shard"],
  rogue:   ["goblin_dagger","health_potion","mana_potion","herb","golem_fragment"]
};

export const shopInventories = {
  // town shop (adventurer's supply)
  shop: [
    "health_potion",
    "mana_potion",
    "sword",
    "armor",
    "staff",
    "robe",
    "gloves",
    "boots",
    "ring_strength",
    "ring_agility",
    "ring_intelligence",
  ],
  // castle quartermaster has stronger gear (higher level / pricier)
  castle_shop: [
    "health_potion",
    "mana_potion",
    "iron_sword",
    "plate_armor",
    "royal_armor",
    "ring_of_power",
    "ring_of_knowledge",
    "scroll_of_rally",
    "scroll_of_power",
    "scroll_of_arcane",
  ],
  // port vendors focus on sea / exploration items and trinkets
  port: [
    "health_potion",
    "mana_potion",
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