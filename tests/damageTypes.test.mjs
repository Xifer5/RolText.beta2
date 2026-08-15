import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyResistance, getWeaponDamageType, getResistanceLabel,
  ENEMY_COMBAT_DATA, WEAPON_DAMAGE_TYPES, PHYSICAL_TYPES, DAMAGE_TYPES,
  getEffectiveResistances
} from "../js/damageTypes.js";
import { gameState } from "../js/state.js";

// SPEC-0701: fire/dark/holy/etc. tienen multiplicador de daño por hora del
// día — estos tests de resistencia "pura" usan tipos sin entrada en esa
// tabla (slash/pierce/ice/water) para no depender de gameState.timeOfDay.

test("applyResistance reduce con resistencia positiva", () => {
  assert.equal(applyResistance(100, "slash", { slash: 30 }), 70);
  assert.equal(applyResistance(10, "pierce", { pierce: 50 }), 5);
});

test("applyResistance amplifica con resistencia negativa (vulnerabilidad)", () => {
  assert.equal(applyResistance(100, "pierce", { pierce: -30 }), 130);
});

test("applyResistance nunca baja de 1 (inmunidad 100 → 1)", () => {
  assert.equal(applyResistance(50, "water", { water: 100 }), 1);
  assert.equal(applyResistance(1, "slash", { slash: 99 }), 1);
});

test("applyResistance ignora tipos sin entrada o argumentos ausentes", () => {
  assert.equal(applyResistance(42, "ice", { fire: 50 }), 42);
  assert.equal(applyResistance(42, null, { fire: 50 }), 42);
  assert.equal(applyResistance(42, "pierce", null), 42);
});

test("SPEC-0701: applyResistance aplica el multiplicador de daño por hora", () => {
  const original = gameState.timeOfDay;
  try {
    gameState.timeOfDay = "day";
    assert.equal(applyResistance(100, "fire", {}), 110);   // día: fuego +10%
    assert.equal(applyResistance(100, "dark", {}), 80);    // día: oscuridad -20%
    gameState.timeOfDay = "night";
    assert.equal(applyResistance(100, "dark", {}), 130);   // noche: oscuridad +30%
    assert.equal(applyResistance(100, "fire", {}), 90);    // noche: fuego -10%
    assert.equal(applyResistance(100, "slash", {}), 100);  // sin entrada en la tabla → sin cambio
  } finally {
    gameState.timeOfDay = original;
  }
});

test("getWeaponDamageType: sin arma → slash; damageType propio gana a la tabla", () => {
  assert.equal(getWeaponDamageType(null), "slash");
  assert.equal(getWeaponDamageType(undefined), "slash");
  assert.equal(getWeaponDamageType({ id: "x", damageType: "fire" }), "fire");
  assert.equal(getWeaponDamageType({ id: "desconocida" }), "slash");
});

test("getWeaponDamageType resuelve por id en WEAPON_DAMAGE_TYPES", () => {
  const [id, type] = Object.entries(WEAPON_DAMAGE_TYPES)[0];
  assert.equal(getWeaponDamageType({ id }), type);
});

test("getResistanceLabel", () => {
  assert.equal(getResistanceLabel(100), "Inmune");
  assert.equal(getResistanceLabel(30), "Res. 30%");
  assert.equal(getResistanceLabel(-20), "Vuln. 20%");
  assert.equal(getResistanceLabel(0), null);
});

test("ENEMY_COMBAT_DATA: attackDamageType siempre es un tipo conocido", () => {
  for (const [id, data] of Object.entries(ENEMY_COMBAT_DATA)) {
    assert.ok(DAMAGE_TYPES[data.attackDamageType], `${id}: ${data.attackDamageType}`);
    if (data.magicDamageType) {
      assert.ok(DAMAGE_TYPES[data.magicDamageType], `${id}: ${data.magicDamageType}`);
    }
    for (const type of Object.keys(data.resistances || {})) {
      assert.ok(DAMAGE_TYPES[type], `${id} resiste tipo desconocido: ${type}`);
    }
  }
});

test("SPEC-1103: getEffectiveResistances sin rasgo devuelve la base tal cual", () => {
  assert.deepEqual(getEffectiveResistances({ id: "wolf" }), ENEMY_COMBAT_DATA.wolf.resistances);
  assert.equal(getEffectiveResistances({ id: "no_existe" }), undefined);
});

test("SPEC-1103: getEffectiveResistances suma el bono del rasgo Antiguo sin mutar ENEMY_COMBAT_DATA", () => {
  const before = JSON.stringify(ENEMY_COMBAT_DATA.wolf.resistances);
  const res = getEffectiveResistances({ id: "wolf", traitResistances: { physical: 30, light: -30 } });
  assert.equal(res.physical, 30);
  assert.equal(res.light, -30);
  assert.equal(res.fire, ENEMY_COMBAT_DATA.wolf.resistances.fire); // conserva la base
  assert.equal(JSON.stringify(ENEMY_COMBAT_DATA.wolf.resistances), before); // no mutó el objeto compartido
});

test("SPEC-1103: getEffectiveResistances suma sobre una resistencia ya existente", () => {
  // giant_spider ya tiene physical:20 en su base
  const res = getEffectiveResistances({ id: "giant_spider", traitResistances: { physical: 30 } });
  assert.equal(res.physical, 50);
});

test("PHYSICAL_TYPES contiene los tipos físicos base", () => {
  for (const t of ["slash", "pierce", "blunt", "physical"]) {
    assert.ok(PHYSICAL_TYPES.has(t));
  }
  assert.ok(!PHYSICAL_TYPES.has("fire"));
});
