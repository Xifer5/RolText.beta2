/**
 * combatRewards.js — Fin de combate: recompensas y progresión
 *
 * Extraído de combat.js (modularización post SPEC-1110, ver
 * errores/registro_de_errores.md / project_polish_sprint en memoria).
 * Cero dependencia de otros módulos combat-* — hoja del árbol de imports.
 */
import { gameState } from "./state.js";
import { calculateTotalStats, applyDerivedMaxes, statDiffLines, formatStatDiff } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI, showFloatingText } from "./ui.js";
import { getLoot } from "./lootTables.js";
import { allItems } from "./items.js";
import { recordEnemyKill, recordBossKill } from "./bestiary.js";
import { checkAchievements } from "./achievements.js";
import { saveGame } from "./saveSystem.js";
import { playSound, playMusic } from "./sounds.js";
import { showToast } from "./toast.js";
import { t, formatText, localizeText } from "./i18n.js";
import { getDifficultyConfig } from "./difficulty.js";
import { getActiveSpec, canSpecialize } from "./specializations.js";
import { showSpecializationModal } from "./specModal.js";
import { consumeEchoReward } from "./echoIntro.js";
import { modifierXpMult, scarceGoldMult, filterLoot } from "./modifiers.js";
import { showEnding, MORAL_DECISIONS } from "./endings.js";
import { recordRun } from "./runLog.js";
import { maybeShowHint } from "./onboarding.js";

// SPEC-1103: enemyFled=true cuando un enemigo con rasgo "Cobarde" huyó solo —
// el mensaje ya lo emitió checkCowardFlee(); acá solo evita confundirlo con
// una huida del jugador (fled) y documenta que tampoco entrega recompensas
// (ya cubierto por el gate `if (victory && enemy)` de más abajo).
export function endCombat(victory, fled = false, enemyFled = false) {
  const enemy = gameState.currentEnemy;
  gameState.isInCombat = false;
  gameState.activeDebuffs = {};
  gameState.playerDebuffs = {};

  if (victory && enemy) {
    playSound("enemy_die");
    const diff = getDifficultyConfig(gameState.difficulty);
    let xp = Math.max(1, Math.floor((enemy.experience || 10) * diff.xpMult * modifierXpMult(gameState)));
    let gold = Math.max(0, Math.floor((enemy.gold || 5) * diff.goldMult * scarceGoldMult(gameState)));
    // SPEC-1106: Amuleto del Eco — más recompensa si ya tomaste alguna
    // decisión compasiva (reutiliza los flags "luz" de MORAL_DECISIONS,
    // sin curar una segunda lista de "qué es compasivo")
    const echoAmulet = gameState.equipment?.accessory;
    if (echoAmulet?.special === "compassionReward") {
      const hasCompassion = MORAL_DECISIONS.some(d => d.weight > 0 && gameState.worldFlags?.[d.flag]);
      if (hasCompassion) {
        xp = Math.floor(xp * (1 + echoAmulet.compassionRewardBonus));
        gold = Math.floor(gold * (1 + echoAmulet.compassionRewardBonus));
      }
    }
    gameState.player.experience = (gameState.player.experience || 0) + xp;
    gameState.player.gold = (gameState.player.gold || 0) + gold;

    addMessage(formatText(t('victoryRewards'), { xp, gold }), "stat");

    // SPEC-1105: Caballero Sagrado — cura al matar un enemigo
    // SPEC-1106: Espada Voraz — cura al matar (fuente independiente, vía equipo)
    const healOnKill = (getActiveSpec()?.bonuses?.healOnKill || 0)
      + (gameState.equipment?.rightHand?.special === "healOnKill" ? gameState.equipment.rightHand.healOnKillPct : 0);
    if (healOnKill) {
      const p = gameState.player;
      const stats = calculateTotalStats(p, gameState.equipment);
      const missing = Math.max(0, stats.maxHp - (p.hp || 0));
      const healed = Math.floor(missing * healOnKill);
      if (healed > 0) {
        p.hp = Math.min(stats.maxHp, (p.hp || 0) + healed);
        addMessage(formatText(t('healOnKillMsg'), { heal: healed }), "combat");
      }
    }

    // SPEC-0902: recompensa del eco tras el combate guionizado del bosque
    consumeEchoReward();

    // Boss death message (narrative payoff from enemies.js deathMessage field)
    if (enemy.isBoss && enemy.deathMessage) {
      setTimeout(() => addMessage(formatText(t("bossDiesMessage"), { message: enemy.deathMessage }), "system"), 400);
    }
    // SPEC-1218 — historia mejorada, Acto I: revelaciones extra tras el
    // deathMessage corto (generico, cualquier boss puede sumar epilogueLines
    // en enemies.js sin tocar este archivo).
    if (enemy.isBoss && Array.isArray(enemy.epilogueLines)) {
      enemy.epilogueLines.forEach((line, i) => {
        setTimeout(() => addMessage(line, "system"), 1300 + i * 1700);
      });
    }

    // Dragon King epilogue — climax of the main story
    if (enemy.id === "dragon_king") {
      gameState.mainQuestCompleted = true;
      setTimeout(() => addMessage(t("dragonKingThanks"),  "system"), 1200);
      setTimeout(() => addMessage(t("dragonKingTwist1"),  "system"), 2800);
      setTimeout(() => addMessage(t("dragonKingTwist2"),  "system"), 4400);
      // SPEC-1215 — complejidad moral (revisión 2026-08-28): Asterion no es
      // solo víctima del olvido, también estuvo a punto de imponerle al
      // mundo una paz absoluta. Se inserta ACÁ, entre el giro del vacío y
      // el epílogo esperanzador, para que la esperanza final se sienta
      // ganada (conociendo lo bueno Y lo malo) en vez de ingenua.
      setTimeout(() => addMessage(t("dragonKingTwist3"),  "system"), 6000);
      setTimeout(() => addMessage(t("dragonKingEpilogue"),"system"), 7600);
      // SPEC-1001: el final refleja tus decisiones (el modal estaba huérfano — nadie lo abría)
      // SPEC-1003: la crónica se escribe tras cerrar el resto de endCombat (kills ya contadas)
      setTimeout(() => recordRun("victory"), 100);
      setTimeout(() => showEnding(), 9200);
    }

    // Record kill for bestiary
    recordEnemyKill(enemy.id);
    if (enemy.isBoss) {
      recordBossKill();
      // SPEC-1206: hook genérico para Pruebas del Eco (echoTrials.js) — se
      // dispara en TODO boss kill (zona, mini-boss, dragon_king, rival); el
      // listener filtra por enemyId, así que un boss kill normal de
      // exploración no interfiere con una prueba en curso.
      window.dispatchEvent(new CustomEvent("pixel:bossDefeated", { detail: { enemyId: enemy.id } }));
      setTimeout(() => { saveGame(); showToast(t('victorySaved')); }, 800);
      // SPEC-1110: recap ceremonial solo para el boss principal de zona — ni
      // mini-bosses (perdonables, ya tienen su propio flujo) ni dragon_king
      // (que ya dispara su propio epílogo extenso arriba).
      if (!enemy.isMiniBoss && enemy.id !== "dragon_king") {
        setTimeout(() => showToast(formatText(t('zoneBossVictoryToast'), { enemy: enemy.type }), "boss"), 1600);
      }
    }

    // Loot
    try {
      const biomeId = window.worldMap?.[gameState.currentLocationId]?.biome;
      const loot = filterLoot(getLoot(enemy.id, biomeId), gameState);
      if (Array.isArray(loot) && loot.length) {
        loot.forEach(item => {
          gameState.inventory[item] = (gameState.inventory[item] || 0) + 1;
        });
        playSound("loot");
        addMessage(formatText(t('lootObtained'), { items: loot.map(i => localizeText(allItems[i]?.name) ?? i.replace(/_/g, " ")).join(", ") }), "loot");
        maybeShowHint("first_loot"); // SPEC-0801: primer botín
      }
    } catch(e) {}

    // Level up
    if (gameState.player.experience >= (gameState.player.nextLevelXp || 100)) {
      levelUp();
    }
  } else if (fled) {
    addMessage(t('fleeSuccess'), "system");
  }

  checkAchievements();
  gameState.currentEnemy = null;
  // Restaura música del bioma actual al terminar el combate
  const zoneBiome = window.worldMap?.[gameState.currentLocationId]?.biome;
  playMusic(zoneBiome || "none");
  updateUI();
}

export function levelUp() {
  const p = gameState.player;
  const before = calculateTotalStats(p, gameState.equipment); // SPEC-1209: visibilidad de build
  p.level = (p.level || 1) + 1;
  p.experience = Math.max(0, (p.experience || 0) - (p.nextLevelXp || 100));
  p.nextLevelXp = Math.floor((p.nextLevelXp || 100) * 1.5);
  p.statPoints = (p.statPoints || 0) + 5;

  // Class-based HP/MP growth
  const hpGain = p.class === "warrior" ? 15 : p.class === "mage" ? 6 : 10;
  const mpGain = p.class === "mage" ? 12 : p.class === "rogue" ? 5 : 3;
  p.permanentHpBonus = (p.permanentHpBonus || 0) + hpGain;
  p.permanentMpBonus = (p.permanentMpBonus || 0) + mpGain;
  applyDerivedMaxes();
  p.hp = p.maxHp;
  p.mp = p.maxMp;

  // Update profile card
  const profileRole = document.querySelector(".profile-role");
  if (profileRole) profileRole.textContent = `${t('levelBadgePrefix')} ${p.level} ${(p.className || "").toUpperCase()}`;

  playSound("level_up");
  addMessage(formatText(t('levelUp'), { level: p.level }), "milestone"); // SPEC-1212

  // SPEC-1209 — visibilidad de build: los 5 puntos de stat todavía no están
  // gastados, así que lo único que cambió DE VERDAD en este instante es
  // maxHp/maxMp (el bono de clase por nivel). El resto se muestra al gastar
  // cada punto (ver increaseStat() en stats.js).
  const after = calculateTotalStats(p, gameState.equipment);
  const diffs = statDiffLines(before, after);
  if (diffs.length) showToast(formatStatDiff(diffs), "stat");

  // Especialización disponible a partir de nivel 10
  if (canSpecialize(p)) {
    addMessage(t('specUnlockedMsg'), "milestone"); // SPEC-1212
    setTimeout(() => showSpecializationModal(), 1500);
  }

  checkAchievements();
  // Autoguardar en cada level up
  setTimeout(() => {
    saveGame();
    showToast(t('autoSaveToast'));
  }, 1200);
  // SPEC-1110: animación dedicada de level-up (antes usaba el floatUp genérico)
  showFloatingText(t('levelUpText') || "⭐ LEVEL UP!", window.innerWidth/2 - 60, window.innerHeight/2 - 80, "#fbbf24", "2em", "levelup");
}
