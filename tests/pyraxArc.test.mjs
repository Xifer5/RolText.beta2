// SPEC-1219 (Fase 3) — Pyrax, la prueba de las tres llaves
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { maybeStartPyraxTrial, advancePyraxTrialIfPending } from "../js/pyraxArc.js";

beforeEach(() => resetState());

test("maybeStartPyraxTrial no dispara sin mq_04_la_verdad completada", () => {
  assert.equal(maybeStartPyraxTrial("volcano_4"), false);
  gameState.quests = { mq_04_la_verdad: "active" };
  assert.equal(maybeStartPyraxTrial("volcano_4"), false);
});

test("maybeStartPyraxTrial no dispara fuera de volcano_4", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  assert.equal(maybeStartPyraxTrial("volcano_3"), false);
});

test("maybeStartPyraxTrial dispara el primer paso una vez completada mq_04", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  assert.equal(maybeStartPyraxTrial("volcano_4"), true);
});

test("maybeStartPyraxTrial es resumible: retoma el paso donde quedó, no reinicia ni se atasca", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  gameState.worldFlags.pyrax_trial_step = 2;
  assert.equal(maybeStartPyraxTrial("volcano_4"), true, "debe retomar en el paso 2, no negarse a disparar");
  gameState.worldFlags.pyrax_trial_step = 3;
  assert.equal(maybeStartPyraxTrial("volcano_4"), true, "debe retomar en el paso 3");
});

test("maybeStartPyraxTrial deja de disparar una vez resuelto", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  gameState.worldFlags.pyrax_trial_resolved = true;
  assert.equal(maybeStartPyraxTrial("volcano_4"), false);
});

test("advancePyraxTrialIfPending encadena el paso siguiente según el flag, y no hace nada sin flag", () => {
  assert.equal(advancePyraxTrialIfPending(), false);
  gameState.worldFlags.pyrax_trial_step = 2;
  assert.equal(advancePyraxTrialIfPending(), true);
  gameState.worldFlags.pyrax_trial_step = 3;
  assert.equal(advancePyraxTrialIfPending(), true);
});
