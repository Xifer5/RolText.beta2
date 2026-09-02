// SPEC-1221 — descripciones de ubicación con callback narrativo condicional
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { pickLocationDescription } from "../js/movement.js";
import { gameState, resetState } from "../js/state.js";
import { biomes } from "../js/biomes.js";

beforeEach(() => resetState());

test("pickLocationDescription: sin array, devuelve el valor tal cual", () => {
  const desc = { en: "solo", es: "solo" };
  assert.equal(pickLocationDescription(desc), desc);
});

test("pickLocationDescription: sin líneas condicionadas, elige cualquiera del array", () => {
  const list = [{ en: "a" }, { en: "b" }];
  const picked = pickLocationDescription(list);
  assert.ok(list.includes(picked));
});

test("pickLocationDescription: excluye líneas con when() falso", () => {
  const alwaysFalse = { en: "nunca", when: () => false };
  const list = [{ en: "normal" }, alwaysFalse];
  for (let i = 0; i < 20; i++) {
    assert.notEqual(pickLocationDescription(list), alwaysFalse);
  }
});

test("pickLocationDescription: incluye líneas con when() verdadero en el mismo sorteo", () => {
  const unlocked = { en: "desbloqueada", when: () => true };
  const list = [unlocked];
  assert.equal(pickLocationDescription(list), unlocked);
});

test("pickLocationDescription: si TODAS las condicionadas fallan y no hay genéricas, cae al array completo (nunca deja sin texto)", () => {
  const list = [{ en: "condicionada", when: () => false }];
  assert.equal(pickLocationDescription(list), list[0]);
});

// SPEC-1221 — las líneas narrativas condicionadas de biomes.js reaccionan a
// gameState en vivo (mismo patrón que eryndelArc.js: sin contador propio).
test("biomes.js: las líneas condicionadas de jefes de zona reaccionan a gameState.stats.enemiesDefeated", () => {
  const forestConditional = biomes.forest.description.find(d => d.en.includes("Titan has fallen"));
  assert.ok(forestConditional, "la línea condicionada del Titán del Bosque debe existir");
  assert.equal(forestConditional.when(), false, "sin haber vencido al Titán, when() debe ser false");

  gameState.stats.enemiesDefeated.forest_titan = 1;
  assert.equal(forestConditional.when(), true, "tras vencerlo, when() debe volverse true");
});

test("biomes.js: la línea de Pyrax en volcano reacciona a worldFlags.pyrax_trial_resolved", () => {
  const pyraxLine = biomes.volcano.description.find(d => d.en.includes("Pyrax no longer blocks"));
  assert.ok(pyraxLine);
  assert.equal(pyraxLine.when(), false);
  gameState.worldFlags.pyrax_trial_resolved = true;
  assert.equal(pyraxLine.when(), true);
});
