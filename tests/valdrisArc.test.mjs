// SPEC-1219 — Valdris, antagonista real (Fase 1 del plan docs/PLAN-HISTORIA-FASE4.md)
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { maybeStartValdrisEncounter, startValdrisCombatIfPending } from "../js/valdrisArc.js";
import { enemyData } from "../js/enemies.js";
import { ENEMY_COMBAT_DATA } from "../js/damageTypes.js";

beforeEach(() => resetState());

test("valdris_corrupted existe en enemyData y en ENEMY_COMBAT_DATA", () => {
  assert.ok(enemyData.valdris_corrupted);
  assert.equal(enemyData.valdris_corrupted.isBoss, true);
  assert.ok(ENEMY_COMBAT_DATA.valdris_corrupted);
});

test("maybeStartValdrisEncounter solo dispara en inferno_1", () => {
  assert.equal(maybeStartValdrisEncounter("town"), false);
  assert.equal(maybeStartValdrisEncounter("volcano_7"), false);
  assert.equal(maybeStartValdrisEncounter("inferno_1"), true);
});

test("maybeStartValdrisEncounter no se gatea por _seen: sigue disparando si no fue derrotado (permite reintentar tras huir/perder)", () => {
  assert.equal(maybeStartValdrisEncounter("inferno_1"), true);
  assert.equal(maybeStartValdrisEncounter("inferno_1"), true, "sin worldFlags.valdris_defeated, debe poder reintentarse");
});

test("maybeStartValdrisEncounter deja de disparar una vez derrotado", () => {
  gameState.worldFlags.valdris_defeated = true;
  assert.equal(maybeStartValdrisEncounter("inferno_1"), false);
});

test("startValdrisCombatIfPending solo dispara si la elección lo marcó pendiente", () => {
  assert.equal(startValdrisCombatIfPending(), false);
  gameState.worldFlags.valdris_combat_pending = true;
  assert.equal(startValdrisCombatIfPending(), true);
  assert.equal(gameState.worldFlags.valdris_combat_pending, false, "se consume, no queda pendiente para siempre");
  assert.equal(startValdrisCombatIfPending(), false, "no debe repetirse");
});
