// SPEC-0602 — debilidad y ceguera
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { ENEMY_STATUS_EFFECTS, NON_DOT_DEBUFFS } = await import("../js/combat.js");
const { enemyData } = await import("../js/enemies.js");
const { t } = await import("../js/i18n.js");

test("SPEC-0602: enemigos de la spec aplican el estado correcto", () => {
  for (const id of ["cave_bat", "goblin", "wolf", "cave_bear", "chimera"]) assert.equal(ENEMY_STATUS_EFFECTS[id]?.type, "bleed", id);
  for (const id of ["cultist", "dark_knight", "diablo", "imp"]) assert.equal(ENEMY_STATUS_EFFECTS[id]?.type, "weakness", id);
  for (const id of ["beholder", "medusa", "sand_worm"]) assert.equal(ENEMY_STATUS_EFFECTS[id]?.type, "blind", id);
});

test("SPEC-0602: todo enemigo con status existe en enemyData y los no-DoT no llevan damage", () => {
  for (const [id, se] of Object.entries(ENEMY_STATUS_EFFECTS)) {
    assert.ok(enemyData[id], `${id} no existe en enemyData`);
    if (NON_DOT_DEBUFFS.includes(se.type)) assert.equal(se.damage, undefined, id);
  }
});

test("SPEC-0602: claves i18n de debilidad/ceguera existen", () => {
  for (const k of ["enemyWeaknessEffect", "enemyBlindEffect", "weaknessWearsOff", "blindWearsOff", "blindMiss", "blindMissFloat", "statusWeakness", "statusBlind"]) {
    assert.notEqual(t(k), k, k);
  }
});
