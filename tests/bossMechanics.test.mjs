// SPEC-1219 (Fase 4 del plan docs/PLAN-HISTORIA-FASE4.md) — clímax de 4
// fases del Rey Dragón, cada una evoca la mecánica de un jefe de zona ya
// vencido (guardia/devorar/sobrecarga/quemadura final).
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { updateBossPhase, rollForcedBossAction } = await import("../js/bossMechanics.js");

function dragonKing(hpRatio, overrides = {}) {
  return { id: "dragon_king", type: "Dragon", maxHp: 1000, hp: Math.round(hpRatio * 1000), hasGuard: true, ...overrides };
}

test("updateBossPhase: 4 fases por umbral de HP (75/50/25), nunca retrocede", () => {
  const e = dragonKing(1);
  updateBossPhase(e);
  assert.equal(e.bossPhase, 1);
  e.hp = 700; // 70% -> fase 2
  updateBossPhase(e);
  assert.equal(e.bossPhase, 2);
  e.hp = 900; // subir HP no debe hacer retroceder la fase
  updateBossPhase(e);
  assert.equal(e.bossPhase, 2);
  e.hp = 400; // 40% -> fase 3
  updateBossPhase(e);
  assert.equal(e.bossPhase, 3);
  e.hp = 100; // 10% -> fase 4
  updateBossPhase(e);
  assert.equal(e.bossPhase, 4);
});

test("updateBossPhase: apaga hasGuard (guardia de fase 1) al escalar a fase 2+", () => {
  const e = dragonKing(1, { hasGuard: true });
  updateBossPhase(e); // fase 1, sigue con guardia
  assert.equal(e.hasGuard, true);
  e.hp = 700;
  updateBossPhase(e); // escala a fase 2
  assert.equal(e.hasGuard, false);
});

test("updateBossPhase: no toca enemigos sin behavior boss_phased", () => {
  const e = { id: "forest_titan", maxHp: 1000, hp: 100 };
  updateBossPhase(e);
  assert.equal(e.bossPhase, undefined, "forest_titan no usa el sistema de fases");
});

test("rollForcedBossAction: fase 2 fuerza 'devour' al 3er turno (mismo contador que cave_devourer)", () => {
  const e = dragonKing(0.7, { bossPhase: 2 });
  assert.equal(rollForcedBossAction(e), null, "turno 1: todavía no");
  assert.equal(rollForcedBossAction(e), null, "turno 2: todavía no");
  assert.equal(rollForcedBossAction(e), "devour", "turno 3: fuerza devour");
});

test("rollForcedBossAction: fase 3 fuerza 'overload' al 4to turno (mismo contador que ancient_construct)", () => {
  const e = dragonKing(0.4, { bossPhase: 3 });
  assert.equal(rollForcedBossAction(e), null);
  assert.equal(rollForcedBossAction(e), null);
  assert.equal(rollForcedBossAction(e), null);
  assert.equal(rollForcedBossAction(e), "overload");
});

test("rollForcedBossAction: fase 1 y 4 no fuerzan ninguna acción especial", () => {
  assert.equal(rollForcedBossAction(dragonKing(1, { bossPhase: 1 })), null);
  assert.equal(rollForcedBossAction(dragonKing(0.1, { bossPhase: 4 })), null);
});
