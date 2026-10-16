// SPEC-1302 — Esquivar: probabilidad combinada y compuertas por dificultad
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  computeDodgeChance, isTacticalDifficulty, DODGEABLE_ACTIONS,
  DODGE_MAX, DODGE_MIN, EXPOSED_DAMAGE_MULT
} = await import("../js/dodge.js");
const { t } = await import("../js/i18n.js");
const fs = await import("node:fs");

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !~ ${b}`);

test("botón suma 0.35 a la pasiva (tactical)", () => {
  near(computeDodgeChance({ passive: 0.2, buttonActive: true, tactical: true }), 0.55);
  near(computeDodgeChance({ passive: 0, buttonActive: true, tactical: true }), 0.35);
});

test("tope 0.85 y mínimo 0.10 con botón", () => {
  near(computeDodgeChance({ passive: 0.7, buttonActive: true, tactical: true }), DODGE_MAX);
  near(computeDodgeChance({ passive: -0.5, buttonActive: true, tactical: true }), DODGE_MIN);
});

test("sin botón (tactical): pasiva topada en 0.85", () => {
  near(computeDodgeChance({ passive: 0.95, tactical: true }), DODGE_MAX);
  near(computeDodgeChance({ passive: 0.3, tactical: true }), 0.3);
});

test("Fácil: pasiva intacta, sin tope ni penalización a la magia", () => {
  near(computeDodgeChance({ passive: 0.95, tactical: false }), 0.95);
  near(computeDodgeChance({ passive: 0.4, isMagic: true, tactical: false }), 0.4);
  near(computeDodgeChance({ passive: 0.4, buttonActive: true, tactical: false }), 0.4);
});

test("magia (tactical): ×0.5 después del tope", () => {
  near(computeDodgeChance({ passive: 0.2, buttonActive: true, isMagic: true, tactical: true }), 0.275);
  near(computeDodgeChance({ passive: 0.9, buttonActive: true, isMagic: true, tactical: true }), DODGE_MAX * 0.5);
});

test("isTacticalDifficulty por dificultad", () => {
  assert.equal(isTacticalDifficulty("easy"), false);
  for (const d of ["adventure", "hard", "impossible"]) assert.equal(isTacticalDifficulty(d), true, d);
});

test("DODGEABLE_ACTIONS solo acciones que atacan", () => {
  assert.deepEqual([...DODGEABLE_ACTIONS].sort(), ["attack", "channeled_magic", "magic", "power_attack", "stunning_blow"]);
  assert.equal(EXPOSED_DAMAGE_MULT, 1.25);
});

test("tecla 9 → pixel:dodge y existen los botones", () => {
  assert.match(fs.readFileSync("js/keyboard.js", "utf8"), /"9":\s*"pixel:dodge"/);
  const html = fs.readFileSync("index.html", "utf8");
  assert.match(html, /id="dodgeBtn"[^>]*\bhidden\b|class="combat-btn dodge hidden" id="dodgeBtn"/);
  assert.match(html, /id="mob-dodgeBtn"/);
});

test("claves i18n de Esquivar existen", () => {
  for (const k of ["combatDodge", "combatDodgeAria", "dodgeStanceMsg", "dodgeSuccess", "dodgeFail", "exposedBonusTag", "intentDodgeable", "dodgeTooltip"]) {
    assert.notEqual(t(k), k, k);
  }
});

test("playerDodge: en Fácil no cambia el estado; en Aventura pone la postura", async () => {
  const state = await import("../js/state.js");
  const { playerDodge } = await import("../js/playerCombatActions.js");
  const g = state.gameState;
  g.isInCombat = true; g.activeBuffs = {}; g.difficulty = "easy";
  await playerDodge();
  assert.equal(g.activeBuffs.dodge_stance, undefined);
  g.difficulty = "adventure"; g.currentEnemy = null;
  // sin enemigo, enemyTurn() retorna de inmediato; tickBuffs deja 1 turno restante
  await playerDodge();
  assert.equal(g.activeBuffs.dodge_stance, 1);
  g.isInCombat = false; g.activeBuffs = {}; g.difficulty = "easy";
});

test("cada evento de COMBAT_KEYS tiene click de escritorio Y móvil cableado en ui.js", () => {
  const kb = fs.readFileSync("js/keyboard.js", "utf8");
  const ui = fs.readFileSync("js/ui.js", "utf8");
  const events = [...kb.matchAll(/"(\d)":\s*"(pixel:\w+)"/g)].map(m => m[2]);
  assert.ok(events.length >= 7);
  for (const ev of events) {
    const hits = ui.split(`new Event("${ev}")`).length - 1;
    // flee/attack/magic/defend/... → botón de escritorio + botón móvil
    assert.ok(hits >= 2, `${ev} debería despacharse desde escritorio y móvil (hits=${hits})`);
  }
});
