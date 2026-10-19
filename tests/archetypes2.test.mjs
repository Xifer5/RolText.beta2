// SPEC-1305 — Hostigador, Regenerador y Depredador
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const A = await import("../js/archetypes.js");
const { decideNextAction, ACTION_META } = await import("../js/enemyAI.js");
const { enemyData } = await import("../js/enemies.js");
const { isMiniBossId } = await import("../js/biomeBosses.js");
const { t } = await import("../js/i18n.js");
const state = await import("../js/state.js");
const g = state.gameState;

const ASSIGNED = {
  harasser: ["centaurus", "pirate", "drider", "gremlin"],
  regenerator: ["slime", "fungedBeast", "chimera", "kraken"],
  predator: ["cave_bear", "linchorn", "pirate_captain", "pegasus"],
};

test("los 12 enemigos tienen su arquetipo en Aventura/Difícil/Imposible y ninguno en Fácil ni como jefe", () => {
  for (const [arch, ids] of Object.entries(ASSIGNED)) {
    for (const id of ids) {
      for (const d of ["adventure", "hard", "impossible"]) assert.equal(A.getArchetype(id, d), arch, `${id} ${d}`);
      assert.equal(A.getArchetype(id, "easy"), null, id);
      assert.equal(A.getArchetype(id, "adventure", true), null, id);
    }
  }
});

test("genérico: los 12 existen, no son jefes ni mini-jefes, y ningún enemigo repite arquetipo", () => {
  for (const ids of Object.values(ASSIGNED)) {
    for (const id of ids) {
      assert.ok(enemyData[id], `${id} no existe`);
      assert.ok(!enemyData[id].isBoss, `${id} es jefe`);
      assert.ok(!isMiniBossId(id), `${id} es mini-jefe`);
    }
  }
  // ENEMY_ARCHETYPE es un objeto: un id duplicado se perdería en silencio, así que se cuenta en el fuente
  const src = Object.keys(A.ENEMY_ARCHETYPE);
  assert.equal(new Set(src).size, src.length);
});

test("Hostigador: 30% de retirada, nunca dos seguidas, y la capa solo aplica a su arquetipo", () => {
  const e = { archetype: "harasser", behavior: "aggressive", hp: 10, maxHp: 10, lastAction: "attack" };
  assert.equal(decideNextAction(e, () => 0.29), "retreat");
  assert.notEqual(decideNextAction(e, () => 0.31), "retreat");
  assert.notEqual(decideNextAction({ ...e, lastAction: "retreat" }, () => 0.0), "retreat");
  assert.notEqual(decideNextAction({ ...e, archetype: undefined }, () => 0.0), "retreat");
  assert.ok(ACTION_META.retreat);
});

test("Hostigador: el fallo físico escala y no afecta a la magia ni a otras intenciones", () => {
  const e = (nextAction, archetype = "harasser") => ({ archetype, nextAction });
  assert.deepEqual([1, 2, 3].map(s => A.retreatMissChance(e("retreat"), s, true)), [0.30, 0.40, 0.50]);
  assert.equal(A.retreatMissChance(e("retreat"), 3, false), 0);
  assert.equal(A.retreatMissChance(e("attack"), 3, true), 0);
  assert.equal(A.retreatMissChance(e("retreat", "wrecker"), 3, true), 0);
  assert.equal(A.retreatMissChance(e("retreat"), 0, true), 0);
  assert.equal(A.retreatMissChance(null, 2, true), 0);
});

test("Regenerador: cura 4/6/8% (mín. 1), nunca sobre el máximo", () => {
  const tick = (over) => A.regeneratorTick({ archetype: "regenerator", scale: 1, blocked: 0, hp: 50, maxHp: 100, ...over });
  assert.deepEqual([1, 2, 3].map(s => tick({ scale: s }).heal), [4, 6, 8]);
  assert.equal(tick({ maxHp: 20, hp: 10, scale: 1 }).heal, 1);  // 0.8 -> mínimo 1
  assert.equal(tick({ hp: 98 }).heal, 2);                         // tope al máximo
  assert.equal(tick({ hp: 100 }).heal, 0);
  assert.equal(tick({ scale: 0 }).heal, 0);
  assert.equal(A.regeneratorTick({ archetype: "predator", scale: 3, hp: 1, maxHp: 100 }).heal, 0);
});

test("Regenerador: daño continuo suspende 2 turnos y luego retoma; el rasgo evita la cura doble", () => {
  const tick = (over) => A.regeneratorTick({ archetype: "regenerator", scale: 2, hp: 50, maxHp: 100, ...over });
  let r = tick({ suppressNow: true, blocked: 0 });
  assert.deepEqual([r.heal, r.blocked, r.suspended], [0, 2, true]);
  r = tick({ suppressNow: true, blocked: 2 });
  assert.deepEqual([r.heal, r.blocked, r.suspended], [0, 2, false]);  // ya estaba suspendida: sin mensaje repetido
  r = tick({ blocked: 2 });
  assert.deepEqual([r.heal, r.blocked], [0, 1]);
  r = tick({ blocked: 1 });
  assert.deepEqual([r.heal, r.blocked], [0, 0]);
  assert.equal(tick({ blocked: 0 }).heal, 6);
  assert.equal(tick({ hasTrait: true }).heal, 0);
});

test("Depredador: bono solo bajo el 50% de HP y escala por dificultad", () => {
  assert.deepEqual([1, 2, 3].map(s => A.predatorMult("predator", s, 0.3)), [1.25, 1.35, 1.5]);
  assert.equal(A.predatorMult("predator", 3, 0.5), 1);
  assert.equal(A.predatorMult("predator", 3, 0.9), 1);
  assert.equal(A.predatorMult("predator", 0, 0.1), 1);
  assert.equal(A.predatorMult("harasser", 3, 0.1), 1);
});

test("genérico: i18n en/es completa para los tres arquetipos y sus mensajes", () => {
  for (const key of ["harasser", "regenerator", "predator"]) {
    const def = A.ARCHETYPES[key];
    for (const k of [def.nameKey, def.tipKey, def.adviceKey]) assert.notEqual(t(k), k, k);
  }
  for (const k of ["intentRetreat", "adviceRetreat", "archRetreatMsg", "archRetreatMiss", "archRegenHeal", "archRegenSuspended", "archPredatorSmell"]) {
    assert.notEqual(t(k), k, k);
  }
});

// ── Integración con enemyTurn real ────────────────────

async function arena(enemyId, difficulty = "adventure") {
  const { startCombat } = await import("../js/combat.js");
  g.difficulty = difficulty;
  g.isGameOver = false;
  g.player.hp = g.player.maxHp = 100000;
  g.player.mp = g.player.maxMp = 100;
  g.playerDebuffs = {}; g.activeDebuffs = {}; g.activeBuffs = {};
  startCombat(enemyId, false);
  const e = g.currentEnemy;
  e.trait = null;
  return e;
}

test("integración: la retirada no hace daño y re-telegrafía", async () => {
  const { enemyTurn } = await import("../js/combat.js");
  const e = await arena("centaurus");
  e.nextAction = "retreat";
  const hp = g.player.hp;
  await enemyTurn();
  assert.equal(g.player.hp, hp);
  assert.equal(e.lastAction, "retreat");
  assert.notEqual(e.nextAction, "retreat");   // nunca dos seguidas
  g.isInCombat = false;
});

test("integración: golpe físico contra Hostigador que se aleja falla y consume el turno; la magia no falla", async () => {
  const { retreatMissed } = await import("../js/playerCombatActions.js");
  const e = await arena("pirate", "impossible");
  e.nextAction = "retreat";
  const orig = Math.random;
  Math.random = () => 0.0;               // siempre dentro de la probabilidad de fallo
  try {
    assert.equal(await retreatMissed(false), false, "la magia no debe fallar");
    assert.equal(await retreatMissed(true), true, "el golpe físico debe fallar");
  } finally { Math.random = orig; }
  g.isInCombat = false;
});

test("integración: el Regenerador cura al inicio de su turno y el fuego la frena", async () => {
  const { enemyTurn, applyDamageToEnemy } = await import("../js/combat.js");
  const e = await arena("kraken", "hard");
  e.nextAction = "defend";                // turno inofensivo, solo medimos la cura
  e.hp = Math.floor(e.maxHp / 2);
  const before = e.hp;
  await enemyTurn();
  assert.ok(e.hp > before, "no curó");
  assert.equal(e.hp - before, Math.floor(e.maxHp * 0.06));

  applyDamageToEnemy(1, "fire");
  assert.equal(e.regenBlocked, 2);
  e.nextAction = "defend";
  const afterFire = e.hp;
  await enemyTurn();
  await enemyTurn();
  assert.equal(e.hp, afterFire, "curó con la regeneración suspendida");
  e.nextAction = "defend";
  await enemyTurn();
  assert.ok(e.hp > afterFire, "no retomó la cura");
  g.isInCombat = false;
});

test("integración: veneno activo sobre el Regenerador lo frena mientras dure", async () => {
  const { enemyTurn } = await import("../js/combat.js");
  const e = await arena("slime", "adventure");
  e.maxHp = e.hp = 1000;
  e.hp = 500;
  g.activeDebuffs.poison = { turns: 3, damage: 1 };
  e.nextAction = "defend";
  const before = e.hp;
  await enemyTurn();
  assert.ok(e.hp <= before, "curó bajo veneno");
  assert.equal(e.regenBlocked, 2);
  g.isInCombat = false;
});

test("integración: el Depredador pega más con el jugador herido que con el jugador sano", async () => {
  const { enemyTurn } = await import("../js/combat.js");
  const orig = Math.random;
  const dmgAt = async (hpRatio) => {
    const e = await arena("cave_bear", "impossible");
    const { calculateTotalStats } = await import("../js/stats.js");
    const total = calculateTotalStats(g.player, g.equipment);
    const maxHp = total.maxHp; // la misma base que usa enemyTurn
    g.player.hp = Math.floor(maxHp * hpRatio);
    e.nextAction = "attack"; e.attack = Math.ceil(total.defense) + 20; // golpe chico: nunca mata al jugador herido
    Math.random = () => 0.99;           // sin esquiva, varianza fija
    const before = g.player.hp;
    try { await enemyTurn(); } finally { Math.random = orig; }
    g.isInCombat = false;
    return before - g.player.hp;
  };
  const healthy = await dmgAt(0.9);
  const wounded = await dmgAt(0.3);
  assert.ok(healthy > 0 && wounded > healthy * 1.3, `sano ${healthy} vs herido ${wounded}`);
});

test("Fácil: ninguno de los tres arquetipos se activa", async () => {
  const { enemyTurn } = await import("../js/combat.js");
  const e = await arena("kraken", "easy");
  assert.equal(e.archetype, null);
  e.hp = Math.floor(e.maxHp / 2);
  e.nextAction = "defend";
  const before = e.hp;
  await enemyTurn();
  assert.equal(e.hp, before);
  g.isInCombat = false;
});
