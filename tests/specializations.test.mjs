import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

// Ver nota en mastery.test.mjs: gameState se reasigna en resetState(), leer vía namespace
const state = await import("../js/state.js");
const { resetState } = state;
const {
  SPECIALIZATIONS, getClassSpecializations, canSpecialize, chooseSpecialization, getActiveSpec
} = await import("../js/specializations.js");

test("cada clase tiene exactamente 3 especializaciones", () => {
  for (const cls of ["warrior", "mage", "rogue"]) {
    assert.equal(getClassSpecializations(cls).length, 3, cls);
  }
  assert.equal(Object.keys(SPECIALIZATIONS).length, 9);
});

test("canSpecialize exige nivel 10 y no tener spec previa", () => {
  assert.equal(canSpecialize({ level: 9, specialization: null }), false);
  assert.equal(canSpecialize({ level: 10, specialization: null }), true);
  assert.equal(canSpecialize({ level: 15, specialization: "sword_master" }), false);
  assert.equal(canSpecialize({}), false);
});

test("chooseSpecialization valida clase, nivel y unicidad", () => {
  resetState();
  state.gameState.player.class = "warrior";
  state.gameState.player.level = 10;

  assert.equal(chooseSpecialization("fire_school"), null, "spec de otra clase");
  assert.equal(chooseSpecialization("no_existe"), null);

  const spec = chooseSpecialization("sword_master");
  assert.equal(spec.id, "sword_master");
  assert.equal(state.gameState.player.specialization, "sword_master");
  assert.equal(getActiveSpec().name, spec.name);

  assert.equal(chooseSpecialization("mace_master"), null, "la elección es permanente");
  assert.equal(state.gameState.player.specialization, "sword_master");
});

test("chooseSpecialization rechaza por nivel insuficiente", () => {
  resetState();
  state.gameState.player.class = "rogue";
  state.gameState.player.level = 9;
  assert.equal(chooseSpecialization("assassin"), null);
  assert.equal(getActiveSpec(), null);
});

test("los bonos de cada spec usan campos conocidos", () => {
  const known = new Set([
    "dmgType", "dmgBonus", "physicalDefenseBonus", "mpDiscount", "extraFrozenTurn",
    "critBonus", "poisonOnAttack", "evasionBonus", "counterattack", "goldBonus", "fleeBonus"
  ]);
  for (const spec of Object.values(SPECIALIZATIONS)) {
    for (const key of Object.keys(spec.bonuses)) {
      assert.ok(known.has(key), `${spec.id}: bono desconocido ${key}`);
    }
  }
});
