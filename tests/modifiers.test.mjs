// SPEC-1004 — modificadores de partida
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as state from "../js/state.js";
import {
  MODIFIERS, activeModifiers, isActive, modifierXpMult, cruelAtkMult,
  scarceGoldMult, isIntentAlwaysHidden, areMapsHidden, buyPriceOf,
  filterLoot, applyRest, CRUEL_REST_COST, MERCHANT_DISCOUNT_MULT
} from "../js/modifiers.js";
import { buildRunRecord } from "../js/runLog.js";

beforeEach(() => { state.resetState(); localStorage.clear(); });

test("MODIFIERS: 3 modificadores bilingües con id/emoji coherentes", () => {
  const ids = Object.keys(MODIFIERS);
  assert.deepEqual(ids, ["fog", "cruel", "scarce"]);
  for (const [key, m] of Object.entries(MODIFIERS)) {
    assert.equal(m.id, key);
    assert.ok(m.emoji && m.color);
    assert.ok(m.name.en && m.name.es, `name bilingüe en ${key}`);
    assert.ok(m.description.en && m.description.es, `description bilingüe en ${key}`);
  }
});

test("activeModifiers: ignora ids desconocidos y saves sin el campo", () => {
  assert.deepEqual(activeModifiers({}), []);
  assert.deepEqual(activeModifiers({ modifiers: null }), []);
  assert.deepEqual(activeModifiers({ modifiers: ["fog", "inventado", "cruel"] }), ["fog", "cruel"]);
  assert.ok(isActive({ modifiers: ["fog"] }, "fog"));
  assert.ok(!isActive({ modifiers: ["fog"] }, "cruel"));
});

test("modifierXpMult: 0→1.0, 1→1.1, 3→1.3", () => {
  assert.equal(modifierXpMult({ modifiers: [] }), 1);
  assert.equal(modifierXpMult({ modifiers: ["fog"] }), 1.1);
  assert.ok(Math.abs(modifierXpMult({ modifiers: ["fog", "cruel", "scarce"] }) - 1.3) < 1e-9);
});

test("multiplicadores por eje: cruel ATK, scarce oro, fog visión", () => {
  const all = { modifiers: ["fog", "cruel", "scarce"] };
  const none = { modifiers: [] };
  assert.equal(cruelAtkMult(all), 1.15);
  assert.equal(cruelAtkMult(none), 1);
  assert.equal(scarceGoldMult(all), 0.5);
  assert.equal(scarceGoldMult(none), 1);
  assert.ok(isIntentAlwaysHidden(all) && areMapsHidden(all));
  assert.ok(!isIntentAlwaysHidden(none) && !areMapsHidden(none));
});

test("applyRest sin cruel: cura todo, gratis", () => {
  const st = { player: { hp: 10, maxHp: 100, mp: 3, maxMp: 40, gold: 50 }, modifiers: [] };
  const r = applyRest(st);
  assert.deepEqual(r, { hpGain: 90, mpGain: 37, goldCost: 0, cruel: false });
  assert.equal(st.player.hp, 100);
  assert.equal(st.player.mp, 40);
  assert.equal(st.player.gold, 50);
});

test("applyRest con cruel: 50% de lo faltante y cobra 10 de oro", () => {
  const st = { player: { hp: 10, maxHp: 100, mp: 0, maxMp: 41, gold: 50 }, modifiers: ["cruel"] };
  const r = applyRest(st);
  assert.equal(r.hpGain, 45);          // floor(90 × 0.5)
  assert.equal(r.mpGain, 20);          // floor(41 × 0.5)
  assert.equal(r.goldCost, CRUEL_REST_COST);
  assert.equal(st.player.hp, 55);
  assert.equal(st.player.gold, 40);
});

test("applyRest con cruel y sin oro suficiente: paga lo que tiene, nunca bloquea", () => {
  const st = { player: { hp: 10, maxHp: 100, mp: 40, maxMp: 40, gold: 4 }, modifiers: ["cruel"] };
  const r = applyRest(st);
  assert.equal(r.goldCost, 4);
  assert.equal(st.player.gold, 0);
  assert.equal(st.player.hp, 55);
});

test("filterLoot: sin scarce no filtra; con scarce el RNG decide por ítem", () => {
  const loot = ["a", "b", "c"];
  assert.deepEqual(filterLoot(loot, { modifiers: [] }), loot);
  const seq = [0.2, 0.9, 0.4];         // conserva, pierde, conserva
  const rng = () => seq.shift();
  assert.deepEqual(filterLoot(loot, { modifiers: ["scarce"] }, rng), ["a", "c"]);
  assert.deepEqual(filterLoot(null, { modifiers: [] }), []);
});

test("buyPriceOf: ×1.25 con redondeo arriba solo bajo scarce", () => {
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: ["scarce"] }), 125);
  assert.equal(buyPriceOf({ price: 10 }, { modifiers: ["scarce"] }), 13);
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: [] }), 100);
  assert.equal(buyPriceOf({}, { modifiers: ["scarce"] }), 0);
});

test("SPEC-1104: buyPriceOf aplica el descuento del viajero ayudado (10%)", () => {
  assert.equal(MERCHANT_DISCOUNT_MULT, 0.90);
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: [], worldFlags: { traveler_helped: true } }), 90);
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: [], worldFlags: {} }), 100);
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: [] }), 100); // sin worldFlags del todo
});

test("SPEC-1104: descuento y botín escaso se componen (1.25 × 0.90 = 1.125)", () => {
  assert.equal(buyPriceOf({ price: 100 }, { modifiers: ["scarce"], worldFlags: { traveler_helped: true } }), 113);
});

test("save viejo sin modifiers: resetState lo trae y las lecturas no rompen", () => {
  assert.ok(Array.isArray(state.gameState.modifiers));
  delete state.gameState.modifiers;    // simula un save pre-1004 ya cargado
  assert.deepEqual(activeModifiers(state.gameState), []);
  assert.equal(modifierXpMult(state.gameState), 1);
});

test("crónica: buildRunRecord registra los modificadores de la run", () => {
  state.gameState.modifiers = ["fog", "scarce"];
  const r = buildRunRecord(state.gameState, "victory");
  assert.deepEqual(r.modifiers, ["fog", "scarce"]);
  const old = buildRunRecord({ ...state.gameState, modifiers: undefined }, "defeat");
  assert.deepEqual(old.modifiers, []);
});
