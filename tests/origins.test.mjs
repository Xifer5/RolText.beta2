// SPEC-1002 — rasgos de origen
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { ORIGINS, applyOrigin } from "../js/origins.js";
import { TRAVEL_EVENTS, eligibleEvents } from "../js/travelEvents.js";

beforeEach(() => resetState());

test("hay 3 orígenes bilingües con bono, flag y color", () => {
  assert.deepEqual(Object.keys(ORIGINS), ["exile", "apprentice", "mercenary"]);
  for (const o of Object.values(ORIGINS)) {
    assert.ok(o.name?.en && o.name?.es, `${o.id}.name bilingüe`);
    assert.ok(o.description?.en && o.description?.es, `${o.id}.description bilingüe`);
    assert.ok(Object.keys(o.bonuses).length === 1, `${o.id} tiene un bono de stat`);
    assert.ok(o.flag?.startsWith("origin_"), `${o.id}.flag`);
    assert.ok(o.emoji && o.color, `${o.id} presentación`);
  }
});

test("exiliado: +2 AGI, +1 poción, flag", () => {
  const agi = gameState.player.agility;
  assert.equal(applyOrigin(gameState, "exile"), true);
  assert.equal(gameState.player.agility, agi + 2);
  assert.equal(gameState.inventory.health_potion, 1);
  assert.equal(gameState.worldFlags.origin_exile, true);
  assert.equal(gameState.player.origin, "exile");
});

test("aprendiz: +2 INT y poción de maná; mercenario: +2 STR y +30 oro", () => {
  const intl = gameState.player.intelligence;
  applyOrigin(gameState, "apprentice");
  assert.equal(gameState.player.intelligence, intl + 2);
  assert.equal(gameState.inventory.mana_potion, 1);

  resetState();
  const str = gameState.player.strength, gold = gameState.player.gold;
  applyOrigin(gameState, "mercenary");
  assert.equal(gameState.player.strength, str + 2);
  assert.equal(gameState.player.gold, gold + 30);
});

test("origen desconocido: false y sin efectos", () => {
  const before = JSON.stringify(gameState.player);
  assert.equal(applyOrigin(gameState, "nope"), false);
  assert.equal(JSON.stringify(gameState.player), before);
});

test("evento de origen: elegible solo con su flag y una sola vez", () => {
  const ids = () => eligibleEvents("forest").map(e => e.id);
  assert.ok(!ids().includes("origin_exile_tracks"), "sin origen no aparece");
  applyOrigin(gameState, "exile");
  assert.ok(ids().includes("origin_exile_tracks"), "con origen aparece en el pool");
  assert.ok(!ids().includes("origin_mercenary_debt"), "los de otros orígenes no");
  // resolverlo lo retira para siempre
  TRAVEL_EVENTS.find(e => e.id === "origin_exile_tracks").choices[0].apply();
  assert.ok(!ids().includes("origin_exile_tracks"), "visto no vuelve");
});

test("los eventos de origen no son follow-ups (sin prioridad absoluta)", () => {
  applyOrigin(gameState, "mercenary");
  const ev = TRAVEL_EVENTS.find(e => e.id === "origin_mercenary_debt");
  assert.ok(!ev.followUp);
  assert.ok(eligibleEvents(null).length > 1, "convive con el pool normal");
});

test("el bono de origen entra en los máximos derivados (mercenario: +2 STR → +4 maxHp)", async () => {
  const { calculateTotalStats } = await import("../js/stats.js");
  const base = calculateTotalStats(gameState.player, {}).maxHp;
  applyOrigin(gameState, "mercenary");
  assert.equal(calculateTotalStats(gameState.player, {}).maxHp, base + 4);
});
