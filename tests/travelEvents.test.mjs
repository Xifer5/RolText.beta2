import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { TRAVEL_EVENTS, eligibleEvents } from "../js/travelEvents.js";

const ev = id => TRAVEL_EVENTS.find(e => e.id === id);
const choose = (id, i) => ev(id).choices[i].apply();
const ids = pool => pool.map(e => e.id);

beforeEach(() => resetState());

test("viajero: ambas ramas marcan su flag", () => {
  choose("stray_traveler", 0);
  assert.equal(gameState.worldFlags.traveler_helped, true);
  resetState();
  choose("stray_traveler", 1);
  assert.equal(gameState.worldFlags.traveler_ignored, true);
});

test("bolsa: ambas ramas marcan su flag", () => {
  choose("lost_coin_purse", 0);
  assert.equal(gameState.worldFlags.purse_taken, true);
  resetState();
  choose("lost_coin_purse", 1);
  assert.equal(gameState.worldFlags.purse_left, true);
});

test("santuario: orar marca flag, ignorar no", () => {
  choose("old_shrine", 1);
  assert.equal(gameState.worldFlags.shrine_prayed, undefined);
  choose("old_shrine", 0);
  assert.equal(gameState.worldFlags.shrine_prayed, true);
});

test("mercader: solo marca flag si la compra se completa", () => {
  gameState.player.gold = 5;
  choose("suspicious_merchant", 0);
  assert.equal(gameState.worldFlags.merchant_bought, undefined);
  gameState.player.gold = 10;
  choose("suspicious_merchant", 0);
  assert.equal(gameState.worldFlags.merchant_bought, true);
  assert.equal(gameState.player.gold, 2);
});

test("sin flags no hay follow-ups elegibles", () => {
  const pool = eligibleEvents("forest");
  assert.ok(pool.length > 0);
  assert.ok(pool.every(e => !e.followUp));
});

test("follow-up elegible tiene prioridad absoluta sobre eventos normales", () => {
  gameState.worldFlags = { shrine_prayed: true };
  assert.deepEqual(ids(eligibleEvents("forest")), ["shrine_gratitude"]);
  // resuelto → el pool vuelve a los eventos normales
  gameState.worldFlags.shrine_resolved = true;
  assert.ok(eligibleEvents("forest").every(e => !e.followUp));
});

test("follow-up resuelto no vuelve jamás", () => {
  gameState.worldFlags = { traveler_helped: true };
  assert.ok(ids(eligibleEvents(null)).includes("traveler_grateful"));
  const goldBefore = gameState.player.gold;
  choose("traveler_grateful", 0);
  assert.equal(gameState.worldFlags.traveler_resolved, true);
  assert.equal(gameState.player.gold, goldBefore + 40);
  assert.equal(gameState.inventory.health_potion, 1);
  assert.ok(eligibleEvents(null).every(e => !e.followUp));
});

test("las dos ramas del viajero comparten resolución (solo un segundo acto)", () => {
  gameState.worldFlags = { traveler_helped: true, traveler_ignored: true };
  choose("traveler_grave", 0);
  assert.ok(!ids(eligibleEvents(null)).includes("traveler_grateful"));
  assert.ok(!ids(eligibleEvents(null)).includes("traveler_grave"));
});

test("granjero: devolver el oro cuesta 25 y da 50 XP", () => {
  gameState.worldFlags = { purse_taken: true };
  gameState.player.gold = 30;
  const xpBefore = gameState.player.experience;
  choose("farmer_searching", 0);
  assert.equal(gameState.player.gold, 5);
  assert.equal(gameState.player.experience, xpBefore + 50);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("granjero: sin oro para devolver, resuelve igualmente con confesión", () => {
  gameState.worldFlags = { purse_taken: true };
  gameState.player.gold = 10;
  choose("farmer_searching", 0);
  assert.equal(gameState.player.gold, 10);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("granjero agradecido: honradez pagada con 30 oro", () => {
  gameState.worldFlags = { purse_left: true };
  const goldBefore = gameState.player.gold;
  choose("farmer_grateful", 0);
  assert.equal(gameState.player.gold, goldBefore + 30);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("mercader regresa: sin oro suficiente NO se resuelve y volverá", () => {
  gameState.worldFlags = { merchant_bought: true };
  gameState.player.gold = 5;
  choose("merchant_returns", 0);
  assert.ok(!gameState.worldFlags.merchant_resolved);
  assert.ok(ids(eligibleEvents(null)).includes("merchant_returns"));
  gameState.player.gold = 20;
  choose("merchant_returns", 0);
  assert.equal(gameState.worldFlags.merchant_resolved, true);
  assert.equal(gameState.player.gold, 5);
  assert.equal(gameState.inventory.greater_elixir, 1);
});

test("bendición: +5 maxHp permanente que sobrevive guardar/cargar", () => {
  gameState.worldFlags = { shrine_prayed: true };
  const maxBefore = gameState.player.maxHp;
  choose("shrine_gratitude", 0);
  assert.equal(gameState.player.maxHp, maxBefore + 5);
  // roundtrip de save: saveGame serializa gameState completo como JSON
  const loaded = JSON.parse(JSON.stringify(gameState));
  assert.equal(loaded.player.maxHp, maxBefore + 5);
  assert.equal(loaded.worldFlags.shrine_resolved, true);
});

test("save antiguo sin worldFlags: los apply lo crean y la cadena funciona", () => {
  delete gameState.worldFlags;
  assert.ok(eligibleEvents("forest").every(e => !e.followUp));
  choose("lost_coin_purse", 1);
  assert.equal(gameState.worldFlags.purse_left, true);
  assert.ok(ids(eligibleEvents(null)).includes("farmer_grateful"));
});

test("los follow-ups respetan el filtro de bioma universal (biomes null)", () => {
  gameState.worldFlags = { merchant_bought: true };
  for (const biome of ["forest", "desert", "tundra", null]) {
    assert.deepEqual(ids(eligibleEvents(biome)), ["merchant_returns"]);
  }
});
