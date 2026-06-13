import { gameState } from "./state.js";
import { allItems, addItemToInventory, removeItemFromInventory } from "./items.js";
import { calculateTotalStats } from "./stats.js";
import { createIconElement } from "./utils.js";
import { addMessage } from "./story.js";
import { updateUI, renderStatsModal } from "./ui.js";
import { t, formatText, localizeText } from "./i18n.js";

let selectedInventoryItemId = null;
let inventoryFilterText = "";
let inventoryTypeFilter = "all";

export function renderInventory() {
  const list = document.getElementById("inventoryList");
  const goldEl = document.getElementById("inventoryGold");
  if (!list || !goldEl) return;

  const searchInput = document.getElementById("inventorySearchInput");
  const typeSelect = document.getElementById("inventoryTypeFilter");
  if (searchInput && !searchInput.dataset.initialized) {
    searchInput.addEventListener("input", (event) => {
      inventoryFilterText = event.target.value || "";
      renderInventory();
    });
    searchInput.dataset.initialized = "1";
  }
  if (typeSelect && !typeSelect.dataset.initialized) {
    typeSelect.addEventListener("change", (event) => {
      inventoryTypeFilter = event.target.value || "all";
      renderInventory();
    });
    typeSelect.dataset.initialized = "1";
  }
  if (searchInput) searchInput.value = inventoryFilterText;
  if (typeSelect) typeSelect.value = inventoryTypeFilter;

  list.innerHTML = "";
  goldEl.textContent = gameState.player.gold;
  let hasInventoryItems = false;

  const filterValue = inventoryFilterText.trim().toLowerCase();
  let foundItems = 0;

  for (const [itemId, qty] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item) continue;
    hasInventoryItems = true;

    const nameText = localizeText(item.name).toLowerCase();
    const descText = localizeText(item.description || "").toLowerCase();
    const idText = itemId.toLowerCase();
    const matchesSearch = !filterValue || `${nameText} ${descText} ${idText}`.includes(filterValue);
    const matchesType = inventoryTypeFilter === "all" || item.type === inventoryTypeFilter;
    if (!matchesSearch || !matchesType) continue;

    foundItems += 1;
    const li = document.createElement("li");
    li.className = item.type === "quest" ? "inv-item quest-item" : "inv-item";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `Ver detalles de ${item.name}`);
    li.addEventListener("click", () => showItemDetails(itemId, item));
    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showItemDetails(itemId, item);
      }
    });

    // icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'inv-icon';
    // Support image filenames or objects — createIconElement returns an element
    // Render icon with a slightly smaller image padding so there is whitespace around it
    // match shop icon size for uniform presentation
    const iconEl = createIconElement(item.icon || (item.type === 'consumable' ? '🧪' : (item.type === 'weapon' ? '⚔️' : (item.type === 'armor' ? '🛡️' : '✨'))), 56);
    iconDiv.appendChild(iconEl);

    const nameWrap = document.createElement('div');
    nameWrap.className = 'inv-item-namewrap';
    const name = document.createElement('div');
    name.className = 'inv-item-name';
    name.textContent = localizeText(item.name);
    const qtyBadge = document.createElement('div');
    qtyBadge.className = 'inv-item-qty';
    qtyBadge.textContent = `x${qty}`;
    nameWrap.appendChild(name);
    nameWrap.appendChild(qtyBadge);

    // attributes summary
    const attrs = [];
    if (item.attack) attrs.push(`ATK +${item.attack}`);
    if (item.defense) attrs.push(`DEF +${item.defense}`);
    if (item.intelligence) attrs.push(`INT +${item.intelligence}`);
    if (item.strength) attrs.push(`STR +${item.strength}`);
    if (item.agility) attrs.push(`AGI +${item.agility}`);
    if (item.magic) attrs.push(`MAG +${item.magic}`);
    // direct flat HP bonus applied to MAX HP
    if (item.hpBonus) attrs.push(`MaxHP +${item.hpBonus}`);

    // include restorative attributes such as restoreHp/restoreMp and other relevant fields
    if (item.restoreHp) attrs.push(`HP +${item.restoreHp}`);
    if (item.restoreMp) attrs.push(`MP +${item.restoreMp}`);
    if (item.potency && item.effect) attrs.push(`${item.effect.replace('_',' ').toUpperCase()}: ${item.potency}`);

    const attrEl = document.createElement('div');
    attrEl.className = 'inv-item-attrs';
    attrEl.textContent = attrs.join(' | ');

    // action button
    const btn = document.createElement('button');
    btn.className = 'btn tiny';
    const isConsumable = item.type === 'consumable';
    const isEquippable = !!item.slot;
    if (isConsumable) {
      btn.textContent = t('btnUse');
      btn.onclick = (e) => { e.stopPropagation(); useItem(itemId, item); };
    } else if (isEquippable) {
      btn.textContent = t('btnEquip');
      btn.className = 'btn tiny equip-btn';
      btn.onclick = (e) => { e.stopPropagation(); equipItem(itemId, item); };
    } else if (item.type === 'quest') {
      btn.textContent = t('missionTag');
      btn.disabled = true;
      btn.title = t('missionTagTooltip');
    } else {
      btn.textContent = t('btnInfo');
      btn.disabled = true;
    }

    const info = document.createElement('button');
    info.className = 'btn tiny secondary';
    info.textContent = t('btnInfo');
    info.onclick = (e) => { e.stopPropagation(); showItemDetails(itemId, item); };

    li.tabIndex = 0;
    li.dataset.itemId = itemId;
    li.addEventListener('click', () => showItemDetails(itemId, item));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showItemDetails(itemId, item);
      }
    });

    li.appendChild(iconDiv);
    li.appendChild(nameWrap);
    if (attrEl.textContent) li.appendChild(attrEl);
    li.appendChild(btn);
    li.appendChild(info);

    if (selectedInventoryItemId === itemId) {
      li.classList.add('active');
    }

    list.appendChild(li);
  }

  if (!hasInventoryItems) {
    const empty = document.createElement("li");
    empty.className = "empty-list-row";
    empty.setAttribute("aria-disabled", "true");
    empty.textContent = "Inventario vacio. Explora, compra o derrota enemigos para encontrar objetos.";
    list.appendChild(empty);
  }

  // Equipment
  const equipSlots = [
    { id: "equip-rightHand", slot: "rightHand" },
    { id: "equip-leftHand", slot: "leftHand" },
    { id: "equip-armor", slot: "armor" },
    { id: "equip-boots", slot: "boots" },
    { id: "equip-arms", slot: "arms" },
    { id: "equip-ring", slot: "ring" },
    { id: "equip-head", slot: "head" },
    { id: "equip-accessory", slot: "accessory" }
  ];
  equipSlots.forEach(({ id, slot }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = gameState.equipment[slot]?.name || "Empty";
  });

  if (!gameState.inventory[selectedInventoryItemId]) {
    selectedInventoryItemId = null;
  }

  if (foundItems === 0) {
    const empty = document.createElement('li');
    empty.className = 'inventory-empty';
    empty.textContent = inventoryFilterText || inventoryTypeFilter !== 'all' ? 'No se encontraron objetos.' : 'No tienes objetos en el inventario.';
    list.appendChild(empty);
  }
  const grid = document.querySelector('.inventory-grid');
  if (grid) grid.classList.toggle('detail-open', !!selectedInventoryItemId);
  if (!selectedInventoryItemId) {
    document.querySelectorAll('#inventoryList li.active').forEach(li => li.classList.remove('active'));
  }
}

function buildEquipmentComparison(item) {
  if (!item?.slot) return null;
  const currentStats = calculateTotalStats(gameState.player, gameState.equipment);
  const nextEquipment = { ...gameState.equipment, [item.slot]: item };
  const nextStats = calculateTotalStats(gameState.player, nextEquipment);
  const rows = [
    ["ATK", "attack"],
    ["DEF", "defense"],
    ["MAG", "magic"],
    ["HP max", "maxHp"],
    ["MP max", "maxMp"]
  ].map(([label, key]) => {
    const current = currentStats[key] || 0;
    const next = nextStats[key] || 0;
    const delta = next - current;
    return { label, current, next, delta };
  });
  return rows;
}

function renderEquipmentComparison(item) {
  const rows = buildEquipmentComparison(item);
  if (!rows) return null;
  const wrap = document.createElement("div");
  wrap.className = "equipment-compare";
  const title = document.createElement("div");
  title.className = "equipment-compare-title";
  title.textContent = "Comparacion al equipar";
  wrap.appendChild(title);
  const grid = document.createElement("div");
  grid.className = "equipment-compare-grid";
  rows.forEach(({ label, current, next, delta }) => {
    const chip = document.createElement("div");
    chip.className = `equipment-compare-chip ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-even"}`;
    const sign = delta > 0 ? "+" : "";
    chip.innerHTML = `<span>${label}</span><strong>${current} -> ${next}</strong><em>${sign}${delta}</em>`;
    grid.appendChild(chip);
  });
  wrap.appendChild(grid);
  return wrap;
}

function showItemDetails(itemId, item) {
  selectedInventoryItemId = itemId;
  const detailCard = document.getElementById('itemDetailCard');
  const detailEmpty = document.querySelector('#inventoryDetail .item-detail-empty');
  const detailName = document.getElementById('detailName');
  const detailMeta = document.getElementById('detailMeta');
  const detailDesc = document.getElementById('detailDesc');
  const detailAttrs = document.getElementById('detailAttrs');
  const detailIcon = document.getElementById('detailIcon');
  const useBtn = document.getElementById('detailUseBtn');
  const equipBtn = document.getElementById('detailEquipBtn');

  if (detailEmpty) detailEmpty.classList.add('hidden');
  if (detailCard) detailCard.classList.remove('hidden');

  const grid = document.querySelector('.inventory-grid');
  if (grid) {
    grid.classList.add('detail-open');
    grid.querySelectorAll('#inventoryList li').forEach(li => {
      li.classList.toggle('active', li.dataset.itemId === itemId);
    });
  }

  detailName.textContent = localizeText(item.name) || itemId;
  const metaParts = [];
  if (item.rarity) metaParts.push(item.rarity);
  if (item.type) metaParts.push(item.type);
  if (item.slot) metaParts.push(item.slot);
  detailMeta.textContent = metaParts.join(' • ');

  detailDesc.textContent = localizeText(item.description) || formatText(t('defaultItemDetail'), { item: localizeText(item.name) });

  detailAttrs.innerHTML = '';
  const equipped = item.slot ? gameState.equipment[item.slot] : null;
  const pushAttr = (text, itemVal, statName) => {
    const li = document.createElement('li');
    let extra = '';
    if (equipped && statName && typeof itemVal === 'number') {
      const eqVal = equipped[statName] || 0;
      const diff = itemVal - eqVal;
      if (diff > 0) {
        extra = ` <span class="stat-diff-positive">(+${diff} vs equipado)</span>`;
      } else if (diff < 0) {
        extra = ` <span class="stat-diff-negative">(${diff} vs equipado)</span>`;
      }
    }
    li.innerHTML = `${text}${extra}`;
    detailAttrs.appendChild(li);
  };

  if (item.attack) pushAttr(formatText(t('attrAttack'), { value: item.attack }), item.attack, 'attack');
  if (item.defense) pushAttr(formatText(t('attrDefense'), { value: item.defense }), item.defense, 'defense');
  if (item.intelligence) pushAttr(formatText(t('attrIntelligence'), { value: item.intelligence }), item.intelligence, 'intelligence');
  if (item.strength) pushAttr(formatText(t('attrStrength'), { value: item.strength }), item.strength, 'strength');
  if (item.agility) pushAttr(formatText(t('attrAgility'), { value: item.agility }), item.agility, 'agility');
  if (item.magic) pushAttr(formatText(t('attrMagic'), { value: item.magic }), item.magic, 'magic');
  if (item.hpBonus) pushAttr(formatText(t('attrMaxHpBonus'), { value: item.hpBonus }), item.hpBonus, 'hpBonus');
  
  if (item.restoreHp) pushAttr(formatText(t('attrRestoreHp'), { value: item.restoreHp }));
  if (item.restoreMp) pushAttr(formatText(t('attrRestoreMp'), { value: item.restoreMp }));
  if (item.effect) pushAttr(formatText(t('attrEffect'), { effect: item.effect.replace('_', ' '), potency: item.potency || '' }));
  if (item.price) pushAttr(formatText(t('attrPrice'), { value: item.price }));

  const oldCompare = detailAttrs.parentElement?.querySelector(".equipment-compare");
  oldCompare?.remove();
  const compareEl = renderEquipmentComparison(item);
  if (compareEl) detailAttrs.insertAdjacentElement("afterend", compareEl);
  detailIcon.innerHTML = '';
  detailIcon.appendChild(createIconElement(item.icon || (item.type === 'consumable' ? '🧪' : (item.type === 'weapon' ? '⚔️' : (item.type === 'armor' ? '🛡️' : '✨'))), 64));

  if (useBtn) {
    const isConsumable = item.type === 'consumable';
    useBtn.classList.toggle('hidden', !isConsumable);
    if (isConsumable) {
      useBtn.disabled = false;
      useBtn.className = 'btn-action';
      useBtn.textContent = t('btnUse');
      useBtn.onclick = () => {
        useItem(itemId, item);
        if (!gameState.inventory[itemId]) closeItemDetail();
      };
    }
  }

  if (equipBtn) {
    equipBtn.classList.toggle('hidden', !item.slot);
    if (item.slot) {
      equipBtn.disabled = false;
      equipBtn.className = 'btn-action secondary';
      equipBtn.textContent = t('btnEquip');
      equipBtn.onclick = () => {
        const ok = equipItem(itemId, item);
        if (ok) detailMeta.textContent = (item.rarity ? item.rarity + ' • ' : '') + (item.type || '') + ' • ' + (item.slot || '');
      };
    }
  }

  const closeBtn = document.getElementById('detailCloseBtn');
  if (closeBtn) closeBtn.onclick = closeItemDetail;
}

function closeItemDetail() {
  selectedInventoryItemId = null;
  const detailCard = document.getElementById('itemDetailCard');
  const detailEmpty = document.querySelector('#inventoryDetail .item-detail-empty');
  const grid = document.querySelector('.inventory-grid');
  if (detailCard) detailCard.style.display = 'none';
  if (detailEmpty) detailEmpty.style.display = '';
  if (grid) grid.classList.remove('detail-open');
  document.querySelectorAll('#inventoryList li.active').forEach(li => li.classList.remove('active'));
}

function useItem(itemId, item) {
  // consumable behaviors
  if (!removeItemFromInventory(gameState.inventory, itemId, 1)) {
    addMessage(t('itemNotOwned'), 'system');
    return false;
  }

  // Specific known items still supported for backwards-compatibility
  if (itemId === 'health_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 25, gameState.player.maxHp);
    addMessage(formatText(t('usedItemRestoreHp'), { item: localizeText(item.name), amount: 25 }), 'stat');
  } else if (itemId === 'mana_potion') {
    gameState.player.mp = Math.min(gameState.player.mp + 10, gameState.player.maxMp);
    addMessage(formatText(t('usedItemRestoreMp'), { item: localizeText(item.name), amount: 10 }), 'stat');
  } else if (itemId === 'elixir_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 50, gameState.player.maxHp);
    gameState.player.mp = Math.min(gameState.player.mp + 30, gameState.player.maxMp);
    addMessage(formatText(t('usedItem'), { item: localizeText(item.name) }), 'stat');
  } else if (itemId === 'big_health_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 75, gameState.player.maxHp);
    addMessage(formatText(t('usedItemRestoreHp'), { item: localizeText(item.name), amount: 75 }), 'stat');
  } else if (itemId === 'big_mana_potion') {
    gameState.player.mp = Math.min(gameState.player.mp + 50, gameState.player.maxMp);
    addMessage(formatText(t('usedItemRestoreMp'), { item: localizeText(item.name), amount: 50 }), 'stat');
  } else if (item.curesAll || item.curesPoison || item.curesBurn) {
    if (!gameState.playerDebuffs) gameState.playerDebuffs = {};
    const msgs = [];
    if (item.curesAll || item.curesPoison) {
      if (gameState.playerDebuffs.poison) { delete gameState.playerDebuffs.poison; msgs.push(t('statusPoison')); }
    }
    if (item.curesAll || item.curesBurn) {
      if (gameState.playerDebuffs.burn) { delete gameState.playerDebuffs.burn; msgs.push(t('statusBurn')); }
    }
    if (item.curesAll && gameState.playerDebuffs.stun) {
      delete gameState.playerDebuffs.stun; msgs.push(t('statusStun')); }
    if (item.restoreHp) {
      gameState.player.hp = Math.min(gameState.player.hp + item.restoreHp, gameState.player.maxHp);
    }
    if (msgs.length) addMessage(formatText(t('usedItemCuredStatuses'), { item: localizeText(item.name), statuses: msgs.join(', ') }), 'stat');
    else addMessage(formatText(t('usedItemNoEffect'), { item: localizeText(item.name) }), 'stat');
    if (item.restoreHp) addMessage(formatText(t('restoredHpAmount'), { amount: item.restoreHp }), 'stat');
  } else if (item.restoreHp || item.restoreMp) {
    // Generic handling for crafted/defined consumables with restoreHp/restoreMp properties
    if (item.restoreHp) {
      const amount = item.restoreHp;
      gameState.player.hp = Math.min(gameState.player.hp + amount, gameState.player.maxHp);
      addMessage(formatText(t('usedItemRestoreHp'), { item: localizeText(item.name), amount }), 'stat');
    }
    if (item.restoreMp) {
      const amount = item.restoreMp;
      gameState.player.mp = Math.min(gameState.player.mp + amount, gameState.player.maxMp);
      addMessage(formatText(t('usedItemRestoreMp'), { item: localizeText(item.name), amount }), 'stat');
    }
  } else {
    // fallback: consumable with no special code
    addMessage(formatText(t('usedItem'), { item: localizeText(item.name) }), 'stat');
  }

  updateUI();
  renderInventory();
  return true;
}

function equipItem(itemId, item) {
  // ensure item exists in inventory
  if (!removeItemFromInventory(gameState.inventory, itemId, 1)) {
    addMessage(t('itemNotOwnedEquip'), 'system');
    return false;
  }

  // Validar slot y tipo
  const slot = item.slot;
  const slotTypeMap = {
    rightHand: ['weapon'],
    leftHand: ['shield'],
    armor: ['armor'],
    boots: ['boots'],
    arms: ['arms'],
    ring: ['ring'],
    head: ['helmet', 'hat'],
    accessory: ['emblem', 'collar', 'talisman', 'accessory']
  };
  if (!slot || !slotTypeMap[slot] || !slotTypeMap[slot].includes(item.type)) {
    addMessage(t('cannotEquipItem'), 'system');
    return false;
  }
  const oldItem = gameState.equipment[slot];
  // Equipar nuevo item
  gameState.equipment[slot] = item;
  if (oldItem && oldItem.id) addItemToInventory(gameState.inventory, oldItem.id, 1);
  addMessage(formatText(t('equippedItem'), { item: localizeText(item.name) }), 'stat');

  // Recalculate derived stats after equipping and apply to player's maxHP/maxMP so STR/INT bonuses take effect
  const derived = calculateTotalStats(gameState.player, gameState.equipment);
  // Apply new maxes to player state and clamp current hp/mp
  gameState.player.maxHp = derived.maxHp;
  gameState.player.maxMp = derived.maxMp;
  gameState.player.hp = Math.min(gameState.player.hp ?? gameState.player.maxHp, gameState.player.maxHp);
  gameState.player.mp = Math.min(gameState.player.mp ?? gameState.player.maxMp, gameState.player.maxMp);
  updateUI();
  renderInventory();
  return true;
}
