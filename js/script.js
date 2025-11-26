// script.js (VERSIÓN CORREGIDA Y MEJORADA)
// NOTA: este archivo asume que existen los módulos:
// - biomes.js         -> export const biomes
// - mapgen.js         -> export functions generateZone, connectZones
// - worldMap.js       -> export default worldMap
// - biomeBosses.js    -> export function getBossForBiome(biomeId)
// - lootTables.js     -> export function getLoot(enemyId, biomeId)
// - items.js          -> export const allItems, shopInventory
// - enemies.js        -> export const enemyData
// - crafting.js       -> export const craftingRecipes, canCraft, craftItem
//
// Asegúrate de tener esos archivos en la misma carpeta o ajustar rutas.

import { allItems, shopInventory, shopInventories } from "./items.js";
import { enemyData } from "./enemies.js";
import worldMap from "./worldMap.js";
import { biomes } from "./biomes.js";
import { getBossForBiome } from "./biomeBosses.js";
import { getLoot } from "./lootTables.js";
import { craftingRecipes, canCraft, craftItem } from "./crafting.js";
import { buildTooltip } from "./tooltip.js";

// =========================
// Estado inicial del juego
// =========================
const initialGameState = {
  player: {
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 30,
    maxMp: 30,
    strength: 10,
    agility: 8,
    intelligence: 7,
    attack: 10,
    defense: 4,
    magic: 7,
    gold: 50,
    experience: 0,
    nextLevelXp: 100,
    statPoints: 0,
    healthPotions: 3,
    manaPotions: 2,
  },
  currentLocationId: "town",
  currentEnemy: null,
  isInCombat: false,
  inventory: {}, // object  id→quantity  (NOT array)
  equipment: {
    rightHand: null,
    armor: null,
    accessory: null
  },
  shop: { isOpen: false, mode: null },
  messages: [],
  isGameOver: false, // <-- AÑADE ESTA LÍNEA
  timeOfDay: "day",
};

// =========================
// Estado dinámico
// =========================
let gameState = JSON.parse(JSON.stringify(initialGameState));
let isProcessingTurn = false;

// =========================
// Helpers
// =========================
function calculateTotalStats(player, equipment) {
  const newStats = { ...player };
  
  // Bonos base de atributos
  newStats.attack = player.strength;
  newStats.defense = Math.floor(player.agility / 2);
  newStats.magic = player.intelligence;
  newStats.maxHp = 80 + (player.strength * 2);
  newStats.maxMp = 20 + (player.intelligence * 2);
  
  // Aplicar equipo
  for (const slot in equipment) {
    const item = equipment[slot];
    if (item) {
      newStats.attack += item.attack || 0;
      newStats.defense += item.defense || 0;
      newStats.magic += item.magic || 0;
      newStats.strength += item.strength || 0;
      newStats.agility += item.agility || 0;
      newStats.intelligence += item.intelligence || 0;
    }
  }
  
  // Asegurar que HP/MP no excedan los máximos
  newStats.hp = Math.min(newStats.hp, newStats.maxHp);
  newStats.mp = Math.min(newStats.mp, newStats.maxMp);
  
  return newStats;
}

function calculateMagicAttack(stats) {
  return Math.round(stats.magic * 1.5);
}

function addMessage(text, type = "narrative") {
  const story = document.getElementById("story");
  if (!story) {
    console.error("ERROR: No se encontró el elemento #story");
    return;
  }
  
  const p = document.createElement("p");
  p.textContent = text;
  
  p.className = "";
  if (type === "combat") p.classList.add("msg-combat");
  else if (type === "loot") p.classList.add("msg-loot");
  else if (type === "stat") p.classList.add("msg-stat");
  else if (type === "shop") p.classList.add("msg-shop");
  else if (type === "system") p.classList.add("msg-system");
  else p.classList.add("msg-narrative");

  story.appendChild(p);
  story.scrollTop = story.scrollHeight;
}

// =========================
// Sistema de Atributos
// =========================
function increaseStat(stat) {
  if (gameState.player.statPoints > 0) {
    gameState.player.statPoints--;
    gameState.player[stat]++;
    
    const stats = calculateTotalStats(gameState.player, gameState.equipment);
    gameState.player.maxHp = stats.maxHp;
    gameState.player.maxMp = stats.maxMp;
    
    addMessage(`Increased ${stat.toUpperCase()} to ${gameState.player[stat]}!`, "stat");
    updateStatsModal();
    updateUI();
  } else {
    addMessage("Not enough stat points!", "system");
  }
}

function levelUp() {
  gameState.player.level++;
  gameState.player.experience = 0;
  gameState.player.nextLevelXp = Math.floor(gameState.player.nextLevelXp * 1.5);
  gameState.player.statPoints += 5;
  
  gameState.player.maxHp += 10;
  gameState.player.maxMp += 5;
  gameState.player.hp = gameState.player.maxHp;
  gameState.player.mp = gameState.player.maxMp;
  
  addMessage("LEVEL UP! Gained 5 stat points!", "stat");
  addMessage(`Reached level ${gameState.player.level}!`, "stat");
  addMessage("Max HP and MP increased!", "stat");
}

// =========================
// Sistema de Inventario (CORREGIDO)
// =========================
function addItem(item) {
  if (!item || !item.id) return;

  // migra save antiguo (array → objeto)
  if (Array.isArray(gameState.inventory)) {
    gameState.inventory = gameState.inventory.reduce((acc, it) => {
      if (it?.id) acc[it.id] = (acc[it.id] || 0) + 1;
      return acc;
    }, {});
  }

  // ahora sí, añadir
  gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + 1;
  addMessage(`Obtained ${item.name}.`, "loot");
}

function removeItem(itemId, amount = 1) {
  if (!gameState.inventory[itemId]) return false;

  gameState.inventory[itemId] -= amount;

  if (gameState.inventory[itemId] <= 0) {
    delete gameState.inventory[itemId];
  }

  return true;
}

function useItem(itemId, item) {
  if (!item) return;

  if (item.type === "consumable") {
    if (item.id === "health_potion") {
      const stats = calculateTotalStats(gameState.player, gameState.equipment);
      gameState.player.hp = Math.min(gameState.player.hp + 25, stats.maxHp);
      addMessage("Used Health Potion! Restored 25 HP.", "stat");
    } else if (item.id === "mana_potion") {
      const stats = calculateTotalStats(gameState.player, gameState.equipment);
      gameState.player.mp = Math.min(gameState.player.mp + 10, stats.maxMp);
      addMessage("Used Mana Potion! Restored 10 MP.", "stat");
    }

    removeItem(itemId, 1);
  } else if (item.slot) {
    const oldItem = gameState.equipment[item.slot];
    if (oldItem) {
      addItem(oldItem);
    }

    gameState.equipment[item.slot] = item;
    removeItem(itemId, 1);
    addMessage(`Equipped ${item.name}!`, "stat");
  }

  updateInventoryModal();
  updateUI();
}

// =========================
// Actualización UI
// =========================
function updateUI() {
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  
  const hpBar = document.getElementById("hp-bar");
  const hpText = document.getElementById("hp-text");
  if (hpBar && hpText) {
    const hpPercentage = (stats.hp / stats.maxHp) * 100;
    hpBar.style.width = `${hpPercentage}%`;
    hpText.textContent = `${stats.hp}/${stats.maxHp}`;
  }
  
  const mpBar = document.getElementById("mp-bar");
  const mpText = document.getElementById("mp-text");
  if (mpBar && mpText) {
    const mpPercentage = (stats.mp / stats.maxMp) * 100;
    mpBar.style.width = `${mpPercentage}%`;
    mpText.textContent = `${stats.mp}/${stats.maxMp}`;
  }

  const xpBar = document.getElementById("xp-bar");
  const xpText = document.getElementById("xp-text");
  if (xpBar && xpText) {
    const xpPercentage = (gameState.player.experience / gameState.player.nextLevelXp) * 100;
    xpBar.style.width = `${xpPercentage}%`;
    xpText.textContent = `${gameState.player.experience}/${gameState.player.nextLevelXp}`;
  }
  
  const elements = {
    gold: document.getElementById("gold"),
    level: document.getElementById("level"),
    strength: document.getElementById("strength"),
    agility: document.getElementById("agility"),
    intelligence: document.getElementById("intelligence"),
    statPoints: document.getElementById("stat-points"),
    locationName: document.getElementById("location-name"),
  };
  
  if (elements.gold) elements.gold.textContent = gameState.player.gold;
  if (elements.level) elements.level.textContent = gameState.player.level;
  if (elements.strength) elements.strength.textContent = gameState.player.strength;
  if (elements.agility) elements.agility.textContent = gameState.player.agility;
  if (elements.intelligence) elements.intelligence.textContent = gameState.player.intelligence;
  if (elements.statPoints) elements.statPoints.textContent = gameState.player.statPoints;
  if (elements.locationName) elements.locationName.textContent = worldMap[gameState.currentLocationId]?.name || "Unknown";

  const enemyPanel = document.getElementById("enemy-panel");
  const enemyName = document.getElementById("enemy-name");
  const enemyHp = document.getElementById("enemy-hp");
  
  if (gameState.currentEnemy) {
    if (enemyPanel) enemyPanel.classList.remove("hidden");
    if (enemyName) enemyName.textContent = gameState.currentEnemy.type;
    if (enemyHp) enemyHp.textContent = `${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
  } else {
    if (enemyPanel) enemyPanel.classList.add("hidden");
  }
}

function updateStatsModal() {
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  
  const modalElements = {
    level: document.getElementById("modalLevel"),
    statPoints: document.getElementById("modalStatPoints"),
    strength: document.getElementById("modalStrength"),
    agility: document.getElementById("modalAgility"),
    intelligence: document.getElementById("modalIntelligence"),
    strBonus: document.getElementById("strBonus"),
    strHpBonus: document.getElementById("strHpBonus"),
    agiDefBonus: document.getElementById("agiDefBonus"),
    intMpBonus: document.getElementById("intMpBonus"),
    intMagicBonus: document.getElementById("intMagicBonus"),
  };

  if (modalElements.level) modalElements.level.textContent = stats.level;
  if (modalElements.statPoints) modalElements.statPoints.textContent = stats.statPoints;
  if (modalElements.strength) modalElements.strength.textContent = stats.strength;
  if (modalElements.agility) modalElements.agility.textContent = stats.agility;
  if (modalElements.intelligence) modalElements.intelligence.textContent = stats.intelligence;
  if (modalElements.strBonus) modalElements.strBonus.textContent = stats.strength;
  if (modalElements.strHpBonus) modalElements.strHpBonus.textContent = stats.strength * 2;
  if (modalElements.agiDefBonus) modalElements.agiDefBonus.textContent = Math.floor(stats.agility / 2);
  if (modalElements.intMpBonus) modalElements.intMpBonus.textContent = stats.intelligence * 2;
  if (modalElements.intMagicBonus) modalElements.intMagicBonus.textContent = stats.intelligence;
  
  const addStrBtn = document.getElementById("addStrBtn");
  const addAgiBtn = document.getElementById("addAgiBtn");
  const addIntBtn = document.getElementById("addIntBtn");
  
  const hasPoints = stats.statPoints > 0;
  if (addStrBtn) addStrBtn.disabled = !hasPoints;
  if (addAgiBtn) addAgiBtn.disabled = !hasPoints;
  if (addIntBtn) addIntBtn.disabled = !hasPoints;
}

function updateInventoryModal() {
  const inventoryList = document.getElementById("inventoryList");
  if (!inventoryList) return;

  inventoryList.innerHTML = "";

  for (const [itemId, quantity] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item) continue;

    const li = document.createElement("li");
    li.className = "tooltip"; // Clase para el contenedor del tooltip
    li.innerHTML = `
      <span class="tooltiptext">${buildTooltip(item)}</span>
      ${item.name} x${quantity}
    `;

    const btn = document.createElement("button");
    btn.textContent = item.type === "consumable" ? "Use" : "Equip";
    btn.classList.add("btn", "equip-btn");
    btn.onclick = () => useItem(itemId, item);

    li.appendChild(btn);
    inventoryList.appendChild(li);
  }

  const equipRightHand = document.getElementById("equip-rightHand");
  const equipArmor = document.getElementById("equip-armor");
  const equipAccessory = document.getElementById("equip-accessory");
  const inventoryGold = document.getElementById("inventoryGold");

  if (equipRightHand) equipRightHand.textContent = gameState.equipment.rightHand ? gameState.equipment.rightHand.name : "Empty";
  if (equipArmor) equipArmor.textContent = gameState.equipment.armor ? gameState.equipment.armor.name : "Empty";
  if (equipAccessory) equipAccessory.textContent = gameState.equipment.accessory ? gameState.equipment.accessory.name : "Empty";
  if (inventoryGold) inventoryGold.textContent = gameState.player.gold;
}

// =========================
// Lógica principal
// =========================
function handleMove(direction) {
  if (gameState.isGameOver) return; // <-- AÑADE ESTA LÍNEA
  if (gameState.isInCombat) {
    addMessage("You can't move during combat!", "system");
    return;
  }
  
  const currentLocation = worldMap[gameState.currentLocationId];
  const nextLocationId = currentLocation?.exits?.[direction];
  
  if (nextLocationId && worldMap[nextLocationId]) {
    gameState.currentLocationId = nextLocationId;
    gameState.currentEnemy = null;
    
    const directionMessages = {
      north: "You head north...", south: "You travel south...", 
      east: "You venture east...", west: "You move west...",
      up: "You climb upward...", down: "You descend downward...",
      enter: "You enter...", out: "You exit..."
    };
    
    addMessage(directionMessages[direction] || `You move ${direction}...`, "narrative");

    const newLoc = worldMap[nextLocationId];
    const biomeId = newLoc?.biome;
    const biome = biomes[biomeId];
    if (biome && Array.isArray(biome.description) && biome.description.length > 0) {
      const desc = biome.description[Math.floor(Math.random() * biome.description.length)];
      addMessage(desc, "narrative");
    } else {
      addMessage(newLoc.description || "You arrive.", "narrative");
    }
    
    if (!gameState.isInCombat) {
      if (biomeId) {
        const bossId = getBossForBiome(biomeId);
        if (bossId) {
          startCombat(bossId);
          updateUI();
          return;
        }
      }

      const encounterRate = newLoc.encounterRate ?? (biome?.encounterRate ?? 0.3);
      const enemiesList = newLoc.enemies ?? (biome?.enemies ?? []);
      if (enemiesList.length > 0 && Math.random() < encounterRate) {
        const enemyType = enemiesList[Math.floor(Math.random() * enemiesList.length)];
        startCombat(enemyType);
        updateUI();
        return;
      }
    }
  } else {
    const blockedMessages = {
      north: "You cannot go north from here.", south: "The path south is blocked.", 
      east: "You cannot travel east.", west: "The way west is impassable.",
      up: "There's no way up from here.", down: "You cannot go down here.",
      enter: "There's nothing to enter here.", out: "You're not inside anything to exit."
    };
    
    addMessage(blockedMessages[direction] || "You can't go that way.", "system");
  }
  
  updateUI();
}

function startCombat(enemyType) {
  const baseEnemy = enemyData[enemyType];
  let newEnemy;

  if (baseEnemy) {
    newEnemy = { ...baseEnemy };
    newEnemy.id = enemyType;
    newEnemy.maxHp = newEnemy.maxHp ?? newEnemy.hp ?? 1;
    newEnemy.hp = newEnemy.hp ?? newEnemy.maxHp;
  } else {
    const loc = worldMap[gameState.currentLocationId] || {};
    const level = loc.level ?? 1;
    newEnemy = {
      id: enemyType,
      type: enemyType.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
      hp: 50 + level * 20, maxHp: 50 + level * 20,
      attack: 8 + level * 2, defense: 2 + Math.floor(level / 2),
      magicAttack: 6 + Math.floor(level * 1.5),
      experience: 20 * level, gold: 10 * level, drops: []
    };
    addMessage(`A wild ${newEnemy.type} (boss/unique) emerges!`, "combat");
  }

  gameState.currentEnemy = newEnemy;
  gameState.isInCombat = true;
  
  addMessage(`A wild ${newEnemy.type} appears! Prepare for battle!`, "combat");
  
  toggleCombatNavigationMenus(true);
  updateUI();
}

function endCombat(victory) {
  if (victory) {
    const enemy = gameState.currentEnemy;
    addMessage(`You defeated the ${enemy.type}! Victory is yours!`, "combat");
    gameState.player.experience += enemy.experience ?? 0;
    gameState.player.gold += enemy.gold ?? 0;
    addMessage(`Gained ${enemy.experience ?? 0} XP and ${enemy.gold ?? 0} gold!`, "loot");

    try {
      const currentLoc = worldMap[gameState.currentLocationId] || {};
      const biomeId = currentLoc.biome || null;
      const enemyId = enemy.id || null;
      const lootIds = getLoot(enemyId, biomeId) || [];

      if (lootIds.length > 0) {
        lootIds.forEach(itemId => {
          const item = allItems[itemId];
          if (item) {
            addItem(item);
            addMessage(`Loot: You obtained ${item.name}!`, "loot");
          } else {
            addMessage(`Loot: You obtained ${itemId}! (define it in allItems)`, "loot");
          }
        });
      }
    } catch (err) {
      console.error("Error al calcular loot:", err);
    }

    if (gameState.player.experience >= gameState.player.nextLevelXp) {
      levelUp();
    }

    gameState.isInCombat = false;
    gameState.currentEnemy = null;
    toggleCombatNavigationMenus(false);
  } else {
    addMessage("You have been defeated. The world fades to black...", "system");
    addMessage("GAME OVER", "system");
    showGameOver();
  }
  
  isProcessingTurn = false;
  updateUI();
}

function playerTurn(damage, cost = 0, isMagic = false) {
  if (gameState.isGameOver) return; // <-- AÑADE ESTA LÍNEA
  if (!gameState.isInCombat || !gameState.currentEnemy || isProcessingTurn) return;
  
  isProcessingTurn = true;
  gameState.currentEnemy.hp -= damage;
  if (cost > 0) gameState.player.mp -= cost;
  
  const attackType = isMagic ? "magic spell" : "attack";
  addMessage(`You hit the ${gameState.currentEnemy.type} with a ${attackType} for ${damage} damage!`, "combat");
  
  if (gameState.currentEnemy.hp <= 0) {
    endCombat(true);
    return;
  }
  
  setTimeout(() => {
    const enemyAttack = (gameState.currentEnemy.magicAttack && Math.random() < 0.3) ? 
      gameState.currentEnemy.magicAttack : gameState.currentEnemy.attack;
    
    const stats = calculateTotalStats(gameState.player, gameState.equipment);
    const finalDamage = Math.max(1, enemyAttack - stats.defense);
    gameState.player.hp -= finalDamage;
    
    const attackDesc = enemyAttack === gameState.currentEnemy.magicAttack ? 
      "magic attack" : "physical attack";
    
    addMessage(`The ${gameState.currentEnemy.type} hits you with a ${attackDesc} for ${finalDamage} damage!`, "combat");
    
    if (gameState.player.hp <= 0) {
      endCombat(false);
      return;
    }
    
    isProcessingTurn = false;
    updateUI();
  }, 800);
  
  updateUI();
}




// =========================
// Sistema de Guardado/Carga (CORREGIDO)
// =========================
function saveGame() {
  try {
    const saveData = { gameState: gameState, timestamp: new Date().toISOString() };
    localStorage.setItem('pixelQuestSave', JSON.stringify(saveData));
    addMessage("Game saved successfully!", "system");
  } catch (e) {
    console.error("Failed to save game:", e);
    addMessage("Failed to save game!", "system");
  }
}

function loadGame() {
  try {
    const savedGame = localStorage.getItem('pixelQuestSave');
    if (!savedGame) {
      addMessage("No saved game found!", "system");
      return false;
    }
    const saveData = JSON.parse(savedGame);
    gameState = saveData.gameState;
    
    updateUI();
    updateInventoryModal();
    updateStatsModal();
    
    const saveDate = new Date(saveData.timestamp);
    addMessage(`Game loaded from ${saveDate.toLocaleString()}`, "system");
    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    addMessage("Error loading saved game!", "system");
    return false;
  }
}

function hasSavedGame() {
  return localStorage.getItem('pixelQuestSave') !== null;
}

function deleteSave() {
  localStorage.removeItem('pixelQuestSave');
  addMessage("Saved game deleted!", "system");
}

// =========================
// Modales y Menús (CORREGIDO)
// =========================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
}

function openInventory() { openModal("inventoryModal"); updateInventoryModal(); }
function closeInventory() { closeModal("inventoryModal"); }
function openStats() { openModal("statsModal"); updateStatsModal(); }
function closeStats() { closeModal("statsModal"); }
function openShop() { openModal("shopModal"); renderShop(); }
function closeShop() { closeModal("shopModal"); }

function renderShop() {
  const buyList = document.getElementById("shopBuyList");
  const sellList = document.getElementById("shopSellList");
  const goldEl = document.getElementById("shopGold");

  if (!buyList || !sellList || !goldEl) return;

  buyList.innerHTML = "";
  sellList.innerHTML = "";
  goldEl.textContent = gameState.player.gold;

  // Decide active shop inventory by current location (support 'shop', 'castle_shop', 'port')
  const locId = gameState.currentLocationId;
  const inventory = (shopInventories && shopInventories[locId]) ? shopInventories[locId] : shopInventory;

  // write a friendly shop title
  const modalTitle = document.querySelector('#shopModal .modal-content h2');
  if (modalTitle) {
    const worldMapRef = window.worldMap?.[locId];
    modalTitle.textContent = worldMapRef?.name || (locId === 'castle_shop' ? 'Castle Shop' : (locId === 'port' ? 'Port Vendor' : 'General Store'));
  }

  // Lista de compra
  inventory.forEach(id => {
    const item = allItems[id];
    if (!item) return;
    const li = document.createElement("li");
    li.className = "tooltip"; // Clase para el contenedor del tooltip
    li.innerHTML = `
      <span class="tooltiptext">${buildTooltip(item)}</span>
      ${item.name} - ${item.price}g
    `;
    const btn = document.createElement("button");
    btn.textContent = "Buy";
    btn.classList.add("btn");
    btn.onclick = () => buyItem(item);
    li.appendChild(btn);
    buyList.appendChild(li);
  });

  // Lista de venta
  for (const [itemId, quantity] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item || !item.price) continue;
    const sellPrice = Math.floor(item.price / 2);
    const li = document.createElement("li");
    li.className = "tooltip"; // Clase para el contenedor del tooltip
    li.innerHTML = `
      <span class="tooltiptext">${buildTooltip(item)}</span>
      ${item.name} x${quantity} - ${sellPrice}g
    `;
    const btn = document.createElement("button");
    btn.textContent = "Sell";
    btn.onclick = () => sellItem(itemId, sellPrice);
    li.appendChild(btn);
    sellList.appendChild(li);
  }
}

function buyItem(item) {
  if (gameState.player.gold < item.price) { addMessage("Not enough gold!", "system"); return; }
  gameState.player.gold -= item.price; addItem(item);
  addMessage(`Bought ${item.name} for ${item.price}g.`, "shop");
  renderShop(); updateUI();
}

function sellItem(itemId, price) {
  if (!gameState.inventory[itemId]) return;
  const item = allItems[itemId]; if (!item) return;
  gameState.player.gold += price; removeItem(itemId, 1);
  addMessage(`Sold ${item.name} for ${price}g.`, "shop");
  renderShop(); updateUI();
}

function rest() {
  const location = worldMap[gameState.currentLocationId];
  if (!location.safeZone) { addMessage("❌ You can only rest in a safe place like Town.", "system"); return; }
  const player = gameState.player;
  const stats = calculateTotalStats(player, gameState.equipment);
  const healHp = Math.floor(stats.maxHp * 0.5);
  const healMp = Math.floor(stats.maxMp * 0.5);
  player.hp = Math.min(player.hp + healHp, stats.maxHp);
  player.mp = Math.min(player.mp + healMp, stats.maxMp);
  addMessage(`🛏️ You rest and recover ${healHp} HP and ${healMp} MP.`, "narrative");
  updateUI();
}

// =========================
// Sistema de Menús Colapsables (CORREGIDO)
// =========================
function setupCollapsibleMenus() {
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-target');
      const content = document.getElementById(targetId);
      if (content) {
        const isCollapsed = content.classList.contains('collapsed');
        if (isCollapsed) {
          content.classList.remove('collapsed'); e.target.classList.remove('collapsed');
          content.style.display = 'block';
        } else {
          content.classList.add('collapsed'); e.target.classList.add('collapsed');
          setTimeout(() => { if (content.classList.contains('collapsed')) content.style.display = 'none'; }, 300);
        }
      }
    });
  });
}

function toggleCombatNavigationMenus(isCombat) {
  const combatMenu = document.getElementById('combat-menu');
  const navigationMenu = document.getElementById('navigation-menu');
  const combatContent = document.getElementById('combat-content');
  const navigationContent = document.getElementById('navigation-content');
  const combatHeader = document.querySelector('[data-target="combat-content"]');
  const navigationHeader = document.querySelector('[data-target="navigation-content"]');
  
  if (isCombat) {
    if (combatMenu) combatMenu.classList.remove('hidden');
    if (navigationMenu) navigationMenu.classList.add('hidden');
    if (combatContent) { combatContent.classList.remove('collapsed'); combatContent.style.display = 'block'; }
    if (combatHeader) combatHeader.classList.remove('collapsed');
  } else {
    if (combatMenu) combatMenu.classList.add('hidden');
    if (navigationMenu) navigationMenu.classList.remove('hidden');
    if (navigationContent) { navigationContent.classList.remove('collapsed'); navigationContent.style.display = 'block'; }
    if (navigationHeader) navigationHeader.classList.remove('collapsed');
  }
}

// =========================
// Crafting UI (CORREGIDO)
// =========================
function setupCraftingUI() {
  const modal = document.getElementById("craftingModal");
  if (!modal) return; // Salir si el modal no existe

  const recipesList = document.getElementById("recipesList");
  const recipeDetails = document.getElementById("recipeDetails");
  const recipeName = document.getElementById("recipeName");
  const materialsList = document.getElementById("materialsList");
  const craftButton = document.getElementById("craftButton");
  const closeCraftingBtn = document.getElementById("closeCraftingBtn");

  function openCrafting() {
    // Asegurarse de que el juego ha comenzado
    if (gameState.currentLocationId === initialGameState.currentLocationId && Object.keys(gameState.inventory).length === 0 && !hasSavedGame()) {
      addMessage("You need to start a new game first!", "system");
      return;
    }
    modal.classList.remove("hidden");
    loadCraftingCategory("forge");
  }
  window.openCrafting = openCrafting; // Exponer globalmente

  function closeCrafting() { modal.classList.add("hidden"); recipeDetails.classList.add("hidden"); }
  closeCraftingBtn.onclick = closeCrafting;

  document.querySelectorAll(".crafting-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".crafting-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadCraftingCategory(tab.dataset.tab);
    });
  });

  function loadCraftingCategory(category) {
    if (!recipesList) return;
    recipesList.innerHTML = ""; recipeDetails.classList.add("hidden");
    const categoryRecipes = craftingRecipes[category]; if (!categoryRecipes) return;
    for (const key in categoryRecipes) {
      const r = categoryRecipes[key];
      const btn = document.createElement("div"); btn.className = "recipe-button";
      btn.innerHTML = `<span>${r.name}</span><small>Lv ${r.levelReq}</small>`;
      btn.addEventListener("click", () => loadRecipeDetails(category, key));
      recipesList.appendChild(btn);
    }
  }

  function loadRecipeDetails(category, recipeId) {
    const r = craftingRecipes[category][recipeId]; if (!r) return;
    if (recipeName) recipeName.textContent = r.name;
    if (materialsList) {
      materialsList.innerHTML = "";
      for (const mat in r.ingredients) {
        const needed = r.ingredients[mat];
        const have = gameState.inventory[mat] || 0;
        const itemDef = allItems[mat]; const label = itemDef ? itemDef.name : mat;
        const ok = have >= needed;
        const li = document.createElement("li");
        li.innerHTML = `<span style="color:${ok ? "lightgreen" : "salmon"}">${label} (${have}/${needed})</span>`;
        materialsList.appendChild(li);
      }
    }
    if (recipeDetails) recipeDetails.classList.remove("hidden");
    if (craftButton) craftButton.onclick = () => {
      const check = canCraft(r, gameState.inventory, gameState.player.level);
      if (!check.ok) { addMessage(`❌ Cannot craft: ${check.reason}`, "system"); return; }
      const newItem = craftItem(r, gameState.inventory);
      if (!newItem) { addMessage("Error crafting item.", "system"); return; }
      addMessage(`✅ Crafted: ${newItem.name}`, "loot");
      updateInventoryModal(); loadRecipeDetails(category, recipeId);
    };
  }
}

// =========================
// Configuración de Event Listeners (CORREGIDO)
// =========================
function setupEventListeners() {
  // Usar una función auxiliar para añadir listeners de forma segura
  const safeAddListener = (id, event, fn) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener(event, fn);
  };

  // Botones de combate
  safeAddListener("attackBtn", "click", () => {
    if (!gameState.currentEnemy) { addMessage("There's no enemy to attack!", "system"); return; }
    const stats = calculateTotalStats(gameState.player, gameState.equipment);
    const dmg = Math.max(1, stats.attack - (gameState.currentEnemy.defense || 0));
    playerTurn(dmg);
  });
  safeAddListener("magicBtn", "click", () => {
    if (!gameState.currentEnemy) { addMessage("No enemy in sight.", "system"); return; }
    const stats = calculateTotalStats(gameState.player, gameState.equipment);
    if (stats.mp < 10) { addMessage("Not enough mana.", "system"); return; }
    const dmg = calculateMagicAttack(stats);
    playerTurn(dmg, 10, true);
  });
  safeAddListener("itemBtn", "click", () => { openInventory(); });
  safeAddListener("fleeBtn", "click", () => {
      if (gameState.isGameOver) return; // <-- AÑADE ESTA LÍNEA
    if (!gameState.currentEnemy) { addMessage("Nothing to flee from!", "system"); return; }
    if (Math.random() < 0.6) {
      addMessage("You successfully fled!", "combat"); gameState.isInCombat = false; gameState.currentEnemy = null;
      toggleCombatNavigationMenus(false);
    } else {
      addMessage("You failed to escape!", "combat");
      setTimeout(() => {
        const stats = calculateTotalStats(gameState.player, gameState.equipment);
        const enemyAttack = Math.max(1, (gameState.currentEnemy.attack || 1) - stats.defense);
        gameState.player.hp -= enemyAttack;
        addMessage(`The ${gameState.currentEnemy.type} hits you for ${enemyAttack} damage!`, "combat");
        if (gameState.player.hp <= 0) { endCombat(false); } else { updateUI(); }
      }, 800);
    } updateUI();
  });

  // Botones de UI
  safeAddListener("inventoryBtn", "click", openInventory);
  safeAddListener("statsBtn", "click", openStats);
  safeAddListener("restBtn", "click", rest);
  safeAddListener("shopBtn", "click", () => {
    const loc = worldMap[gameState.currentLocationId];
    const allowed = new Set(['shop','castle_shop','port']);
    if (loc && allowed.has(loc.id)) {
      addMessage("Shopkeeper: 'Welcome!'", "shop"); openShop();
    } else {
      addMessage("You need to be at a shop (Town, Castle or Port).", "system");
    }
  });
  
  // Botones de guardado rápido
  safeAddListener("quickSaveBtn", "click", saveGame);
  safeAddListener("quickLoadBtn", "click", loadGame);

  // Botones de dirección
  document.querySelectorAll(".direction-buttons .btn").forEach(btn => {
    btn.addEventListener("click", (e) => handleMove(e.target.getAttribute("data-direction")));
  });

  // Cierre de modales
  safeAddListener("closeInventoryBtn", "click", closeInventory);
  safeAddListener("closeStatsBtn", "click", closeStats);
  safeAddListener("closeShopBtn", "click", closeShop);

  // Botones de stats
  safeAddListener("addStrBtn", "click", () => increaseStat("strength"));
  safeAddListener("addAgiBtn", "click", () => increaseStat("agility"));
  safeAddListener("addIntBtn", "click", () => increaseStat("intelligence"));

  // Botón de reinicio
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", restartGame);
  }
}

// ---------------------
// Inicio / inicialización de juego (un solo punto de verdad)
// ---------------------
function initializeGame() {
  // copia fresca del estado inicial
  gameState = JSON.parse(JSON.stringify(initialGameState));
  gameState.inventory = {};
  // recalcular maximos iniciales
  const stats = calculateTotalStats(gameState.player, gameState.equipment);
  gameState.player.maxHp = stats.maxHp;
  gameState.player.maxMp = stats.maxMp;
  gameState.player.hp = stats.maxHp;
  gameState.player.mp = stats.maxMp;

  const storyEl = document.getElementById("story");
  if (storyEl) storyEl.innerHTML = "";
  addMessage("Welcome to Pixel Quest Echoes!", "narrative");
  addMessage("You awaken in the town square, ready to begin your adventure.", "narrative");
  addMessage(worldMap[gameState.currentLocationId]?.description || "You stand in a small town.", "narrative");
  updateUI();
}

function startNewGame() {
  if (hasSavedGame() && !confirm("Start a new game? Unsaved progress will be lost.")) return;
  // eliminar save anterior de forma consistente
  localStorage.removeItem(SAVE_KEY);
  initializeGame();
  toggleMainMenu(false);
}


function toggleMainMenu(show) {
  const menu = document.getElementById("mainMenuModal");
  if (!menu) return;
  menu.classList.toggle("hidden", !show);
  if (show) updateSaveInfo();
}

function updateSaveInfo() {
  const saveInfo   = document.getElementById("saveInfo");
  const continueBtn= document.getElementById("continueBtn");
  const loadBtn    = document.getElementById("loadGameBtn");
  const deleteBtn  = document.getElementById("deleteSaveBtn");

  const exists = hasSavedGame();
  if (!saveInfo || !continueBtn || !loadBtn || !deleteBtn) return;

  if (exists) {
    try {
      const data      = JSON.parse(localStorage.pixelQuestSave);
      const date      = new Date(data.timestamp);
      const lvl       = data.gameState.player.level;
      const gold      = data.gameState.player.gold;
      saveInfo.innerHTML   = `<p>Last save: ${date.toLocaleString()}</p><p>Level ${lvl} | Gold ${gold}</p>`;
      continueBtn.disabled = false;
      loadBtn.disabled     = false;
      deleteBtn.disabled   = false;
    } catch {
      saveInfo.innerHTML   = "<p>Corrupted save</p>";
      continueBtn.disabled = true;
      loadBtn.disabled     = true;
      deleteBtn.disabled   = false;
    }
  } else {
    saveInfo.innerHTML   = "<p>No saved game</p>";
    continueBtn.disabled = true;
    loadBtn.disabled     = true;
    deleteBtn.disabled   = true;
  }
}

// ---------------------
// Guardado / Carga unificado y seguro
// ---------------------
const SAVE_KEY = "pixelQuestSave";

function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function saveGame() {
  try {
    const payload = { gameState: gameState, timestamp: new Date().toISOString() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    addMessage("💾 Game saved!", "system");
    console.log("Game saved:", payload.timestamp);
    return true;
  } catch (e) {
    console.error("Failed to save game:", e);
    addMessage("❌ Failed to save game!", "system");
    return false;
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    addMessage("❌ No save found.", "system");
    return false;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.gameState) throw new Error("Invalid save format");
    gameState = parsed.gameState;
    // Recalculate derived stats to be safe
    const stats = calculateTotalStats(gameState.player, gameState.equipment);
    gameState.player.maxHp = stats.maxHp;
    gameState.player.maxMp = stats.maxMp;
    gameState.player.hp = Math.min(gameState.player.hp ?? stats.maxHp, stats.maxHp);
    gameState.player.mp = Math.min(gameState.player.mp ?? stats.maxMp, stats.maxMp);

    updateUI();
    updateInventoryModal();
    updateStatsModal();

    const saveDate = new Date(parsed.timestamp || Date.now());
    addMessage(`📂 Game loaded (${saveDate.toLocaleString()})`, "system");
    console.log("Game loaded from", saveDate.toISOString());
    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    addMessage("❌ Corrupted save.", "system");
    return false;
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  addMessage("🗑️ Save deleted.", "system");
  console.log("Saved game removed.");
}


// ---------------------
// Listeners del menú principal (más robusto y fácil de debug)
// ---------------------
function setupMainMenuListeners() {
  const handlers = {
    newGameBtn:    () => startNewGame(),
    continueBtn:   () => { if (loadGame()) toggleMainMenu(false); },
    saveGameBtn:   () => { if (saveGame()) updateSaveInfo(); },
    loadGameBtn:   () => { if (loadGame()) toggleMainMenu(false); },
    deleteSaveBtn: () => {
      if (!hasSavedGame()) { addMessage("No save to delete.", "system"); return; }
      if (confirm("Delete saved game?")) { deleteSave(); updateSaveInfo(); }
    },
    closeMenuBtn:  () => toggleMainMenu(false)
  };

  Object.keys(handlers).forEach(id => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`setupMainMenuListeners: elemento con id '${id}' no encontrado en DOM`);
      return;
    }
    // remover anteriores para evitar doble-atach
    el.removeEventListener("click", handlers[id]);
    el.addEventListener("click", handlers[id]);
  });
}

// =========================
// Sistema de Game Over
// =========================
function showGameOver() {
  gameState.isGameOver = true;
  addMessage("You have been defeated. The world fades to black...", "system");
  addMessage("GAME OVER", "system");

  // Mostrar el modal de game over
  const gameOverModal = document.getElementById("gameOverModal");
  if (gameOverModal) {
    gameOverModal.classList.remove("hidden");
  }

  // Opcional: reproducir un sonido de game over
  // playSound('game_over.wav');
}

function restartGame() {
  // Ocultar el modal de game over
  const gameOverModal = document.getElementById("gameOverModal");
  if (gameOverModal) {
    gameOverModal.classList.add("hidden");
  }

  // Reiniciar el estado del juego
  gameState = JSON.parse(JSON.stringify(initialGameState));
  
  // Limpiar la UI
  document.getElementById("story").innerHTML = "";
  
  // Iniciar de nuevo
  initializeGame(); // Usamos la función de inicialización que ya tienes
  addMessage("A new adventure begins...", "narrative");
}

window.addEventListener("DOMContentLoaded", () => {
  setupMainMenuListeners();
  updateSaveInfo();
  toggleMainMenu(true); // Mostrar menú al iniciar
});
  