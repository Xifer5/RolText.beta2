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
// archivo lo consulta). Pero representa la intención original del autor
// sobre qué debería soltar cada enemigo. De los ids que ahí aparecen, solo
// nos importan los que corresponden a un ítem REAL en allItems -- el resto
// son ids que nunca se llegaron a autorar (o typos, ej. "saint_grail" vs
// el item real "saint_grial") y no hay nada que "conectar" ahí sin
// inventar contenido nuevo. Test genérico (no hardcodea la lista): todo
// item REAL que aparece en el `drops` de un enemigo debe ser obtenible en
// algún lado -- si mañana se agrega un enemigo nuevo con `drops` sin
// conectar, esto lo atrapa solo.
test("SPEC-1226: todo item REAL (existe en allItems) listado en enemies.js `drops` es obtenible en algún sistema de loot real", () => {
  const obtainable = allObtainableItems();
  const missing = [];
  for (const [enemyId, e] of Object.entries(enemyData)) {
    for (const item of e.drops ?? []) {
      if (allItems[item] && !obtainable.has(item)) missing.push(`${enemyId} -> ${item}`);
    }
  }
  assert.deepEqual(missing, [], `items reales prometidos por 'drops' sin ninguna fuente real:\n${missing.join("\n")}`);
});

test("SPEC-1226: documenta (sin fallar) los ids de 'drops' que no corresponden a ningún ítem real -- candidatos a limpiar o autorar", () => {
  const phantom = new Set();
  for (const e of Object.values(enemyData)) {
    for (const item of e.drops ?? []) {
      if (!allItems[item]) phantom.add(item);
    }
  }
  // Este test documenta el estado conocido -- si la lista cambia (se
  // autora el item o se limpia el 'drops'), actualizar aquí a propósito.
  assert.deepEqual([...phantom].sort(), [
    "big_health_potion", "dagger", "dark_shield", "dark_sword", "desert_armor", "dragon_scale_armor",
    "elixir_potion", "fire_shield", "flame_robe", "healing_staff", "inferno_blade",
    "lava_sword", "light_armor", "magic_lamp", "pyro_staff", "ring_of_wisdom",
    "saint_grail", "war_hammer"
  ].sort());
});

test("toda misión 'collect' pide un ítem obtenible en algún loot de bioma/enemigo/boss o alguna tienda", () => {
  const obtainable = allObtainableItems();
  const missing = Object.values(QUEST_DATA)
    .filter(q => q.type === "collect")
    .filter(q => !obtainable.has(q.item))
    .map(q => `${q.id} -> ${q.item}`);
  assert.deepEqual(missing, [], `ítems de misión sin fuente de loot conocida:\n${missing.join("\n")}`);
});
