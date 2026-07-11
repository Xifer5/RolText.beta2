import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const {
  SAVE_SLOTS, readSlot, listSlots, latestSlotId, hasSavedGame,
  saveToSlot, loadFromSlot, deleteSlot, saveGame, loadGame
} = await import("../js/saveSystem.js");
const state = await import("../js/state.js");

const LEGACY = "pixelQuestSave";
const keyOf = id => `${LEGACY}.${id}`;
const payload = (over = {}) => JSON.stringify({
  gameState: { ...JSON.parse(JSON.stringify(state.initialGameState)), ...over },
  timestamp: over.timestamp ?? "2026-07-01T10:00:00.000Z",
  version: "3.0"
});

beforeEach(() => { localStorage.clear(); state.resetState(); });

test("hay 4 ranuras: auto + 3 manuales", () => {
  assert.deepEqual(SAVE_SLOTS, ["auto", "slot1", "slot2", "slot3"]);
  assert.equal(listSlots().length, 4);
});

test("migración legacy: el save único pasa a slot1 y la clave vieja desaparece", () => {
  localStorage.setItem(LEGACY, payload());
  const data = readSlot("slot1");
  assert.ok(data?.gameState);
  assert.equal(localStorage.getItem(LEGACY), null);
  assert.equal(localStorage.getItem(keyOf("slot1")) !== null, true);
});

test("migración legacy: si slot1 ya existe, la legacy se descarta sin pisar nada", () => {
  localStorage.setItem(keyOf("slot1"), payload({ marker: "existing" }));
  localStorage.setItem(LEGACY, payload({ marker: "legacy" }));
  const data = readSlot("slot1");
  assert.equal(data.gameState.marker, "existing");
  assert.equal(localStorage.getItem(LEGACY), null);
});

test("saveGame() escribe SOLO en auto; saveToSlot en su ranura", () => {
  assert.equal(saveGame(), true);
  assert.ok(readSlot("auto"));
  assert.equal(readSlot("slot1"), null);
  assert.equal(saveToSlot("slot2"), true);
  assert.ok(readSlot("slot2"));
  assert.equal(readSlot("slot1"), null);
  assert.equal(readSlot("slot3"), null);
});

test("saveToSlot rechaza ranuras desconocidas", () => {
  assert.equal(saveToSlot("slot9"), false);
  assert.equal(saveToSlot("legacy"), false);
});

test("latestSlotId elige el timestamp más reciente y loadGame carga esa", () => {
  localStorage.setItem(keyOf("slot1"), payload({ timestamp: "2026-07-01T10:00:00.000Z" }));
  localStorage.setItem(keyOf("auto"),  payload({ timestamp: "2026-07-10T10:00:00.000Z" }));
  localStorage.setItem(keyOf("slot3"), payload({ timestamp: "2026-07-05T10:00:00.000Z" }));
  assert.equal(latestSlotId(), "auto");
  assert.equal(loadGame(), true);
});

test("roundtrip por ranura: guardar → reset → cargar restaura el estado", () => {
  state.gameState.player.gold = 777;
  state.gameState.worldFlags = { shrine_prayed: true };
  state.gameState.travelPacing = { steps: 5, recent: ["old_shrine"] };
  assert.equal(saveToSlot("slot3"), true);
  state.resetState();
  assert.notEqual(state.gameState.player.gold, 777);
  assert.equal(loadFromSlot("slot3"), true);
  assert.equal(state.gameState.player.gold, 777);
  assert.equal(state.gameState.worldFlags.shrine_prayed, true);
  assert.deepEqual(state.gameState.travelPacing, { steps: 5, recent: ["old_shrine"] });
});

test("loadFromSlot migra saves sin permanentHpBonus", () => {
  const old = JSON.parse(payload());
  delete old.gameState.player.permanentHpBonus;
  delete old.gameState.player.permanentMpBonus;
  old.gameState.player.maxHp = (old.gameState.player.maxHp ?? 100) + 30; // level-ups a la antigua
  localStorage.setItem(keyOf("slot2"), JSON.stringify(old));
  assert.equal(loadFromSlot("slot2"), true);
  assert.equal(state.gameState.player.permanentHpBonus, 30);
});

test("deleteSlot borra solo su ranura", () => {
  saveToSlot("slot1");
  saveToSlot("slot2");
  deleteSlot("slot1");
  assert.equal(readSlot("slot1"), null);
  assert.ok(readSlot("slot2"));
});

test("hasSavedGame refleja cualquier ranura; vacío al borrar todas", () => {
  assert.equal(hasSavedGame(), false);
  saveToSlot("slot2");
  assert.equal(hasSavedGame(), true);
  deleteSlot("slot2");
  assert.equal(hasSavedGame(), false);
  assert.equal(loadGame(), false);
});

test("readSlot devuelve null ante payload corrupto sin lanzar", () => {
  localStorage.setItem(keyOf("slot1"), "{no es json");
  assert.equal(readSlot("slot1"), null);
  localStorage.setItem(keyOf("slot1"), JSON.stringify({ sinGameState: true }));
  assert.equal(readSlot("slot1"), null);
});
