// SPEC-1241 — mountain_emblem_upgraded/arcane_emblem_upgraded/
// tundra_emblem_upgraded tenían `result.id` copiado mal: apuntaba al
// emblema BASE, el mismo que la receta pedía como ingrediente. Forjarlas
// gastaba materiales raros (colossus_heart, construct_eye+runestone,
// glacial_core+ancient_relic) y no daba ningún ítem nuevo a cambio -- un
// sumidero de recursos silencioso. Test genérico (mismo espíritu que
// SPEC-1225/1226 en lootTables.test.mjs): toda receta debe craftear un
// ítem real y distinto de sus propios ingredientes.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { craftingRecipes } from "../js/craftingRecipes.js";
import { allItems } from "../js/items.js";

function allRecipes() {
  const out = [];
  for (const [tab, recipes] of Object.entries(craftingRecipes)) {
    for (const [key, recipe] of Object.entries(recipes)) out.push({ tab, key, recipe });
  }
  return out;
}

test("toda receta de forja produce un ítem real que existe en allItems", () => {
  for (const { tab, key, recipe } of allRecipes()) {
    assert.ok(allItems[recipe.result.id], `${tab}.${key}: result.id="${recipe.result.id}" no existe en allItems`);
  }
});

test("result.id coincide con la clave de la receta (evita el bug de SPEC-1241: copiar el id del emblema base en vez del +)", () => {
  for (const { tab, key, recipe } of allRecipes()) {
    assert.equal(recipe.result.id, key, `${tab}.${key}: result.id="${recipe.result.id}" debería ser "${key}"`);
  }
});

test("ningún ingrediente de una receta es también su propio resultado (craftear no puede consumir el ítem que produce)", () => {
  for (const { tab, key, recipe } of allRecipes()) {
    assert.ok(
      !(recipe.result.id in recipe.ingredients),
      `${tab}.${key}: pide "${recipe.result.id}" como ingrediente para producir "${recipe.result.id}" -- neto cero, gasta el resto de los materiales para nada`
    );
  }
});

test("todo ingrediente de toda receta existe en allItems", () => {
  for (const { tab, key, recipe } of allRecipes()) {
    for (const ingredientId of Object.keys(recipe.ingredients)) {
      assert.ok(allItems[ingredientId], `${tab}.${key}: ingrediente "${ingredientId}" no existe en allItems`);
    }
  }
});

test("todo nombre de receta es {en, es} localizable, no un string plano en un solo idioma", () => {
  for (const { tab, key, recipe } of allRecipes()) {
    assert.equal(typeof recipe.name, "object", `${tab}.${key}: name debería ser {en, es}, no un string plano`);
    assert.ok(recipe.name.en, `${tab}.${key}: falta name.en`);
    assert.ok(recipe.name.es, `${tab}.${key}: falta name.es`);
  }
});
