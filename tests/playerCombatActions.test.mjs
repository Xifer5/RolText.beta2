// SPEC-1224 — fix real: las habilidades universales aprendidas por
// pergamino (rally/power_strike/arcane_bolt, LEARNABLE_SKILLS en classes.js)
// se mostraban como botones en la UI (getAvailableSkills las mezclaba para
// eso), pero useSkill() solo buscaba en SKILLS_BY_CLASS[playerClass] --
// nunca encontraba estos ids y caía siempre en "habilidad no encontrada",
// sin gastar maná ni hacer nada. El jugador las compraba y no pasaba nada.
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { startCombat } from "../js/combat.js";
import { useSkill } from "../js/playerCombatActions.js";
import { learnUniversalSkill } from "../js/classes.js";

document.getElementById = (id) => id === "story" ? { insertBefore() {}, firstChild: null } : null;

beforeEach(() => {
  resetState();
  startCombat("slime", false);
  gameState.currentEnemy.hp = 500; // que ninguna skill lo mate de un golpe
  gameState.currentEnemy.maxHp = 500;
});

test("useSkill: power_strike aprendido por pergamino SÍ hace daño real (antes caía en skillNotFound)", async () => {
  learnUniversalSkill(gameState, "power_strike");
  const hpBefore = gameState.currentEnemy.hp;
  const mpBefore = gameState.player.mp;
  await useSkill("power_strike");
  assert.ok(gameState.currentEnemy.hp < hpBefore, "debe hacer daño real al enemigo");
  assert.ok(gameState.player.mp < mpBefore, "debe gastar maná");
  assert.ok(!gameState.messages.some(m => m.text === "Habilidad no encontrada."), "no debe caer en skillNotFound");
});

test("useSkill: arcane_bolt aprendido hace daño mágico puro", async () => {
  learnUniversalSkill(gameState, "arcane_bolt");
  const hpBefore = gameState.currentEnemy.hp;
  await useSkill("arcane_bolt");
  assert.ok(gameState.currentEnemy.hp < hpBefore);
});

test("useSkill: rally aprendido cura HP y elimina un debuff activo (removeOneDebuff no se leía en ningún lado)", async () => {
  learnUniversalSkill(gameState, "rally");
  gameState.player.hp = 10;
  gameState.activeDebuffs = { poison: { turns: 3, damage: 5 } };
  await useSkill("rally");
  assert.ok(gameState.player.hp > 10, "debe curar HP");
  assert.equal(gameState.activeDebuffs.poison, undefined, "debe eliminar el debuff activo");
});

test("useSkill: sin haber aprendido la habilidad, sigue devolviendo skillNotFound (no se ejecuta gratis)", async () => {
  const hpBefore = gameState.currentEnemy.hp;
  await useSkill("power_strike"); // nunca se aprendió
  assert.equal(gameState.currentEnemy.hp, hpBefore, "no debe hacer nada si no se aprendió");
  assert.ok(gameState.messages.some(m => m.text === "Habilidad no encontrada."));
});
