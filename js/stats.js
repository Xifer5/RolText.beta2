// js/stats.js
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { t, tf } from "./i18n.js";
import { updateUI } from "./ui.js";
import { CLASS_BASE_RESISTANCES, ITEM_RESISTANCES } from "./damageTypes.js";

/**
 * Calcula estadísticas derivadas a partir de los atributos base y equipo.
 * No modifica gameState (salvo que el caller lo quiera aplicar).
 */
export function calculateTotalStats(player, equipment = {}) {
  const stats = { ...player };

  // Ensure numeric base attributes exist
  stats.strength = stats.strength ?? 0;
  stats.agility = stats.agility ?? 0;
  stats.intelligence = stats.intelligence ?? 0;

  // Totals from equipment
  let attackFromItems = 0;
  let defenseFromItems = 0;
  let magicFromItems = 0;
  let hpBonusSum = stats.hpBonus || 0;

  // Apply equipment bonuses (aggregate attribute + direct bonuses)
  for (const slot in equipment) {
    const it = equipment[slot];
    if (!it) continue;
    // attribute bonuses
    stats.strength += it.strength || 0;
    stats.agility += it.agility || 0;
    stats.intelligence += it.intelligence || 0;
    // direct bonuses
    attackFromItems += it.attack || 0;
    defenseFromItems += it.defense || 0;
    magicFromItems += it.magic || 0;
    if (it.hpBonus) hpBonusSum += it.hpBonus || 0;
  }

  // Derived stats now calculated from final attributes + direct item bonuses
  stats.attack = (stats.strength || 0) + attackFromItems;
  stats.defense = Math.floor((stats.agility || 0) / 2) + defenseFromItems;
  stats.magic = (stats.intelligence || 0) + magicFromItems;

  // Compute max values: base + attributes + equipment + class vitality bonus
  const classBonusHp = player.bonusHp || 0;
  const classBonusMp = player.bonusMp || 0;
  stats.maxHp = 80 + ((stats.strength || 0) * 2) + hpBonusSum + classBonusHp;
  const mpPerInt = (player.class === "mage") ? 15 : 5;
  stats.maxMp = 20 + ((stats.intelligence || 0) * mpPerInt) + classBonusMp;

  // Asegurar integridad
  stats.hp = Math.min(player.hp ?? stats.maxHp, stats.maxHp);
  stats.mp = Math.min(player.mp ?? stats.maxMp, stats.maxMp);

  // Agregar resistencias: clase base + equipo (ítem propio o tabla ITEM_RESISTANCES)
  const resistances = { ...(CLASS_BASE_RESISTANCES[player.class] || {}) };
  for (const slot in equipment) {
    const it = equipment[slot];
    if (!it) continue;
    const itemRes = it.resistances || ITEM_RESISTANCES[it.id] || {};
    for (const [type, val] of Object.entries(itemRes)) {
      resistances[type] = (resistances[type] || 0) + val;
    }
  }
  stats.resistances = resistances;

  return stats;
}

export function calculateMagicAttack(stats) {
  return Math.round((stats.magic ?? 0) * 1.5);
}

export function increaseStat(statName) {
  if (!gameState.player) return false;
  if ((gameState.player.statPoints ?? 0) <= 0) {
    addMessage(t("statNoPoints"), "system");
    return false;
  }
  if (!["strength", "agility", "intelligence"].includes(statName)) return false;

  gameState.player.statPoints -= 1;
  gameState.player[statName] = (gameState.player[statName] || 0) + 1;

  // Recalculate maxes and clamp current hp/mp
  const s = calculateTotalStats(gameState.player, gameState.equipment);
  gameState.player.maxHp = s.maxHp;
  gameState.player.maxMp = s.maxMp;
  gameState.player.hp = Math.min(gameState.player.hp ?? s.maxHp, s.maxHp);
  gameState.player.mp = Math.min(gameState.player.mp ?? s.maxMp, s.maxMp);

  addMessage(tf("statIncreased", { stat: statName.toUpperCase(), value: gameState.player[statName] }), "stat");
  return true;
}

// levelUp() vive en combat.js — es la única fuente de verdad.
// No duplicar aquí para evitar comportamiento inconsistente.
