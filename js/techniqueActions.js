/**
 * techniqueActions.js — SPEC-1304: acción "usar técnica de arma" del jugador.
 *
 * Reutiliza el pipeline de useSkill (resistencias, applyDamageToEnemy, debuffs,
 * tickBuffs, turno enemigo). La matemática vive en weaponTechniques.js (pura).
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
import { consumeExposed, blindMissed } from "./playerCombatActions.js";
import {
  TECHNIQUES, FAMILY_META, unlockedTechniques, techniqueReady, resolveTechnique,
  damageAfterDefense, currentPassives
} from "./weaponTechniques.js";

/** Técnicas activas del arma equipada para el panel: [{ id, emoji, name, desc, cooldown, ready }]. */
export function getTechniquePanel() {
  const weapon = gameState.equipment?.rightHand;
  if (!weapon || !gameState.isInCombat) return [];
  const cds = gameState.techCooldowns || {};
  return unlockedTechniques(weapon, gameState.weaponMastery, gameState.difficulty)
    .filter(id => TECHNIQUES[id].slot !== "passive")
    .map(id => ({
      id,
      emoji: TECHNIQUES[id].emoji,
      name: t(TECHNIQUES[id].nameKey),
      desc: t(TECHNIQUES[id].descKey),
      family: t(FAMILY_META[TECHNIQUES[id].family].nameKey),
      cooldown: cds[id] || 0,
      ready: techniqueReady(id, cds),
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
  const tech = TECHNIQUES[techId];
  const weapon = gameState.equipment?.rightHand;
  if (!enemy || !gameState.isInCombat || !tech || tech.slot === "passive") return;
  if (!unlockedTechniques(weapon, gameState.weaponMastery, gameState.difficulty).includes(techId)) return;
  if (!gameState.techCooldowns) gameState.techCooldowns = {};
  const name = t(tech.nameKey);
  if (!techniqueReady(techId, gameState.techCooldowns)) {
    addMessage(formatText(t("techCooling"), { name, turns: gameState.techCooldowns[techId] }), "system");
    return;
  }

  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const passives = currentPassives();
  const res = resolveTechnique(techId, {
    attack: stats.attack, magicAttack: calculateMagicAttack(stats), maxHp: stats.maxHp,
    enemy, passives,
  });
  if (!res) return;

  // Ceguera: la técnica ofensiva puede fallar como cualquier ataque (consume el turno)
  if (res.rawDamage && await blindMissed()) return;

  playSound("skill");
  addMessage(formatText(t("techUsed"), { emoji: tech.emoji, name }), "combat");

  // Estados de enemigo antes del daño: romper guardia / desgastar defensa
  if (res.breakGuard && enemy.isDefending) {
    enemy.isDefending = false;
    addMessage(formatText(t("techGuardBroken"), { enemy: enemy.type }), "combat");
  }
  if (res.defShred) shredEnemyDefense(enemy, res.defShred);

  if (res.rawDamage) {
    const type = getWeaponDamageType(weapon);
    const dmgBase = damageAfterDefense(res.rawDamage, enemy.defense, res.defPen);
    let dmg = Math.max(1, Math.floor(dmgBase * (1 + getMasteryBonus(type))));
    dmg = applyResistance(dmg, type, getEffectiveResistances(enemy));
    dmg = consumeExposed(dmg).dmg;
    applyDamageToEnemy(dmg, type);
    playSound("hit");
    maybeResistanceAdvice(enemy, type);
    grantMasteryXP(type);
    addMessage(formatText(t("techDamage"), { enemy: enemy.type, damage: dmg }), "combat");
    showFloatingText(`-${dmg}`, window.innerWidth/2+50, window.innerHeight/2-50, "#fbbf24", "2em",
      damageFloatType(false, type, getEffectiveResistances(enemy)));
    shakeScreen();
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
    Object.assign(gameState.activeBuffs, res.buffs);
    addMessage(formatText(t("techBuffMsg"), { name }), "combat");
  }
  if (res.heal) {
    const p = gameState.player;
    p.hp = Math.min(stats.maxHp || p.maxHp, (p.hp || 0) + res.heal);
    showFloatingText(`+${res.heal}`, window.innerWidth/2-60, window.innerHeight/2-40, "#4ade80", "1.8em", "heal");
    addMessage(formatText(t("techHealMsg"), { heal: res.heal }), "combat");
    if (res.cleanse && gameState.playerDebuffs) {
      const key = Object.keys(gameState.playerDebuffs)[0];
      if (key) { delete gameState.playerDebuffs[key]; addMessage(t("techCleanseMsg"), "combat"); }
    }
  }

  tickBuffs();
  gameState.techCooldowns[techId] = tech.cooldown; // después del tick: no se descuenta este turno
  updateUI();

  if (enemy.hp <= 0) { await delay(400); return endCombat(true); }
  await delay(700);
  await enemyTurn();
}
