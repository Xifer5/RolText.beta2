


// =============================
// ⭐ DEFINICIÓN DE RECETAS
// =============================

export const craftingRecipes = {

  // ---- FORJA ----
  forge: {
    iron_sword: {
      name: "Iron Sword",
      levelReq: 2,
      rarity: "uncommon",
      ingredients: {
        iron_ore: 3,
        wolf_pelt: 1
      },
      result: { id: "iron_sword", 
        type: "weapon", 
        slot: "rightHand", 
        attack: 5 },
    },

    crystal_blade: {
      name: "Crystal Blade",
      levelReq: 5,
      rarity: "rare",
      ingredients: {
        crystal_shard: 2,
        golem_fragment: 1
      },
      result: { id: "crystal_blade", 
        type: "weapon", 
        slot: "rightHand", 
        attack: 10 },
    }
    },

  // ---- ALQUIMIA ----
    alchemy: {
      healing_elixir: {
      name: "Healing Elixir",
      levelReq: 1,
      rarity: "rare",
      ingredients: {
        herb: 3,
        fungus_core: 1
      },
      result: { id: "healing_elixir", 
        type: "consumable", 
        restoreHp: 50 },
    },
    

    mana_elixir: {
      name: "Mana Elixir",
      levelReq: 4,
      rarity: "uncommon",
      ingredients: {
        bat_wing: 2,
        ice_essence: 1,
      },
      result: { id: "mana_elixir", 
        type: "consumable", 
        restoreMp: 50 },
    },

  },

  // ---- TALLER ARCANO ----
  arcane: {
    forest_emblem_upgraded: {
      name: "Forest Emblem (Upgraded)",
      levelReq: 7,
      rarity: "epic",
      ingredients: {
        forest_emblem: 1,
        ancient_core: 1,
        enchanted_dust: 2
      },
      result: { id: "forest_emblem_upgraded", 
        type: "accessory", 
        slot: "accessory",
        rarity: "legendary",
        attack: 10,
        magic: 10,
        price: 300
    },

    inferno_emblem_upgraded: {
      name: "Inferno Emblem (Upgraded)",
      result: "inferno_emblem_upgraded",
      levelReq: 10,
      rarity: "legendary",
      ingredients: {
        inferno_emblem: 1,
        dragon_scale: 1,
        heart_of_inferno: 1
      },
      result: { id: "inferno_emblem_upgraded", 
        type: "accessory", 
        slot: "accessory",
        rarity: "legendary",
        attack: 30,
        magic: 30,
        price: 600
      },
    },
    }
  }
};



import { addMessage } from "./story.js";

export function canCraft(recipe, inventory, playerLevel) {
  if (playerLevel < recipe.levelReq) return { ok: false, reason: "Level too low" };
  for (const mat in recipe.ingredients) {
    const required = recipe.ingredients[mat];
    const have = inventory[mat] || 0;
    if (have < required) return { ok: false, reason: `Missing ${mat}` };
  }
  return { ok: true };
}

export function craftItem(recipe, inventory, playerLevel) {
  const check = canCraft(recipe, inventory, playerLevel);
  if (!check.ok) {
    addMessage(check.reason, "system");
    return null;
  }
  for (const mat in recipe.ingredients) {
    const required = recipe.ingredients[mat];
    inventory[mat] -= required;
    if (inventory[mat] <= 0) delete inventory[mat];
  }
  // normalize result to ensure consistent property names across recipes/items
  const result = Object.assign({}, recipe.result);
  // legacy recipes used effect/potency (e.g. restore_hp / restore_mp)
  if (result.effect && result.potency) {
    if (result.effect === 'restore_hp') result.restoreHp = result.potency;
    if (result.effect === 'restore_mp') result.restoreMp = result.potency;
  }
  inventory[result.id] = (inventory[result.id] || 0) + 1;
  return result;
}