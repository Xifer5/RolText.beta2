import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

// resetState() reasigna el binding exportado `gameState`; hay que leerlo vía
// namespace para ver siempre el objeto vigente (desestructurar congela la ref)
const state = await import("../js/state.js");
const { resetState } = state;
const { getMasteryTier, getMasteryBonus, addMasteryXP, getMasteryDisplay } = await import("../js/mastery.js");

test("getMasteryTier: límites de tier exactos", () => {
  assert.equal(getMasteryTier(0).title, "Novato");
  assert.equal(getMasteryTier(499).title, "Novato");
  assert.equal(getMasteryTier(500).title, "Adepto");
  assert.equal(getMasteryTier(2000).title, "Experto");
  assert.equal(getMasteryTier(5000).title, "Maestro");
  assert.equal(getMasteryTier(10000).title, "Legendario");
  assert.equal(getMasteryTier(99999).title, "Legendario");
});

test("addMasteryXP acumula y reporta subida de tier", () => {
  resetState();
  assert.equal(getMasteryBonus("slash"), 0);

  assert.equal(addMasteryXP("slash", 100), null);
  assert.equal(state.gameState.weaponMastery.slash.xp, 100);

  const tierUp = addMasteryXP("slash", 400); // 500 → Adepto
  assert.ok(tierUp);
  assert.equal(tierUp.type, "slash");
  assert.equal(tierUp.tier.title, "Adepto");
  assert.equal(getMasteryBonus("slash"), 0.05);
});

test("addMasteryXP sin tipo no rompe ni acumula", () => {
  resetState();
  assert.equal(addMasteryXP(null, 50), null);
  assert.equal(addMasteryXP(undefined), null);
  assert.deepEqual(state.gameState.weaponMastery, {});
});

test("getMasteryDisplay ordena por XP y calcula next tier", () => {
  resetState();
  addMasteryXP("fire", 600);
  addMasteryXP("pierce", 2500);
  const rows = getMasteryDisplay();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].type, "pierce");
  assert.equal(rows[0].tier.title, "Experto");
  assert.equal(rows[0].next.xpReq, 5000);
  assert.equal(rows[1].type, "fire");
  assert.equal(rows[1].tier.title, "Adepto");
});
