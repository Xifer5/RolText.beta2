import { deepClone } from "./utils.js";
import { calculateTotalStats } from "./stats.js";

export const initialGameState = {
  player: {
    name: "Aventurero",
    class: null,
    className: null,
    classEmoji: "⚔️",
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
  stats: {
    kills: 0,
    bossKills: 0,
    locationsVisited: 0,
    enemiesDefeated: {}
  },
  currentLocationId: "town",
  currentEnemy: null,
  isInCombat: false,
  inventory: {},
  equipment: {
    head: null, rightHand: null, leftHand: null,
    armor: null, arms: null, boots: null,
    ring: null, accessory: null
  },
  activeBuffs: {},      // { buff_id: turns_remaining }
  activeDebuffs: {},    // enemy debuffs
  messages: [],
  isGameOver: false,
  mainQuestCompleted: false,
  timeOfDay: "day",
  quests: {},           // { questId: "inactive"|"active"|"completed" }
  visitedLocations: {},  // { locationId: true } — rastrea zonas visitadas para quests tipo "visit"
  achievements: {},
  playerDebuffs: {}    // { poison:{turns,damage}, burn:{turns,damage}, stun:{turns} }
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
