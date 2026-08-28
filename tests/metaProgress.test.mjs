// SPEC-1201/1204/1206/1208 — Fragmentos de Eco, New Game+, bonus de Pruebas
// del Eco: meta-progresión persistente en localStorage, fuera del save.
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  readMeta, earnFragments, earnTrialFragments, getLastRunFragments,
  recordVictory, getVictories, LEGACY_PERKS, isPerkUnlocked, unlockPerk, applyLegacyPerk
} from "../js/metaProgress.js";

beforeEach(() => { localStorage.clear(); });

test("readMeta: valores por defecto cuando no hay nada guardado", () => {
  const meta = readMeta();
  assert.equal(meta.fragments, 0);
  assert.deepEqual(meta.unlocked, {});
  assert.equal(meta.victories, 0);
});

test("earnFragments: fórmula de victoria (2 + bossKills*2 + nivel/5 + 5)", () => {
  const amount = earnFragments({ outcome: "victory", bossKills: 2, level: 12 });
  // 2 + 2*2 + floor(12/5)=2 + 5 = 13
  assert.equal(amount, 13);
  assert.equal(readMeta().fragments, 13);
  assert.equal(getLastRunFragments(), 13);
});

test("earnFragments: derrota no suma el bonus de victoria, pero sí suma algo", () => {
  const amount = earnFragments({ outcome: "defeat", bossKills: 0, level: 3 });
  // 2 + 0 + floor(3/5)=0 + 0 = 2
  assert.equal(amount, 2);
  assert.equal(readMeta().fragments, 2);
});

test("earnFragments: acumula entre llamadas sucesivas (partidas distintas)", () => {
  earnFragments({ outcome: "defeat", bossKills: 0, level: 1 });
  earnFragments({ outcome: "victory", bossKills: 0, level: 1 });
  // 2 (derrota) + (2+5)=7 (victoria) = 9
  assert.equal(readMeta().fragments, 9);
});

test("earnTrialFragments: 5 + nivel*2, independiente de earnFragments", () => {
  const amount = earnTrialFragments(3);
  assert.equal(amount, 11);
  assert.equal(readMeta().fragments, 11);
});

test("recordVictory: incrementa el contador de victorias en cada llamada", () => {
  assert.equal(recordVictory(), 1);
  assert.equal(recordVictory(), 2);
  assert.equal(getVictories(), 2);
});

test("recordVictory: persiste entre lecturas de readMeta()", () => {
  recordVictory();
  assert.equal(readMeta().victories, 1);
});

test("LEGACY_PERKS: los 3 perks conocidos existen con costo positivo", () => {
  const ids = LEGACY_PERKS.map(p => p.id);
  assert.ok(ids.includes("legacy_gold"));
  assert.ok(ids.includes("legacy_potion"));
  assert.ok(ids.includes("legacy_rumor"));
  LEGACY_PERKS.forEach(p => assert.ok(p.cost > 0));
});

test("unlockPerk: falla si no hay fragmentos suficientes, y no descuenta nada", () => {
  const ok = unlockPerk("legacy_gold"); // cuesta 15, hay 0
  assert.equal(ok, false);
  assert.equal(isPerkUnlocked("legacy_gold"), false);
  assert.equal(readMeta().fragments, 0);
});

test("unlockPerk: éxito con fragmentos suficientes, descuenta el costo exacto", () => {
  earnFragments({ outcome: "victory", bossKills: 5, level: 1 }); // 2+10+0+5=17
  const ok = unlockPerk("legacy_gold"); // cuesta 15
  assert.equal(ok, true);
  assert.equal(isPerkUnlocked("legacy_gold"), true);
  assert.equal(readMeta().fragments, 2); // 17 - 15
});

test("unlockPerk: NO se puede comprar dos veces el mismo perk", () => {
  earnFragments({ outcome: "victory", bossKills: 20, level: 1 }); // fragmentos de sobra
  assert.equal(unlockPerk("legacy_gold"), true);
  const fragmentsAfterFirst = readMeta().fragments;
  const ok = unlockPerk("legacy_gold"); // ya desbloqueado
  assert.equal(ok, false);
  assert.equal(readMeta().fragments, fragmentsAfterFirst); // no se descontó una segunda vez
});

test("unlockPerk: id inexistente no rompe nada y devuelve false", () => {
  assert.equal(unlockPerk("legacy_inexistente"), false);
});

test("applyLegacyPerk: legacy_gold suma +30 de oro al estado dado", () => {
  const state = { player: { gold: 50 }, inventory: {} };
  applyLegacyPerk(state, "legacy_gold");
  assert.equal(state.player.gold, 80);
});

test("applyLegacyPerk: legacy_potion suma +1 poción de salud", () => {
  const state = { player: { gold: 0 }, inventory: {} };
  applyLegacyPerk(state, "legacy_potion");
  assert.equal(state.inventory.health_potion, 1);
});

test("applyLegacyPerk: legacy_rumor no muta el estado (se maneja en charselect vía rollRumors)", () => {
  const state = { player: { gold: 0 }, inventory: {} };
  applyLegacyPerk(state, "legacy_rumor");
  assert.deepEqual(state.inventory, {});
});
