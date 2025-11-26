import { deepClone } from "./utils.js";
import { calculateTotalStats } from "./stats.js";

export const initialGameState = {
  player: {
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 30,
    maxMp: 30,
    strength: 10,
    agility: 8,
    intelligence: 7,
    gold: 50,
    experience: 0,
    nextLevelXp: 100,
    statPoints: 0
  },
  currentLocationId: "town",
  currentEnemy: null,
  isInCombat: false,
  inventory: {},
  equipment: { rightHand: null, armor: null, accessory: null },
  messages: [],
  isGameOver: false,
  mainQuestCompleted: false,
  timeOfDay: "day"
};

export let gameState = deepClone(initialGameState);

export function resetState() {
  gameState = deepClone(initialGameState);
  const s = calculateTotalStats(gameState.player, gameState.equipment);
  gameState.player.maxHp = s.maxHp;
  gameState.player.maxMp = s.maxMp;
  gameState.player.hp = s.maxHp;
  gameState.player.mp = s.maxMp;
}

export function initializeGame() {
  resetState();
}