import { test } from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTY_CONFIG, getDifficultyConfig } from "../js/difficulty.js";

test("getDifficultyConfig devuelve la config pedida", () => {
  assert.equal(getDifficultyConfig("hard").id, "hard");
  assert.equal(getDifficultyConfig("impossible").hp, 3.0);
});

test("getDifficultyConfig cae a easy con claves desconocidas", () => {
  assert.equal(getDifficultyConfig("nope").id, "easy");
  assert.equal(getDifficultyConfig(undefined).id, "easy");
  assert.equal(getDifficultyConfig(null).id, "easy");
});

test("las 4 dificultades tienen multiplicadores completos y crecientes", () => {
  const keys = ["easy", "adventure", "hard", "impossible"];
  assert.deepEqual(Object.keys(DIFFICULTY_CONFIG), keys);
  for (const k of keys) {
    const d = DIFFICULTY_CONFIG[k];
    for (const field of ["hp", "atk", "def", "xpMult", "goldMult"]) {
      assert.equal(typeof d[field], "number", `${k}.${field}`);
      assert.ok(d[field] >= 1.0, `${k}.${field} >= 1`);
    }
  }
  for (let i = 1; i < keys.length; i++) {
    assert.ok(DIFFICULTY_CONFIG[keys[i]].hp > DIFFICULTY_CONFIG[keys[i - 1]].hp,
      `hp de ${keys[i]} debe superar a ${keys[i - 1]}`);
  }
});
