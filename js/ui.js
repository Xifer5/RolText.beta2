import { gameState, initializeGame } from "./state.js";
import { addMessage } from "./story.js";
import { renderShop } from "./shop.js";
import { renderCrafting } from "./crafting.js";
import { renderInventory } from "./inventory.js";
import { calculateTotalStats, increaseStat } from "./stats.js";
import { hasSavedGame } from "./saveSystem.js";

export function updateUI() {
  const p = gameState.player;
  // derived stats include equipment bonuses
  const derived = calculateTotalStats(p, gameState.equipment);

  // HP / MP bars use the derived max (equipment/STR/INT can affect them)
  const hpMax = derived.maxHp || p.maxHp || 1;
  const mpMax = derived.maxMp || p.maxMp || 1;
  const hpPct = Math.round((p.hp / hpMax) * 100);
  const mpPct = Math.round((p.mp / mpMax) * 100);
  document.getElementById("hp-bar").style.width = `${hpPct}%`;
  document.getElementById("hp-text").textContent = `${p.hp}/${hpMax}`;
  document.getElementById("mp-bar").style.width = `${mpPct}%`;
  document.getElementById("mp-text").textContent = `${p.mp}/${mpMax}`;

  // XP
  document.getElementById("xp-bar").style.width = `${Math.round((p.experience / p.nextLevelXp) * 100)}%`;
  document.getElementById("xp-text").textContent = `${p.experience}/${p.nextLevelXp}`;

  // Basic info
  document.getElementById("gold").textContent = p.gold;
  document.getElementById("level").textContent = p.level;

  // Show base stat + equipment bonus (if any)
  const strBonus = (derived.strength || 0) - (p.strength || 0);
  const agiBonus = (derived.agility || 0) - (p.agility || 0);
  const intBonus = (derived.intelligence || 0) - (p.intelligence || 0);
  document.getElementById("strength").textContent = `${p.strength || 0}${strBonus ? ' (+' + strBonus + ')' : ''}`;
  document.getElementById("agility").textContent = `${p.agility || 0}${agiBonus ? ' (+' + agiBonus + ')' : ''}`;
  document.getElementById("intelligence").textContent = `${p.intelligence || 0}${intBonus ? ' (+' + intBonus + ')' : ''}`;

  document.getElementById("stat-points").textContent = p.statPoints;

  const loc = window.worldMap?.[gameState.currentLocationId];
  document.getElementById("location-name").textContent = loc?.name || gameState.currentLocationId;

  const enemyPanel = document.getElementById("enemy-panel");
  if (gameState.currentEnemy) {
    enemyPanel.classList.remove("hidden");
    document.getElementById("enemy-name").textContent = gameState.currentEnemy.type;
    document.getElementById("enemy-hp").textContent = `${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
  } else {
    enemyPanel.classList.add("hidden");
  }

  // Toggle combat vs navigation panels
  const combatMenu = document.getElementById("combat-menu");
  const navigationMenu = document.getElementById("navigation-menu");
  const combatContent = document.getElementById("combat-content");
  const navigationContent = document.getElementById("navigation-content");
  const combatHeader = document.querySelector('[data-target="combat-content"]');
  const navigationHeader = document.querySelector('[data-target="navigation-content"]');
  if (gameState.isInCombat) {
    combatMenu?.classList.remove("hidden");
    navigationMenu?.classList.add("hidden");
    combatContent?.classList.remove("collapsed");
    if (combatContent) combatContent.style.display = "block";
    combatHeader?.classList.remove("collapsed");
  } else {
    combatMenu?.classList.add("hidden");
    navigationMenu?.classList.remove("hidden");
    navigationContent?.classList.remove("collapsed");
    if (navigationContent) navigationContent.style.display = "block";
    navigationHeader?.classList.remove("collapsed");
  }

  // Enable/disable combat action buttons depending on combat state
  const attackBtn = document.getElementById('attackBtn');
  const magicBtn = document.getElementById('magicBtn');
  const itemBtn = document.getElementById('itemBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const disabled = !gameState.isInCombat;
  if (attackBtn) attackBtn.disabled = disabled;
  if (magicBtn) magicBtn.disabled = disabled;
  if (itemBtn) itemBtn.disabled = disabled;
  // add derived combat stats display (attack/defense/magic)
  const atkEl = document.getElementById('derived-attack');
  const defEl = document.getElementById('derived-defense');
  const magEl = document.getElementById('derived-magic');
  if (atkEl) atkEl.textContent = derived.attack ?? 0;
  if (defEl) defEl.textContent = derived.defense ?? 0;
  if (magEl) magEl.textContent = derived.magic ?? 0;
  if (fleeBtn) fleeBtn.disabled = disabled;
}

export function toggleMainMenu(show) {
  const modal = document.getElementById("mainMenuModal");
  if (modal) {
    modal.classList.toggle("hidden", !show);
    if (show) updateSaveInfo();
  }
}

export function setupUIListeners() {
  // Keep UI in sync with state changes and save updates triggered elsewhere
  window.addEventListener("pixel:stateUpdated", () => updateUI());
  window.addEventListener("pixel:saveChanged", () => updateSaveInfo());
  document.getElementById("inventoryBtn")?.addEventListener("click", () => {
    renderInventory();
    document.getElementById("inventoryModal").classList.remove("hidden");
  });
  document.getElementById("closeInventoryBtn")?.addEventListener("click", () => {
    document.getElementById("inventoryModal").classList.add("hidden");
    // reset detail panel to empty state
    const detailCard = document.getElementById('itemDetailCard');
    const detailEmpty = document.querySelector('#inventoryDetail .item-detail-empty');
    if (detailCard) detailCard.style.display = 'none';
    if (detailEmpty) detailEmpty.style.display = '';
    const grid = document.querySelector('.inventory-grid');
    if (grid) grid.classList.remove('detail-open');
  });

  document.getElementById("shopBtn")?.addEventListener("click", () => {
    // Only allow opening shops at specific locations (town/shop, castle_shop, port)
    const loc = window.worldMap?.[gameState.currentLocationId];
    const allowed = new Set(['shop', 'castle_shop', 'port']);
    if (!loc || !allowed.has(loc.id)) {
      addMessage("You need to be at a shop (Town, Castle or Port).", "system");
      return;
    }
    renderShop();
    document.getElementById("shopModal").classList.remove("hidden");
  });
  document.getElementById("closeShopBtn")?.addEventListener("click", () => {
    document.getElementById("shopModal").classList.add("hidden");
  });

  document.getElementById("craftBtn")?.addEventListener("click", () => {
    renderCrafting();
    document.getElementById("craftingModal").classList.remove("hidden");
  });
  document.getElementById("closeCraftingBtn")?.addEventListener("click", () => {
    document.getElementById("craftingModal").classList.add("hidden");
  });

  // Stats modal handlers
  document.getElementById("statsBtn")?.addEventListener("click", () => {
    renderStatsModal();
    document.getElementById("statsModal")?.classList.remove('hidden');
  });
  document.getElementById("closeStatsBtn")?.addEventListener("click", () => {
    document.getElementById("statsModal")?.classList.add('hidden');
  });

  document.getElementById("restBtn")?.addEventListener("click", () => {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc?.canRest) {
      gameState.player.hp = gameState.player.maxHp;
      gameState.player.mp = gameState.player.maxMp;
      addMessage("You rest and recover your strength.", "system");
      updateUI();
    } else {
      addMessage("You can't rest here.", "system");
    }
  });

  document.getElementById("floatingMenuBtn")?.addEventListener("click", () => {
    toggleMainMenu(true);
  });

  // Show ending modal when main quest completes
  window.addEventListener('pixel:mainQuestCompleted', (e) => {
    const modal = document.getElementById('endingModal');
    if (!modal) return;
    // populate summary
    document.getElementById('ending-level').textContent = gameState.player.level;
    document.getElementById('ending-gold').textContent = gameState.player.gold;
    document.getElementById('ending-xp').textContent = gameState.player.experience;
    modal.classList.remove('hidden');
    gameState.isGameOver = true;

    // wire buttons (clone to avoid duplicate listeners)
    const restartBtn = document.getElementById('endingRestartBtn');
    const closeBtn = document.getElementById('endingCloseBtn');
    if (restartBtn) {
      // replace to avoid accumulating listeners
      const newBtn = restartBtn.cloneNode(true);
      restartBtn.replaceWith(newBtn);
      newBtn.addEventListener('click', () => {
        initializeGame();
        modal.classList.add('hidden');
        gameState.isGameOver = false;
        updateUI();
      });
    }
    if (closeBtn) {
      const newBtn = closeBtn.cloneNode(true);
      closeBtn.replaceWith(newBtn);
      newBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
  });

  // Collapsible header toggles (accordion-like)
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const targetId = header.getAttribute('data-target');
      if (!targetId) return;
      const content = document.getElementById(targetId);
      if (!content) return;
      const isCollapsed = content.classList.contains('collapsed');
      if (isCollapsed) {
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
        content.style.display = 'block';
      } else {
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        setTimeout(() => { if (content.classList.contains('collapsed')) content.style.display = 'none'; }, 300);
      }
    });
  });

  // Navigation buttons (directional movement) -> dispatch pixel:move events
  document.querySelectorAll('.direction-buttons .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dir = e.currentTarget.getAttribute('data-direction');
      if (!dir) return;
      window.dispatchEvent(new CustomEvent('pixel:move', { detail: { direction: dir } }));
    });
  });

  // Combat action buttons
  document.getElementById('attackBtn')?.addEventListener('click', () => window.dispatchEvent(new Event('pixel:attack')));
  document.getElementById('magicBtn')?.addEventListener('click', () => window.dispatchEvent(new Event('pixel:magic')));
  document.getElementById('itemBtn')?.addEventListener('click', () => {
    // open inventory modal for selecting items during combat
    renderInventory();
    document.getElementById('inventoryModal')?.classList.remove('hidden');
  });
  document.getElementById('fleeBtn')?.addEventListener('click', () => window.dispatchEvent(new Event('pixel:flee')));
}

export function updateSaveInfo() {
  const saveInfo = document.getElementById("saveInfo");
  const continueBtn = document.getElementById("continueBtn");
  const loadBtn = document.getElementById("loadGameBtn");
  const deleteBtn = document.getElementById("deleteSaveBtn");

  const exists = hasSavedGame();
  if (!saveInfo || !continueBtn || !loadBtn || !deleteBtn) return;

  if (exists) {
    try {
      const raw = localStorage.getItem("pixelQuestSave");
      const data = JSON.parse(raw);
      const date = new Date(data.timestamp);
      const lvl = data.gameState?.player?.level ?? "?";
      const gold = data.gameState?.player?.gold ?? 0;
      saveInfo.innerHTML = `<p>Last save: ${date.toLocaleString()}</p><p>Level ${lvl} | Gold ${gold}</p>`;
      continueBtn.disabled = false;
      loadBtn.disabled = false;
      deleteBtn.disabled = false;
    } catch (e) {
      saveInfo.innerHTML = "<p>Corrupted save</p>";
      continueBtn.disabled = true;
      loadBtn.disabled = true;
      deleteBtn.disabled = false;
    }
  } else {
    saveInfo.innerHTML = "<p>No saved game</p>";
    continueBtn.disabled = true;
    loadBtn.disabled = true;
    deleteBtn.disabled = true;
  }
}

export function renderStatsModal() {
  const p = gameState.player;
  const pointsEl = document.getElementById('modal-stat-points');
  const strEl = document.getElementById('modal-strength');
  const agiEl = document.getElementById('modal-agility');
  const intEl = document.getElementById('modal-intelligence');
  if (!pointsEl || !strEl || !agiEl || !intEl) return;
  pointsEl.textContent = p.statPoints ?? 0;
  strEl.textContent = p.strength ?? 0;
  agiEl.textContent = p.agility ?? 0;
  intEl.textContent = p.intelligence ?? 0;

  // hook up increment buttons
  document.getElementById('inc-str')?.replaceWith(document.getElementById('inc-str')?.cloneNode(true));
  document.getElementById('inc-agi')?.replaceWith(document.getElementById('inc-agi')?.cloneNode(true));
  document.getElementById('inc-int')?.replaceWith(document.getElementById('inc-int')?.cloneNode(true));

  const incStr = document.getElementById('inc-str');
  const incAgi = document.getElementById('inc-agi');
  const incInt = document.getElementById('inc-int');
  const canInc = (p.statPoints ?? 0) > 0;
  if (incStr) incStr.disabled = !canInc;
  if (incAgi) incAgi.disabled = !canInc;
  if (incInt) incInt.disabled = !canInc;

  incStr?.addEventListener('click', () => {
    if (increaseStat('strength')) {
      updateUI(); renderStatsModal();
    }
  });
  incAgi?.addEventListener('click', () => {
    if (increaseStat('agility')) {
      updateUI(); renderStatsModal();
    }
  });
  incInt?.addEventListener('click', () => {
    if (increaseStat('intelligence')) {
      updateUI(); renderStatsModal();
    }
  });
}