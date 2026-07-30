import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

// Ver nota en mastery.test.mjs: gameState se reasigna en resetState(), leer vía namespace
const state = await import("../js/state.js");
const { resetState } = state;
const {
  SPECIALIZATIONS, getClassSpecializations, canSpecialize, chooseSpecialization, getActiveSpec,
  migrateUnknownSpecialization
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
  assert.equal(canSpecialize({ level: 15, specialization: "tank" }), false);
  assert.equal(canSpecialize({}), false);
});

test("chooseSpecialization valida clase, nivel y unicidad", () => {
  resetState();
  state.gameState.player.class = "warrior";
  state.gameState.player.level = 10;

  assert.equal(chooseSpecialization("elementalist"), null, "spec de otra clase");
  assert.equal(chooseSpecialization("no_existe"), null);

  const spec = chooseSpecialization("tank");
  assert.equal(spec.id, "tank");
  assert.equal(state.gameState.player.specialization, "tank");
  assert.equal(getActiveSpec().name, spec.name);

  assert.equal(chooseSpecialization("berserker"), null, "la elección es permanente");
  assert.equal(state.gameState.player.specialization, "tank");
});

test("chooseSpecialization rechaza por nivel insuficiente", () => {
  resetState();
  state.gameState.player.class = "rogue";
  state.gameState.player.level = 9;
  assert.equal(chooseSpecialization("assassin"), null);
  assert.equal(getActiveSpec(), null);
});

test("SPEC-1105: las 9 especializaciones son las nombradas por el usuario, una por clase", () => {
  const byClass = {
    warrior: ["tank", "berserker", "holy_knight"],
    mage: ["elementalist", "necromancer", "chronomancer"],
    rogue: ["assassin", "trapper", "duelist"]
  };
  for (const [cls, ids] of Object.entries(byClass)) {
    const actual = getClassSpecializations(cls).map(s => s.id).sort();
    assert.deepEqual(actual, [...ids].sort(), cls);
  }
});

test("los bonos de cada spec usan campos conocidos", () => {
  const known = new Set([
    "dmgType", "dmgBonus", "physicalDefenseBonus", "mpDiscount", "extraFrozenTurn",
    "critBonus", "poisonOnAttack", "evasionBonus", "counterattack",
    "maxHpBonus", "counterattackOnHit", "dmgBonusAll", "enrageThreshold", "enrageDmgMult",
    "physicalDefensePenalty", "healOnKill", "debuffResistPct", "lifeStealOnMagic",
    "curseOnMagicCrit", "extraTurnChance", "enemyStunOnHitChance", "executeBonus",
    "bleedOnAttack", "enemyDefenseShred", "counterDmgBonus"
  ]);
  for (const spec of Object.values(SPECIALIZATIONS)) {
    for (const key of Object.keys(spec.bonuses)) {
      assert.ok(known.has(key), `${spec.id}: bono desconocido ${key}`);
    }
  }
});

test("SPEC-1105: migrateUnknownSpecialization resetea ids que ya no existen", () => {
  const player = { specialization: "sword_master" };
  assert.equal(migrateUnknownSpecialization(player), true);
  assert.equal(player.specialization, null);
});

test("SPEC-1105: migrateUnknownSpecialization no toca ids válidos ni null", () => {
  const withValid = { specialization: "tank" };
  assert.equal(migrateUnknownSpecialization(withValid), false);
  assert.equal(withValid.specialization, "tank");

  const withNull = { specialization: null };
  assert.equal(migrateUnknownSpecialization(withNull), false);

  assert.equal(migrateUnknownSpecialization(null), false);
  assert.equal(migrateUnknownSpecialization({}), false);
});
