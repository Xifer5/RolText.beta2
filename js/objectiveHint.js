// SPEC-1240 — "Objetivo actual": una sola línea de prioridad sobre estado
// que ya existe (HP, misión activa, tienda, Fragmentos), en vez de un
// sistema de contenido nuevo. Ver design doc 2026-09-09
// (diego-ovando-main-design-20260909-101942.md): revive el bloque
// #questTracker, antes permanentemente oculto (ver js/ui.js
// updateObjectiveHint()). Lógica pura y sin DOM a propósito, para poder
// testearse con node --test igual que pickVariant()/pickLocationDescription().
import { gameState } from "./state.js";
import { QUEST_DATA, getQuestStatus } from "./quests.js";
import { calculateTotalStats } from "./stats.js";
import { allItems, shopInventories, classShopBonus } from "./items.js";
import { readMeta, LEGACY_PERKS } from "./metaProgress.js";
import { biomeBosses } from "./biomeBosses.js";
import { biomeLoot } from "./lootTables.js";
import { t, formatText, localizeText } from "./i18n.js";

const HP_CRITICAL_RATIO = 0.25;
const COMPARE_KEYS = ["attack", "defense", "magic", "maxHp", "maxMp"];

// Next Steps #1 del design doc: la misión activa a mostrar es la relevante
// al bioma ACTUAL (jefe de zona pedido por una "kill", o ítem de esta zona
// pedido por una "collect") -- no la primera en orden de declaración de
// QUEST_DATA, que con los 3 rumores auto-activados al inicio (SPEC-1109)
// mostraría una misión arbitraria sin relación con dónde está el jugador.
// Sin pathfinding: solo mira el bioma en el que ya estás parado.
function relevantActiveQuest() {
  const activeQuests = Object.values(QUEST_DATA).filter(q => getQuestStatus(q.id) === "active");
  if (!activeQuests.length) return null;

  const biome = window.worldMap?.[gameState.currentLocationId]?.biome;
  if (biome) {
    const zoneBoss = biomeBosses[biome]?.boss;
    const biomeItems = new Set((biomeLoot[biome] || []).map(d => d.item));
    const relevant = activeQuests.find(q =>
      (q.type === "kill" && q.enemy === zoneBoss) ||
      (q.type === "collect" && biomeItems.has(q.item))
    );
    if (relevant) return relevant;
  }

  return activeQuests[0];
}

// Mismo criterio de "mejora neta" que buildShopCompare() (shop.js), pero
// sobre datos puros -- sin crear un elemento DOM, para poder evaluarlo en
// cada render y en tests headless sin depender de document.
function hasAffordableUpgradeInShop() {
  const locId = gameState.currentLocationId;
  const base = shopInventories[locId] || shopInventories.shop || [];
  const bonus = classShopBonus[gameState.player.class] || [];
  const inventory = [...new Set([...base, ...bonus])];
  if (!inventory.length) return false;

  const currentStats = calculateTotalStats(gameState.player, gameState.equipment);
  return inventory.some(id => {
    const item = allItems[id];
    if (!item || !item.slot || !item.price) return false;
    if ((gameState.player.gold || 0) < item.price) return false;
    const nextStats = calculateTotalStats(gameState.player, { ...gameState.equipment, [item.slot]: item });
    return COMPARE_KEYS.some(key => (nextStats[key] || 0) > (currentStats[key] || 0));
  });
}

// SPEC-1234/readMeta: unlockPerk()/renderLegacyShop() solo son alcanzables
// desde la Crónica post-run (runLog.js), no durante la partida activa -- por
// eso esta señal es informativa ("ya podrías desbloquear al terminar"), no
// una acción disponible ahora mismo (ver Next Steps #4 del design doc).
function nextAffordableLegacyPerk() {
  const meta = readMeta();
  return LEGACY_PERKS.find(p => !meta.unlocked[p.id] && meta.fragments >= p.cost);
}

/**
 * Línea de "Objetivo actual" a mostrar, en orden de prioridad:
 * HP crítico > misión activa > mejor equipo en la tienda local > Fragmentos
 * suficientes para el próximo Legado > idle genérico (nunca vacío).
 */
export function getCurrentObjective() {
  const p = gameState.player;

  if (p.maxHp > 0 && (p.hp / p.maxHp) < HP_CRITICAL_RATIO) {
    return t("objectiveHpCritical");
  }

  const quest = relevantActiveQuest();
  if (quest) {
    return formatText("objectiveQuest", { title: localizeText(quest.title) });
  }

  if (hasAffordableUpgradeInShop()) {
    return t("objectiveShopUpgrade");
  }

  if (nextAffordableLegacyPerk()) {
    return t("objectiveLegacyReady");
  }

  return t("objectiveIdle");
}
