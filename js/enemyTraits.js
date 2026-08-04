/**
 * enemyTraits.js — Rasgos aleatorios de enemigo (SPEC-1103)
 *
 * Extraído de combat.js (modularización post SPEC-1110, ver
 * errores/registro_de_errores.md / project_polish_sprint en memoria):
 * furioso/ladrón/antiguo/regenerador/cobarde — asignación al iniciar
 * combate, huida del cobarde, y robo de oro del ladrón al huir el jugador.
 */
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { t, formatText } from "./i18n.js";
import { endCombat } from "./combatRewards.js";

// SPEC-1103: rasgos aleatorios de enemigo (solo no-boss) — rejugabilidad
const ENEMY_TRAIT_CHANCE = 0.25;
const ENEMY_TRAITS = ["furious", "thief", "ancient", "regenerator", "coward"];
const THIEF_GOLD_STEAL_PCT = 0.15;
const COWARD_HP_THRESHOLD = 0.2;
const COWARD_FLEE_CHANCE = 0.6;

// SPEC-1103: rasgos aleatorios de enemigo (solo no-boss, rejugabilidad).
// Muta `enemy` in-place (mismo objeto que gameState.currentEnemy).
export function assignRandomTrait(enemy, isBoss) {
  if (isBoss || Math.random() >= ENEMY_TRAIT_CHANCE) return;
  const trait = ENEMY_TRAITS[Math.floor(Math.random() * ENEMY_TRAITS.length)];
  enemy.trait = trait;
  if (trait === "furious") {
    enemy.attack = Math.max(1, Math.floor(enemy.attack * 1.35));
    enemy.defense = Math.max(0, Math.floor(enemy.defense * 0.75));
  } else if (trait === "ancient") {
    enemy.traitResistances = { physical: 30, light: -30 };
  }
  const traitKey = { furious: "traitFurious", thief: "traitThief", ancient: "traitAncient", regenerator: "traitRegenerator", coward: "traitCoward" }[trait];
  enemy.type = `${enemy.type} ${t(traitKey)}`;
}

// SPEC-1103: rasgo "Cobarde" — bajo COWARD_HP_THRESHOLD, chance por turno de
// huir sin dar recompensa (simétrico a tryFlee() del jugador). true = huyó.
export function checkCowardFlee(enemy) {
  if (enemy.trait !== "coward" || enemy.hp <= 0) return false;
  if (enemy.hp / enemy.maxHp >= COWARD_HP_THRESHOLD) return false;
  if (Math.random() >= COWARD_FLEE_CHANCE) return false;
  addMessage(formatText(t('enemyFleesCoward'), { enemy: enemy.type }), "system");
  endCombat(false, false, true);
  return true;
}

// SPEC-1103: rasgo "Ladrón" — roba oro cuando el jugador huye con éxito
export function applyThiefGoldSteal(enemy) {
  if (enemy?.trait !== "thief" || !(gameState.player.gold > 0)) return;
  const stolen = Math.max(1, Math.floor(gameState.player.gold * THIEF_GOLD_STEAL_PCT));
  gameState.player.gold = Math.max(0, gameState.player.gold - stolen);
  addMessage(formatText(t('enemyStealsGold'), { enemy: enemy.type, gold: stolen }), "system");
}
