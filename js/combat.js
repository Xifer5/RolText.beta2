import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";
import { calculateTotalStats, calculateMagicAttack } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { getLoot } from "./lootTables.js";

export function setupCombat() {
  window.addEventListener("pixel:attack", playerAttack);
  window.addEventListener("pixel:magic", playerMagic);
  window.addEventListener("pixel:flee", tryFlee);
  window.addEventListener("pixel:startCombat", (e) => startCombat(e.detail?.enemyId));
}

export function getRandomEncounter(locationId) {
  const loc = window.worldMap?.[locationId];
  if (!loc) return null;
  const list = loc.enemies || [];
  const rate = typeof loc.encounterRate === "number" ? loc.encounterRate : 0.25;
  if (list.length === 0) return null;
  if (Math.random() < rate) return list[Math.floor(Math.random() * list.length)];
  return null;
}

export function startCombat(enemyType) {
  const base = enemyData?.[enemyType];
  if (!base) {
    addMessage(`No enemy definition for ${enemyType}`, "system");
    return;
  }
  // keep the original id so we can check for special enemies (bosses)
  gameState.currentEnemy = { id: enemyType, ...base, hp: base.maxHp ?? base.hp ?? 1, maxHp: base.maxHp ?? base.hp ?? 1 };
  gameState.isInCombat = true;
  addMessage(`A wild ${gameState.currentEnemy.type} appears!`, "combat");
  updateUI();
}

function playerAttack() {
  if (!gameState.isInCombat || !gameState.currentEnemy) { addMessage("There's no enemy to attack!", "system"); return; }
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const dmg = Math.max(1, stats.attack - (gameState.currentEnemy.defense || 0));
  gameState.currentEnemy.hp -= dmg;
  addMessage(`You strike the ${gameState.currentEnemy.type} for ${dmg} damage!`, "combat");
  if (gameState.currentEnemy.hp <= 0) return endCombat(true);
  setTimeout(enemyTurn, 600);
  updateUI();
}

function playerMagic() {
  if (!gameState.isInCombat || !gameState.currentEnemy) { addMessage("No enemy in sight.", "system"); return; }
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  if (stats.mp < 10) { addMessage("Not enough mana.", "system"); return; }
  const dmg = calculateMagicAttack(stats);
  gameState.player.mp -= 10;
  gameState.currentEnemy.hp -= dmg;
  addMessage(`You cast a spell dealing ${dmg} damage!`, "combat");
  if (gameState.currentEnemy.hp <= 0) return endCombat(true);
  setTimeout(enemyTurn, 600);
  updateUI();
}

function enemyTurn() {
  if (!gameState.currentEnemy) return;
  const enemyAtk = gameState.currentEnemy.magicAttack && Math.random() < 0.3 ? gameState.currentEnemy.magicAttack : gameState.currentEnemy.attack;
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  const final = Math.max(1, (enemyAtk || 1) - stats.defense);
  gameState.player.hp -= final;
  const atkType = enemyAtk === gameState.currentEnemy.magicAttack ? "magic attack" : "physical attack";
  addMessage(`The ${gameState.currentEnemy.type} hits you with a ${atkType} for ${final} damage.`, "combat");
  if (gameState.player.hp <= 0) return endCombat(false);
  updateUI();
}

function tryFlee() {
  if (!gameState.currentEnemy) return;
  if (Math.random() < 0.6) {
    addMessage("You successfully fled!", "combat");
    gameState.isInCombat = false;
    gameState.currentEnemy = null;
    updateUI();
    return;
  }
  addMessage("You failed to flee!", "combat");
  setTimeout(enemyTurn, 600);
}

function endCombat(victory) {
  if (victory) {
    const enemy = gameState.currentEnemy;
    // special-case: if main antagonist defeated
    if (enemy?.id === 'dragon_king' && !gameState.mainQuestCompleted) {
      gameState.mainQuestCompleted = true;
      addMessage('¡Felicidades! Has completado la misión principal.', 'system');
      // (optionally) fire an event so UI or other systems can react
      window.dispatchEvent(new CustomEvent('pixel:mainQuestCompleted', { detail: { by: 'dragon_king' } }));
    }
    addMessage(`You defeated the ${enemy.type}!`, "combat");
    gameState.player.gold += enemy.gold || 0;
    gameState.player.experience += enemy.experience || 0;

    const loot = getLoot(enemy.type, window.worldMap?.[gameState.currentLocationId]?.biome);
    loot.forEach(itemId => {
      gameState.inventory[itemId] = (gameState.inventory[itemId] || 0) + 1;
      addMessage(`You found: ${itemId}`, "loot");
    });

    gameState.currentEnemy = null;
    gameState.isInCombat = false;

    if (gameState.player.experience >= gameState.player.nextLevelXp) {
      import("./stats.js").then(({ levelUp }) => levelUp());
    }

    updateUI();
    return;
  }

  addMessage("You have been defeated. GAME OVER", "system");
  gameState.isGameOver = true;
  document.getElementById("gameOverModal").classList.remove("hidden");
  updateUI();
}