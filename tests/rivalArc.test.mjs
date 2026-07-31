// SPEC-1108 — Kestrel, el rival recurrente (roadmap ítem #8)
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import {
  maybeStartRivalEncounter, RIVAL_ENCOUNTER_1, RIVAL_ENCOUNTER_2, rivalResolutionEvent
} from "../js/rivalArc.js";
import { enemyData } from "../js/enemies.js";
import { ENEMY_COMBAT_DATA } from "../js/damageTypes.js";

beforeEach(() => resetState());

test("kestrel_rival existe en enemyData y en ENEMY_COMBAT_DATA", () => {
  assert.ok(enemyData.kestrel_rival);
  assert.ok(ENEMY_COMBAT_DATA.kestrel_rival);
  assert.equal(enemyData.kestrel_rival.isBoss, undefined, "no es un boss de zona ni mini-boss");
});

test("maybeStartRivalEncounter no dispara sin la misión completada", () => {
  assert.equal(maybeStartRivalEncounter("town"), false);
  gameState.quests = { mq_01_la_cancion: "active" };
  assert.equal(maybeStartRivalEncounter("town"), false);
});

test("maybeStartRivalEncounter dispara el encuentro 1 en town tras completar mq_01, una sola vez", () => {
  gameState.quests = { mq_01_la_cancion: "completed" };
  assert.equal(maybeStartRivalEncounter("town"), true);
  assert.equal(gameState.worldFlags.rival_encounter_1_seen, true);
  assert.equal(maybeStartRivalEncounter("town"), false, "no debe repetirse");
});

test("maybeStartRivalEncounter dispara el encuentro 2 en garden_1 tras completar mq_03", () => {
  gameState.quests = { mq_03_ecos: "completed" };
  assert.equal(maybeStartRivalEncounter("garden_1"), true);
  assert.equal(gameState.worldFlags.rival_encounter_2_seen, true);
  assert.equal(maybeStartRivalEncounter("garden_1"), false);
});

test("maybeStartRivalEncounter dispara la resolución en inferno_1 tras completar mq_04", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  assert.equal(maybeStartRivalEncounter("inferno_1"), true);
  assert.equal(gameState.worldFlags.rival_encounter_3_seen, true);
  assert.equal(maybeStartRivalEncounter("inferno_1"), false);
});

test("encuentro 1: compartir suma +1 al rival_score; guardarte resta -1", () => {
  RIVAL_ENCOUNTER_1.choices[0].apply();
  assert.equal(gameState.worldFlags.rival_score, 1);
  resetState();
  RIVAL_ENCOUNTER_1.choices[1].apply();
  assert.equal(gameState.worldFlags.rival_score, -1);
});

test("encuentro 2: ayudar suma +1; dejarlo resta -1 (el score se acumula entre encuentros)", () => {
  gameState.worldFlags = { rival_score: 1 }; // ya compartió en el encuentro 1
  RIVAL_ENCOUNTER_2.choices[0].apply();
  assert.equal(gameState.worldFlags.rival_score, 2);
});

test("resolución: score≥1 → aliado (cura completa + buff de ataque)", () => {
  gameState.worldFlags = { rival_score: 2 };
  gameState.player.hp = 1;
  const event = rivalResolutionEvent();
  assert.equal(event.id, "rival_resolution_ally");
  event.choices[0].apply();
  assert.equal(gameState.player.hp, gameState.player.maxHp);
  assert.equal(gameState.activeBuffs.warcry, 5);
  assert.equal(gameState.worldFlags.rival_resolved_ally, true);
});

test("resolución: score≤-1 → traidor (roba 20% del oro)", () => {
  gameState.worldFlags = { rival_score: -2 };
  gameState.player.gold = 100;
  const event = rivalResolutionEvent();
  assert.equal(event.id, "rival_resolution_traitor");
  event.choices[0].apply();
  assert.equal(gameState.player.gold, 80);
  assert.equal(gameState.worldFlags.rival_resolved_traitor, true);
});

test("resolución: score===0 → competidor (duelo), no toca HP/oro directamente", () => {
  gameState.worldFlags = { rival_score: 0 };
  const event = rivalResolutionEvent();
  assert.equal(event.id, "rival_resolution_competitor");
  const goldBefore = gameState.player.gold;
  event.choices[0].apply();
  assert.equal(gameState.player.gold, goldBefore, "el duelo se resuelve en combate, no acá");
  assert.equal(gameState.worldFlags.rival_resolved_competitor, true);
});
