import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decideNextAction, isIntentHidden, ACTION_META,
  BOSS_HIDE_CHANCE, POWER_ATTACK_MULT, DEFEND_DAMAGE_MULT, REGEN_PCT, ENRAGE_ATK_MULT
} from "../js/enemyAI.js";

// RNG determinista: devuelve valores fijos en secuencia
const rngOf = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };
const base = { hp: 100, maxHp: 100, magicAttack: 0, hasStatusEffect: false };

test("aggressive: 40% golpe fuerte, 60% ataque", () => {
  const e = { ...base, behavior: "aggressive" };
  assert.equal(decideNextAction(e, rngOf(0.39)), "power_attack");
  assert.equal(decideNextAction(e, rngOf(0.41)), "attack");
});

test("defensive: defiende 40% pero nunca dos veces seguidas", () => {
  const e = { ...base, behavior: "defensive" };
  assert.equal(decideNextAction(e, rngOf(0.39)), "defend");
  assert.equal(decideNextAction({ ...e, lastAction: "defend" }, rngOf(0.01)), "attack");
  assert.equal(decideNextAction(e, rngOf(0.5)), "attack");
});

test("berserker: enfurece una vez bajo 50% HP y luego alterna golpes fuertes", () => {
  const e = { ...base, behavior: "berserker", hp: 40 };
  assert.equal(decideNextAction(e, rngOf(0.9)), "enrage");
  assert.equal(decideNextAction({ ...e, enraged: true }, rngOf(0.49)), "power_attack");
  assert.equal(decideNextAction({ ...e, enraged: true }, rngOf(0.51)), "attack");
  // por encima de 50% HP no enfurece
  assert.equal(decideNextAction({ ...base, behavior: "berserker", hp: 60 }, rngOf(0.9)), "attack");
});

test("regenerate: cura bajo 60% HP, nunca dos veces seguidas", () => {
  const e = { ...base, behavior: "regenerate", hp: 50 };
  assert.equal(decideNextAction(e, rngOf(0.49)), "regen");
  assert.equal(decideNextAction({ ...e, lastAction: "regen" }, rngOf(0.01)), "attack");
  assert.equal(decideNextAction({ ...base, behavior: "regenerate", hp: 70 }, rngOf(0.01)), "attack");
});

test("mage: 70% magia solo si tiene magicAttack", () => {
  const e = { ...base, behavior: "mage", magicAttack: 8 };
  assert.equal(decideNextAction(e, rngOf(0.69)), "magic");
  assert.equal(decideNextAction(e, rngOf(0.71)), "attack");
  assert.equal(decideNextAction({ ...base, behavior: "mage" }, rngOf(0.01)), "attack");
});

test("status: 50% efecto de estado solo si lo tiene", () => {
  const e = { ...base, behavior: "status", hasStatusEffect: true };
  assert.equal(decideNextAction(e, rngOf(0.49)), "status");
  assert.equal(decideNextAction(e, rngOf(0.51)), "attack");
  assert.equal(decideNextAction({ ...base, behavior: "status" }, rngOf(0.01)), "attack");
});

test("boss: mezcla 40/25/20/15 con fallbacks", () => {
  const e = { ...base, behavior: "boss", magicAttack: 10 };
  assert.equal(decideNextAction(e, rngOf(0.1)), "attack");
  assert.equal(decideNextAction(e, rngOf(0.5)), "power_attack");
  assert.equal(decideNextAction(e, rngOf(0.7)), "magic");
  assert.equal(decideNextAction({ ...base, behavior: "boss" }, rngOf(0.7)), "power_attack");
  assert.equal(decideNextAction(e, rngOf(0.9)), "defend");
  assert.equal(decideNextAction({ ...e, lastAction: "defend" }, rngOf(0.9)), "attack");
});

test("standard/sin behavior: 30% magia si tiene, si no ataque", () => {
  assert.equal(decideNextAction({ ...base, magicAttack: 5 }, rngOf(0.29)), "magic");
  assert.equal(decideNextAction({ ...base, magicAttack: 5 }, rngOf(0.31)), "attack");
  assert.equal(decideNextAction(base, rngOf(0.01)), "attack");
  assert.equal(decideNextAction(null), "attack");
});

test("enemigo sin behavior pero isBoss usa la mezcla de boss", () => {
  assert.equal(decideNextAction({ ...base, isBoss: true }, rngOf(0.5)), "power_attack");
});

test("isIntentHidden: solo jefes, ~35%", () => {
  assert.equal(isIntentHidden({ isBoss: true }, rngOf(0.34)), true);
  assert.equal(isIntentHidden({ isBoss: true }, rngOf(0.36)), false);
  assert.equal(isIntentHidden({ isBoss: false }, rngOf(0.01)), false);
  assert.equal(isIntentHidden(null, rngOf(0.01)), false);
});

test("toda acción decidible tiene metadata de presentación", () => {
  const decidable = ["attack", "power_attack", "magic", "defend", "regen", "status", "enrage"];
  for (const a of decidable) {
    assert.ok(ACTION_META[a]?.icon, `${a} tiene icono`);
    assert.ok(ACTION_META[a]?.labelKey, `${a} tiene labelKey`);
  }
  assert.ok(ACTION_META.unknown?.icon, "unknown (❓) existe para jefes");
});

test("constantes de balance en rangos conservadores", () => {
  assert.equal(POWER_ATTACK_MULT, 1.5);
  assert.equal(DEFEND_DAMAGE_MULT, 0.5);
  assert.equal(REGEN_PCT, 0.12);
  assert.equal(ENRAGE_ATK_MULT, 1.3);
  assert.equal(BOSS_HIDE_CHANCE, 0.35);
});
