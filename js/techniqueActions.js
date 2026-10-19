/**
 * techniqueActions.js — acción "usar técnica" del jugador.
 *
 * SPEC-1304 (técnicas de arma) y SPEC-1306 (activas de rama de héroe) comparten
 * el pipeline de useSkill (resistencias, applyDamageToEnemy, debuffs, tickBuffs,
 * turno enemigo), el panel, el evento `pixel:useTechnique` y la tabla de
 * enfriamientos. La matemática vive en weaponTechniques.js / branchNodes.js (puras).
 */
import { gameState } from "./state.js";
import { calculateTotalStats, calculateMagicAttack } from "./stats.js";
import { addMessage } from "./story.js";
import { showFloatingText, shakeScreen, updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { t, formatText } from "./i18n.js";
import { getMasteryBonus } from "./mastery.js";
import { applyResistance, getWeaponDamageType, getEffectiveResistances } from "./damageTypes.js";
import { delay, damageFloatType, maybeResistanceAdvice, grantMasteryXP } from "./combatFeedback.js";
import { endCombat } from "./combatRewards.js";
import { applyDamageToEnemy, tickBuffs, enemyTurn } from "./combat.js";
import { consumeExposed, blindMissed, retreatMissed } from "./playerCombatActions.js";
import {
  TECHNIQUES, FAMILY_META, unlockedTechniques, techniqueReady, resolveTechnique,
  damageAfterDefense, currentPassives
} from "./weaponTechniques.js";
import {
  getBranchActive, unlockedBranchActives, resolveBranchActive, currentBranchPassives, branchCooldown,
  branchDamageMult, consumeMark, nodeNameKey, nodeDescKey
} from "./branchNodes.js";
import { SPECIALIZATIONS } from "./specializations.js";

const slotOf = (def) => String(def.level);

// Describe una técnica (de arma o de rama) para el panel y para useTechnique.
function describe(id) {
  const branch = getBranchActive(id);
  if (branch) {
    const slot = slotOf(branch);
    return {
      isBranch: true, emoji: branch.emoji,
      nameKey: nodeNameKey(branch.spec, slot), descKey: nodeDescKey(branch.spec, slot),
      familyLabel: SPECIALIZATIONS[branch.spec].name,
      cooldown: branchCooldown(branch, currentBranchPassives()),
      usesPerCombat: branch.usesPerCombat || 0,
    };
  }
  const tech = TECHNIQUES[id];
  if (!tech || tech.slot === "passive") return null;
  return {
    isBranch: false, emoji: tech.emoji, nameKey: tech.nameKey, descKey: tech.descKey,
    familyLabel: t(FAMILY_META[tech.family].nameKey), cooldown: tech.cooldown, usesPerCombat: 0,
  };
}

function isAvailable(id) {
  const weapon = gameState.equipment?.rightHand;
  const d = gameState.difficulty;
  return unlockedTechniques(weapon, gameState.weaponMastery, d).includes(id)
    || unlockedBranchActives(gameState.player, d).includes(id);
}

/** Técnicas activas (arma + rama) para el panel: [{ id, emoji, name, desc, family, cooldown, ready }]. */
export function getTechniquePanel() {
  if (!gameState.isInCombat) return [];
  const weapon = gameState.equipment?.rightHand;
  const cds = gameState.techCooldowns || {};
  const uses = gameState.techUses || {};
  const ids = [
    ...unlockedTechniques(weapon, gameState.weaponMastery, gameState.difficulty),
    ...unlockedBranchActives(gameState.player, gameState.difficulty),
  ];
  return ids.map(id => ({ id, d: describe(id) })).filter(x => x.d).map(({ id, d }) => ({
    id,
    emoji: d.emoji,
    name: t(d.nameKey),
    desc: t(d.descKey),
    family: d.familyLabel,
    cooldown: cds[id] || 0,
    ready: techniqueReady(id, cds) && !(d.usesPerCombat && (uses[id] || 0) >= d.usesPerCombat),
  }));
}

// Quita la guardia temporal del enemigo y desgasta su defensa un tiempo.
// Se restaura en tickBuffs() (combat.js) al vencer los turnos.
function shredEnemyDefense(enemy, { pct, turns }) {
  if (enemy._techShred) { enemy.defense += enemy._techShred.amount; enemy._techShred = null; }
  const amount = Math.floor((enemy.defense || 0) * pct);
  if (amount <= 0) return;
  enemy.defense -= amount;
  enemy._techShred = { amount, turns };
  addMessage(formatText(t("techShredMsg"), { enemy: enemy.type }), "combat");
}

export async function useTechnique(techId) {
  const enemy = gameState.currentEnemy;
  const d = describe(techId);
  if (!enemy || !gameState.isInCombat || !d || !isAvailable(techId)) return;
  if (!gameState.techCooldowns) gameState.techCooldowns = {};
  if (!gameState.techUses) gameState.techUses = {};
  const name = t(d.nameKey);
  if (!techniqueReady(techId, gameState.techCooldowns)) {
    addMessage(formatText(t("techCooling"), { name, turns: gameState.techCooldowns[techId] }), "system");
    return;
  }
  if (d.usesPerCombat && (gameState.techUses[techId] || 0) >= d.usesPerCombat) {
    addMessage(formatText(t("techUsedUp"), { name }), "system");
    return;
  }

  const weapon = gameState.equipment?.rightHand;
  const p = gameState.player;
  const stats = calculateTotalStats(p, gameState.equipment);
  const passives = currentPassives();
  const bp = currentBranchPassives();
  const ctx = {
    attack: stats.attack, magicAttack: calculateMagicAttack(stats), maxHp: stats.maxHp, hp: p.hp,
    enemy, passives: d.isBranch ? bp : passives, resistances: getEffectiveResistances(enemy) || {},
    dodgedLastTurn: !!gameState.dodgedLastTurn,
  };
  const res = d.isBranch ? resolveBranchActive(techId, ctx) : resolveTechnique(techId, ctx);
  if (!res) return;

  // Ceguera / retirada: la técnica ofensiva puede fallar como cualquier ataque (consume el turno)
  if (res.rawDamage && await blindMissed()) return;
  if (res.rawDamage && await retreatMissed(res.kind === "physical")) return; // SPEC-1305

  playSound("skill");
  addMessage(formatText(t("techUsed"), { emoji: d.emoji, name }), "combat");

  // Estados de enemigo antes del daño: romper guardia / desgastar defensa
  if (res.breakGuard && enemy.isDefending) {
    enemy.isDefending = false;
    addMessage(formatText(t("techGuardBroken"), { enemy: enemy.type }), "combat");
  }
  if (res.defShred) shredEnemyDefense(enemy, res.defShred);

  let totalDmg = 0;
  if (res.rawDamage) {
    const type = res.damageType || getWeaponDamageType(weapon);
    const isMagic = res.kind === "magic";
    const resMap = getEffectiveResistances(enemy) || {};
    const hits = res.hits || 1;
    for (let i = 0; i < hits && enemy.hp > 0; i++) {
      const dmgBase = damageAfterDefense(res.rawDamage, enemy.defense, res.defPen);
      let dmg = Math.max(1, Math.floor(dmgBase * (1 + getMasteryBonus(type))));
      dmg = applyResistance(dmg, type, resMap);
      if (i === 0) {
        dmg = consumeExposed(dmg).dmg;
        dmg = Math.max(1, Math.floor(dmg * consumeMark(enemy, !isMagic))); // Marca Letal (SPEC-1306)
      }
      dmg = Math.max(1, Math.floor(dmg * branchDamageMult(bp, {
        hpRatio: p.hp / (stats.maxHp || 1), isMagic, weakness: (resMap[type] ?? 0) < 0,
      })));
      applyDamageToEnemy(dmg, type);
      totalDmg += dmg;
    }
    playSound("hit");
    maybeResistanceAdvice(enemy, type);
    grantMasteryXP(type);
    addMessage(formatText(t("techDamage"), { enemy: enemy.type, damage: totalDmg }), "combat");
    showFloatingText(`-${totalDmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#fbbf24", "2em",
      damageFloatType(false, type, resMap));
    shakeScreen();
  }

  // ── Efectos propios de rama (SPEC-1306) ──
  if (res.selfDamagePct) {
    const loss = Math.max(1, Math.floor((stats.maxHp || 1) * res.selfDamagePct));
    p.hp = Math.max(1, (p.hp || 1) - loss); // retroceso: nunca letal
    addMessage(formatText(t("brSelfDamage"), { damage: loss }), "combat");
  }
  if (res.interrupt && enemy.hp > 0 && res.interrupt.actions.includes(enemy.nextAction)) {
    const blocked = enemy.isBoss && Math.random() >= (res.interrupt.bossChance || 0);
    if (!blocked) {
      enemy.nextAction = "interrupted";
      addMessage(formatText(t("interruptSuccess"), { enemy: enemy.type }), "combat");
    }
  }
  if (res.lifesteal && totalDmg > 0) {
    const heal = Math.max(1, Math.floor(totalDmg * res.lifesteal));
    p.hp = Math.min(stats.maxHp || p.maxHp, (p.hp || 0) + heal);
    addMessage(formatText(t("techHealMsg"), { heal }), "combat");
  }
  if (res.enemyDebuff && enemy.hp > 0) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs[res.enemyDebuff.type] = { turns: res.enemyDebuff.turns, damage: res.enemyDebuff.damage };
    addMessage(formatText(t(res.enemyDebuff.type === "burn" ? "brBurnMsg" : "brFrozenMsg"), { enemy: enemy.type }), "combat");
  }
  if (res.curse && enemy.hp > 0) {
    enemy.cursedDebuff = { turns: res.curse.turns };
    addMessage(formatText(t("brCurseMsg"), { enemy: enemy.type }), "combat");
  }
  if (res.mark && enemy.hp > 0) {
    enemy.marked = { turns: res.mark.turns };
    addMessage(formatText(t("brMarkMsg"), { enemy: enemy.type }), "combat");
  }
  if (res.trap) {
    enemy.trap = { ...res.trap };
    addMessage(formatText(t("brTrapSet"), { enemy: enemy.type }), "combat");
  }
  if ((res.cleansePlayer || res.cleanseAll) && gameState.playerDebuffs) {
    const keys = Object.keys(gameState.playerDebuffs);
    const n = res.cleanseAll ? keys.length : res.cleansePlayer;
    for (const k of keys.slice(0, n)) delete gameState.playerDebuffs[k];
    if (keys.length) addMessage(t("techCleanseMsg"), "combat");
  }

  if (res.debuff && enemy.hp > 0) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs[res.debuff.type] = { turns: res.debuff.turns, damage: res.debuff.damage };
    addMessage(formatText(t(res.debuff.type === "bleed" ? "techBleedMsg" : "techVenomMsg"), { enemy: enemy.type }), "combat");
  }
  if (res.stun && enemy.hp > 0 && !gameState.activeDebuffs?.stunned) {
    if (!gameState.activeDebuffs) gameState.activeDebuffs = {};
    gameState.activeDebuffs.stunned = { turns: 1 };
    addMessage(formatText(t("enemyStunnedByPlayer"), { enemy: enemy.type }), "combat");
  }
  if (res.buffs) {
    if (!gameState.activeBuffs) gameState.activeBuffs = {};
    if (res.buffs.defend_stance) delete gameState.activeBuffs.dodge_stance; // excluyentes, como Defender
    if (res.buffs.dodge_stance) delete gameState.activeBuffs.defend_stance;
    Object.assign(gameState.activeBuffs, res.buffs);
    addMessage(formatText(t("techBuffMsg"), { name }), "combat");
  }
  if (res.heal) {
    p.hp = Math.min(stats.maxHp || p.maxHp, (p.hp || 0) + res.heal);
    showFloatingText(`+${res.heal}`, window.innerWidth/2-60, window.innerHeight/2-40, "#4ade80", "1.8em", "heal");
    addMessage(formatText(t("techHealMsg"), { heal: res.heal }), "combat");
    if (res.cleanse && gameState.playerDebuffs) {
      const key = Object.keys(gameState.playerDebuffs)[0];
      if (key) { delete gameState.playerDebuffs[key]; addMessage(t("techCleanseMsg"), "combat"); }
    }
  }

  tickBuffs();
  gameState.techCooldowns[techId] = d.cooldown; // después del tick: no se descuenta este turno
  if (d.usesPerCombat) gameState.techUses[techId] = (gameState.techUses[techId] || 0) + 1;
  updateUI();

  if (enemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700);
  await enemyTurn();
}
