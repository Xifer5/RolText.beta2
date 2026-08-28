// SPEC-1206/1207 — Pruebas del Eco: rotación de jefes, escalada explícita
// por nivel de prueba, y avance solo al vencer al jefe correcto.
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { TRIAL_BOSSES, trialMultiplier, handleBossDefeated } from "../js/echoTrials.js";

beforeEach(() => { resetState(); localStorage.clear(); });

test("trialMultiplier: nivel 1 es el jefe base, sin escalar", () => {
  const m = trialMultiplier(1);
  assert.equal(m.hp, 1);
  assert.equal(m.atk, 1);
});

test("trialMultiplier: +10% HP / +5% daño por cada nivel dentro del primer ciclo", () => {
  const m = trialMultiplier(3); // nivel 3 = 2 niveles por encima del base
  assert.equal(m.hp, 1.20);
  assert.equal(m.atk, 1.10);
});

test("trialMultiplier: al completar un ciclo (7 jefes) se suma un +10%/+5% extra", () => {
  const lastOfCycle1 = trialMultiplier(TRIAL_BOSSES.length); // nivel 7, todavía ciclo 0
  const firstOfCycle2 = trialMultiplier(TRIAL_BOSSES.length + 1); // nivel 8, ciclo 1 ya arrancó
  assert.ok(firstOfCycle2.hp > lastOfCycle1.hp);
  assert.ok(firstOfCycle2.atk > lastOfCycle1.atk);
});

test("handleBossDefeated: no avanza si no hay una prueba activa", () => {
  gameState.echoTrialActive = false;
  const result = handleBossDefeated(TRIAL_BOSSES[0]);
  assert.equal(result, null);
  assert.equal(gameState.echoTrials.level, 0);
});

test("handleBossDefeated: no avanza si el boss derrotado no es el de la prueba en curso", () => {
  gameState.echoTrialActive = true; // prueba en curso, nivel 0 → toca TRIAL_BOSSES[0]
  const result = handleBossDefeated("un_boss_cualquiera_de_exploracion_normal");
  assert.equal(result, null);
  assert.equal(gameState.echoTrialActive, true); // sigue activa, no se consumió por error
  assert.equal(gameState.echoTrials.level, 0);
});

test("handleBossDefeated: avanza de nivel y suma al mejor alcanzado al vencer al boss correcto", () => {
  gameState.echoTrialActive = true;
  const result = handleBossDefeated(TRIAL_BOSSES[0]);
  assert.equal(result.level, 1);
  assert.equal(gameState.echoTrials.level, 1);
  assert.equal(gameState.echoTrials.best, 1);
  assert.equal(gameState.echoTrialActive, false); // se consume, no queda "pegada"
});

test("handleBossDefeated: rota al siguiente jefe de la lista en la próxima prueba", () => {
  gameState.echoTrialActive = true;
  handleBossDefeated(TRIAL_BOSSES[0]);
  gameState.echoTrialActive = true;
  const result = handleBossDefeated(TRIAL_BOSSES[1]);
  assert.equal(result.level, 2);
});

test("handleBossDefeated: 'best' no baja aunque el jugador retroceda de nivel actual", () => {
  gameState.echoTrialActive = true;
  handleBossDefeated(TRIAL_BOSSES[0]);
  gameState.echoTrials.level = 0; // simula un reinicio manual del nivel actual
  gameState.echoTrialActive = true;
  handleBossDefeated(TRIAL_BOSSES[0]);
  assert.equal(gameState.echoTrials.best, 1);
});

test("handleBossDefeated: cada prueba superada suma Fragmentos de Eco (5 + nivel*2)", () => {
  gameState.echoTrialActive = true;
  const result = handleBossDefeated(TRIAL_BOSSES[0]); // nivel resultante 1
  assert.equal(result.bonus, 7); // 5 + 1*2
});
