// SPEC-1304 — técnicas por arma
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const W = await import("../js/weaponTechniques.js");
const { allItems } = await import("../js/items.js");
const { t } = await import("../js/i18n.js");
const state = await import("../js/state.js");
const g = state.gameState;

const weapon = (id) => ({ ...allItems[id], id });
const wm = (family, xp) => ({ [W.FAMILY_XP_PREFIX + family]: { xp } });
const fixed = (v) => () => v;

test("todo arma equipable de la mano derecha tiene familia", () => {
  const rightHand = Object.entries(allItems).filter(([, it]) => it.type === "weapon" || it.slot === "rightHand");
  assert.ok(rightHand.length >= 38);
  for (const [id, it] of rightHand) assert.ok(W.getWeaponFamily({ ...it, id }), `${id} sin familia`);
  assert.equal(W.getWeaponFamily(null), null);
  assert.equal(W.getWeaponFamily({ id: "no_such_weapon" }), null);
});

test("la familia sale de la forma, no del elemento", () => {
  assert.equal(W.getWeaponFamily(weapon("lava_sword")), "blade");
  assert.equal(W.getWeaponFamily(weapon("elven_bow")), "piercing");
  assert.equal(W.getWeaponFamily(weapon("burnt_book")), "staff");
  assert.equal(W.getWeaponFamily(weapon("healing_staff")), "support");
});

test("desbloqueo por XP de familia: 100 / 400 / 1000, y nunca en Fácil", () => {
  const sword = weapon("sword");
  const ids = (xp, d = "adventure") => W.unlockedTechniques(sword, wm("blade", xp), d);
  assert.deepEqual(ids(99), []);
  assert.deepEqual(ids(100), ["blade_cross_slash"]);
  assert.deepEqual(ids(400), ["blade_cross_slash", "blade_riposte"]);
  assert.deepEqual(ids(1000), ["blade_cross_slash", "blade_riposte", "blade_keen"]);
  assert.deepEqual(ids(1000, "easy"), []);
  assert.deepEqual(W.unlockedTechniques(null, wm("blade", 1000), "hard"), []);
});

test("familyXp: toma el mayor entre el contador propio y el XP legado del tipo", () => {
  assert.equal(W.familyXp("blade", { slash: { xp: 700 } }), 700);
  assert.equal(W.familyXp("blade", { slash: { xp: 700 }, fam_blade: { xp: 50 } }), 700);
  assert.equal(W.familyXp("blade", { slash: { xp: 10 }, fam_blade: { xp: 50 } }), 50);
  assert.equal(W.familyXp("support", { holy: { xp: 300 } }), 300);
  assert.equal(W.familyXp("blunt", {}), 0);
});

test("newlyUnlocked detecta cruces de umbral", () => {
  assert.deepEqual(W.newlyUnlocked("blade", 95, 100), ["blade_cross_slash"]);
  assert.deepEqual(W.newlyUnlocked("blade", 100, 105), []);
  assert.deepEqual(W.newlyUnlocked("blunt", 395, 405), ["blunt_quake"]);
});

test("técnicas ofensivas: números exactos con RNG fijo (variance = 1.0)", () => {
  const ctx = { attack: 100, magicAttack: 80, maxHp: 200, enemy: { defense: 20 }, passives: {} };
  const r = (id, over = {}) => W.resolveTechnique(id, { ...ctx, ...over }, fixed(0.5));
  assert.equal(r("blade_cross_slash").rawDamage, 140);
  assert.deepEqual(r("blade_cross_slash").debuff, { type: "bleed", turns: 2, damage: 3 });
  assert.equal(r("pierce_precise").rawDamage, 120);
  assert.equal(r("pierce_precise").defPen, 0.4);
  assert.deepEqual(r("pierce_venom").debuff, { type: "poison", turns: 3, damage: 3 });
  assert.equal(r("blunt_crush").rawDamage, 150);
  assert.equal(r("blunt_crush").breakGuard, true);
  assert.deepEqual(r("blunt_crush").defShred, { pct: 0.25, turns: 3 });
  assert.equal(r("staff_burst").rawDamage, 120);
  assert.equal(r("staff_burst").kind, "magic");
});

test("Estocada Precisa: contra defensa 20 resta 12, no 20", () => {
  assert.equal(W.damageAfterDefense(120, 20, 0.4), 108);
  assert.equal(W.damageAfterDefense(120, 20, 0), 100);
  assert.equal(W.damageAfterDefense(5, 100, 0), 1);
});

test("Impacto Sísmico: aturde al común (RNG<=0.4), nunca a jefes ni mini-jefes", () => {
  const base = { attack: 100, passives: {} };
  const q = (enemy, rng) => W.resolveTechnique("blunt_quake", { ...base, enemy }, fixed(rng));
  assert.equal(q({}, 0.3).stun, true);
  assert.equal(q({}, 0.5).stun, false);
  for (const enemy of [{ isBoss: true }, { isMiniBoss: true }]) {
    const res = q(enemy, 0.0);
    assert.ok(!res.stun);
    assert.deepEqual(res.defShred, { pct: 0.25, turns: 2 });
  }
});

test("técnicas utilitarias: buffs y curación", () => {
  const ctx = { attack: 10, maxHp: 200, enemy: {}, passives: {} };
  assert.deepEqual(W.resolveTechnique("blade_riposte", ctx, fixed(0.5)).buffs, { defend_stance: 2, riposte: 2 });
  assert.deepEqual(W.resolveTechnique("staff_overload", ctx, fixed(0.5)).buffs, { focused: 2 });
  assert.deepEqual(W.resolveTechnique("support_shield", ctx, fixed(0.5)).buffs, { arcane_shield: 2 });
  assert.equal(W.resolveTechnique("support_heal", ctx, fixed(0.5)).heal, 24);
  const devo = W.resolveTechnique("support_heal", { ...ctx, passives: { healBonus: 0.25, cleanse: true } }, fixed(0.5));
  assert.equal(devo.heal, 30);
  assert.equal(devo.cleanse, true);
  assert.equal(W.resolveTechnique("blade_keen", ctx), null); // las pasivas no se "usan"
});

test("pasivas: solo suman con la técnica desbloqueada", () => {
  const p = (id, family, xp, d = "hard") => W.computePassives(weapon(id), wm(family, xp), d);
  assert.equal(p("sword", "blade", 1000).critBonus, 0.10);
  assert.equal(p("sword", "blade", 999).critBonus, 0);
  assert.equal(p("dagger", "piercing", 1000).exposedBonus, 0.15);
  assert.equal(p("hammer", "blunt", 1000).defPen, 0.10);
  assert.equal(p("staff", "staff", 1000).mpPerTurn, 2);
  assert.equal(p("healing_staff", "support", 1000).healBonus, 0.25);
  assert.equal(p("sword", "blade", 1000, "easy").critBonus, 0);
});

test("enfriamiento: listo solo con 0 o sin registro", () => {
  assert.equal(W.techniqueReady("blade_cross_slash", {}), true);
  assert.equal(W.techniqueReady("blade_cross_slash", { blade_cross_slash: 2 }), false);
  assert.equal(W.techniqueReady("blade_cross_slash", { blade_cross_slash: 0 }), true);
});

test("genérico: toda técnica tiene familia válida, i18n y exactamente 2 activas + 1 pasiva por familia", () => {
  const perFamily = {};
  for (const [id, tech] of Object.entries(W.TECHNIQUES)) {
    assert.ok(W.FAMILY_META[tech.family], `${id}: familia inválida`);
    for (const k of [tech.nameKey, tech.descKey]) assert.notEqual(t(k), k, k);
    (perFamily[tech.family] ||= []).push(tech.slot);
  }
  assert.equal(Object.keys(perFamily).length, 5);
  for (const slots of Object.values(perFamily)) assert.deepEqual(slots.map(String).sort(), ["1", "2", "passive"]);
  for (const f of Object.values(W.FAMILY_META)) assert.notEqual(t(f.nameKey), f.nameKey);
  for (const k of ["techUsed", "techDamage", "techGuardBroken", "techShredMsg", "techBleedMsg", "techVenomMsg",
    "techBuffMsg", "techHealMsg", "techCleanseMsg", "techCooling", "techUnlocked"]) assert.notEqual(t(k), k, k);
});

// ── Integración con combate real ──────────────────────

async function arena({ weaponId, family, xp, enemyId, difficulty = "adventure" }) {
  const { startCombat } = await import("../js/combat.js");
  g.difficulty = difficulty;
  g.isGameOver = false;
  g.player.hp = g.player.maxHp = 100000;
  g.player.mp = g.player.maxMp = 100;
  g.player.attack = 50;
  g.playerDebuffs = {}; g.activeDebuffs = {}; g.activeBuffs = {};
  g.equipment = { ...(g.equipment || {}), rightHand: weapon(weaponId) };
  g.weaponMastery = family ? wm(family, xp) : {};
  startCombat(enemyId, false);
  return g.currentEnemy;
}

test("useTechnique: enfría, daña, sangra y no se puede repetir de inmediato", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const e = await arena({ weaponId: "sword", family: "blade", xp: 100, enemyId: "slime" });
  e.hp = e.maxHp = 100000; e.defense = 0;
  await useTechnique("blade_cross_slash");
  assert.ok(e.hp < 100000, "no hizo daño");
  assert.ok(g.activeDebuffs.bleed, "no sangra");
  assert.equal(g.techCooldowns.blade_cross_slash, 3);
  const hpAfter = e.hp;
  await useTechnique("blade_cross_slash");
  assert.equal(e.hp, hpAfter, "se usó con enfriamiento");
  g.isInCombat = false;
});

test("useTechnique: técnica bloqueada o en Fácil no hace nada", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  let e = await arena({ weaponId: "sword", family: "blade", xp: 99, enemyId: "slime" });
  e.hp = e.maxHp = 100000;
  await useTechnique("blade_cross_slash");
  assert.equal(e.hp, 100000);
  e = await arena({ weaponId: "sword", family: "blade", xp: 5000, enemyId: "slime", difficulty: "easy" });
  e.hp = e.maxHp = 100000;
  await useTechnique("blade_cross_slash");
  assert.equal(e.hp, 100000);
  g.isInCombat = false;
});

test("Golpe Aplastante rompe la guardia del Guardián antes de golpear: sin reflejo", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const e = await arena({ weaponId: "hammer", family: "blunt", xp: 100, enemyId: "guard" });
  assert.equal(e.archetype, "guardian");
  e.hp = e.maxHp = 100000; e.defense = 0; e.isDefending = true;
  e.nextAction = "attack"; // el Guardián no puede volver a cubrirse en su turno de respuesta
  await useTechnique("blunt_crush");
  assert.equal(e.isDefending, false);
  assert.ok(e.hp < 100000, "el golpe debe entrar");
  g.isInCombat = false;
});

test("la defensa temporal y el enfriamiento se restauran con los turnos", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const { tickBuffs } = await import("../js/combat.js");
  const e = await arena({ weaponId: "hammer", family: "blunt", xp: 100, enemyId: "slime" });
  e.hp = e.maxHp = 100000; e.defense = 40;
  await useTechnique("blunt_crush");
  assert.equal(e.defense, 30, "defensa -25%");
  g.techCooldowns.blunt_crush = 3;
  for (let i = 0; i < 3; i++) tickBuffs();
  assert.equal(e.defense, 40, "la defensa vuelve");
  assert.equal(g.techCooldowns.blunt_crush, 0);
  g.isInCombat = false;
});

test("startCombat reinicia los enfriamientos", async () => {
  g.techCooldowns = { blade_cross_slash: 3 };
  await arena({ weaponId: "sword", family: "blade", xp: 100, enemyId: "slime" });
  assert.deepEqual(g.techCooldowns, {});
  g.isInCombat = false;
});

test("XP: suma a tipo de daño y a familia; en Fácil no suma a familia", async () => {
  const { grantMasteryXP } = await import("../js/combatFeedback.js");
  await arena({ weaponId: "sword", family: null, xp: 0, enemyId: "slime" });
  grantMasteryXP("slash");
  assert.equal(g.weaponMastery.slash.xp, 5);
  assert.equal(g.weaponMastery.fam_blade.xp, 5);
  g.difficulty = "easy";
  grantMasteryXP("slash");
  assert.equal(g.weaponMastery.fam_blade.xp, 5, "en Fácil no suma XP de familia");
  g.isInCombat = false;
});

test("cruzar el umbral por golpes desbloquea la técnica", async () => {
  const { grantMasteryXP } = await import("../js/combatFeedback.js");
  await arena({ weaponId: "sword", family: "blade", xp: 95, enemyId: "slime" });
  grantMasteryXP("slash"); // 95 -> 100
  assert.deepEqual(W.unlockedTechniques(g.equipment.rightHand, g.weaponMastery, "adventure"), ["blade_cross_slash"]);
  g.isInCombat = false;
});

test("humo: 5 familias x 3 dificultades usan ambas técnicas sin lanzar excepciones", async () => {
  const { useTechnique } = await import("../js/techniqueActions.js");
  const cases = [["sword", "blade"], ["dagger", "piercing"], ["hammer", "blunt"], ["staff", "staff"], ["healing_staff", "support"]];
  for (const difficulty of ["adventure", "hard", "impossible"]) {
    for (const [weaponId, family] of cases) {
      const e = await arena({ weaponId, family, xp: 1000, enemyId: "orc", difficulty });
      for (let i = 0; i < 4 && g.isInCombat; i++) {
        e.hp = e.maxHp = 100000; g.player.hp = g.player.maxHp;
        const ids = W.unlockedTechniques(g.equipment.rightHand, g.weaponMastery, difficulty)
          .filter(id => W.TECHNIQUES[id].slot !== "passive");
        await useTechnique(ids[i % ids.length]);
        if (g.playerDebuffs.stun) delete g.playerDebuffs.stun;
      }
      g.isInCombat = false;
    }
  }
});
