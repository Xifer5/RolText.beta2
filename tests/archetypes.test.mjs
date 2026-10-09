// SPEC-1303 (entrega 1) — arquetipos físicos de enemigo
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const A = await import("../js/archetypes.js");
const { decideNextAction, ACTION_META } = await import("../js/enemyAI.js");
const { enemyData } = await import("../js/enemies.js");
const { t } = await import("../js/i18n.js");
const { computeDodgeChance } = await import("../js/dodge.js");

test("getArchetype: Fácil y jefes no tienen arquetipo", () => {
  assert.equal(A.getArchetype("orc", "adventure"), "wrecker");
  assert.equal(A.getArchetype("orc", "hard"), "wrecker");
  assert.equal(A.getArchetype("orc", "impossible"), "wrecker");
  assert.equal(A.getArchetype("orc", "easy"), null);
  assert.equal(A.getArchetype("orc", "adventure", true), null);
  assert.equal(A.getArchetype("slime", "adventure"), null);
});

test("archetypeScale por dificultad", () => {
  assert.deepEqual(["easy", "adventure", "hard", "impossible", "?"].map(A.archetypeScale), [0, 1, 2, 3, 0]);
});

test("Rompeguardia: solo el golpe pesado atraviesa Defender, y escala", () => {
  assert.equal(A.wreckerDefendMult("wrecker", 1, "power_attack"), 0.75);
  assert.equal(A.wreckerDefendMult("wrecker", 2, "power_attack"), 0.85);
  assert.equal(A.wreckerDefendMult("wrecker", 3, "power_attack"), 1.0);
  assert.equal(A.wreckerDefendMult("wrecker", 1, "attack"), null);
  assert.equal(A.wreckerDefendMult("wrecker", 0, "power_attack"), null);
  assert.equal(A.wreckerDefendMult("guardian", 1, "power_attack"), null);
});

test("Asaltante: bonus de esquiva solo contra su ataque normal; baja con la dificultad", () => {
  assert.equal(A.skirmisherDodgeBonus("skirmisher", 1, "attack"), 0.15);
  assert.equal(A.skirmisherDodgeBonus("skirmisher", 2, "attack"), 0.10);
  assert.equal(A.skirmisherDodgeBonus("skirmisher", 3, "attack"), 0.05);
  assert.equal(A.skirmisherDodgeBonus("skirmisher", 1, "power_attack"), 0);
  assert.equal(A.skirmisherDodgeBonus("wrecker", 1, "attack"), 0);
  // se integra con computeDodgeChance sin romper el tope
  const passive = 0.1 + A.skirmisherDodgeBonus("skirmisher", 1, "attack");
  assert.ok(Math.abs(computeDodgeChance({ passive, tactical: true }) - 0.25) < 1e-9);
});

test("Guardián: refleja física solo en guardia, escala, y nunca mata", () => {
  const base = { archetype: "guardian", scale: 1, isDefending: true, isPhysical: true, dmg: 100, playerHp: 500 };
  assert.equal(A.guardianReflect(base), 30);
  assert.equal(A.guardianReflect({ ...base, scale: 2 }), 40);
  assert.equal(A.guardianReflect({ ...base, scale: 3 }), 50);
  assert.equal(A.guardianReflect({ ...base, isDefending: false }), 0);
  assert.equal(A.guardianReflect({ ...base, isPhysical: false }), 0);
  assert.equal(A.guardianReflect({ ...base, archetype: "wrecker" }), 0);
  assert.equal(A.guardianReflect({ ...base, scale: 0 }), 0);
  assert.equal(A.guardianReflect({ ...base, playerHp: 10 }), 9);   // deja 1 HP
  assert.equal(A.guardianReflect({ ...base, playerHp: 1 }), 0);
});

test("Canalizador: multiplicador por escala", () => {
  assert.deepEqual([0, 1, 2, 3].map(A.channelerMult), [1, 1.5, 1.75, 2.0]);
});

test("decideNextAction Canalizador: channel -> channeled_magic -> (azar)", () => {
  const e = { archetype: "channeler", magicAttack: 12, hp: 10, maxHp: 10, lastAction: "attack" };
  assert.equal(decideNextAction(e, () => 0.1), "channel");
  assert.equal(decideNextAction(e, () => 0.9), "attack");
  assert.equal(decideNextAction({ ...e, lastAction: "channel" }, () => 0.9), "channeled_magic");
  assert.equal(decideNextAction({ ...e, lastAction: "channeled_magic" }, () => 0.1), "channel");
  // sin magia, el arquetipo no aplica y cae al behavior normal
  assert.notEqual(decideNextAction({ ...e, magicAttack: 0, behavior: "aggressive" }, () => 0.1), "channel");
  // sin arquetipo: comportamiento original intacto
  assert.notEqual(decideNextAction({ ...e, archetype: undefined, behavior: "mage" }, () => 0.0), "channel");
});

test("genérico: todo ENEMY_ARCHETYPE existe, no es jefe y su arquetipo está definido", () => {
  for (const [id, key] of Object.entries(A.ENEMY_ARCHETYPE)) {
    assert.ok(enemyData[id], `${id} no existe en enemyData`);
    assert.ok(!enemyData[id].isBoss, `${id} es jefe`);
    assert.ok(A.ARCHETYPES[key], `arquetipo ${key} sin definición`);
  }
});

test("genérico: toda definición de arquetipo y acción nueva tiene i18n", () => {
  for (const def of Object.values(A.ARCHETYPES)) {
    for (const k of [def.nameKey, def.tipKey, def.adviceKey]) assert.notEqual(t(k), k, k);
  }
  for (const k of ["intentChannel", "intentChanneledMagic", "adviceChannel", "adviceChanneledMagic", "archChannelMsg", "archWreckerBreaks", "archGuardianReflect"]) {
    assert.notEqual(t(k), k, k);
  }
  assert.ok(ACTION_META.channel && ACTION_META.channeled_magic);
});
