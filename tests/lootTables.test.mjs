// SPEC-1225 — mq_03_ecos (Eryndel, "Ecos del Pasado") pedía "ancient_core"
// y su propio diálogo decía "las criaturas que custodian este jardín lo
// portan", pero el ítem solo vivía en la tabla de loot de "ruins" -- un
// bioma sin relación con la misión. El jugador no tenía forma real de
// completarla salvo tropezar con el ítem por accidente en otra zona.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { biomeLoot, enemyLoot, bossLoot } from "../js/lootTables.js";
import { shopInventories } from "../js/items.js";
import { QUEST_DATA } from "../js/quests.js";

function allObtainableItems() {
  const set = new Set();
  for (const list of Object.values(biomeLoot)) for (const d of list) set.add(d.item);
  for (const list of Object.values(enemyLoot)) for (const d of list) set.add(d.item);
  for (const list of Object.values(bossLoot)) for (const d of list) set.add(d.item);
  for (const list of Object.values(shopInventories)) for (const id of list) set.add(id);
  return set;
}

test("ancient_core (mq_03_ecos) es obtenible en el bioma garden, no solo en ruins", () => {
  const gardenItems = biomeLoot.garden.map(d => d.item);
  assert.ok(gardenItems.includes("ancient_core"), "ancient_core debe poder dropear en garden -- ahí es donde Eryndel dice que está");
});

test("toda misión 'collect' pide un ítem obtenible en algún loot de bioma/enemigo/boss o alguna tienda", () => {
  const obtainable = allObtainableItems();
  const missing = Object.values(QUEST_DATA)
    .filter(q => q.type === "collect")
    .filter(q => !obtainable.has(q.item))
    .map(q => `${q.id} -> ${q.item}`);
  assert.deepEqual(missing, [], `ítems de misión sin fuente de loot conocida:\n${missing.join("\n")}`);
});
