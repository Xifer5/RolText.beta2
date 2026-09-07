import { test } from "node:test";
import assert from "node:assert/strict";

const { equipInventoryItem, unequipSlot } = await import("../js/equipmentActions.js");

function state() {
  return {
    inventory: { sword: 1, potion: 1 },
    equipment: { rightHand: null, armor: null }
  };
}

test("equipar mueve el objeto al slot y devuelve el anterior a la mochila", () => {
  const s = state();
  s.equipment.rightHand = { id: "old_sword", type: "weapon", slot: "rightHand" };
  const result = equipInventoryItem(s, "sword", { id: "sword", type: "weapon", slot: "rightHand" });
  assert.equal(result.ok, true);
  assert.equal(s.inventory.sword, undefined);
  assert.equal(s.inventory.old_sword, 1);
  assert.equal(s.equipment.rightHand.id, "sword");
});

test("un objeto incompatible no se consume ni cambia el equipo", () => {
  const s = state();
  const result = equipInventoryItem(s, "potion", { id: "potion", type: "consumable", slot: "rightHand" });
  assert.deepEqual(result, { ok: false, reason: "incompatible" });
  assert.equal(s.inventory.potion, 1);
  assert.equal(s.equipment.rightHand, null);
});

test("desequipar devuelve el objeto a inventario y vacía la ranura", () => {
  const s = state();
  s.equipment.armor = { id: "mail", type: "armor", slot: "armor" };
  const result = unequipSlot(s, "armor");
  assert.equal(result.ok, true);
  assert.equal(result.item.id, "mail");
  assert.equal(s.inventory.mail, 1);
  assert.equal(s.equipment.armor, null);
});

test("desequipar una ranura vacía es un no-op seguro", () => {
  const s = state();
  assert.deepEqual(unequipSlot(s, "armor"), { ok: false, reason: "empty" });
});

