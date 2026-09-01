// SPEC-1219 (Fase 2) — Eryndel pierde memoria con cada jefe de zona vencido
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { zoneBossesDefeatedCount, eryndelMemoryKey } from "../js/eryndelArc.js";

test("zoneBossesDefeatedCount ignora bosses que no son de zona (mini-bosses, dragon_king)", () => {
  const state = { stats: { enemiesDefeated: { wolf: 1, dragon_king: 1, kestrel_rival: 1 } } };
  assert.equal(zoneBossesDefeatedCount(state), 0);
});

test("zoneBossesDefeatedCount cuenta los 7 jefes de zona reales", () => {
  const state = { stats: { enemiesDefeated: {
    forest_titan: 1, cave_devourer: 1, mountain_colossus: 1, ancient_construct: 1,
    swamp_abomination: 1, frost_wyrm: 1, inferno_dragon: 1
  } } };
  assert.equal(zoneBossesDefeatedCount(state), 7);
});

test("eryndelMemoryKey devuelve null sin ningún boss vencido", () => {
  assert.equal(eryndelMemoryKey({ stats: { enemiesDefeated: {} } }), null);
  assert.equal(eryndelMemoryKey({}), null, "sin gameState.stats siquiera, no debe romper");
});

test("eryndelMemoryKey escala por umbral: 1-2 / 3-4 / 5-6 / 7", () => {
  const withN = (n) => {
    const ids = ["forest_titan", "cave_devourer", "mountain_colossus", "ancient_construct", "swamp_abomination", "frost_wyrm", "inferno_dragon"];
    const enemiesDefeated = {};
    ids.slice(0, n).forEach(id => { enemiesDefeated[id] = 1; });
    return { stats: { enemiesDefeated } };
  };
  assert.equal(eryndelMemoryKey(withN(1)), "eryndelMemory1");
  assert.equal(eryndelMemoryKey(withN(2)), "eryndelMemory1");
  assert.equal(eryndelMemoryKey(withN(3)), "eryndelMemory2");
  assert.equal(eryndelMemoryKey(withN(4)), "eryndelMemory2");
  assert.equal(eryndelMemoryKey(withN(5)), "eryndelMemory3");
  assert.equal(eryndelMemoryKey(withN(6)), "eryndelMemory3");
  assert.equal(eryndelMemoryKey(withN(7)), "eryndelMemory4");
});
