import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { calculateTotalStats, calculateMagicAttack, applyDerivedMaxes, migratePermanentBonuses, statDiffLines, formatStatDiff, increaseStat } = await import("../js/stats.js");
// namespace, no destructuring: resetState() reasigna gameState y el snapshot quedaría obsoleto
const state = await import("../js/state.js");

const basePlayer = () => ({
  class: "warrior",
  strength: 10, agility: 8, intelligence: 6,
  hp: 50, mp: 20, bonusHp: 0, bonusMp: 0, hpBonus: 0,
});

test("stats derivadas sin equipo: ATK=STR, DEF=AGI/2, MAG=INT", () => {
  const s = calculateTotalStats(basePlayer(), {});
  assert.equal(s.attack, 10);
  assert.equal(s.defense, 4);
  assert.equal(s.magic, 6);
  assert.equal(s.maxHp, 80 + 10 * 2);
});

test("el equipo suma atributos y bonos directos", () => {
  const eq = {
    rightHand: { id: "sword", attack: 5, strength: 2 },
    armor: { id: "chainmail", defense: 3, hpBonus: 10 },
  };
  const s = calculateTotalStats(basePlayer(), eq);
  assert.equal(s.strength, 12);
  assert.equal(s.attack, 12 + 5);
  assert.equal(s.defense, 4 + 3);
  assert.equal(s.maxHp, 80 + 12 * 2 + 10);
});

// SPEC-1228 — bug real: ~10 ítems (báculos/varitas/anillos) traen un campo
// `mp` en su definición junto a intelligence/magic, pero calculateTotalStats()
// nunca lo sumaba a maxMp -- el jugador equipaba "+X MP" y solo pasaba lo de
// INT/MAG, el maná máximo no se movía.
test("el equipo con campo `mp` (báculos/varitas/anillos) SÍ suma a maxMp", () => {
  // basePlayer() es warrior -> mpPerInt = 5. +3 INT ya sube maxMp por su
  // cuenta (15); lo que se está probando es el `+5` extra del campo `mp`,
  // que antes del fix no se sumaba en absoluto.
  const base = calculateTotalStats(basePlayer(), {});
  const eqSinMp = { rightHand: { id: "staff_test", intelligence: 3, magic: 5 } };
  const eqConMp = { rightHand: { id: "staff_test", intelligence: 3, magic: 5, mp: 5 } };
  const withoutMpField = calculateTotalStats(basePlayer(), eqSinMp);
  const withMpField = calculateTotalStats(basePlayer(), eqConMp);
  assert.equal(withoutMpField.maxMp, base.maxMp + 3 * 5, "el bono de maxMp por INT sí debía funcionar ya");
  assert.equal(withMpField.maxMp, withoutMpField.maxMp + 5, "el campo `mp` del ítem debe sumar aparte, no ignorarse");
});

test("resistencias: clase base + item propio + tabla ITEM_RESISTANCES", () => {
  const eq = {
    armor: { id: "chainmail" },                       // tabla: pierce 15
    ring: { id: "x", resistances: { fire: 10 } },     // propia
  };
  const s = calculateTotalStats(basePlayer(), eq);
  assert.equal(s.resistances.physical, 10);  // warrior base
  assert.equal(s.resistances.blunt, 5);      // warrior base
  assert.equal(s.resistances.pierce, 15);
  assert.equal(s.resistances.fire, 10);
});

test("hp/mp actuales quedan limitados por los máximos", () => {
  const p = { ...basePlayer(), hp: 9999, mp: 9999 };
  const s = calculateTotalStats(p, {});
  assert.equal(s.hp, s.maxHp);
  assert.equal(s.mp, s.maxMp);
});

test("mago escala MP con INT ×15", () => {
  const p = { ...basePlayer(), class: "mage" };
  const s = calculateTotalStats(p, {});
  assert.equal(s.maxMp, 20 + 6 * 15);
});

test("calculateMagicAttack = magia × 1.5 redondeado", () => {
  assert.equal(calculateMagicAttack({ magic: 10 }), 15);
  assert.equal(calculateMagicAttack({ magic: 7 }), 11);
  assert.equal(calculateMagicAttack({}), 0);
});

// ── permanentHpBonus / permanentMpBonus — única fuente de verdad de máximos ──

test("los bonos permanentes entran en la fórmula de máximos", () => {
  const p = { ...basePlayer(), permanentHpBonus: 45, permanentMpBonus: 24 };
  const s = calculateTotalStats(p, {});
  assert.equal(s.maxHp, 80 + 10 * 2 + 45);
  assert.equal(s.maxMp, 20 + 6 * 5 + 24);
});

test("migración: reconstruye level-ups de saves antiguos como bono permanente", () => {
  // warrior con 2 level-ups (+15 HP, +3 MP cada uno) acumulados a la antigua
  const p = { ...basePlayer(), maxHp: 130, maxMp: 56 };
  delete p.permanentHpBonus;
  assert.equal(migratePermanentBonuses(p, {}), true);
  assert.equal(p.permanentHpBonus, 30);
  assert.equal(p.permanentMpBonus, 6);
  // idempotente: un save ya migrado no se toca
  assert.equal(migratePermanentBonuses(p, {}), false);
  assert.equal(p.permanentHpBonus, 30);
});

test("migración: no inventa bono si el máximo guardado no supera la fórmula", () => {
  const p = { ...basePlayer(), maxHp: 90, maxMp: 40 };
  delete p.permanentHpBonus;
  migratePermanentBonuses(p, {});
  assert.equal(p.permanentHpBonus, 0);
  assert.equal(p.permanentMpBonus, 0);
});

test("applyDerivedMaxes sincroniza maxHp/maxMp y clampa hp/mp", () => {
  state.resetState();
  const p = () => state.gameState.player;
  const before = p().maxHp;
  p().permanentHpBonus += 20;
  applyDerivedMaxes();
  assert.equal(p().maxHp, before + 20);
  p().hp = p().maxHp;
  p().permanentHpBonus -= 20;
  applyDerivedMaxes();
  assert.equal(p().hp, before); // clampeado al nuevo máximo
});

test("regresión: recalcular tras gastar un punto de stat ya no borra los level-ups", () => {
  state.resetState();
  const p = () => state.gameState.player;
  p().permanentHpBonus = 30;    // dos level-ups de guerrero
  applyDerivedMaxes();
  const withLevels = p().maxHp;
  p().strength += 1;            // lo que hace increaseStat antes de recalcular
  applyDerivedMaxes();
  assert.equal(p().maxHp, withLevels + 2); // +2 por STR, sin perder los +30
});

// ── statDiffLines / formatStatDiff — SPEC-1209, visibilidad de build ──

test("statDiffLines: solo devuelve las stats que realmente cambiaron", () => {
  const before = calculateTotalStats(basePlayer(), {});
  const after = calculateTotalStats({ ...basePlayer(), strength: 12 }, {});
  const diffs = statDiffLines(before, after);
  assert.equal(diffs.length, 2); // attack y maxHp cambian con STR; defense/magic/maxMp no
  const byKey = Object.fromEntries(diffs.map(d => [d.key, d]));
  assert.equal(byKey.attack.before, 10);
  assert.equal(byKey.attack.after, 12);
  assert.equal(byKey.attack.delta, 2);
  assert.equal(byKey.maxHp.delta, 4); // +2 STR × 2
});

test("statDiffLines: +1 AGI que no mueve floor(agi/2) no genera diff falso", () => {
  // agility par → +1 sigue dando el mismo floor(agi/2)
  const before = calculateTotalStats({ ...basePlayer(), agility: 8 }, {});
  const after = calculateTotalStats({ ...basePlayer(), agility: 9 }, {});
  const diffs = statDiffLines(before, after);
  assert.equal(diffs.length, 0);
});

test("statDiffLines: sin cambios reales, devuelve array vacío", () => {
  const s = calculateTotalStats(basePlayer(), {});
  assert.deepEqual(statDiffLines(s, s), []);
});

test("formatStatDiff: formatea antes→después con signo en el delta", () => {
  const diffs = [{ key: "attack", icon: "⚔️", before: 10, after: 14, delta: 4 }];
  assert.equal(formatStatDiff(diffs), "⚔️ 10→14 (+4)");
});

test("increaseStat: gasta el punto y aplica exactamente +1 al atributo elegido", () => {
  state.resetState();
  const p = () => state.gameState.player;
  p().statPoints = 3;
  const str0 = p().strength;
  assert.equal(increaseStat("strength"), true);
  assert.equal(p().strength, str0 + 1);
  assert.equal(p().statPoints, 2);
});

test("increaseStat: sin puntos disponibles, no muta nada y devuelve false", () => {
  state.resetState();
  const p = () => state.gameState.player;
  p().statPoints = 0;
  const str0 = p().strength;
  assert.equal(increaseStat("strength"), false);
  assert.equal(p().strength, str0);
});
