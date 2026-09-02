// SPEC-1223 — narrador oculto: línea propia por jefe de zona (narratorLine),
// silencio total en el Rey Dragón, y disparo único por primer encuentro
// (no se repite en reintentos tras huir/perder).
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { gameState, resetState } from "../js/state.js";
import { enemyData } from "../js/enemies.js";
import { startCombat } from "../js/combat.js";

// domStub.mjs stubea document.getElementById() -> null siempre, así que
// addMessage() (story.js) hace early-return y nunca llena gameState.messages.
// Acá sí necesitamos observar ese efecto, así que damos un "#story" mínimo.
document.getElementById = (id) => id === "story" ? { insertBefore() {}, firstChild: null } : null;

beforeEach(() => resetState());

// Mismo orden narrativo documentado en el design doc (NO es el orden en el
// archivo enemies.js — inferno_dragon está definido primero ahí pero es el
// último narrativamente).
const ZONE_BOSS_IDS = [
  "forest_titan", "cave_devourer", "mountain_colossus",
  "ancient_construct", "swamp_abomination", "frost_wyrm", "inferno_dragon"
];

test("los 7 jefes de zona tienen narratorLine; dragon_king (climax) no tiene ninguna — silencio total", () => {
  for (const id of ZONE_BOSS_IDS) {
    assert.ok(enemyData[id]?.narratorLine, `${id} debería tener narratorLine`);
  }
  assert.equal(enemyData.dragon_king?.narratorLine, undefined,
    "dragon_king NO debe tener narratorLine — el silencio del narrador en el clímax es el punto central de la feature");
});

test("ninguna narratorLine menciona 'Eco' (colisión con Fragmentos de Eco / echo_freed, ya sobrecargados)", () => {
  for (const id of ZONE_BOSS_IDS) {
    const line = enemyData[id].narratorLine;
    assert.doesNotMatch(line, /eco/i, `${id}.narratorLine no debe mencionar "Eco": "${line}"`);
  }
});

test("startCombat: la narratorLine se marca vista en el primer encuentro y no se relanza en un reintento", async () => {
  startCombat("forest_titan", true);
  assert.equal(gameState.worldFlags.narrator_seen_forest_titan, true);
  await sleep(1800);
  const seenOnce = gameState.messages.filter(m => m.text === enemyData.forest_titan.narratorLine);
  assert.equal(seenOnce.length, 1, "debe aparecer exactamente una vez en el primer encuentro");

  // Reintento contra el mismo jefe (ej. tras huir o perder) — no repetir.
  startCombat("forest_titan", true);
  await sleep(1800);
  const seenAfterRetry = gameState.messages.filter(m => m.text === enemyData.forest_titan.narratorLine);
  assert.equal(seenAfterRetry.length, 1, "no debe repetirse en un segundo encuentro contra el mismo jefe");
});

test("startCombat: inferno_dragon (sin introLine propio) también dispara su narratorLine en el primer encuentro", async () => {
  startCombat("inferno_dragon", true);
  await sleep(1000);
  const msgs = gameState.messages.filter(m => m.text === enemyData.inferno_dragon.narratorLine);
  assert.equal(msgs.length, 1);
});

test("startCombat: dragon_king nunca agrega ninguna narratorLine de jefe de zona", async () => {
  startCombat("dragon_king", true);
  await sleep(3000);
  const anyNarratorLine = ZONE_BOSS_IDS.some(id =>
    gameState.messages.some(m => m.text === enemyData[id]?.narratorLine)
  );
  assert.equal(anyNarratorLine, false);
});
