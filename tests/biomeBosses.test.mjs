// SPEC-1104 — trySpawnBoss(ambushMult) e isMiniBossId()
import { test } from "node:test";
import assert from "node:assert/strict";
import { biomeBosses, trySpawnBoss, isMiniBossId, AMBUSH_CHANCE_MULT } from "../js/biomeBosses.js";

test("isMiniBossId: identifica mini-bosses reales de cualquier bioma", () => {
  assert.ok(isMiniBossId("wolf"));           // forest
  assert.ok(isMiniBossId("hydra"));          // swamp
  assert.ok(isMiniBossId("stone_golem"));    // cave
});

test("isMiniBossId: false para el boss principal de zona y para ids desconocidos", () => {
  assert.equal(isMiniBossId("forest_titan"), false);
  assert.equal(isMiniBossId("dragon_king"), false);
  assert.equal(isMiniBossId("no_existe"), false);
});

test("AMBUSH_CHANCE_MULT es +50%", () => {
  assert.equal(AMBUSH_CHANCE_MULT, 1.5);
});

test("SPEC-1104: trySpawnBoss sin ambushMult se comporta igual que antes (default 1)", () => {
  const orig = Math.random;
  try {
    Math.random = () => 0.09; // < spawnChance forest (0.10)
    assert.ok(trySpawnBoss("forest"));
    Math.random = () => 0.11; // > spawnChance forest (0.10), sin mult falla
    assert.equal(trySpawnBoss("forest"), null);
  } finally {
    Math.random = orig;
  }
});

test("SPEC-1104: ambushMult=1.5 hace que un roll que antes fallaba ahora tenga éxito", () => {
  const orig = Math.random;
  try {
    // forest.spawnChance = 0.10; con ambushMult 1.5 el umbral efectivo es 0.15
    Math.random = () => 0.12;
    assert.equal(trySpawnBoss("forest"), null); // sin mult, 0.12 > 0.10 falla
    assert.ok(trySpawnBoss("forest", AMBUSH_CHANCE_MULT)); // con mult, 0.12 <= 0.15 pasa
  } finally {
    Math.random = orig;
  }
});

test("SPEC-1104: ambushMult<1 (protección del bosque) hace más difícil el spawn", () => {
  const orig = Math.random;
  try {
    Math.random = () => 0.08;
    assert.ok(trySpawnBoss("forest")); // sin mult, 0.08 <= 0.10 pasa
    assert.equal(trySpawnBoss("forest", 0.5), null); // con 0.5x, umbral 0.05, 0.08 falla
  } finally {
    Math.random = orig;
  }
});

test("trySpawnBoss: bioma desconocido siempre null, sin importar ambushMult", () => {
  assert.equal(trySpawnBoss("no_existe", 999), null);
});
