// items.js
// Item icons
// - You can set `icon` to an emoji/text OR to a filename like 'sword.webp'.
// - Filenames are resolved with a base path defined by `window.ASSET_BASE` or the default './img/items/'.
// - Avoid hard-coded absolute paths containing local folder names (e.g. 'pruebas/6.1/img/...') so the game can be hosted elsewhere.
export const allItems = {
  // Pociones
  health_potion: {
    id: "health_potion",
    name: { en: "Health Potion", es: "Poción de Salud" },
    description: { en: "Restores 25 HP.", es: "Restaura 25 HP." },
    restoreHp: 25,
    icon: "./img/potionRed.webp",
    type: "consumable",
    price: 10
  },
  mana_potion: {
    id: "mana_potion",
    name: { en: "Mana Potion", es: "Poción de Maná" },
    description: { en: "Restores 10 MP.", es: "Restaura 10 MP." },
    restoreMp: 20,
    icon: "./img/potionBlue.webp",
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
    icon: "./img/dagger.webp",
  },
  sword: {
    id: "sword",
    name: { en: "Sword", es: "Espada" },
    description: { en: "A sturdy blade. +5 ATK", es: "Una hoja resistente. +5 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 4,
    price: 30,
    icon: "./img/swordWood.webp"
  },
  axe: {
    id: "axe",
    name: { en: "Axe", es: "Hacha" },
    description: { en: "A heavy axe. +7 ATK", es: "Un hacha pesada. +7 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 5,
    price: 35,
    icon: "./img/axe.webp"
  },
  hammer: {
    id: "hammer",
    name: { en: "Hammer", es: "Martillo" },
    description: { en: "A heavy hammer. +9 ATK", es: "Un martillo pesado. +9 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 6,
    price: 45,
    icon: "./img/hammer.webp"
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
    name: { en: "Giant Club", es: "Maza Gigante" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 8,
    price: 125,
    icon: "./img/giantClub.webp",
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
    name: { en: "Trident", es: "Tridente" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 10,
    price: 100,
    icon: "./img/trident.webp",
  },
  tiger_blade: {
    id: "tiger_blade",
    name: { en: "Tiger Blade", es: "Hoja del Tigre" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 12,
    price: 90,
    icon: "./img/tiguerBlade.webp",
  },

  captain_sword: {
    id: "captain_sword",
    name: { en: "Captain Sword", es: "Espada del Capitán" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 13,
    price: 130,
    icon: "./img/sword2.webp",
  },
  serpent_sword: {
    id: "serpent_sword",
    name: { en: "Serpent Sword", es: "Espada Serpiente" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    attack: 14,
    price: 120,
    icon: "./img/swordSerpent.webp",
  },
  crystal_blade: {
    id: "crystal_blade",
    name: { en: "Crystal Blade", es: "Hoja de Cristal" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    attack: 15,
    magic: 3,
    icon: "./img/swordCrystal.webp",
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
    icon: "./img/upg_sword.webp",
  },
  katana: {
    id: "katana",
    name: { en: "Katana", es: "Katana" },
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 20,
    price: 200,
    icon: "./img/katana1.webp",
  },
  demon_blade: {
    id: "demon_blade",
    name: { en: "Demon Blade", es: "Hoja del Demonio" },
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 25,
    price: 300,
    icon: "./img/swordDark.webp",
  },

  divine_sword: {
    id: "divine_sword",
    name: { en: "Divine Sword", es: "Espada Divina" },
    description: { en: "A divine weapon. +20 ATK", es: "Un arma divina. +20 ATK" },
    slot: "rightHand",
    type: "weapon",
    attack: 30,
    price: 150,
    icon: "./img/swordDivine.webp",
  },
  excalibur: {
    id: "excalibur",
    name: { en: "Excalibur", es: "Excalibur" },
    description: { en: "An EPIC divine weapon. +50 ATK, +20 STR, +20 AGI, +20 INT, +50 MAX HP, +20 DEF", es: "Un arma divina ÉPICA. +50 ATK, +20 FUE, +20 AGI, +20 INT, +50 HP MÁX, +20 DEF" },
    slot: "rightHand",
    type: "weapon",
    attack: 50,
    strength: 20,
    agility: 20,
    intelligence: 20,
    price: 1000,
    hpBonus: 50,
    defense: 20,
    icon: "./img/escalibur.webp",
  },
  // Crafting Results
  iron_sword: {
    id: "iron_sword",
    name: { en: "Iron Sword", es: "Espada de Hierro" },
    type: "weapon",
    rarity: "uncommon",
    slot: "rightHand",
    attack: 6,
    price: 40,
    icon: "./img/swordIron.webp",
  },


  dragon_king_sword: {
    id: "dragon_king_sword",
    name: { en: "Dragon King Sword", es: "Espada del Rey Dragón" },
    type: "weapon",
    rarity: "legendary",
    slot: "rightHand",
    attack: 50,
    price: 500,
    icon: "./img/swordOgre.webp",
  },
  //magic weapons
  staff: {
    id: "staff",
    name: { en: "Magic Staff", es: "Báculo Mágico" },
    description: { en: "A staff imbued with magic. +3 INT, +5 MAG", es: "Un báculo imbuido de magia. +3 INT, +5 MAG" },
    type: "weapon",
    slot: "rightHand",
    intelligence: 3,
    magic: 5,
    mp: 5,
    price: 45,
    icon: "./img/staff2.webp",
  },
  wand: {
    id: "wand",
    name: { en: "Magic Wand", es: "Varita Mágica" },
    description: { en: "A wand imbued with magic. +5 INT, +8 MAG", es: "Una varita imbuida de magia. +5 INT, +8 MAG" },
    type: "weapon",
    slot: "rightHand",
    intelligence: 4,
    magic: 8,
    mp: 8,
    price: 65,
    icon: "./img/wand.webp"
  },
  elemental_wand: {
    id: "elemental_wand",
    name: { en: "Elemental Wand", es: "Varita Elemental" },
    description: { en: "An elemental wand imbued with the magic of elements. +7 INT, +10 MAG", es: "Una varita elemental imbuida de la magia de los elementos. +7 INT, +10 MAG" },
    type: "weapon",
    slot: "rightHand",
    intelligence: 7,
    magic: 10,
    mp: 10,
    price: 85,
    icon: "./img/upg_wand.webp",
  },
  bless_staff: {
    id: "bless_staff",
    name: { en: "Bless Staff", es: "Báculo Bendito" },
    description: { en: "A blessed staff imbued with magic. +10 INT, +15 MAG", es: "Un báculo bendito imbuido de magia. +10 INT, +15 MAG" },
    type: "weapon",
    slot: "rightHand",
    intelligence: 10,
    magic: 15,
    mp: 15,
    price: 120,
    icon: "./img/staff3.webp",
  },
  water_staff: {
    id: "water_staff",
    name: { en: "Water Staff", es: "Báculo de Agua" },
    type: "weapon",
    rarity: "rare",
    slot: "rightHand",
    intelligence: 10,
    magic: 14,
    mp: 14,
    price: 90,
    icon: "./img/staff3.webp",
  },
  ocean_staff: {
    id: "ocean_staff",
    name: { en: "Ocean Staff", es: "Báculo del Océano" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 15,
    magic: 20,
    mp: 20,
    price: 140,
    icon: "./img/staffWater.webp",
  },
  flame_staff: {
    id: "flame_staff",
    name: { en: "Flame Staff", es: "Báculo de Llamas" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 20,
    magic: 30,
    mp: 30,
    price: 160,
    icon: "./img/flameStaff.webp",
  },
  spirit_staff: {
    id: "spirit_staff",
    name: { en: "Spirit Staff", es: "Báculo del Espíritu" },
    type: "weapon",
    rarity: "epic",
    slot: "rightHand",
    intelligence: 15,
    magic: 10,
    mp: 10,
    price: 140,
    icon: "./img/staffAnima.webp",
  },

  //shields
  wooden_shield: {
    id: "wooden_shield",
    name: { en: "Wooden Shield", es: "Escudo de Madera" },
    description: { en: "Basic shield. +2 DEF", es: "Escudo básico. +2 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 1,
    price: 15,
    icon: "./img/shieldWood.webp"
  },
  shield: {
    id: "shield",
    name: { en: "Wooden Shield", es: "Escudo de Madera" },
    description: { en: "Basic shield. +3 DEF", es: "Escudo básico. +3 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 2,
    price: 20,
    icon: "./img/shieldWood.webp"
  },
  shield_of_elves: {
    id: "shield_of_elves",
    name: { en: "Shield of the Elf", es: "Escudo Élfico" },
    description: { en: "An Elf shield. +8 DEF", es: "Un escudo élfico. +8 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 3,
    price: 80,
    icon: "./img/shieldElven1.webp"
  },
  iron_shield: {
    id: "iron_shield",
    name: { en: "Iron Shield", es: "Escudo de Hierro" },
    description: { en: "Basic iron shield. +7 DEF", es: "Escudo de hierro básico. +7 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 4,
    price: 80,
    icon: "./img/shield5.webp"
  },
  strong_shield: {
    id: "strong_shield",
    name: { en: "Strong Shield", es: "Escudo Reforzado" },
    description: { en: "A very strong shield. +10 DEF", es: "Un escudo muy resistente. +10 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 5,
    price: 100,
    icon: "./img/shieldPlate2.webp"
  },
  tower_shield: {
    id: "tower_shield",
    name: { en: "Tower Shield", es: "Escudo Torre" },
    description: { en: "A very strong shield. +15 DEF", es: "Un escudo enorme y resistente. +15 DEF" },
    slot: "leftHand",
    type: "shield",
    defense: 10,
    price: 150,
    icon: "./img/shieldTower.webp"
  },
  //boots
  boots_leather: {
    id: "boots_leather",
    name: { en: "Leather Boots", es: "Botas de Cuero" },
    description: { en: "Simple boots. +2 AGI", es: "Botas sencillas. +2 AGI" },
    slot: "boots",
    type: "boots",
    agility: 2,
    price: 18,
    icon: "./img/bootsLeather.webp"
  },
  boots: {
    id: "boots",
    name: { en: "Boots", es: "Botas" },
    description: { en: "Common boots. +2 DEF", es: "Botas comunes. +2 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 1,
    price: 40,
    icon: "./img/boots7.webp"
  },
  leather_boots: {
    id: "leather_boots",
    name: { en: "Leather Boots", es: "Botas de Cuero" },
    description: { en: "Leather boots. +4 DEF", es: "Botas de cuero. +4 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 2,
    price: 40,
    icon: "./img/bootsLeather.webp"
  },
  iron_boots: {
    id: "iron_boots",
    name: { en: "Iron Boots", es: "Botas de Hierro" },
    description: { en: "Iron boots. +5 DEF", es: "Botas de hierro. +5 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 3,
    price: 90,
    icon: "./img/boots1.webp"
  },
  plate_boots: {
    id: "plate_boots",
    name: { en: "Plate Boots", es: "Botas de Placa" },
    description: { en: "Plate boots. +7 DEF", es: "Botas de placa. +7 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 5,
    price: 100,
    icon: "./img/boots3.webp"
  },
  magic_boots: {
    id: "magic_boots",
    name: { en: "Magic Boots", es: "Botas Mágicas" },
    description: { en: "Magic boots. +6 DEF, +5 INT", es: "Botas mágicas. +6 DEF, +5 INT" },
    type: "boots",
    slot: "boots",
    rarity: "common",
    defense: 5,
    intelligence: 5,
    price: 420,
    icon: "./img/bootsMagic.webp"
  },
  strength_boots: {
    id: "strength_boots",
    name: { en: "Strength Boots", es: "Botas de Fuerza" },
    description: { en: "Strength boots. +6 DEF, +5 STR", es: "Botas de fuerza. +6 DEF, +5 FUE" },
    type: "boots",
    slot: "boots",
    rarity: "rare",
    defense: 5,
    strength: 5,
    price: 420,
    icon: "./img/bootsMagic.webp"
  },
  black_boots: {
    id: "black_boots",
    name: { en: "Black Boots", es: "Botas Negras" },
    description: { en: "Black boots. +8 DEF", es: "Botas negras. +8 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "rare",
    defense: 8,
    price: 400,
    icon: "./img/bootsBlack.webp"
  },
  divine_boots: {
    id: "divine_boots",
    name: { en: "Divine Boots", es: "Botas Divinas" },
    description: { en: "Divine boots. +10 DEF", es: "Botas divinas. +10 DEF" },
    type: "boots",
    slot: "boots",
    rarity: "epic",
    defense: 10,
    price: 500,
    icon: "./img/bootsBlack.webp"
  },
  //arms
  gloves: {
    id: "gloves",
    name: { en: "Gloves", es: "Guantes" },
    description: { en: "Common gloves. +2 DEF", es: "Guantes comunes. +2 DEF" },
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 1,
    price: 30,
    icon: "./img/arm2.webp"
  },
  leather_gloves: {
    id: "leather_gloves",
    name: { en: "Leather Gloves", es: "Guantes de Cuero" },
    description: { en: "Leather gloves. +4 DEF", es: "Guantes de cuero. +4 DEF" },
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 2,
    price: 40,
    icon: "./img/arm1.webp"
  },

  bracers: {
    id: "bracers",
    name: { en: "Bracers", es: "Brazaletes" },
    description: { en: "Basic bracers. +5 DEF", es: "Brazaletes básicos. +5 DEF" },
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 3,
    price: 50,
    icon: "./img/arm4.webp"
  },

  iron_bracers: {
    id: "iron_bracers",
    name: { en: "Iron Bracers", es: "Brazaletes de Hierro" },
    description: { en: "Iron bracers. +6 DEF", es: "Brazaletes de hierro. +6 DEF" },
    type: "arms",
    slot: "arms",
    rarity: "common",
    defense: 4,
    price: 60,
    icon: "./img/arm5.webp"
  },

  plate_bracers: {
    id: "plate_bracers",
    name: { en: "Plate Bracers", es: "Brazaletes de Placa" },
    description: { en: "Good plate bracers. +8 DEF", es: "Buenos brazaletes de placa. +8 DEF" },
    type: "arms",
    slot: "arms",
    rarity: "uncommon",
    defense: 5,
    price: 100,
    icon: "./img/armBattle.webp"
  },

  magic_bracers: {
    id: "magic_bracers",
    name: { en: "Magic Bracers", es: "Brazaletes Mágicos" },
    description: { en: "Magic bracers. +5 DEF, +5 INT", es: "Brazaletes mágicos. +5 DEF, +5 INT" },
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 5,
    intelligence: 5,
    price: 300,
    icon: "./img/armGem.webp",
  },
  strength_bracers: {
    id: "strength_bracers",
    name: { en: "Strength Bracers", es: "Brazaletes de Fuerza" },
    description: { en: "Strength bracers. +6 DEF, +5 STR", es: "Brazaletes de fuerza. +6 DEF, +5 FUE" },
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 5,
    strength: 5,
    price: 400,
    icon: "./img/armBronce.webp",
  },
  black_bracers: {
    id: "black_bracers",
    name: { en: "Black Bracers", es: "Brazaletes Negros" },
    description: { en: "Black bracers. +8 DEF, +6 STR", es: "Brazaletes negros. +8 DEF, +6 FUE" },
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 8,
    strength: 6,
    price: 500,
    icon: "./img/armBronc2.webp",
  },
  divine_bracers: {
    id: "divine_bracers",
    name: { en: "Divine Bracers", es: "Brazaletes Divinos" },
    description: { en: "Divine bracers. +10 DEF, +10 STR", es: "Brazaletes divinos. +10 DEF, +10 FUE" },
    type: "arms",
    slot: "arms",
    rarity: "rare",
    defense: 10,
    strength: 10,
    price: 1000,
    icon: "./img/armAngel.webp",
  },
  arms_bracelet: {
    id: "arms_bracelet",
    name: { en: "Iron Bracelet", es: "Brazalete de Hierro" },
    description: { en: "Bracelet for arms. +2 DEF", es: "Brazalete para los brazos. +2 DEF" },
    slot: "arms",
    type: "arms",
    defense: 2,
    price: 15,
    icon: "./img/ringIron.webp"
  },
  //ring
  ring_silver: {
    id: "ring_silver",
    name: { en: "Silver Ring", es: "Anillo de Plata" },
    description: { en: "A shiny ring. +4 MAG", es: "Un anillo brillante. +4 MAG" },
    slot: "ring",
    type: "ring",
    magic: 10,
    mp: 10,
    price: 25,
    icon: "./img/ring4silver.webp"
  },
  ring_strength: {
    id: "ring_strength",
    name: { en: "Ring of Strength", es: "Anillo de Fuerza" },
    description: { en: "Increases physical power. +2 STR", es: "Aumenta el poder físico. +2 FUE" },
    slot: "ring",
    type: "ring",
    strength: 2,
    price: 60,
    icon: "./img/ringRedGem.webp",
  },
  ring_agility: {
    id: "ring_agility",
    name: { en: "Ring of Agility", es: "Anillo de Agilidad" },
    description: { en: "Enhances movement. +2 AGI", es: "Mejora el movimiento. +2 AGI" },
    slot: "ring",
    type: "ring",
    agility: 2,
    price: 60,
    icon: "./img/ringIron.webp",
  },
  ring_intelligence: {
    id: "ring_intelligence",
    name: { en: "Ring of Intelligence", es: "Anillo de Inteligencia" },
    description: { en: "Boosts magical power. +2 INT", es: "Potencia el poder mágico. +2 INT" },
    slot: "ring",
    type: "ring",
    intelligence: 2,
    price: 60,
    icon: "./img/ringGemBlue.webp",
  },
  ring_of_knowledge: {
    id: "ring_of_knowledge",
    name: { en: "Ring of Knowledge", es: "Anillo del Conocimiento" },
    description: { en: "Boosts magical power. +10 INT", es: "Potencia el poder mágico. +10 INT" },
    slot: "ring",
    type: "ring",
    intelligence: 10,
    price: 600,
    icon: "./img/ring4silver.webp",
  },
  ring_of_power: {
    id: "ring_of_power",
    name: { en: "Ring of Power", es: "Anillo del Poder" },
    description: { en: "Increases physical power. +10 STR", es: "Aumenta el poder físico. +10 FUE" },
    slot: "ring",
    type: "ring",
    strength: 10,
    price: 600,
    icon: "./img/ringLord.webp",
  },
  ring_of_elven: {
    id: "ring_of_elven",
    name: { en: "Ring of Elven", es: "Anillo Élfico" },
    description: { en: "Enhances movement. +10 AGI", es: "Mejora el movimiento. +10 AGI" },
    slot: "ring",
    type: "ring",
    agility: 10,
    price: 600,
    icon: "./img/ringStar.webp",
  },
  ring_of_inferno: {
    id: "ring_of_inferno",
    name: { en: "Ring of Inferno", es: "Anillo del Infierno" },
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
    icon: "./img/ringMagma.webp"
  },

  //helmet
  helmet_leather: {
    id: "helmet_leather",
    name: { en: "Leather Helmet", es: "Casco de Cuero" },
    description: { en: "Simple helmet. +2 DEF", es: "Casco sencillo. +2 DEF" },
    slot: "head",
    type: "helmet",
    defense: 1,
    price: 22,
    icon: "./img/helmet.webp"
  },
  helmet: {
    id: "helmet",
    name: { en: "Helmet", es: "Casco" },
    description: { en: "A common helmet. +5 DEF", es: "Un casco común. +5 DEF" },
    type: "helmet",
    slot: "head",
    rarity: "common",
    defense: 2,
    price: 70,
    icon: "./img/helmet.webp"
  },
  iron_helmet: {
    id: "iron_helmet",
    name: { en: "Iron Helmet", es: "Casco de Hierro" },
    description: { en: "An iron helmet. +6 DEF", es: "Un casco de hierro. +6 DEF" },
    type: "helmet",
    slot: "head",
    rarity: "common",
    defense: 3,
    price: 80,
    icon: "./img/helmet3.webp"
  },
  plate_helmet: {
    id: "plate_helmet",
    name: { en: "Plate Helmet", es: "Casco de Placa" },
    description: { en: "A plate helmet. +7 DEF", es: "Un casco de placa. +7 DEF" },
    type: "helmet",
    slot: "head",
    rarity: "uncommon",
    defense: 5,
    price: 90,
    icon: "./img/helmet2.webp"
  },

  viking_helmet: {
    id: "viking_helmet",
    name: { en: "Viking Helmet", es: "Casco Vikingo" },
    description: { en: "A Viking helmet. +8 DEF, +5 ATK", es: "Un casco vikingo. +8 DEF, +5 ATK" },
    type: "helmet",
    slot: "head",
    rarity: "rare",
    defense: 6,
    attack: 5,
    price: 600,
    icon: "./img/helmetViking.webp"
  },
  spartan_helmet: {
    id: "spartan_helmet",
    name: { en: "Spartan Helmet", es: "Casco Espartano" },
    description: { en: "A Spartan helmet. +10 DEF, +7 ATK", es: "Un casco espartano. +10 DEF, +7 ATK" },
    type: "helmet",
    slot: "head",
    rarity: "rare",
    defense: 7,
    attack: 7,
    price: 800,
    icon: "./img/helmetSpartan.webp"
  },
  giant_orc_helmet: {
    id: "giant_orc_helmet",
    name: { en: "Giant Orc Helmet", es: "Casco del Orco Gigante" },
    description: { en: "The helmet of the Giant Orc. +15 DEF, +10 ATK", es: "El casco del Orco Gigante. +15 DEF, +10 ATK" },
    type: "helmet",
    slot: "head",
    rarity: "epic",
    defense: 10,
    attack: 10,
    price: 800,
    icon: "./img/helmetOrc.webp"
  },
  divine_helmet: {
    id: "divine_helmet",
    name: { en: "Divine Helmet", es: "Casco Divino" },
    description: { en: "The Divine Helmet blessed by the Gods. +20 DEF, +15 ATK", es: "El Casco Divino bendecido por los Dioses. +20 DEF, +15 ATK" },
    type: "helmet",
    slot: "head",
    rarity: "epic",
    defense: 12,
    attack: 15,
    price: 2000,
    icon: "./img/helmetBless.webp"
  },

  //helmets MAGIC
  hat: {
    id: "hat",
    name: { en: "Hat", es: "Sombrero" },
    description: { en: "Common hat. +2 DEF", es: "Sombrero común. +2 DEF" },
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 1,
    price: 40,
    icon: "./img/hat1.webp"
  },
  leather_hat: {
    id: "leather_hat",
    name: { en: "Leather Hat", es: "Sombrero de Cuero" },
    description: { en: "Leather hat. +4 DEF", es: "Sombrero de cuero. +4 DEF" },
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 2,
    price: 60,
    icon: "./img/hat2.webp"
  },

  Magic_hat: {
    id: "magic_hat",
    name: { en: "Magic Hat", es: "Sombrero Mágico" },
    description: { en: "Magic hat. +4 DEF, +5 INT", es: "Sombrero mágico. +4 DEF, +5 INT" },
    type: "hat",
    slot: "head",
    rarity: "common",
    defense: 2,
    intelligence: 5,
    price: 200,
    icon: "./img/hatMage.webp"
  },
  acolyte_hat: {
    id: "acolyte_hat",
    name: { en: "Acolyte's Hat", es: "Sombrero del Acólito" },
    description: { en: "Only an Acolyte can use this. +5 DEF, +8 INT", es: "Solo un Acólito puede usar esto. +5 DEF, +8 INT" },
    type: "hat",
    slot: "head",
    rarity: "rare",
    defense: 3,
    intelligence: 8,
    price: 600,
    icon: "./img/hatMage2.webp"
  },
  dark_mage_hat: {
    id: "dark_mage_hat",
    name: { en: "The Dark Hat", es: "El Sombrero Oscuro" },
    description: { en: "Only high dark mages use this. +10 DEF, +10 INT", es: "Solo los grandes magos oscuros usan esto. +10 DEF, +10 INT" },
    type: "hat",
    slot: "head",
    rarity: "epic",
    defense: 4,
    intelligence: 10,
    price: 1000,
    icon: "./img/helmetBlackMage.webp"
  },

  //accessory
  emblem_hero: {
    id: "emblem_hero",
    name: { en: "Hero Emblem", es: "Emblema del Héroe" },
    description: { en: "Emblem for heroes. +2 STR", es: "Emblema para héroes. +2 FUE" },
    slot: "accessory",
    type: "accessory",
    strength: 2,
    price: 40,
    icon: "./img/saintGrial.webp"
  },
  // Armaduras
  leather_armor: {
    id: "leather_armor",
    name: { en: "Leather Armor", es: "Armadura de Cuero" },
    type: "armor",
    rarity: "uncommon",
    slot: "armor",
    defense: 2,
    price: 70,
    icon: "./img/armorLeather.webp",
  },
  armor: {
    id: "armor",
    name: { en: "Leather Armor", es: "Armadura de Cuero" },
    description: { en: "Simple armor. +5 DEF", es: "Armadura sencilla. +5 DEF" },
    slot: "armor",
    type: "armor",
    defense: 4,
    price: 40,
    icon: "./img/armorLeather4.webp",
  },
  dark_armor: {
    id: "dark_armor",
    name: { en: "Dark Armor", es: "Armadura Oscura" },
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 20,
    price: 220,
    icon: "./img/armorDark2.webp",
  },
  jungle_armor: {
    id: "jungle_armor",
    name: { en: "Jungle Armor", es: "Armadura de la Jungla" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 8,
    price: 135,
    icon: "./img/armorBarbarian.webp",
  },
  chainmail: {
    id: "chainmail",
    name: { en: "Chainmail Armor", es: "Cota de Malla" },
    description: { en: "Strong armor. +10 DEF", es: "Armadura resistente. +10 DEF" },
    slot: "armor",
    type: "armor",
    defense: 10,
    price: 80,
    icon: "./img/armor2.webp",
  },
  sea_armor: {
    id: "sea_armor",
    name: { en: "Sea Armor", es: "Armadura Marina" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 12,
    price: 150,
    icon: "./img/ArmorSea.webp",
  },
  captain_coat: {
    id: "captain_coat",
    name: { en: "Captain Coat", es: "Abrigo del Capitán" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 13,
    price: 140,
    icon: "./img/robeDarkBattle.webp",
  },
  royal_armor: {
    id: "royal_armor",
    name: { en: "Royal Armor", es: "Armadura Real" },
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 18,
    price: 350,
    icon: "./img/armor8.webp",
  },
  plate_armor: {
    id: "plate_armor",
    name: { en: "Plate Armor", es: "Armadura de Placas" },
    description: { en: "Strong armor. +20 DEF", es: "Armadura resistente. +20 DEF" },
    slot: "armor",
    type: "armor",
    defense: 20,
    price: 300,
    icon: "./img/armor8.webp",
  },
  stone_armor: {
    id: "stone_armor",
    name: { en: "Stone Armor", es: "Armadura de Piedra" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    defense: 14,
    price: 160,
    icon: "./img/armorStone.webp",
  },

  dragon_king_armor: {
    id: "dragon_king_armor",
    name: { en: "Dragon King Armor", es: "Armadura del Rey Dragón" },
    type: "armor",
    rarity: "legendary",
    slot: "armor",
    defense: 50,
    price: 500,
    icon: "./img/dragonKingArmor.webp",
  },
  //armor magic
  robe: {
    id: "robe",
    name: { en: "Mage Robe", es: "Túnica de Mago" },
    description: { en: "Enchanted robe. +2 INT, +1 DEF", es: "Túnica encantada. +2 INT, +1 DEF" },
    slot: "armor",
    type: "armor",
    intelligence: 2,
    defense: 1,
    price: 35,
    icon: "./img/robe.webp",
  },
  gown: {
    id: "gown",
    name: { en: "Mage Gown", es: "Vestimenta de Mago" },
    description: { en: "Enchanted gown. +5 INT, +3 DEF", es: "Vestimenta encantada. +5 INT, +3 DEF" },
    slot: "armor",
    type: "armor",
    intelligence: 5,
    defense: 3,
    price: 50,
    icon: "./img/robe2.webp",
  },
  arcane_robe: {
    id: "arcane_robe",
    name: { en: "Arcane Mage Robe", es: "Túnica Arcana de Mago" },
    description: { en: "Enchanted arcane robe. +8 INT, +5 DEF", es: "Túnica arcana encantada. +8 INT, +5 DEF" },
    slot: "armor",
    type: "armor",
    intelligence: 8,
    defense: 5,
    price: 80,
    icon: "./img/robeGreen.webp",
  },
  aqua_robe: {
    id: "aqua_robe",
    name: { en: "Aqua Robe", es: "Túnica Aqua" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 12,
    defense: 6,
    price: 130,
    icon: "./img/aquaRobe.webp",
  },
  coral_robe: {
    id: "coral_robe",
    name: { en: "Coral Robe", es: "Túnica de Coral" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 10,
    defense: 8,
    price: 150,
    icon: "./img/coralRobe.webp",
  },
  fire_robe: {
    id: "fire_robe",
    name: { en: "Fire Robe", es: "Túnica de Fuego" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 9,
    price: 170,
    icon: "./img/coralRobe.webp",
  },
  nature_robe: {
    id: "nature_robe",
    name: { en: "Nature Robe", es: "Túnica de la Naturaleza" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 12,
    defense: 6,
    price: 130,
    icon: "./img/robeGreen2.webp",
  },

  ethereal_robe: {
    id: "ethereal_robe",
    name: { en: "Ethereal Robe", es: "Túnica Etérea" },
    type: "armor",
    rarity: "epic",
    slot: "armor",
    intelligence: 14,
    defense: 8,
    price: 150,
    icon: "./img/robeMerlin2.webp",
  },

  // Accesorios
  saint_grial: {
    id: "saint_grial",
    name: { en: "Saint Grail", es: "Santo Grial" },
    description: { en: "The Quest object. +30 STR, +20 AGI, +20 INT", es: "El objeto de la Misión. +30 FUE, +20 AGI, +20 INT" },
    slot: "accessory",
    type: "accessory",
    intelligence: 20,
    agility: 20,
    strength: 30,
    hpBonus: 80,
    price: 60,
    icon: "./img/saintGrial.webp",
  },
  dragon_king_crown: {
    id: "dragon_king_crown",
    name: { en: "Dragon King Crown", es: "Corona del Rey Dragón" },
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    intelligence: 25,
    strength: 25,
    agility: 25,
    price: 4000,
    icon: "./img/dragonKingCrow.webp",
  },



  // =====================
  // ⭐ Loot común por bioma
  // =====================

  herb: {
    id: "herb",
    name: { en: "Healing Herb", es: "Hierba Curativa" },
    type: "material",
    rarity: "common",
    price: 5,
    icon: "./img/herbs.webp",
  },

  wolf_pelt: {
    id: "wolf_pelt",
    name: { en: "Wolf Pelt", es: "Piel de Lobo" },
    type: "material",
    rarity: "uncommon",
    price: 8,
    icon: "./img/wolfPelt.webp",
  },

  fungus_core: {
    id: "fungus_core",
    name: { en: "Fungus Core", es: "Núcleo Fúngico" },
    type: "material",
    rarity: "rare",
    price: 18,
    icon: "./img/fungusCore.webp",
  },

  iron_ore: {
    id: "iron_ore",
    name: { en: "Iron Ore", es: "Mineral de Hierro" },
    description: { en: "A raw iron ore used for crafting.", es: "Un mineral de hierro en bruto para craftear." },
    type: "material",
    rarity: "common",
    price: 5,
    icon: "./img/ironOre.webp",
  },

  bat_wing: {
    id: "bat_wing",
    name: { en: "Bat Wing", es: "Ala de Murciélago" },
    type: "material",
    rarity: "common",
    price: 8,
    icon: "./img/batWing.webp",
  },

  crystal_shard: {
    id: "crystal_shard",
    name: { en: "Crystal Shard", es: "Fragmento de Cristal" },
    type: "material",
    rarity: "rare",
    price: 20,
    icon: "./img/cristalShard.webp",
  },

  golem_fragment: {
    id: "golem_fragment",
    name: { en: "Golem Fragment", es: "Fragmento de Gólem" },
    type: "material",
    rarity: "epic",
    price: 35,
    icon: "./img/golemFragment.webp"
  },

  ice_crystal: {
    id: "ice_crystal",
    name: { en: "Ice Crystal", es: "Cristal de Hielo" },
    type: "material",
    rarity: "uncommon",
    price: 15,
    icon: "./img/iceCristal.webp",
  },

  wyvern_scale: {
    id: "wyvern_scale",
    name: { en: "Wyvern Scale", es: "Escama de Wyvern" },
    type: "material",
    rarity: "rare",
    price: 35,
    icon: "./img/wyvernScale.webp",
  },

  giant_bone: {
    id: "giant_bone",
    name: { en: "Giant Bone", es: "Hueso Gigante" },
    type: "material",
    rarity: "rare",
    price: 25,
    icon: "./img/giantBone.webp",
  },

  ancient_relic: {
    id: "ancient_relic",
    name: { en: "Ancient Relic", es: "Reliquia Antigua" },
    type: "material",
    rarity: "epic",
    price: 50,
    icon: "./img/ancientRelic.webp",
  },

  enchanted_dust: {
    id: "enchanted_dust",
    name: { en: "Enchanted Dust", es: "Polvo Encantado" },
    type: "material",
    rarity: "uncommon",
    price: 12,
    icon: "./img/enchantedDust.webp",
  },

  runestone: {
    id: "runestone",
    name: { en: "Runestone", es: "Piedra Rúnica" },
    type: "material",
    rarity: "rare",
    price: 30,
    icon: "./img/runeBlack.webp",
  },

  ancient_core: {
    id: "ancient_core",
    name: { en: "Ancient Core", es: "Núcleo Antiguo" },
    type: "material",
    rarity: "epic",
    price: 40,
    icon: "./img/runeSpirit.webp",
  },

  arcane_relic: {
    id: "arcane_relic",
    name: { en: "Arcane Relic", es: "Reliquia Arcana" },
    type: "material",
    rarity: "legendary",
    price: 100,
    icon: "./img/rune1.webp",
  },

  poison_gland: {
    id: "poison_gland",
    name: { en: "Poison Gland", es: "Glándula Venenosa" },
    type: "material",
    rarity: "common",
    price: 6,
    icon: "./img/poisonGland.webp"
  },

  acid_sac: {
    id: "acid_sac",
    name: { en: "Acid Sac", es: "Saco Ácido" },
    type: "material",
    rarity: "uncommon",
    price: 10,
    icon: "./img/acidSac.webp"
  },

  necrotic_bone: {
    id: "necrotic_bone",
    name: { en: "Necrotic Bone", es: "Hueso Necrótico" },
    type: "material",
    rarity: "rare",
    price: 22,
    icon: "./img/necroticBone.webp",
  },

  toxic_heart: {
    id: "toxic_heart",
    name: { en: "Toxic Heart", es: "Corazón Tóxico" },
    type: "material",
    rarity: "epic",
    price: 45,
    icon: "./img/toxicHeart.webp",
  },

  magma_fragment: {
    id: "magma_fragment",
    name: { en: "Magma Fragment", es: "Fragmento de Magma" },
    type: "material",
    rarity: "uncommon",
    price: 18,
    icon: "./img/magmaFragment.webp",
  },

  pyro_core: {
    id: "pyro_core",
    name: { en: "Pyro Core", es: "Núcleo Pirótico" },
    type: "material",
    rarity: "rare",
    price: 28,
    icon: "./img/pyroCore.webp",
  },

  dragon_scale: {
    id: "dragon_scale",
    name: { en: "Dragon Scale", es: "Escama de Dragón" },
    type: "material",
    rarity: "epic",
    price: 75,
    icon: "./img/dragonScale.webp",
  },

  heart_of_inferno: {
    id: "heart_of_inferno",
    name: { en: "Heart of the Inferno", es: "Corazón del Infierno" },
    type: "material",
    rarity: "legendary",
    price: 150,
    icon: "./img/heartOfInferno.webp",
  },

  frost_shard: {
    id: "frost_shard",
    name: { en: "Frost Shard", es: "Fragmento Helado" },
    type: "material",
    rarity: "uncommon",
    price: 14,
    icon: "./img/frostShard.webp",
  },

  ice_essence: {
    id: "ice_essence",
    name: { en: "Ice Essence", es: "Esencia de Hielo" },
    type: "material",
    rarity: "rare",
    price: 24,
    icon: "./img/iceEssence.webp",
  },

  glacial_core: {
    id: "glacial_core",
    name: { en: "Glacial Core", es: "Núcleo Glacial" },
    type: "material",
    rarity: "epic",
    price: 60,
    icon: "./img/frostShard.webp",
  },


  // =====================
  // ⭐ Loot de Jefes
  // =====================

  titan_branch: {
    id: "titan_branch",
    name: { en: "Titan Branch", es: "Rama Titán" },
    type: "material",
    rarity: "rare",
    price: 40,
    icon: "./img/titanBranch.webp",
  },

  forest_emblem: {
    id: "forest_emblem",
    name: { en: "Forest Emblem", es: "Emblema del Bosque" },
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    description: { en: "A forest emblem. +5 Magic, +2 DEF.", es: "Un emblema del bosque. +5 Magia, +2 DEF." },
    magic: 5,
    defense: 2,
    hpBonus: 20,
    price: 90,
    icon: "./img/runeGreen.webp",
  },

  devourer_fang: {
    id: "devourer_fang",
    name: { en: "Devourer Fang", es: "Colmillo del Devorador" },
    type: "material",
    rarity: "rare",
    price: 45,
    icon: "./img/devourerFang.webp",
  },

  earthbreaker_core: {
    id: "earthbreaker_core",
    name: { en: "Earthbreaker Core", es: "Núcleo Rompetierras" },
    type: "material",
    rarity: "epic",
    price: 100,
    icon: "./img/earthbreakerCore.webp"
  },

  colossus_heart: {
    id: "colossus_heart",
    name: { en: "Colossus Heart", es: "Corazón del Coloso" },
    type: "material",
    rarity: "rare",
    price: 55,
    icon: "./img/colossusHeart.webp",
  },

  mountain_emblem: {
    id: "mountain_emblem",
    name: { en: "Mountain Emblem", es: "Emblema de la Montaña" },
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    defense: 4,
    hpBonus: 30,
    price: 120,
    description: { en: "The Mountain Emblem. +4 DEF", es: "El Emblema de la Montaña. +4 DEF" },
    icon: "./img/runeKey.webp"
  },

  construct_eye: {
    id: "construct_eye",
    name: { en: "Construct Eye", es: "Ojo del Constructo" },
    type: "material",
    rarity: "rare",
    price: 50
  },

  arcane_emblem: {
    id: "arcane_emblem",
    name: { en: "Arcane Emblem", es: "Emblema Arcano" },
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    magic: 8,
    defense: 3,
    price: 150,
    description: { en: "The Arcane Emblem. +3 DEF, +8 Magic", es: "El Emblema Arcano. +3 DEF, +8 Magia" },
    icon: "./img/runeMagic.webp"
  },

  abomination_core: {
    id: "abomination_core",
    name: { en: "Abomination Core", es: "Núcleo de la Abominación" },
    type: "material",
    rarity: "rare",
    price: 48
  },

  plague_emblem: {
    id: "plague_emblem",
    name: { en: "Plague Emblem", es: "Emblema de la Plaga" },
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    strength: 3,
    magic: 3,
    price: 120,
    description: { en: "The Plague Emblem. +3 STR, +3 Magic", es: "El Emblema de la Plaga. +3 FUE, +3 Magia" },
    icon: "./img/runeRed.webp"
  },

  inferno_eye: {
    id: "inferno_eye",
    name: { en: "Inferno Eye", es: "Ojo del Infierno" },
    type: "material",
    rarity: "epic",
    price: 85
  },

  inferno_emblem: {
    id: "inferno_emblem",
    name: { en: "Inferno Emblem", es: "Emblema del Infierno" },
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    attack: 5,
    magic: 5,
    price: 200,
    description: { en: "The Inferno Emblem. +5 ATK, +5 Magic", es: "El Emblema del Infierno. +5 ATK, +5 Magia" },
    icon: "./img/runeRed2.webp"
  },

  wyrm_tail: {
    id: "wyrm_tail",
    name: { en: "Frost Wyrm Tail", es: "Cola del Wyrm Helado" },
    type: "material",
    rarity: "epic",
    price: 70
  },

  tundra_emblem: {
    id: "tundra_emblem",
    name: { en: "Tundra Emblem", es: "Emblema de la Tundra" },
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    defense: 5,
    magic: 4,
    price: 180,
    description: { en: "The Tundra Emblem. +5 DEF, +4 Magic", es: "El Emblema de la Tundra. +5 DEF, +4 Magia" },
    icon: "./img/runePurple.webp"
  },

  forest_emblem_upgraded: {
    id: "forest_emblem_upgraded",
    name: { en: "Forest Emblem+", es: "Emblema del Bosque+" },
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    magic: 10,
    defense: 5,
    price: 180,
    description: { en: "The Forest Emblem+. +5 DEF, +10 Magic", es: "El Emblema del Bosque+. +5 DEF, +10 Magia" },
    icon: "./img/runeGreen2.webp"
  },

  inferno_emblem_upgraded: {
    id: "inferno_emblem_upgraded",
    name: { en: "Inferno Emblem+", es: "Emblema del Infierno+" },
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    strength: 10,
    agility: 10,
    intelligence: 10,
    attack: 10,
    magic: 10,
    price: 300,
    description: { en: "The Inferno Emblem+. +10 STR, +10 AGI, +10 INT, +10 ATK, +10 Magic", es: "El Emblema del Infierno+. +10 FUE, +10 AGI, +10 INT, +10 ATK, +10 Magia" },
    icon: "./img/runeFire.webp"
  },

  rusty_coin: {
    id: "rusty_coin",
    name: { en: "Rusty Coin", es: "Moneda Oxidada" },
    type: "material",
    rarity: "common",
    price: 5,
    icon: "🪙"
  },

  slime_gel: {
    id: "slime_gel",
    name: { en: "Slime Gel", es: "Gel de Slime" },
    type: "material",
    rarity: "common",
    price: 4,
  },
  golden_key: {
    id: "golden_key",
    name: { en: "Golden Key", es: "Llave Dorada" },
    type: "key_item",
    rarity: "rare",
    price: 100,
    icon: "./img/goldenKey.webp",
  },
  garden_key: {
    id: "garden_key",
    name: { en: "Garden Key", es: "Llave del Jardín" },
    description: { en: "A magical key that opens the Garden Vault.", es: "Una llave mágica que abre la Bóveda del Jardín." },
    type: "key_item",
    rarity: "rare",
    price: 0,
    icon: "🗝️",
  },
  treasure_map: {
    id: "treasure_map",
    name: { en: "Treasure Map", es: "Mapa del Tesoro" },
    type: "key_item",
    rarity: "uncommon",
    price: 50,
    icon: "./img/map.webp",
  },
  world_map: {
    id: "world_map",
    name: { en: "World Map", es: "Mapa del Mundo" },
    type: "key_item",
    rarity: "epic",
    price: 150,
    description: { en: "A map that shows the entire world.", es: "Un mapa que muestra el mundo entero." },
    icon: "./img/map.webp",
  },

  ancient_guardian_core: {
    id: "ancient_guardian_core",
    name: { en: "Ancient Guardian Core", es: "Núcleo del Guardián Antiguo" },
    type: "material",
    rarity: "legendary",
    price: 200,
    icon: "./img/ancientGuardianCore.webp",
  },
  treasure_guardian_core: {
    id: "treasure_guardian_core",
    name: { en: "Treasure Guardian Core", es: "Núcleo del Guardián del Tesoro" },
    type: "material",
    rarity: "epic",
    price: 120,
    icon: "./img/ancientGuardianCore.webp",
  },
  treasure_guardian_heart: {
    id: "treasure_guardian_heart",
    name: { en: "Treasure Guardian Heart", es: "Corazón del Guardián del Tesoro" },
    type: "material",
    rarity: "rare",
    price: 80,
    icon: "./img/heart.webp",
  },
  dragon_heart: {
    id: "dragon_heart",
    name: { en: "Dragon Heart", es: "Corazón de Dragón" },
    type: "material",
    rarity: "legendary",
    price: 250,
    icon: "./img/heartOfInferno.webp",
  },
  inferno_gem: {
    id: "inferno_gem",
    name: { en: "Inferno Gem", es: "Gema del Infierno" },
    type: "material",
    rarity: "legendary",
    price: 220,
    icon: "./img/infernoGem.webp",
  },

  // ── Pergaminos de habilidad (SPEC-0607) ──────────────
  scroll_of_rally: {
    id: "scroll_of_rally",
    name: { en: "Scroll: Rally", es: "Pergamino: Reagruparse" },
    type: "scroll",
    icon: "📜",
    teachesSkill: "rally",
    description: { en: "Teaches the universal skill Rally (+20% HP, removes debuffs).", es: "Enseña la habilidad universal Reagruparse (+20% HP, elimina debuffs)." },
    price: 150,
    rarity: "uncommon"
  },
  scroll_of_power: {
    id: "scroll_of_power",
    name: { en: "Scroll: Power Strike", es: "Pergamino: Golpe Potente" },
    type: "scroll",
    icon: "📜",
    teachesSkill: "power_strike",
    description: { en: "Teaches the universal skill Power Strike (ignores defense, 50% crit).", es: "Enseña la habilidad universal Golpe Potente (ignora defensa, 50% crit)." },
    price: 200,
    rarity: "uncommon"
  },
  scroll_of_arcane: {
    id: "scroll_of_arcane",
    name: { en: "Scroll: Arcane Bolt", es: "Pergamino: Descarga Arcana" },
    type: "scroll",
    icon: "📜",
    teachesSkill: "arcane_bolt",
    description: { en: "Teaches the universal skill Arcane Bolt (2× pure magic damage).", es: "Enseña la habilidad universal Descarga Arcana (2× daño mágico puro)." },
    price: 250,
    rarity: "rare"
  },

  // SPEC-1106: loot que cambia cómo juegas, no solo números (roadmap ítem #6)
  ring_last_breath: {
    id: "ring_last_breath",
    name: { en: "Ring of Last Breath", es: "Anillo de Último Aliento" },
    description: { en: "Once per combat, survive lethal damage at 1 HP instead of falling.", es: "Una vez por combate, sobrevives al daño letal con 1 HP en vez de caer." },
    type: "ring",
    slot: "ring",
    rarity: "legendary",
    strength: 1,
    special: "lastBreath",
    price: 300,
    icon: "💍",
  },
  cloak_of_mist: {
    id: "cloak_of_mist",
    name: { en: "Cloak of Mist", es: "Capa de Niebla" },
    description: { en: "+3 DEF. The mist hides you completely from the enemy's first strike.", es: "+3 DEF. La niebla te oculta por completo del primer golpe del enemigo." },
    type: "armor",
    slot: "armor",
    rarity: "epic",
    defense: 3,
    special: "mistEvasion",
    mistEvasionBonus: 0.50,
    price: 220,
    icon: "🌫️",
  },
  ravenous_sword: {
    id: "ravenous_sword",
    name: { en: "Ravenous Sword", es: "Espada Voraz" },
    description: { en: "+14 ATK, -3 DEF. Heals 20% of missing HP on every kill — it feeds so you don't have to guard.", es: "+14 ATK, -3 DEF. Cura 20% del HP faltante en cada muerte — se alimenta para que no tengas que cuidarte." },
    type: "weapon",
    slot: "rightHand",
    rarity: "epic",
    attack: 14,
    defense: -3,
    special: "healOnKill",
    healOnKillPct: 0.20,
    price: 260,
    icon: "🩸",
  },
  echo_amulet: {
    id: "echo_amulet",
    name: { en: "Echo Amulet", es: "Amuleto del Eco" },
    description: { en: "+3 INT. Rewards grow +20% once you've made a compassionate choice this run.", es: "+3 INT. Las recompensas crecen +20% una vez que tomaste una decisión compasiva en esta partida." },
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    intelligence: 3,
    special: "compassionReward",
    compassionRewardBonus: 0.20,
    price: 240,
    icon: "📿",
  },
  burnt_book: {
    id: "burnt_book",
    name: { en: "Burnt Book", es: "Libro Quemado" },
    description: { en: "+8 INT, +12 Magic. Fire spells hit 25% harder, but every spell costs 30% more MP.", es: "+8 INT, +12 Magia. Los hechizos de fuego pegan 25% más fuerte, pero cada hechizo cuesta 30% más MP." },
    type: "weapon",
    slot: "rightHand",
    rarity: "epic",
    intelligence: 8,
    magic: 12,
    special: "burntBook",
    fireDmgBonus: 0.25,
    mpCostMult: 1.30,
    price: 260,
    icon: "📕",
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
