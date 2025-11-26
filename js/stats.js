// js/stats.js
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";

/**
 * Calcula estadísticas derivadas a partir de los atributos base y equipo.
 * No modifica gameState (salvo que el caller lo quiera aplicar).
 */
export function calculateTotalStats(player, equipment = {}) {
  const stats = { ...player };

  // Base
  stats.attack = player.strength ?? 0;
  stats.defense = Math.floor((player.agility ?? 0) / 2);
  stats.magic = player.intelligence ?? 0;
  // We'll calculate maxHP/MP after merging equipment so equipment STR/hpBonus is included
  let hpBonusSum = player.hpBonus || 0;

  // Aplicar equipo si tiene bonificaciones
  for (const slot in equipment) {
    const it = equipment[slot];
    if (!it) continue;
    stats.attack += it.attack || 0;
    stats.defense += it.defense || 0;
    stats.magic += it.magic || 0;
    stats.strength += it.strength || 0;
    stats.agility += it.agility || 0;
    stats.intelligence += it.intelligence || 0;
    // Support equipment that adds direct HP to max HP (accumulate and apply after loop)
    if (it.hpBonus) hpBonusSum += it.hpBonus || 0;
  }

  // Compute max values now equipment and stats.strength/stats.intelligence are resolved
  stats.maxHp = 80 + ((stats.strength ?? 0) * 2) + hpBonusSum;
  stats.maxMp = 20 + ((stats.intelligence ?? 0) * 2);

  // Asegurar integridad
  stats.hp = Math.min(player.hp ?? stats.maxHp, stats.maxHp);
  stats.mp = Math.min(player.mp ?? stats.maxMp, stats.maxMp);

  return stats;
}

export function calculateMagicAttack(stats) {
  return Math.round((stats.magic ?? 0) * 1.5);
}

export function increaseStat(statName) {
  if (!gameState.player) return false;
  if ((gameState.player.statPoints ?? 0) <= 0) {
    addMessage("Not enough stat points!", "system");
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

  addMessage(`Increased ${statName.toUpperCase()} to ${gameState.player[statName]}!`, "stat");
  return true;
}

export function levelUp() {
  const p = gameState.player;
  p.level = (p.level || 1) + 1;
  p.experience = 0;
  p.nextLevelXp = Math.floor((p.nextLevelXp || 100) * 1.5);
  p.statPoints = (p.statPoints || 0) + 5;
  p.maxHp = (p.maxHp || 0) + 10;
  p.maxMp = (p.maxMp || 0) + 5;
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  addMessage(`LEVEL UP! You reached level ${p.level}! Gained 5 stat points.`, "stat");
}
