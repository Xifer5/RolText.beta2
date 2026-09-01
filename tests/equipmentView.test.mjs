import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { buildEquipmentView, equipmentStageHTML } = await import("../js/equipmentView.js");

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

// SPEC-1220 — componente compartido entre Inventario y el panel "Equipo"
// del menú: MISMAS clases/estructura sin importar el caller, para que
// ambas superficies se vean idénticas (styles-m3.css ya no las scopea a
// #inventoryModal).
test("equipmentStageHTML: usa las clases compartidas con #inventoryModal (sin ids nuevos)", () => {
  const view = buildEquipmentView({ name: "Kael", class: "warrior", className: "Guerrero", level: 3, hp: 50, mp: 10, strength: 10, agility: 8, intelligence: 6 }, {});
  const html = equipmentStageHTML(view);
  for (const cls of ["equipment-banner-title", "equipment-stage", "equipment-character", "equipment-avatar-frame", "equipment-slots-list", "equip-slot-art", "equip-slot-label", "equip-val", "equipment-vitals", "equipment-vital", "equipment-stat-strip"]) {
    assert.ok(html.includes(cls), `falta la clase compartida "${cls}"`);
  }
  assert.ok(html.includes("Kael"));
});

test("equipmentStageHTML: marca 'is-equipped' solo en los slots con item", () => {
  const view = buildEquipmentView({ class: "warrior" }, { rightHand: { id: "sword", name: { es: "Espada" }, icon: "⚔️" } });
  const html = equipmentStageHTML(view);
  const rightHandLi = html.match(/<li data-slot="rightHand"[^>]*>/)[0];
  const headLi = html.match(/<li data-slot="head"[^>]*>/)[0];
  assert.ok(rightHandLi.includes("is-equipped"));
  assert.ok(!headLi.includes("is-equipped"));
});

test("equipmentStageHTML: interactive=true agrega role=button/tabindex a cada slot, false no", () => {
  const view = buildEquipmentView({ class: "warrior" }, {});
  const passive = equipmentStageHTML(view);
  const active = equipmentStageHTML(view, { interactive: true });
  assert.ok(!passive.includes('role="button"'));
  assert.ok(active.includes('role="button"'));
  assert.ok(active.includes('tabindex="0"'));
});

