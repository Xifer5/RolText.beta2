const SLOT_TYPES = Object.freeze({
  rightHand: ["weapon"],
  leftHand: ["shield"],
  armor: ["armor"],
  boots: ["boots"],
  arms: ["arms"],
  ring: ["ring"],
  head: ["helmet", "hat"],
  accessory: ["emblem", "collar", "talisman", "accessory"]
});

function addToInventory(inventory, itemId, quantity = 1) {
  inventory[itemId] = (inventory[itemId] || 0) + quantity;
}

export function canEquipItem(item) {
  return !!item?.slot && !!SLOT_TYPES[item.slot]?.includes(item.type);
}

export function equipInventoryItem(state, itemId, item) {
  if (!state?.inventory?.[itemId]) return { ok: false, reason: "notOwned" };
  if (!canEquipItem(item)) return { ok: false, reason: "incompatible" };

  state.inventory[itemId] -= 1;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  const replacedItem = state.equipment[item.slot] || null;
  state.equipment[item.slot] = item;
  if (replacedItem?.id) addToInventory(state.inventory, replacedItem.id);
  return { ok: true, item, replacedItem };
}

export function unequipSlot(state, slot) {
  const item = state?.equipment?.[slot];
  if (!item) return { ok: false, reason: "empty" };
  if (!state.inventory) state.inventory = {};
  addToInventory(state.inventory, item.id);
  state.equipment[slot] = null;
  return { ok: true, item, slot };
}

