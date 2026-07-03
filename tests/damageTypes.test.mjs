import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyResistance, getWeaponDamageType, getResistanceLabel,
  ENEMY_COMBAT_DATA, WEAPON_DAMAGE_TYPES, PHYSICAL_TYPES, DAMAGE_TYPES
} from "../js/damageTypes.js";

test("applyResistance reduce con resistencia positiva", () => {
  assert.equal(applyResistance(100, "slash", { slash: 30 }), 70);
  assert.equal(applyResistance(10, "fire", { fire: 50 }), 5);
});

test("applyResistance amplifica con resistencia negativa (vulnerabilidad)", () => {
  assert.equal(applyResistance(100, "fire", { fire: -30 }), 130);
});

test("applyResistance nunca baja de 1 (inmunidad 100 → 1)", () => {
  assert.equal(applyResistance(50, "water", { water: 100 }), 1);
  assert.equal(applyResistance(1, "slash", { slash: 99 }), 1);
});

test("applyResistance ignora tipos sin entrada o argumentos ausentes", () => {
  assert.equal(applyResistance(42, "ice", { fire: 50 }), 42);
  assert.equal(applyResistance(42, null, { fire: 50 }), 42);
  assert.equal(applyResistance(42, "fire", null), 42);
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

test("PHYSICAL_TYPES contiene los tipos físicos base", () => {
  for (const t of ["slash", "pierce", "blunt", "physical"]) {
    assert.ok(PHYSICAL_TYPES.has(t));
  }
  assert.ok(!PHYSICAL_TYPES.has("fire"));
});
