// SPEC-0902 — mini-aventura "El eco del bosque": flags, cadena de escena y recompensa de build
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import {
  ECHO_MORAL_EVENT, ECHO_REWARD_EVENT,
  maybeStartEchoIntro, startEchoCombatIfPending, consumeEchoReward
} from "../js/echoIntro.js";
import { eligibleEvents } from "../js/travelEvents.js";

const flags = () => gameState.worldFlags;
const ids = pool => pool.map(e => e.id);

beforeEach(() => resetState());

test("la escena solo dispara en forest_1 y solo una vez", () => {
  assert.equal(maybeStartEchoIntro("town"), false);
  assert.equal(maybeStartEchoIntro("forest_2"), false);
  assert.equal(maybeStartEchoIntro("forest_1"), true);
  gameState.worldFlags.echo_intro_done = true;
  assert.equal(maybeStartEchoIntro("forest_1"), false);
});

test("liberar al eco: flags de decisión + combate pendiente, sin XP inmediata", () => {
  const xp = gameState.player.experience;
  ECHO_MORAL_EVENT.choices[0].apply();
  assert.equal(flags().echo_freed, true);
  assert.equal(flags().echo_intro_done, true);
  assert.equal(flags().echo_combat_pending, true);
  assert.equal(gameState.player.experience, xp);
});

test("absorber al eco: poder ahora (+30 XP) y mismos flags de escena", () => {
  const xp = gameState.player.experience;
  ECHO_MORAL_EVENT.choices[1].apply();
  assert.equal(flags().echo_absorbed, true);
  assert.equal(flags().echo_combat_pending, true);
  assert.equal(gameState.player.experience, xp + 30);
});

test("cadena: cierre del modal arma el combate y deja la recompensa pendiente", () => {
  ECHO_MORAL_EVENT.choices[0].apply();
  assert.equal(startEchoCombatIfPending(), true);
  assert.equal(flags().echo_combat_pending, false);
  assert.equal(flags().echo_reward_pending, true);
  // sin nada pendiente no re-dispara
  assert.equal(startEchoCombatIfPending(), false);
});

test("victoria: consumeEchoReward programa la recompensa una sola vez", () => {
  gameState.worldFlags = { echo_reward_pending: true };
  assert.equal(consumeEchoReward(), true);
  assert.equal(flags().echo_reward_pending, false);
  assert.equal(consumeEchoReward(), false);
});

test("recompensa: cada forma concede su ítem de build", () => {
  const expected = ["iron_sword", "staff", "ring_agility"];
  ECHO_REWARD_EVENT.choices.forEach((choice, i) => {
    resetState();
    choice.apply();
    assert.equal(gameState.inventory[expected[i]], 1, expected[i]);
    assert.equal(flags().echo_reward_taken, expected[i]);
  });
});

test("consecuencia persistente: liberar → 'El bosque recuerda' con prioridad", () => {
  gameState.worldFlags = { echo_freed: true };
  assert.deepEqual(ids(eligibleEvents("forest")), ["echo_grateful"]);
  const ev = eligibleEvents("forest")[0];
  ev.choices[0].apply();
  assert.equal(flags().echo_resolved, true);
  assert.equal(gameState.inventory.health_potion, 1);
  assert.ok(!ids(eligibleEvents("forest")).includes("echo_grateful"));
});

test("consecuencia persistente: absorber → 'Un silencio en el bosque', resuelve una vez", () => {
  gameState.worldFlags = { echo_absorbed: true };
  assert.deepEqual(ids(eligibleEvents(null)), ["echo_silence"]);
  eligibleEvents(null)[0].choices[1].apply();
  assert.ok(!ids(eligibleEvents(null)).includes("echo_silence"));
});

test("los flags de la escena sobreviven al roundtrip de save", () => {
  ECHO_MORAL_EVENT.choices[0].apply();
  startEchoCombatIfPending();
  const loaded = JSON.parse(JSON.stringify(gameState));
  assert.equal(loaded.worldFlags.echo_freed, true);
  assert.equal(loaded.worldFlags.echo_reward_pending, true);
});
