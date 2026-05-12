import { addMessage } from "./story.js";

export const craftingRecipes = {

  // ── Forja ────────────────────────────────────────────────────────
  forge: {
    // Armas
    iron_sword: {
      name: "Iron Sword", icon: "⚔️", levelReq: 2, rarity: "uncommon",
      ingredients: { iron_ore: 3, wolf_pelt: 1 },
      result: { id: "iron_sword", type: "weapon", slot: "rightHand", attack: 5 }
    },
    axe: {
      name: "Axe", icon: "🪓", levelReq: 2, rarity: "uncommon",
      ingredients: { iron_ore: 3, wolf_pelt: 2 },
      result: { id: "axe", type: "weapon", slot: "rightHand", attack: 6 }
    },
    hammer: {
      name: "Hammer", icon: "🔨", levelReq: 3, rarity: "uncommon",
      ingredients: { iron_ore: 4, golem_fragment: 1 },
      result: { id: "hammer", type: "weapon", slot: "rightHand", attack: 8, strength: 2 }
    },
    crystal_blade: {
      name: "Crystal Blade", icon: "💎", levelReq: 5, rarity: "rare",
      ingredients: { crystal_shard: 2, golem_fragment: 1 },
      result: { id: "crystal_blade", type: "weapon", slot: "rightHand", attack: 10 }
    },
    royal_sword: {
      name: "Royal Sword", icon: "👑", levelReq: 6, rarity: "rare",
      ingredients: { iron_ore: 5, crystal_shard: 3, golem_fragment: 2 },
      result: { id: "royal_sword", type: "weapon", slot: "rightHand", attack: 16 }
    },
    serpent_sword: {
      name: "Serpent Sword", icon: "🐍", levelReq: 7, rarity: "rare",
      ingredients: { crystal_shard: 3, bat_wing: 3, poison_gland: 2 },
      result: { id: "serpent_sword", type: "weapon", slot: "rightHand", attack: 20, agility: 3 }
    },
    katana: {
      name: "Katana", icon: "⚔️", levelReq: 8, rarity: "epic",
      ingredients: { crystal_shard: 4, ancient_relic: 1, wyvern_scale: 2 },
      result: { id: "katana", type: "weapon", slot: "rightHand", attack: 25, agility: 5 }
    },
    demon_blade: {
      name: "Demon Blade", icon: "😈", levelReq: 11, rarity: "legendary",
      ingredients: { ancient_relic: 3, enchanted_dust: 5, necrotic_bone: 2, crystal_shard: 6 },
      result: { id: "demon_blade", type: "weapon", slot: "rightHand", attack: 40, strength: 10 }
    },
    divine_sword: {
      name: "Divine Sword", icon: "✨", levelReq: 12, rarity: "legendary",
      ingredients: { ancient_relic: 4, enchanted_dust: 5, colossus_heart: 1, runestone: 3 },
      result: { id: "divine_sword", type: "weapon", slot: "rightHand", attack: 45, strength: 10, intelligence: 5, hpBonus: 30 }
    },
    excalibur: {
      name: "Excalibur", icon: "⚡", levelReq: 15, rarity: "legendary",
      ingredients: { crystal_shard: 10, golem_fragment: 10, iron_ore: 10, wolf_pelt: 10, herb: 10, fungus_core: 10 },
      result: { id: "excalibur", type: "weapon", slot: "rightHand", attack: 50, strength: 20, agility: 20, intelligence: 20, hpBonus: 50, defense: 20 }
    },
    // Escudos
    iron_shield: {
      name: "Iron Shield", icon: "🛡️", levelReq: 3, rarity: "uncommon",
      ingredients: { iron_ore: 4, wolf_pelt: 2 },
      result: { id: "iron_shield", type: "shield", slot: "leftHand", defense: 10 }
    },
    strong_shield: {
      name: "Strong Shield", icon: "🛡️", levelReq: 6, rarity: "rare",
      ingredients: { iron_ore: 7, golem_fragment: 2, crystal_shard: 1 },
      result: { id: "strong_shield", type: "shield", slot: "leftHand", defense: 20 }
    },
    // Armaduras
    leather_armor: {
      name: "Leather Armor", icon: "🥋", levelReq: 1, rarity: "common",
      ingredients: { wolf_pelt: 4, herb: 2 },
      result: { id: "leather_armor", type: "armor", slot: "armor", defense: 5 }
    },
    chainmail: {
      name: "Chainmail", icon: "⛓️", levelReq: 4, rarity: "uncommon",
      ingredients: { iron_ore: 6, golem_fragment: 1 },
      result: { id: "chainmail", type: "armor", slot: "armor", defense: 12 }
    },
    plate_armor: {
      name: "Plate Armor", icon: "🪖", levelReq: 8, rarity: "rare",
      ingredients: { iron_ore: 10, golem_fragment: 4, crystal_shard: 2 },
      result: { id: "plate_armor", type: "armor", slot: "armor", defense: 25, strength: 3 }
    },
    dark_armor: {
      name: "Dark Armor", icon: "🖤", levelReq: 10, rarity: "epic",
      ingredients: { ancient_relic: 3, enchanted_dust: 4, necrotic_bone: 3 },
      result: { id: "dark_armor", type: "armor", slot: "armor", defense: 35, agility: 5 }
    },
    arcane_robe: {
      name: "Arcane Robe", icon: "🔮", levelReq: 6, rarity: "rare",
      ingredients: { bat_wing: 4, enchanted_dust: 3, crystal_shard: 2 },
      result: { id: "arcane_robe", type: "armor", slot: "armor", defense: 8, magic: 15, intelligence: 5 }
    },
    // Cascos
    iron_helmet: {
      name: "Iron Helmet", icon: "⛑️", levelReq: 3, rarity: "uncommon",
      ingredients: { iron_ore: 3, wolf_pelt: 1 },
      result: { id: "iron_helmet", type: "helmet", slot: "head", defense: 8 }
    },
    plate_helmet: {
      name: "Plate Helmet", icon: "🪖", levelReq: 7, rarity: "rare",
      ingredients: { iron_ore: 6, golem_fragment: 2 },
      result: { id: "plate_helmet", type: "helmet", slot: "head", defense: 18, strength: 2 }
    },
    // Botas
    iron_boots: {
      name: "Iron Boots", icon: "👡", levelReq: 3, rarity: "uncommon",
      ingredients: { iron_ore: 3, wolf_pelt: 2 },
      result: { id: "iron_boots", type: "boots", slot: "boots", defense: 6, agility: 1 }
    },
    plate_boots: {
      name: "Plate Boots", icon: "👡", levelReq: 6, rarity: "rare",
      ingredients: { iron_ore: 5, golem_fragment: 2 },
      result: { id: "plate_boots", type: "boots", slot: "boots", defense: 14, strength: 1 }
    },
    // Brazaletes / brazales
    leather_gloves: {
      name: "Leather Gloves", icon: "🧤", levelReq: 1, rarity: "common",
      ingredients: { wolf_pelt: 3, herb: 1 },
      result: { id: "leather_gloves", type: "arms", slot: "arms", defense: 4, agility: 1 }
    },
    iron_bracers: {
      name: "Iron Bracers", icon: "💪", levelReq: 4, rarity: "uncommon",
      ingredients: { iron_ore: 4, golem_fragment: 1 },
      result: { id: "iron_bracers", type: "arms", slot: "arms", defense: 9, strength: 2 }
    },
  },

  // ── Alquimia ─────────────────────────────────────────────────────
  alchemy: {
    health_potion: {
      name: "Health Potion", icon: "❤️", levelReq: 1, rarity: "common",
      ingredients: { herb: 2 },
      result: { id: "health_potion", type: "consumable", restoreHp: 30 }
    },
    mana_potion: {
      name: "Mana Potion", icon: "💙", levelReq: 1, rarity: "common",
      ingredients: { bat_wing: 1, herb: 1 },
      result: { id: "mana_potion", type: "consumable", restoreMp: 20 }
    },
    healing_elixir: {
      name: "Healing Elixir",
      icon: "🧪",
      levelReq: 1,
      rarity: "uncommon",
      ingredients: { herb: 3, fungus_core: 1 },
      result: { id: "healing_elixir", type: "consumable", restoreHp: 50 }
    },
    mana_elixir: {
      name: "Mana Elixir",
      icon: "🔮",
      levelReq: 4,
      rarity: "uncommon",
      ingredients: { bat_wing: 2, ice_crystal: 1 },
      result: { id: "mana_elixir", type: "consumable", restoreMp: 50 }
    },
    greater_elixir: {
      name: "Greater Elixir",
      icon: "✨",
      levelReq: 8,
      rarity: "rare",
      ingredients: { herb: 5, fungus_core: 3, enchanted_dust: 1 },
      result: { id: "greater_elixir", type: "consumable", restoreHp: 100, restoreMp: 50 }
    },
    antidote: {
      name: "Antídoto",
      icon: "💚",
      levelReq: 1,
      rarity: "common",
      ingredients: { herb: 2, bat_wing: 1 },
      result: { id: "antidote", type: "consumable", curesPoison: true }
    },
    remedy: {
      name: "Remedio",
      icon: "🧊",
      levelReq: 2,
      rarity: "common",
      ingredients: { herb: 1, ice_crystal: 1 },
      result: { id: "remedy", type: "consumable", curesBurn: true }
    },
    panacea: {
      name: "Panacea",
      icon: "🌟",
      levelReq: 5,
      rarity: "uncommon",
      ingredients: { herb: 3, bat_wing: 2, enchanted_dust: 1 },
      result: { id: "panacea", type: "consumable", curesAll: true, restoreHp: 20 }
    }
  },

  // ── Taller Arcano ────────────────────────────────────────────────
  arcane: {
    // Anillos
    ring_strength: {
      name: "Ring of Strength", icon: "💪", levelReq: 3, rarity: "uncommon",
      ingredients: { iron_ore: 2, wolf_pelt: 1, enchanted_dust: 1 },
      result: { id: "ring_strength", type: "ring", slot: "ring", strength: 3 }
    },
    ring_agility: {
      name: "Ring of Agility", icon: "🏃", levelReq: 3, rarity: "uncommon",
      ingredients: { bat_wing: 2, herb: 1, enchanted_dust: 1 },
      result: { id: "ring_agility", type: "ring", slot: "ring", agility: 3 }
    },
    ring_intelligence: {
      name: "Ring of Intelligence", icon: "🧠", levelReq: 3, rarity: "uncommon",
      ingredients: { crystal_shard: 1, ice_crystal: 1, enchanted_dust: 1 },
      result: { id: "ring_intelligence", type: "ring", slot: "ring", intelligence: 3 }
    },
    ring_of_knowledge: {
      name: "Ring of Knowledge", icon: "📚", levelReq: 6, rarity: "rare",
      ingredients: { crystal_shard: 2, ancient_relic: 1, enchanted_dust: 2 },
      result: { id: "ring_of_knowledge", type: "ring", slot: "ring", intelligence: 6, magic: 5 }
    },
    ring_of_power: {
      name: "Ring of Power", icon: "⚡", levelReq: 9, rarity: "epic",
      ingredients: { ancient_relic: 2, enchanted_dust: 3, dragon_scale: 1 },
      result: { id: "ring_of_power", type: "ring", slot: "ring", strength: 8, attack: 10 }
    },
    // Emblemas boss drops → upgrades
    forest_emblem_upgraded: {
      name: "Forest Emblem +", icon: "🌿", levelReq: 7, rarity: "epic",
      ingredients: { forest_emblem: 1, ancient_relic: 1, enchanted_dust: 2 },
      result: { id: "forest_emblem_upgraded", type: "accessory", slot: "accessory", attack: 10, magic: 10 }
    },
    mountain_emblem_upgraded: {
      name: "Mountain Emblem +", icon: "⛰️", levelReq: 9, rarity: "epic",
      ingredients: { mountain_emblem: 1, colossus_heart: 1, ancient_relic: 1 },
      result: { id: "mountain_emblem", type: "accessory", slot: "accessory", attack: 18, defense: 12, strength: 5 }
    },
    arcane_emblem_upgraded: {
      name: "Arcane Emblem +", icon: "🔮", levelReq: 10, rarity: "epic",
      ingredients: { arcane_emblem: 1, construct_eye: 1, runestone: 2 },
      result: { id: "arcane_emblem", type: "accessory", slot: "accessory", magic: 20, intelligence: 8 }
    },
    inferno_emblem_upgraded: {
      name: "Inferno Emblem +", icon: "🔥", levelReq: 11, rarity: "legendary",
      ingredients: { inferno_emblem: 1, dragon_scale: 1, ancient_relic: 1 },
      result: { id: "inferno_emblem_upgraded", type: "accessory", slot: "accessory", attack: 30, magic: 30 }
    },
    tundra_emblem_upgraded: {
      name: "Tundra Emblem +", icon: "❄️", levelReq: 11, rarity: "legendary",
      ingredients: { tundra_emblem: 1, glacial_core: 1, ancient_relic: 1 },
      result: { id: "tundra_emblem", type: "accessory", slot: "accessory", magic: 25, intelligence: 10, defense: 10 }
    },
  }
};

export function canCraft(recipe, inventory, playerLevel) {
  if (playerLevel < (recipe.levelReq ?? 1)) return { ok: false };
  for (const [mat, qty] of Object.entries(recipe.ingredients)) {
    if ((inventory[mat] ?? 0) < qty) return { ok: false };
  }
  return { ok: true };
}

export function craftItem(recipe, inventory, playerLevel) {
  if (!canCraft(recipe, inventory, playerLevel).ok) {
    addMessage("No puedes fabricar esto ahora.", "system");
    return null;
  }
  for (const [mat, qty] of Object.entries(recipe.ingredients)) {
    inventory[mat] -= qty;
    if (inventory[mat] <= 0) delete inventory[mat];
  }
  const result = { ...recipe.result };
  inventory[result.id] = (inventory[result.id] ?? 0) + 1;
  return result;
}
