import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { calculateTotalStats, calculateMagicAttack, applyDerivedMaxes, migratePermanentBonuses } = await import("../js/stats.js");
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
