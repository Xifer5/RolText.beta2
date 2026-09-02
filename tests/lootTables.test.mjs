// SPEC-1225 — mq_03_ecos (Eryndel, "Ecos del Pasado") pedía "ancient_core"
// y su propio diálogo decía "las criaturas que custodian este jardín lo
// portan", pero el ítem solo vivía en la tabla de loot de "ruins" -- un
// bioma sin relación con la misión. El jugador no tenía forma real de
// completarla salvo tropezar con el ítem por accidente en otra zona.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { biomeLoot, enemyLoot, bossLoot } from "../js/lootTables.js";
import { shopInventories, allItems } from "../js/items.js";
import { QUEST_DATA } from "../js/quests.js";
import { enemyData } from "../js/enemies.js";

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

// SPEC-1226 — enemies.js's `drops` field es dato decorativo NUNCA leído por
// ningún código real (confirmado: ni combatRewards.js ni ningún otro
// archivo lo consulta), pero representa la intención original del autor
// sobre qué debería soltar cada enemigo. Tras autorar los 16 ids que no
// correspondían a ningún ítem (fase 2) y conectar los 12 que sí existían
// pero no estaban en ningún loot (fase 1), TODO lo que `drops` promete
// debe ahora ser: (a) un ítem real, y (b) obtenible en algún sistema real.
test("SPEC-1226: todo item listado en enemies.js `drops` existe en allItems Y es obtenible en algún sistema de loot real", () => {
  const obtainable = allObtainableItems();
  const missingItem = [];
  const missingLoot = [];
  for (const [enemyId, e] of Object.entries(enemyData)) {
    for (const item of e.drops ?? []) {
      if (!allItems[item]) missingItem.push(`${enemyId} -> ${item}`);
      else if (!obtainable.has(item)) missingLoot.push(`${enemyId} -> ${item}`);
    }
  }
  assert.deepEqual(missingItem, [], `ids de 'drops' sin ítem real en allItems:\n${missingItem.join("\n")}`);
  assert.deepEqual(missingLoot, [], `items reales prometidos por 'drops' sin ninguna fuente real:\n${missingLoot.join("\n")}`);
});

// SPEC-1226 — el bug inverso, y más grave: 16 ids en biomeLoot/enemyLoot/
// bossLoot/shopInventories nunca tuvieron un ítem real en allItems (el
// mismo patrón exacto ya visto una vez con fairy_dust, SPEC-1109). Un
// jugador que los recibía quedaba con un ítem sin nombre/ícono/definición
// real en su inventario. Test genérico: TODA entrada de cualquier tabla de
// loot/tienda debe apuntar a un ítem que exista de verdad.
test("SPEC-1226: toda entrada de biomeLoot/enemyLoot/bossLoot/shopInventories apunta a un ítem real en allItems", () => {
  const missing = [];
  const check = (id, src) => { if (!allItems[id]) missing.push(`${src} -> ${id}`); };
  for (const [k, list] of Object.entries(biomeLoot)) for (const d of list) check(d.item, `biomeLoot.${k}`);
  for (const [k, list] of Object.entries(enemyLoot)) for (const d of list) check(d.item, `enemyLoot.${k}`);
  for (const [k, list] of Object.entries(bossLoot)) for (const d of list) check(d.item, `bossLoot.${k}`);
  for (const [k, list] of Object.entries(shopInventories)) for (const id of list) check(id, `shopInventories.${k}`);
  assert.deepEqual(missing, [], `entradas de loot/tienda sin ítem real en allItems:\n${missing.join("\n")}`);
});

test("toda misión 'collect' pide un ítem obtenible en algún loot de bioma/enemigo/boss o alguna tienda", () => {
  const obtainable = allObtainableItems();
  const missing = Object.values(QUEST_DATA)
    .filter(q => q.type === "collect")
    .filter(q => !obtainable.has(q.item))
    .map(q => `${q.id} -> ${q.item}`);
  assert.deepEqual(missing, [], `ítems de misión sin fuente de loot conocida:\n${missing.join("\n")}`);
});
