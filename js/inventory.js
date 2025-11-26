import { gameState } from "./state.js";
import { allItems, addItemToInventory, removeItemFromInventory } from "./items.js";
import { calculateTotalStats } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI, renderStatsModal } from "./ui.js";

export function renderInventory() {
  const list = document.getElementById("inventoryList");
  const goldEl = document.getElementById("inventoryGold");
  if (!list || !goldEl) return;

  list.innerHTML = "";
  goldEl.textContent = gameState.player.gold;

  for (const [itemId, qty] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item) continue;

    const li = document.createElement("li");
    li.className = "inv-item";

    // icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'inv-icon';
    iconDiv.textContent = item.icon || (item.type === 'consumable' ? '🧪' : (item.type === 'weapon' ? '⚔️' : (item.type === 'armor' ? '🛡️' : '✨')));

    const nameWrap = document.createElement('div');
    nameWrap.style.display = 'flex';
    nameWrap.style.flexDirection = 'column';
    const name = document.createElement('div');
    name.className = 'inv-item-name';
    name.textContent = item.name;
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
    btn.className = 'btn equip-btn';
    // Consumables: "Use" else "Equip"
    const isConsumable = item.type === 'consumable';
    const isEquippable = !!item.slot;
    if (isConsumable) {
      btn.textContent = 'Use';
      btn.onclick = () => useItem(itemId, item);
    } else if (isEquippable) {
      btn.textContent = 'Equip';
      btn.onclick = () => equipItem(itemId, item);
    } else {
      btn.textContent = 'Info';
      btn.disabled = true;
    }

    // info button to show full description + attributes in story
    const info = document.createElement('button');
    info.className = 'btn small';
    info.textContent = 'Info';
    info.onclick = () => showItemDetails(itemId, item);

    li.appendChild(iconDiv);
    li.appendChild(nameWrap);
    if (attrEl.textContent) li.appendChild(attrEl);
    li.appendChild(btn);
    li.appendChild(info);

    list.appendChild(li);
  }

  // Equipment
  document.getElementById("equip-rightHand").textContent = gameState.equipment.rightHand?.name || "Empty";
  document.getElementById("equip-armor").textContent = gameState.equipment.armor?.name || "Empty";
  document.getElementById("equip-accessory").textContent = gameState.equipment.accessory?.name || "Empty";

  // Ensure detail panel is collapsed when inventory is re-rendered
  const grid = document.querySelector('.inventory-grid');
  if (grid) grid.classList.remove('detail-open');
}

function showItemDetails(itemId, item) {
  const detailCard = document.getElementById('itemDetailCard');
  const detailEmpty = document.querySelector('#inventoryDetail .item-detail-empty');
  const detailName = document.getElementById('detailName');
  const detailMeta = document.getElementById('detailMeta');
  const detailDesc = document.getElementById('detailDesc');
  const detailAttrs = document.getElementById('detailAttrs');
  const detailIcon = document.getElementById('detailIcon');
  const useBtn = document.getElementById('detailUseBtn');
  const equipBtn = document.getElementById('detailEquipBtn');

  if (detailEmpty) detailEmpty.style.display = 'none';
  if (detailCard) detailCard.style.display = 'block';

  // open the right-side detail column
  const grid = document.querySelector('.inventory-grid');
  if (grid) grid.classList.add('detail-open');

  detailName.textContent = item.name || itemId;
  const metaParts = [];
  if (item.rarity) metaParts.push(item.rarity);
  if (item.type) metaParts.push(item.type);
  if (item.slot) metaParts.push(item.slot);
  detailMeta.textContent = metaParts.join(' • ');

  detailDesc.textContent = item.description || `No description available for ${item.name}.`;

  // attributes list
  detailAttrs.innerHTML = '';
  const pushAttr = (text) => { const li = document.createElement('li'); li.textContent = text; detailAttrs.appendChild(li); };
  if (item.attack) pushAttr(`Attack: +${item.attack}`);
  if (item.defense) pushAttr(`Defense: +${item.defense}`);
  if (item.intelligence) pushAttr(`Intelligence: +${item.intelligence}`);
  if (item.strength) pushAttr(`Strength: +${item.strength}`);
  if (item.agility) pushAttr(`Agility: +${item.agility}`);
  if (item.magic) pushAttr(`Magic: +${item.magic}`);
  if (item.restoreHp) pushAttr(`Restore HP: ${item.restoreHp}`);
  if (item.restoreMp) pushAttr(`Restore MP: ${item.restoreMp}`);
  if (item.hpBonus) pushAttr(`Max HP Bonus: +${item.hpBonus}`);
  if (item.effect) pushAttr(`Effect: ${item.effect} ${item.potency ? '(' + item.potency + ')' : ''}`);
  if (item.price) pushAttr(`Price: ${item.price}g`);

  // icon
  detailIcon.textContent = item.icon || (item.type === 'consumable' ? '🧪' : (item.type === 'weapon' ? '⚔️' : (item.type === 'armor' ? '🛡️' : '✨')));

  // Actions
  // Use button only enabled for consumables
  if (useBtn) {
    if (item.type === 'consumable') {
      useBtn.style.display = '';
      useBtn.disabled = false;
      useBtn.onclick = () => {
        const ok = useItem(itemId, item);
        // if used and inventory exhausted close detail
        if (!gameState.inventory[itemId]) {
          closeItemDetail();
        }
      };
    } else {
      useBtn.style.display = 'none';
    }
  }

  if (equipBtn) {
    if (item.slot) {
      equipBtn.style.display = '';
      equipBtn.disabled = false;
      equipBtn.onclick = () => {
        const ok = equipItem(itemId, item);
        if (ok) {
          // refresh detail meta (equipment changed)
          detailMeta.textContent = (item.rarity ? item.rarity + ' • ' : '') + (item.type || '') + ' • ' + (item.slot || '');
        }
      };
    } else {
      equipBtn.style.display = 'none';
    }
  }

  // wire close button
  const closeBtn = document.getElementById('detailCloseBtn');
  if (closeBtn) closeBtn.onclick = closeItemDetail;
}

  function closeItemDetail() {
    const detailCard = document.getElementById('itemDetailCard');
    const detailEmpty = document.querySelector('#inventoryDetail .item-detail-empty');
    const grid = document.querySelector('.inventory-grid');
    if (detailCard) detailCard.style.display = 'none';
    if (detailEmpty) detailEmpty.style.display = '';
    if (grid) grid.classList.remove('detail-open');
  }

function useItem(itemId, item) {
  // consumable behaviors
  if (!removeItemFromInventory(gameState.inventory, itemId, 1)) {
    addMessage("You don't have that item.", 'system');
    return false;
  }

  // Specific known items still supported for backwards-compatibility
  if (itemId === 'health_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 25, gameState.player.maxHp);
    addMessage('Used Health Potion! Restored 25 HP.', 'stat');
  } else if (itemId === 'mana_potion') {
    gameState.player.mp = Math.min(gameState.player.mp + 10, gameState.player.maxMp);
    addMessage('Used Mana Potion! Restored 10 MP.', 'stat');
  } else if (itemId === 'elixir_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 50, gameState.player.maxHp);
    gameState.player.mp = Math.min(gameState.player.mp + 30, gameState.player.maxMp);
    addMessage('Used Elixir! Restored HP and MP.', 'stat');
  } else if (itemId === 'big_health_potion') {
    gameState.player.hp = Math.min(gameState.player.hp + 75, gameState.player.maxHp);
    addMessage('Used Big Health Potion! Restored 75 HP.', 'stat');
  } else if (itemId === 'big_mana_potion') {
    gameState.player.mp = Math.min(gameState.player.mp + 50, gameState.player.maxMp);
    addMessage('Used Big Mana Potion! Restored 50 MP.', 'stat');
  } else if (item.restoreHp || item.restoreMp) {
    // Generic handling for crafted/defined consumables with restoreHp/restoreMp properties
    if (item.restoreHp) {
      const amount = item.restoreHp;
      gameState.player.hp = Math.min(gameState.player.hp + amount, gameState.player.maxHp);
      addMessage(`Used ${item.name}! Restored ${amount} HP.`, 'stat');
    }
    if (item.restoreMp) {
      const amount = item.restoreMp;
      gameState.player.mp = Math.min(gameState.player.mp + amount, gameState.player.maxMp);
      addMessage(`Used ${item.name}! Restored ${amount} MP.`, 'stat');
    }
  } else {
    // fallback: consumable with no special code
    addMessage(`Used ${item.name}.`, 'stat');
  }

  updateUI();
  renderInventory();
  return true;
}

function equipItem(itemId, item) {
  // ensure item exists in inventory
  if (!removeItemFromInventory(gameState.inventory, itemId, 1)) {
    addMessage("You don't have that item to equip.", 'system');
    return false;
  }

  const slot = item.slot || 'rightHand';
  const oldItem = gameState.equipment[slot];
  // Equip new item
  gameState.equipment[slot] = item;
  if (oldItem && oldItem.id) addItemToInventory(gameState.inventory, oldItem.id, 1);
  addMessage(`Equipped ${item.name}!`, 'stat');

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