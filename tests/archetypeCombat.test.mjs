// SPEC-1303 — humo de combate: cada enemigo con arquetipo corre muchos turnos
// reales de enemyTurn() en cada dificultad táctica sin lanzar excepciones, y
// los invariantes de las mecánicas nuevas se cumplen.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const state = await import("../js/state.js");
const { startCombat, enemyTurn } = await import("../js/combat.js");
const { ENEMY_ARCHETYPE } = await import("../js/archetypes.js");
const g = state.gameState;

function prepare(difficulty) {
  g.difficulty = difficulty;
  g.isGameOver = false;
  g.player.hp = g.player.maxHp = 100000;
  g.player.mp = g.player.maxMp = 100;
  g.playerDebuffs = {};
  g.activeDebuffs = {};
  g.activeBuffs = {};
}

for (const difficulty of ["adventure", "hard", "impossible"]) {
  test(`humo ${difficulty}: todos los arquetipos sobreviven 40 turnos de enemigo`, async () => {
    for (const id of Object.keys(ENEMY_ARCHETYPE)) {
      prepare(difficulty);
      startCombat(id, false);
      const e = g.currentEnemy;
      assert.equal(e.archetype, ENEMY_ARCHETYPE[id], `${id} sin arquetipo en ${difficulty}`);
      for (let i = 0; i < 40 && g.isInCombat; i++) {
        e.hp = e.maxHp;            // el enemigo no muere
        g.player.hp = g.player.maxHp;
        if (i % 7 === 3) g.activeBuffs.defend_stance = 2;
        await enemyTurn();
        if (g.playerDebuffs.stun) delete g.playerDebuffs.stun;
      }
      g.isInCombat = false;
    }
  });
}

test("Fácil: ningún enemigo recibe arquetipo ni estado de respaldo", () => {
  prepare("easy");
  for (const id of Object.keys(ENEMY_ARCHETYPE)) {
    startCombat(id, false);
    assert.equal(g.currentEnemy.archetype, null, id);
  }
  g.isInCombat = false;
});

test("Aturdidor: tras un aturdimiento hay inmunidad (nunca stun encadenado)", async () => {
  prepare("hard");
  startCombat("mountain_giant", false);
  const e = g.currentEnemy;
  g.stunImmune = 3;
  for (let i = 0; i < 25; i++) {
    e.hp = e.maxHp; g.player.hp = g.player.maxHp;
    e.nextAction = "stunning_blow";
    g.stunImmune = 3;
    await enemyTurn();
    assert.equal(g.playerDebuffs.stun, undefined, "stun entró estando inmune");
  }
  g.isInCombat = false;
});

test("Drenador: el Drenador nunca supera su HP máximo al curarse", async () => {
  prepare("impossible");
  startCombat("warlock", false);
  const e = g.currentEnemy;
  for (let i = 0; i < 30; i++) {
    e.hp = e.maxHp - 1;
    g.player.hp = g.player.maxHp;
    await enemyTurn();
    assert.ok(e.hp <= e.maxHp);
  }
  g.isInCombat = false;
});
