// SPEC-1240 — "Objetivo actual": prioridad de una sola línea sobre HP,
// misión activa, mejora de tienda y Fragmentos de Legado. Ver design doc
// diego-ovando-main-design-20260909-101942.md (Success Criteria): HP crítico
// siempre gana, y el fallback idle nunca es un string vacío.
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { getCurrentObjective } from "../js/objectiveHint.js";
import { activateQuest, QUEST_DATA } from "../js/quests.js";
import { t, formatText, localizeText } from "../js/i18n.js";

beforeEach(() => {
  resetState();
  localStorage.clear();
  gameState.player.gold = 0; // sin oro: ningún ítem de tienda es "asequible" por defecto
});

test("idle: sin ninguna señal activa, cae al fallback genérico (nunca vacío)", () => {
  const line = getCurrentObjective();
  assert.equal(line, t("objectiveIdle"));
  assert.ok(line.length > 0);
});

test("HP crítico (<25%) gana por sobre cualquier otra señal", () => {
  gameState.player.hp = Math.floor(gameState.player.maxHp * 0.1);
  activateQuest("collect_crystal");
  gameState.player.gold = 9999; // también dispararía la mejora de tienda si no ganara HP
  assert.equal(getCurrentObjective(), t("objectiveHpCritical"));
});

test("misión activa: usa formatText() con el título ya localizado de la misión", () => {
  activateQuest("collect_crystal");
  const expected = formatText("objectiveQuest", { title: localizeText(QUEST_DATA.collect_crystal.title) });
  assert.equal(getCurrentObjective(), expected);
  assert.doesNotMatch(expected, /\{\{/, "formatText() no debe dejar placeholders sin resolver");
});

test("misión activa gana sobre mejora de tienda y Fragmentos, pero pierde contra HP crítico", () => {
  activateQuest("collect_crystal");
  gameState.player.gold = 9999;
  localStorage.setItem("pqe.meta.v1", JSON.stringify({ fragments: 999, unlocked: {}, victories: 0 }));
  const expected = formatText("objectiveQuest", { title: localizeText(QUEST_DATA.collect_crystal.title) });
  assert.equal(getCurrentObjective(), expected);

  gameState.player.hp = 1;
  assert.equal(getCurrentObjective(), t("objectiveHpCritical"));
});

test("mejor equipo en tienda: con oro suficiente y nada equipado, gana sobre Fragmentos", () => {
  gameState.player.gold = 50; // sword cuesta 30
  localStorage.setItem("pqe.meta.v1", JSON.stringify({ fragments: 999, unlocked: {}, victories: 0 }));
  assert.equal(getCurrentObjective(), t("objectiveShopUpgrade"));
});

test("Fragmentos suficientes para el próximo Legado: solo gana cuando no hay señal de mayor prioridad", () => {
  localStorage.setItem("pqe.meta.v1", JSON.stringify({ fragments: 15, unlocked: {}, victories: 0 }));
  assert.equal(getCurrentObjective(), t("objectiveLegacyReady"));
});

test("Fragmentos: si el perk más barato ya está desbloqueado, no dispara la señal", () => {
  localStorage.setItem("pqe.meta.v1", JSON.stringify({ fragments: 999, unlocked: { legacy_gold: true, legacy_potion: true, legacy_rumor: true }, victories: 0 }));
  assert.equal(getCurrentObjective(), t("objectiveIdle"));
});

test("con varias misiones activas, prioriza la relevante al bioma ACTUAL (jefe de zona o ítem de esta zona) sobre la primera declarada", () => {
  // kill_pirates (declarada antes) no tiene nada que ver con forest_1;
  // mq_02_los_sellos pide matar a forest_titan, el jefe de ESTE bioma.
  window.worldMap = { forest_1: { id: "forest_1", biome: "forest" } };
  gameState.currentLocationId = "forest_1";
  activateQuest("kill_pirates");
  gameState.quests.mq_01_la_cancion = "completed"; // prerequisiteQuest de mq_02_los_sellos
  activateQuest("mq_02_los_sellos");

  const expected = formatText("objectiveQuest", { title: localizeText(QUEST_DATA.mq_02_los_sellos.title) });
  assert.equal(getCurrentObjective(), expected);
});

test("misión relevante al bioma por ítem de collect (no solo por jefe de kill)", () => {
  // collect_fairy_dust pide fairy_dust, que sí dropea en garden (biomeLoot);
  // kill_pirates (declarada antes) no tiene relación con este bioma.
  window.worldMap = { garden_1: { id: "garden_1", biome: "garden" } };
  gameState.currentLocationId = "garden_1";
  activateQuest("kill_pirates");
  activateQuest("collect_fairy_dust");

  const expected = formatText("objectiveQuest", { title: localizeText(QUEST_DATA.collect_fairy_dust.title) });
  assert.equal(getCurrentObjective(), expected);
});

test("sin ninguna misión relevante al bioma actual, cae a la primera activa declarada (nunca se queda sin línea)", () => {
  window.worldMap = { volcano_1: { id: "volcano_1", biome: "volcano" } };
  gameState.currentLocationId = "volcano_1";
  activateQuest("kill_pirates");
  activateQuest("collect_fairy_dust");

  const expected = formatText("objectiveQuest", { title: localizeText(QUEST_DATA.kill_pirates.title) });
  assert.equal(getCurrentObjective(), expected);
});
