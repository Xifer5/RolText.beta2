import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { buildEquipmentView } = await import("../js/equipmentView.js");

test("presenta identidad, avatar, recursos y ocho ranuras", () => {
  const player = {
    name: "Eira", class: "warrior", className: "Guerrera", classEmoji: "⚔️",
    level: 7, hp: 70, mp: 12, strength: 10, agility: 8, intelligence: 6
  };
  const equipment = { rightHand: { id: "sword", attack: 5, name: "Espada" } };
  const view = buildEquipmentView(player, equipment);
  assert.equal(view.name, "Eira");
  assert.equal(view.role, "Nivel 7 · Guerrera");
  assert.equal(view.avatar, "img/avatar_warrior.webp");
  assert.equal(view.slots.length, 8);
  assert.equal(view.slots.find(slot => slot.slot === "rightHand").item.id, "sword");
  assert.equal(view.stats.attack, 15);
  assert.ok(view.hpPercent >= 0 && view.hpPercent <= 100);
});

test("usa fallback para una clase sin avatar y limita recursos al máximo", () => {
  const view = buildEquipmentView({
    class: "bard", classEmoji: "🎵", hp: 999, mp: -5,
    strength: 1, agility: 1, intelligence: 1
  }, {});
  assert.equal(view.avatar, null);
  assert.equal(view.fallback, "🎵");
  assert.equal(view.hp, view.maxHp);
  assert.equal(view.mp, 0);
  assert.equal(view.mpPercent, 0);
});

