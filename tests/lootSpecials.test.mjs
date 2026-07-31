// SPEC-1106 — loot que cambia cómo juegas, no solo números (roadmap ítem #6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { allItems } from "../js/items.js";
import { MORAL_DECISIONS } from "../js/endings.js";

test("SPEC-1106: los 5 ítems nuevos existen con su campo `special` y datos complementarios", () => {
  const ring = allItems.ring_last_breath;
  assert.equal(ring.slot, "ring");
  assert.equal(ring.special, "lastBreath");

  const cloak = allItems.cloak_of_mist;
  assert.equal(cloak.slot, "armor");
  assert.equal(cloak.special, "mistEvasion");
  assert.equal(cloak.mistEvasionBonus, 0.50);

  const sword = allItems.ravenous_sword;
  assert.equal(sword.slot, "rightHand");
  assert.equal(sword.special, "healOnKill");
  assert.equal(sword.healOnKillPct, 0.20);
  assert.ok(sword.defense < 0, "la Espada Voraz debe tener una penalización real de defensa");

  const amulet = allItems.echo_amulet;
  assert.equal(amulet.slot, "accessory");
  assert.equal(amulet.special, "compassionReward");
  assert.equal(amulet.compassionRewardBonus, 0.20);

  const book = allItems.burnt_book;
  assert.equal(book.slot, "rightHand");
  assert.equal(book.special, "burntBook");
  assert.equal(book.fireDmgBonus, 0.25);
  assert.ok(book.mpCostMult > 1, "el Libro Quemado debe costar MÁS maná, no menos");
});

test("SPEC-1106: los 5 ítems nuevos aparecen en al menos una tabla de loot", async () => {
  const { biomeLoot } = await import("../js/lootTables.js");
  const allIds = Object.values(biomeLoot).flat().map(e => e.item);
  for (const id of ["ring_last_breath", "cloak_of_mist", "ravenous_sword", "echo_amulet", "burnt_book"]) {
    assert.ok(allIds.includes(id), `${id} no está en ninguna tabla de loot por bioma`);
  }
});

test("SPEC-1106: el Amuleto del Eco reutiliza los flags \"luz\" (peso positivo) de MORAL_DECISIONS", () => {
  const lightFlags = MORAL_DECISIONS.filter(d => d.weight > 0).map(d => d.flag);
  // SPEC-1107 agregó "wounded_enemy_spared" — el amuleto lo hereda gratis
  // porque recorre TODA la tabla; este test solo exige que los 4 flags
  // originales sigan presentes, sin fijar la lista completa (evita que este
  // test rompa cada vez que una spec futura sume un flag "luz" más).
  for (const flag of ["echo_freed", "purse_left", "shrine_prayed", "traveler_helped"]) {
    assert.ok(lightFlags.includes(flag), `${flag} debería seguir siendo un flag "luz"`);
  }
});
