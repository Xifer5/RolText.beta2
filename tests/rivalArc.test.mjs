// SPEC-1108 — Kestrel, el rival recurrente (roadmap ítem #8)
// SPEC-1237 — rediseño en 4 etapas (diseñado vía /office-hours): duelo
// amistoso temprano (etapa 0) → discursos por bioma (etapa 1) → segundo
// duelo mitad de juego (etapa 2) → prueba de confianza (etapa 3, reemplaza
// la resolución automática por score con una acción explícita del jugador).
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import {
  maybeStartRivalEncounter, RIVAL_DUEL_1_INTRO, RIVAL_ENCOUNTER_2, BIOME_SPEECHES,
  RIVAL_DUEL_2_INTRO, RIVAL_TRUST_TEST, rivalResolutionEvent, maybeChainValdrisAfterRival
} from "../js/rivalArc.js";
import { enemyData } from "../js/enemies.js";
import { ENEMY_COMBAT_DATA } from "../js/damageTypes.js";
import { biomeBosses } from "../js/biomeBosses.js";

beforeEach(() => resetState());

test("kestrel_rival/kestrel_early/kestrel_rival_2 existen en enemyData y en ENEMY_COMBAT_DATA", () => {
  for (const id of ["kestrel_early", "kestrel_rival_2", "kestrel_rival"]) {
    assert.ok(enemyData[id], `${id} debe existir en enemyData`);
    assert.ok(ENEMY_COMBAT_DATA[id], `${id} debe tener entrada en ENEMY_COMBAT_DATA`);
  }
  assert.equal(enemyData.kestrel_rival.isBoss, undefined, "no es un boss de zona ni mini-boss");
});

test("kestrel_early es más débil que kestrel_rival_2, que a su vez es más débil que kestrel_rival", () => {
  assert.ok(enemyData.kestrel_early.hp < enemyData.kestrel_rival_2.hp);
  assert.ok(enemyData.kestrel_rival_2.hp < enemyData.kestrel_rival.hp);
});

test("maybeStartRivalEncounter no dispara sin la misión completada", () => {
  assert.equal(maybeStartRivalEncounter("town"), false);
  gameState.quests = { mq_01_la_cancion: "active" };
  assert.equal(maybeStartRivalEncounter("town"), false);
});

// ── Etapa 0: duelo amistoso, obligatorio y temprano ─────────────────────

test("maybeStartRivalEncounter: etapa 0 (duelo amistoso) dispara en CUALQUIER lugar tras completar mq_01", () => {
  gameState.quests = { mq_01_la_cancion: "completed" };
  assert.equal(maybeStartRivalEncounter("swamp_1"), true, "no debe requerir una sala específica");
  assert.equal(gameState.worldFlags.rival_duel1_seen, true);
  assert.equal(maybeStartRivalEncounter("swamp_1"), false, "no debe repetirse");
});

// Nota: domStub.mjs stubea window.addEventListener/dispatchEvent como noop
// (ver tests/helpers/domStub.mjs), así que no se puede verificar el evento
// pixel:startCombat en sí -- solo que apply() corre sin romper y devuelve
// el texto esperado (mismo alcance que los tests ya existentes de
// rival_resolution_competitor, que tampoco verifican el dispatch).
test("RIVAL_DUEL_1_INTRO: aceptar el duelo no rompe y devuelve el texto de aceptación", () => {
  const result = RIVAL_DUEL_1_INTRO.choices[0].apply();
  assert.ok(result.en && result.es);
});

// ── "Kestrel en apuros" (jardín) — sin cambios de disparador/contenido ──

test("maybeStartRivalEncounter: 'en apuros' dispara en CUALQUIER lugar tras completar mq_03", () => {
  gameState.quests = { mq_03_ecos: "completed" };
  assert.equal(maybeStartRivalEncounter("mountain_1"), true, "no debe requerir garden_1 exacto");
  assert.equal(gameState.worldFlags.rival_encounter_2_seen, true);
});

test("'en apuros': ayudar suma +1 al rival_score; dejarlo resta -1", () => {
  RIVAL_ENCOUNTER_2.choices[0].apply();
  assert.equal(gameState.worldFlags.rival_score, 1);
  resetState();
  RIVAL_ENCOUNTER_2.choices[1].apply();
  assert.equal(gameState.worldFlags.rival_score, -1);
});

// ── Etapa 1: discursos por bioma ─────────────────────────────────────────

test("BIOME_SPEECHES cubre exactamente los 7 biomas con jefe de zona, ni más ni menos", () => {
  assert.deepEqual(
    Object.keys(BIOME_SPEECHES).sort(),
    Object.keys(biomeBosses).sort()
  );
});

test("cada BIOME_SPEECHES tiene texto en/es no vacío y un choice de continuar", () => {
  for (const [biomeId, speech] of Object.entries(BIOME_SPEECHES)) {
    assert.ok(speech.text.en && speech.text.es, `${biomeId} debe tener texto en/es`);
    assert.equal(speech.choices.length, 1, `${biomeId} es flavor puro, un solo choice de continuar`);
  }
});

test("maybeStartRivalEncounter: NO dispara discurso de bioma antes del duelo 0 (Kestrel todavía no establecida)", () => {
  window.worldMap = { forest_1: { id: "forest_1", biome: "forest" } };
  assert.equal(maybeStartRivalEncounter("forest_1"), false);
});

test("maybeStartRivalEncounter: dispara el discurso de bioma tras el duelo 0, una sola vez por bioma", () => {
  window.worldMap = {
    forest_1: { id: "forest_1", biome: "forest" },
    forest_2: { id: "forest_2", biome: "forest" },
  };
  gameState.worldFlags = { rival_duel1_seen: true };
  assert.equal(maybeStartRivalEncounter("forest_1"), true);
  assert.equal(gameState.worldFlags.rival_biome_seen_forest, true);
  assert.equal(maybeStartRivalEncounter("forest_2"), false, "mismo bioma, ya visto -- no debe repetirse");
});

test("maybeStartRivalEncounter: un bioma sin jefe de zona (ej. garden) no tiene discurso de Kestrel", () => {
  window.worldMap = { garden_1: { id: "garden_1", biome: "garden" } };
  gameState.worldFlags = { rival_duel1_seen: true };
  assert.equal(maybeStartRivalEncounter("garden_1"), false);
});

// ── Etapa 2: segundo duelo, mitad de juego ──────────────────────────────

test("maybeStartRivalEncounter: etapa 2 NO dispara con menos de 3 jefes de zona vencidos", () => {
  gameState.worldFlags = { rival_duel1_seen: true };
  gameState.stats.enemiesDefeated = { forest_titan: 1, cave_devourer: 1 };
  assert.equal(maybeStartRivalEncounter("town"), false);
});

test("maybeStartRivalEncounter: etapa 2 dispara tras 3 jefes de zona vencidos", () => {
  gameState.worldFlags = { rival_duel1_seen: true };
  gameState.stats.enemiesDefeated = { forest_titan: 1, cave_devourer: 1, mountain_colossus: 1 };
  assert.equal(maybeStartRivalEncounter("town"), true);
  assert.equal(gameState.worldFlags.rival_duel2_seen, true);
});

test("RIVAL_DUEL_2_INTRO: aceptar no rompe y devuelve el texto de aceptación", () => {
  const result = RIVAL_DUEL_2_INTRO.choices[0].apply();
  assert.ok(result.en && result.es);
});

// ── Etapa 3: prueba de confianza (reemplaza la resolución por score) ────

test("maybeStartRivalEncounter: prueba de confianza dispara en inferno_1 tras completar mq_04", () => {
  gameState.quests = { mq_04_la_verdad: "completed" };
  assert.equal(maybeStartRivalEncounter("inferno_1"), true);
  assert.equal(gameState.worldFlags.rival_trust_test_seen, true);
  assert.equal(maybeStartRivalEncounter("inferno_1"), false);
});

test("RIVAL_TRUST_TEST: 3 choices mapean directo a aliado/competidor/traidor, sin importar rival_score", () => {
  gameState.worldFlags = { rival_score: -5 }; // score bien negativo -- ya no debe importar
  RIVAL_TRUST_TEST.choices[0].apply(); // "pelear a mi lado"
  assert.equal(gameState.worldFlags.rival_resolved_ally, true, "la elección explícita manda, no el score acumulado");
});

test("RIVAL_TRUST_TEST: elegir 'no confío' dispara el duelo competidor sin importar el score", () => {
  gameState.worldFlags = { rival_score: 5 }; // score bien positivo -- igual puede elegir pelear
  RIVAL_TRUST_TEST.choices[1].apply();
  assert.equal(gameState.worldFlags.rival_resolved_competitor, true);
});

test("RIVAL_TRUST_TEST: elegir 'tomala, andate' resuelve traidor y roba 20% del oro", () => {
  gameState.worldFlags = {};
  gameState.player.gold = 100;
  RIVAL_TRUST_TEST.choices[2].apply();
  assert.equal(gameState.worldFlags.rival_resolved_traitor, true);
  assert.equal(gameState.player.gold, 80);
});

// ── rivalResolutionEvent: forzado explícito (etapa 3) + fallback por score ──

test("rivalResolutionEvent('ally'): cura completa + buff de ataque, sin importar el score", () => {
  gameState.worldFlags = { rival_score: -5 };
  gameState.player.hp = 1;
  const event = rivalResolutionEvent("ally");
  assert.equal(event.id, "rival_resolution_ally");
  event.choices[0].apply();
  assert.equal(gameState.player.hp, gameState.player.maxHp);
  assert.equal(gameState.activeBuffs.warcry, 5);
});

test("rivalResolutionEvent(): sin forzar, cae al umbral de score de siempre (compatibilidad)", () => {
  gameState.worldFlags = { rival_score: 2 };
  assert.equal(rivalResolutionEvent().id, "rival_resolution_ally");
  gameState.worldFlags = { rival_score: -2 };
  assert.equal(rivalResolutionEvent().id, "rival_resolution_traitor");
  gameState.worldFlags = { rival_score: 0 };
  assert.equal(rivalResolutionEvent().id, "rival_resolution_competitor");
});

test("resolución competidor: el camino NO marca rival_chain_valdris_pending -- encadena desde combatRewards.js tras el duelo", () => {
  const event = rivalResolutionEvent("competitor");
  event.choices[0].apply();
  assert.equal(gameState.worldFlags.rival_resolved_competitor, true);
  assert.equal(gameState.worldFlags.rival_chain_valdris_pending, undefined);
});

// ── maybeChainValdrisAfterRival — SPEC-1236, sigue vigente con la etapa 3 ──

test("maybeChainValdrisAfterRival: aliado/traidor dejan pending=true, se consume una sola vez", () => {
  rivalResolutionEvent("ally").choices[0].apply();
  assert.equal(gameState.worldFlags.rival_chain_valdris_pending, true);
  assert.equal(maybeChainValdrisAfterRival(), true);
  assert.equal(gameState.worldFlags.rival_chain_valdris_pending, false);
  assert.equal(maybeChainValdrisAfterRival(), false, "sin nada pendiente, no debe repetirse");
});

test("maybeChainValdrisAfterRival: sin ninguna resolución de Kestrel, no hace nada", () => {
  gameState.worldFlags = {};
  assert.equal(maybeChainValdrisAfterRival(), false);
});
