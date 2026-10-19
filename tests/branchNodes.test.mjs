// SPEC-1306 — nodos de rama de héroe
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const B = await import("../js/branchNodes.js");
const { SPECIALIZATIONS } = await import("../js/specializations.js");
const { SKILLS_BY_CLASS } = await import("../js/classes.js");
const { TECHNIQUES } = await import("../js/weaponTechniques.js");
const { computeDodgeChance } = await import("../js/dodge.js");
const { t } = await import("../js/i18n.js");
const state = await import("../js/state.js");
const g = state.gameState;

const SPECS = Object.keys(SPECIALIZATIONS);
const fixed = (v) => () => v;
const hero = (spec, level, extra = {}) => ({
  class: SPECIALIZATIONS[spec].class, specialization: spec, level, gold: 100000, branchPicks: {}, ...extra,
});
const ctx = (over = {}) => ({ attack: 100, magicAttack: 80, maxHp: 200, hp: 200, enemy: {}, resistances: {}, passives: {}, ...over });
const run = (id, over, rng = 0.5) => B.resolveBranchActive(id, ctx(over), fixed(rng));

test("las 9 ramas tienen exactamente 1 activa de nivel 10, 2 opciones de nivel 15 y 1 activa de nivel 20", () => {
  assert.deepEqual(Object.keys(B.BRANCH_NODES).sort(), [...SPECS].sort());
  for (const spec of SPECS) {
    const n = B.BRANCH_NODES[spec];
    assert.ok(n[10].cooldown >= 1 && n[20].cooldown >= 1, spec);
    assert.deepEqual(Object.keys(n[15]).sort(), ["a", "b"], spec);
    for (const c of ["a", "b"]) assert.ok(Object.keys(n[15][c].effect).length === 1, `${spec} ${c}`);
  }
  assert.equal(B.BRANCH_ACTIVE_IDS.length, 18);
});

test("genérico: i18n de los 36 nodos y ids sin solape con habilidades de clase ni técnicas de arma", () => {
  for (const spec of SPECS) {
    for (const slot of ["10", "15a", "15b", "20"]) {
      for (const k of [B.nodeNameKey(spec, slot), B.nodeDescKey(spec, slot)]) assert.notEqual(t(k), k, k);
    }
  }
  const classSkillIds = new Set(Object.values(SKILLS_BY_CLASS).flat().map(s => s.id));
  for (const id of B.BRANCH_ACTIVE_IDS) {
    assert.ok(!classSkillIds.has(id) && !TECHNIQUES[id], `${id} solapa`);
  }
  for (const k of ["brSectionTitle", "brPickPending", "brRespecPicks", "brChangeTo", "brNeedGold", "brInCombat", "brEasyNote",
    "brTrapSet", "brTrapTriggered", "brRewindMsg", "brStatusBlocked", "brMarkMsg", "brCurseMsg", "techUsedUp",
    "brPickPendingMsg", "brNewActiveMsg", "brSelfDamage"]) assert.notEqual(t(k), k, k);
});

test("estado de nodos por nivel: 12 solo nivel 10; 15 sin elección queda pendiente; 20 suma el remate", () => {
  let st = B.nodeState(hero("tank", 12));
  assert.deepEqual([st[10].unlocked, st[15].unlocked, st[20].unlocked], [true, false, false]);
  st = B.nodeState(hero("tank", 15));
  assert.deepEqual([st[15].unlocked, st[15].pending, st[15].pick], [true, true, null]);
  st = B.nodeState(hero("tank", 20, { branchPicks: { 15: "b" } }));
  assert.deepEqual([st[15].pending, st[15].pick, st[20].unlocked], [false, "b", true]);
  assert.equal(B.nodeState({ level: 20 }), null);
  assert.equal(B.nodeState({ level: 20, specialization: "ya_no_existe" }), null);
});

test("activas desbloqueadas por nivel y nunca en Fácil", () => {
  assert.deepEqual(B.unlockedBranchActives(hero("duelist", 12), "adventure"), ["br_duelist_10"]);
  assert.deepEqual(B.unlockedBranchActives(hero("duelist", 20), "hard"), ["br_duelist_10", "br_duelist_20"]);
  assert.deepEqual(B.unlockedBranchActives(hero("duelist", 20), "easy"), []);
  assert.deepEqual(B.unlockedBranchActives({ level: 20 }, "adventure"), []);
});

test("pickNode: solo a/b, solo nivel>=15, una vez, y la pasiva no suma sin elegir", () => {
  const p = hero("assassin", 14);
  assert.equal(B.pickNode(p, 15, "a"), false, "antes del nivel 15");
  p.level = 15;
  assert.equal(B.pickNode(p, 15, "c"), false);
  assert.equal(B.pickNode(p, 10, "a"), false);
  assert.deepEqual(B.branchPassives(p, "adventure"), B.NO_BRANCH_PASSIVES);
  assert.equal(B.pickNode(p, 15, "a"), true);
  assert.equal(B.pickNode(p, 15, "b"), false, "no se cambia sin reiniciar");
  assert.equal(B.branchPassives(p, "adventure").critBonus, 0.10);
  assert.deepEqual(B.branchPassives(p, "easy"), B.NO_BRANCH_PASSIVES);
});

test("las 18 pasivas suman solo su efecto al elegirlas", () => {
  for (const spec of SPECS) {
    for (const c of ["a", "b"]) {
      const p = hero(spec, 15);
      assert.equal(B.pickNode(p, 15, c), true);
      const got = B.branchPassives(p, "hard");
      const [key, value] = Object.entries(B.BRANCH_NODES[spec][15][c].effect)[0];
      assert.equal(got[key], value, `${spec} ${c}`);
      for (const [k, v] of Object.entries(got)) if (k !== key) assert.equal(v, 0, `${spec} ${c}: ${k} no debe sumar`);
    }
  }
});

test("reinicio: cuesta 50 x nivel, cambio de rama 100 x nivel; falla sin oro y en combate sin descontar", () => {
  const p = hero("tank", 16, { gold: 799 });
  B.pickNode(p, 15, "a");
  assert.equal(B.respecCost(p, "picks"), 800);
  assert.equal(B.respecCost(p, "branch"), 1600);
  assert.deepEqual(B.respecPicks(p, false), { ok: false, cost: 800, reason: "gold" });
  assert.equal(p.gold, 799);
  p.gold = 800;
  assert.equal(B.respecPicks(p, true).reason, "combat");
  assert.equal(p.gold, 800);
  assert.equal(B.respecPicks(p, false).ok, true);
  assert.equal(p.gold, 0);
  assert.deepEqual(p.branchPicks, {});
  assert.equal(B.respecPicks(p, false).reason, "nothing");
});

test("cambio de rama: misma clase, borra elecciones, conserva nivel y no toca otras cosas del héroe", () => {
  const p = hero("tank", 16, { gold: 5000, learnedSkills: ["x"], branchPicks: { 15: "b" } });
  assert.equal(B.changeBranch(p, "tank", false).reason, "invalid");
  assert.equal(B.changeBranch(p, "assassin", false).reason, "invalid");   // otra clase
  assert.equal(B.changeBranch(p, "berserker", true).reason, "combat");
  assert.equal(B.changeBranch({ ...p, gold: 10 }, "berserker", false).reason, "gold");
  const r = B.changeBranch(p, "berserker", false);
  assert.deepEqual([r.ok, r.cost, p.gold], [true, 1600, 3400]);
  assert.deepEqual([p.specialization, p.branchPicks, p.level, p.learnedSkills], ["berserker", {}, 16, ["x"]]);
});

test("activas de Guerrero con RNG fijo", () => {
  let r = run("br_tank_10");
  assert.deepEqual([r.rawDamage, r.damageType], [80, "blunt"]);
  assert.ok(r.interrupt.actions.includes("power_attack") && r.interrupt.actions.includes("stunning_blow"));
  assert.equal(r.interrupt.bossChance, 0);
  r = run("br_tank_20");
  assert.deepEqual([r.buffs, r.cleansePlayer], [{ defend_stance: 4 }, 1]);
  r = run("br_berserker_10");
  assert.deepEqual([r.rawDamage, r.breakGuard, r.defShred, r.selfDamagePct], [150, true, { pct: 0.2, turns: 2 }, 0.05]);
  assert.equal(run("br_berserker_20", { hp: 200 }).rawDamage, 200);
  assert.ok(Math.abs(run("br_berserker_20", { hp: 100 }).rawDamage - 230) <= 1, "mitad de HP: ~+15%");
  assert.equal(run("br_berserker_20", { hp: 0 }).rawDamage, 260, "tope +30%");
  assert.equal(run("br_holy_knight_10").rawDamage, 130);
  assert.equal(run("br_holy_knight_10", { resistances: { holy: -50 } }).rawDamage, 195);
  assert.equal(run("br_holy_knight_10", { resistances: { light: -10 } }).rawDamage, 195);
  r = run("br_holy_knight_20");
  assert.deepEqual([r.heal, r.cleanseAll], [30, true]);
});

test("activas de Mago con RNG fijo", () => {
  assert.equal(B.weakestElement({}), "fire");
  assert.equal(B.weakestElement({ fire: 20, ice: -30, lightning: -10 }), "ice");
  assert.equal(B.weakestElement({ lightning: -50 }), "lightning");
  let r = run("br_elementalist_10", { resistances: { ice: -30 } });
  assert.deepEqual([r.kind, r.damageType, r.rawDamage, r.enemyDebuff.type], ["magic", "ice", 112, "frozen"]);
  r = run("br_elementalist_10");
  assert.deepEqual([r.damageType, r.enemyDebuff.type], ["fire", "burn"]);
  r = run("br_elementalist_10", { resistances: { lightning: -20 } });
  assert.equal(r.enemyDebuff, undefined);
  assert.equal(run("br_elementalist_20").rawDamage, 176);
  r = run("br_necromancer_10");
  assert.deepEqual([r.damageType, r.rawDamage, r.lifesteal], ["dark", 88, 0.5]);
  r = run("br_necromancer_20");
  assert.deepEqual([r.rawDamage, r.curse], [144, { turns: 3 }]);
  r = run("br_chronomancer_10");
  assert.deepEqual([r.rawDamage, r.interrupt.bossChance], [88, 0.5]);
  assert.deepEqual(run("br_chronomancer_20").buffs, { rewind: 3 });
});

test("activas de Pícaro con RNG fijo", () => {
  let r = run("br_assassin_10");
  assert.deepEqual([r.rawDamage, r.mark], [60, { turns: 3 }]);
  assert.equal(run("br_assassin_20", { enemy: { hp: 100, maxHp: 100 } }).rawDamage, 200);
  assert.equal(run("br_assassin_20", { enemy: { hp: 29, maxHp: 100 } }).rawDamage, 400);
  assert.equal(run("br_assassin_20", { enemy: { hp: 30, maxHp: 100 } }).rawDamage, 200, "30% exacto no ejecuta");
  r = run("br_trapper_10");
  assert.deepEqual([r.trap.charges, r.trap.damage, r.trap.bleed.turns], [1, 130, 3]);
  r = run("br_trapper_10", { passives: { trapBoost: 0.5 } });
  assert.deepEqual([r.trap.damage, r.trap.bleed.turns], [195, 4]);
  r = run("br_trapper_20");
  assert.deepEqual([r.trap.charges, r.trap.damage], [3, 80]);
  assert.equal(run("br_duelist_10").rawDamage, 100);
  assert.equal(run("br_duelist_10", { dodgedLastTurn: true }).rawDamage, 160);
  r = run("br_duelist_20");
  assert.deepEqual([r.rawDamage, r.hits, r.buffs], [80, 3, { dodge_stance: 2 }]);
});

test("multiplicadores de daño dado/recibido y enfriamiento", () => {
  const P = (o) => ({ ...B.NO_BRANCH_PASSIVES, ...o });
  assert.equal(B.branchDamageMult(P({ lowHpDmg: 0.15 }), { hpRatio: 0.4 }), 1.15);
  assert.equal(B.branchDamageMult(P({ lowHpDmg: 0.15 }), { hpRatio: 0.5 }), 1);
  assert.equal(B.branchDamageMult(P({ vsWeakDmg: 0.1 }), { isMagic: true, weakness: true }), 1.1);
  assert.equal(B.branchDamageMult(P({ vsWeakDmg: 0.1 }), { isMagic: false, weakness: true }), 1);
  assert.ok(Math.abs(B.branchDamageTakenMult(P({ physTaken: 0.1 }), { isPhysical: true, announced: false }) - 0.9) < 1e-9);
  assert.equal(B.branchDamageTakenMult(P({ physTaken: 0.1 }), { isPhysical: false, announced: false }), 1);
  assert.ok(Math.abs(B.branchDamageTakenMult(P({ magicTaken: 0.2 }), { isPhysical: false, announced: false }) - 0.8) < 1e-9);
  assert.ok(Math.abs(B.branchDamageTakenMult(P({ darkTaken: 0.25 }), { isPhysical: false, isDark: true, announced: false }) - 0.75) < 1e-9);
  assert.ok(Math.abs(B.branchDamageTakenMult(P({ announcedTaken: 0.1 }), { isPhysical: true, announced: true }) - 0.9) < 1e-9);
  assert.equal(B.branchCooldown({ cooldown: 3 }, P({ cooldownReduce: 1 })), 2);
  assert.equal(B.branchCooldown({ cooldown: 1 }, P({ cooldownReduce: 1 })), 1, "mínimo 1");
});

test("Marca Letal: +50% al siguiente golpe físico y se consume; la magia no la gasta", () => {
  const e = { marked: { turns: 3 } };
  assert.equal(B.consumeMark(e, false), 1);
  assert.ok(e.marked);
  assert.equal(B.consumeMark(e, true), 1.5);
  assert.equal(e.marked, null);
  assert.equal(B.consumeMark(e, true), 1);
});

test("la evasión de rama respeta el tope único de esquiva", () => {
  const passive = 0.9 + B.BRANCH_NODES.duelist[15].a.effect.evasionBonus;
  assert.ok(computeDodgeChance({ passive, buttonActive: true, tactical: true }) <= 0.85);
  assert.ok(computeDodgeChance({ passive, tactical: true }) <= 0.85);
});

// ── Integración con combate real ──────────────────────

async function arena({ spec, level = 20, picks = {}, enemyId = "slime", difficulty = "adventure" }) {
  const { startCombat } = await import("../js/combat.js");
  g.difficulty = difficulty;
  g.isGameOver = false;
  g.playerDebuffs = {}; g.activeDebuffs = {}; g.activeBuffs = {};
  g.equipment = { ...(g.equipment || {}), rightHand: null };
  // El héroe se arma DESPUÉS de startCombat: con clase definida, el onboarding intenta pintar una tarjeta
  // de pistas que el DOM de prueba no soporta (no tiene que ver con las ramas).
  g.player.class = null;
  startCombat(enemyId, false);
  Object.assign(g.player, { class: SPECIALIZATIONS[spec].class, specialization: spec, level, branchPicks: picks });
  g.player.hp = g.player.maxHp = 100000;
  g.player.mp = g.player.maxMp = 100;
  const e = g.currentEnemy;
  e.trait = null; e.hp = e.maxHp = 100000; e.defense = 0;
  return e;
}

test("humo: 9 ramas x 3 dificultades usan sus dos activas sin lanzar excepciones", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  for (const difficulty of ["adventure", "hard", "impossible"]) {
    for (const spec of SPECS) {
      const e = await arena({ spec, difficulty, picks: { 15: "a" }, enemyId: "orc" });
      for (let i = 0; i < 4 && g.isInCombat; i++) {
        e.hp = e.maxHp = 100000; g.player.hp = g.player.maxHp;
        const ids = B.unlockedBranchActives(g.player, difficulty);
        await useTechnique(ids[i % ids.length]);
        if (g.playerDebuffs.stun) delete g.playerDebuffs.stun;
      }
      g.isInCombat = false;
    }
  }
});

test("Hender nunca deja al héroe por debajo de 1 HP y paga 5% del HP máximo", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const { calculateTotalStats } = await import("../js/stats.js");
  const e = await arena({ spec: "berserker" });
  e.nextAction = "defend";
  const max = calculateTotalStats(g.player, g.equipment).maxHp;
  g.player.hp = max;
  await useTechnique("br_berserker_10");
  assert.ok(g.player.hp <= max - Math.floor(max * 0.05) + 1, "no pagó el retroceso");
  g.player.hp = 1;
  e.nextAction = "defend";
  g.techCooldowns = {};
  await useTechnique("br_berserker_10");
  assert.ok(g.player.hp >= 1, "el retroceso mató al héroe");
  g.isInCombat = false;
});

test("Purificación y Rebobinar solo se usan una vez por combate; el contador se reinicia al empezar otro", async () => {
  const { useTechnique, getTechniquePanel } = await import("../js/techniqueActions.js");
  await arena({ spec: "holy_knight" });
  g.player.hp = 50;
  g.playerDebuffs = { poison: { turns: 3, damage: 1 }, burn: { turns: 3, damage: 1 } };
  g.currentEnemy.nextAction = "defend";
  await useTechnique("br_holy_knight_20");
  assert.deepEqual(g.playerDebuffs, {}, "no limpió todo");
  assert.equal(g.techUses.br_holy_knight_20, 1);
  g.techCooldowns = {};
  assert.equal(getTechniquePanel().find(x => x.id === "br_holy_knight_20").ready, false);
  const hp = g.player.hp;
  await useTechnique("br_holy_knight_20");
  assert.equal(g.player.hp, hp, "se usó dos veces");
  g.isInCombat = false;
  await arena({ spec: "holy_knight" });
  assert.deepEqual(g.techUses, {});
  g.isInCombat = false;
});

test("Trampa de Cepos: se activa con el siguiente ataque del enemigo, sangra y se gasta", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const { enemyTurn } = await import("../js/combat.js");
  const e = await arena({ spec: "trapper", level: 10 });
  e.nextAction = "defend";
  await useTechnique("br_trapper_10");
  assert.equal(e.trap.charges, 1);
  e.hp = e.maxHp; e.nextAction = "attack";
  await enemyTurn();
  assert.equal(e.trap, null, "la trampa debía gastarse");
  assert.ok(e.hp < e.maxHp, "la trampa no hizo daño");
  assert.ok(g.activeDebuffs.bleed, "no sangra");
  g.isInCombat = false;
});

test("Marca Letal marca y el siguiente golpe físico consume la marca", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const e = await arena({ spec: "assassin", level: 10 });
  e.nextAction = "defend";
  await useTechnique("br_assassin_10");
  assert.ok(e.marked);
  g.techCooldowns = {};
  e.nextAction = "defend";
  await useTechnique("br_assassin_10");  // 2º físico: consume la marca anterior y vuelve a marcar
  assert.ok(e.marked, "el segundo uso vuelve a marcar tras consumir");
  g.isInCombat = false;
});

test("Rebobinar reduce el siguiente golpe al 25%", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const { enemyTurn } = await import("../js/combat.js");
  const { calculateTotalStats } = await import("../js/stats.js");
  const orig = Math.random;
  const hit = async (withRewind) => {
    const e = await arena({ spec: "chronomancer" });
    e.attack = Math.ceil(calculateTotalStats(g.player, g.equipment).defense) + 40;
    if (withRewind) { e.nextAction = "defend"; await useTechnique("br_chronomancer_20"); }
    e.nextAction = "attack";
    g.player.hp = g.player.maxHp = 100000;
    const before = g.player.hp;
    Math.random = () => 0.99;
    try { await enemyTurn(); } finally { Math.random = orig; }
    g.isInCombat = false;
    return before - g.player.hp;
  };
  const plain = await hit(false);
  const rewound = await hit(true);
  assert.ok(plain > 0 && rewound < plain * 0.5, `normal ${plain} vs rebobinado ${rewound}`);
});

test("compatibilidad: héroe de nivel 20 con rama y sin branchPicks conserva todo y ve la elección pendiente", async () => {
  const { branchSectionHTML } = await import("../js/branchUI.js");
  await arena({ spec: "necromancer", picks: undefined });
  delete g.player.branchPicks;                               // save anterior: el campo no existe
  const st = B.nodeState(g.player);
  assert.equal(st[15].pending, true);
  assert.deepEqual(B.unlockedBranchActives(g.player, "adventure"), ["br_necromancer_10", "br_necromancer_20"]);
  assert.deepEqual(B.branchPassives(g.player, "adventure"), B.NO_BRANCH_PASSIVES);
  const html = branchSectionHTML();
  assert.ok(html.includes("data-br-pick=\"a\"") && html.includes("data-br-pick=\"b\""));
  g.player.branchPicks = { 15: "b" };
  assert.ok(branchSectionHTML().includes("data-br-respec"));
  g.isInCombat = false;
});

test("Fácil: ni activas ni pasivas de rama, y el panel de técnicas no las muestra", async () => {
  const { getTechniquePanel } = await import("../js/techniqueActions.js");
  await arena({ spec: "duelist", difficulty: "easy", picks: { 15: "a" } });
  assert.deepEqual(getTechniquePanel().filter(x => x.id.startsWith("br_")), []);
  assert.deepEqual(B.branchPassives(g.player, "easy"), B.NO_BRANCH_PASSIVES);
  g.isInCombat = false;
});
