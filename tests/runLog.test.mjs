// SPEC-1003 — crónica de partidas
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { buildRunRecord, readRunLog, recordRun, RUN_LOG_LIMIT } from "../js/runLog.js";

beforeEach(() => { resetState(); localStorage.clear(); });

test("buildRunRecord: victoria captura clase, origen, dificultad, tono y decisiones", () => {
  gameState.player.name = "Kael";
  gameState.player.class = "warrior";
  gameState.player.className = "Guerrero";
  gameState.player.origin = "mercenary";
  gameState.player.level = 12;
  gameState.difficulty = "hard";
  gameState.stats.kills = 33;
  gameState.worldFlags = { echo_freed: true, traveler_helped: true };
  const r = buildRunRecord(gameState, "victory");
  assert.equal(r.outcome, "victory");
  assert.equal(r.name, "Kael");
  assert.equal(r.origin, "mercenary");
  assert.equal(r.difficulty, "hard");
  assert.equal(r.level, 12);
  assert.equal(r.kills, 33);
  assert.equal(r.tone, "light");
  assert.equal(r.endingTitleKey, "endingTitleLight");
  assert.equal(r.decisions, 2);
  assert.ok(r.timestamp);
});

test("buildRunRecord: derrota sin título de final pero con decisiones contadas", () => {
  gameState.worldFlags = { purse_taken: true };
  const r = buildRunRecord(gameState, "defeat");
  assert.equal(r.outcome, "defeat");
  assert.equal(r.endingTitleKey, null);
  assert.equal(r.tone, null);
  assert.equal(r.decisions, 1);
});

test("recordRun: la más reciente primero y persiste fuera del save", () => {
  gameState.player.name = "Primera";
  recordRun("defeat");
  gameState.player.name = "Segunda";
  recordRun("victory");
  const log = readRunLog();
  assert.equal(log.length, 2);
  assert.equal(log[0].name, "Segunda");
  assert.equal(log[1].name, "Primera");
  // resetear la partida NO borra la crónica
  resetState();
  assert.equal(readRunLog().length, 2);
});

test("recordRun respeta el tope de entradas", () => {
  for (let i = 0; i < RUN_LOG_LIMIT + 5; i++) recordRun("defeat");
  assert.equal(readRunLog().length, RUN_LOG_LIMIT);
});

test("readRunLog: corrupto o ausente → lista vacía", () => {
  assert.deepEqual(readRunLog(), []);
  localStorage.setItem("pqe.runlog.v1", "{no json");
  assert.deepEqual(readRunLog(), []);
  localStorage.setItem("pqe.runlog.v1", JSON.stringify({ not: "array" }));
  assert.deepEqual(readRunLog(), []);
});
