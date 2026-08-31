import { gameState } from "./state.js";
import { allItems, addItemToInventory, removeItemFromInventory } from "./items.js";
import { calculateTotalStats, applyDerivedMaxes } from "./stats.js";
import { LEARNABLE_SKILLS, hasLearnedSkill, learnUniversalSkill } from "./classes.js";
import { createIconElement } from "./utils.js";
import { addMessage } from "./story.js";
import { updateUI, renderStatsModal } from "./ui.js";
import { t, formatText, localizeText } from "./i18n.js";
import { buildEquipmentView } from "./equipmentView.js";

let selectedInventoryItemId = null;
let inventoryFilterText = "";
let inventoryTypeFilter = "all";

const EQUIP_TYPES = new Set(["weapon","armor","arms","boots","hat","helmet","ring","shield","accessory"]);
const CONSUMABLE_TYPES = new Set(["consumable","scroll"]);
const QUEST_TYPES = new Set(["quest","key_item","material"]);

function matchesTypeFilter(itemType, filter) {
  if (filter === "all") return true;
  if (filter === "consumable") return CONSUMABLE_TYPES.has(itemType);
  if (filter === "equip") return EQUIP_TYPES.has(itemType);
  if (filter === "quest") return QUEST_TYPES.has(itemType);
  return itemType === filter;
}

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
      // Reset chip to "Todos" when dropdown takes over
      const filterBar = document.getElementById("inventoryFilters");
      if (filterBar) filterBar.querySelectorAll(".inv-filter-chip[data-filter]").forEach(c => {
        const on = c.dataset.filter === "all";
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      renderInventory();
    });
    typeSelect.dataset.initialized = "1";
  }

  // Wire filter chips (once)
  const filterBar = document.getElementById("inventoryFilters");
  if (filterBar && !filterBar.dataset.initialized) {
    filterBar.querySelectorAll(".inv-filter-chip[data-filter]").forEach(chip => {
      chip.addEventListener("click", () => {
        inventoryTypeFilter = chip.dataset.filter;
        // Reset dropdown to blank/all when chip takes over
        const sel = document.getElementById("inventoryTypeFilter");
        if (sel) sel.value = chip.dataset.filter === "all" ? "all" : "";
        renderInventory();
      });
    });
    const equipBtn = document.getElementById("showEquipOverviewBtn");
    if (equipBtn) {
      equipBtn.addEventListener("click", () => {
        // Show equipment overview in the detail column
        const overview = document.getElementById("invEquipOverview");
        const card = document.getElementById("itemDetailCard");
        const grid = document.querySelector(".inventory-grid");
        if (card) { card.style.display = "none"; card.classList.add("hidden"); }
        if (overview) overview.style.display = "";
        if (grid) grid.classList.add("detail-open");
        selectedInventoryItemId = null;
        document.querySelectorAll("#inventoryList li.active").forEach(li => li.classList.remove("active"));
      });
    }
    filterBar.dataset.initialized = "1";
  }

  // Sync chip active state
  if (filterBar) {
    filterBar.querySelectorAll(".inv-filter-chip[data-filter]").forEach(chip => {
      const on = chip.dataset.filter === inventoryTypeFilter;
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", String(on));
    });
  }

  if (searchInput) searchInput.value = inventoryFilterText;

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
    const matchesType = matchesTypeFilter(item.type, inventoryTypeFilter);
    if (!matchesSearch || !matchesType) continue;

    foundItems += 1;
    // SPEC-1213 — grilla de íconos (revisión 2026-08-31): antes cada fila
    // mostraba ícono+nombre+stats+botón en ~80px de alto, forzando scroll
    // constante con un inventario lleno. Todo ese contenido YA se muestra
    // completo en el panel de detalle al hacer clic (showItemDetails() lo
    // arma independiente de esta fila) — la celda de grilla solo necesita
    // ícono + cantidad; el nombre queda como tooltip nativo (title).
    const li = document.createElement("li");
    li.className = item.type === "quest" ? "inv-item quest-item" : "inv-item";
    li.tabIndex = 0;
    li.dataset.itemId = itemId;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `${localizeText(item.name)} ×${qty}`);
    li.title = `${localizeText(item.name)} ×${qty}`;
    li.addEventListener("click", () => showItemDetails(itemId, item));
    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showItemDetails(itemId, item);
      }
    });

    const iconDiv = document.createElement('div');
    iconDiv.className = 'inv-icon';
    const iconEl = createIconElement(item.icon || (item.type === 'consumable' ? '🧪' : (item.type === 'weapon' ? '⚔️' : (item.type === 'armor' ? '🛡️' : '✨'))), 40);
    iconDiv.appendChild(iconEl);
    li.appendChild(iconDiv);

    if (qty > 1) {
      const qtyBadge = document.createElement('div');
      qtyBadge.className = 'inv-item-qty-badge';
      qtyBadge.textContent = `×${qty}`;
      li.appendChild(qtyBadge);
    }

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

  // SPEC-1217 — resumen visual de build reutilizando avatar e iconos reales.
  const equipmentView = buildEquipmentView(gameState.player, gameState.equipment);
  equipmentView.slots.forEach(({ id, slot, item, emptyIcon }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = localizeText(item?.name) || t('emptySlot');
    const row = document.querySelector(`#equipmentList [data-slot="${slot}"]`);
    if (row) {
      row.classList.toggle('is-equipped', !!item);
      row.title = item ? localizeText(item.name) : `${row.querySelector('.equip-slot-label')?.textContent || slot}: ${t('emptySlot')}`;
      const art = row.querySelector('.equip-slot-art');
      if (art) {
        art.innerHTML = '';
        art.appendChild(createIconElement(item?.icon || emptyIcon, 44));
      }
    }
  });
  renderEquipmentCharacter(equipmentView);

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

function renderEquipmentCharacter(view) {
  const avatar = document.getElementById('equipmentCharacterAvatar');
  const fallback = document.getElementById('equipmentCharacterFallback');
  if (avatar) {
    avatar.hidden = !view.avatar;
    if (view.avatar) avatar.src = view.avatar;
    avatar.alt = view.avatar ? `${view.name}, ${view.role}` : '';
  }
  if (fallback) {
    fallback.hidden = !!view.avatar;
    fallback.textContent = view.fallback;
  }
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('equipment-character-name', view.name);
  setText('equipmentCharacterRole', view.role);
  setText('equipmentHpText', `${view.hp} / ${view.maxHp}`);
  setText('equipmentMpText', `${view.mp} / ${view.maxMp}`);
  setText('equipmentAttack', view.stats.attack);
  setText('equipmentDefense', view.stats.defense);
  setText('equipmentMagic', view.stats.magic);
  const hpBar = document.getElementById('equipmentHpBar');
  const mpBar = document.getElementById('equipmentMpBar');
  if (hpBar) hpBar.style.width = `${view.hpPercent}%`;
  if (mpBar) mpBar.style.width = `${view.mpPercent}%`;
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

  const equipOverview = document.getElementById('invEquipOverview');
  if (equipOverview) equipOverview.style.display = 'none';
  if (detailEmpty) detailEmpty.classList.add('hidden');
  if (detailCard) { detailCard.classList.remove('hidden'); detailCard.style.display = ''; }

  const grid = document.querySelector('.inventory-grid');
  if (grid) {
    grid.classList.add('detail-open');
    grid.querySelectorAll('#inventoryList li').forEach(li => {
      li.classList.toggle('active', li.dataset.itemId === itemId);
    });
  }

  detailName.textContent = localizeText(item.name) || itemId;
  const metaParts = [];
  const TYPE_KEYS = { weapon:"typeWeapon", armor:"typeArmor", shield:"typeShield", consumable:"typeConsumable", scroll:"typeScroll", accessory:"typeAccessory", ring:"typeRing", hat:"typeHat", helmet:"typeHelmet", arms:"typeArms", boots:"typeBoots", key_item:"typeKeyItem", material:"typeMaterial", quest:"typeQuest" };
  const SLOT_KEYS = { head:"slotHead", rightHand:"slotRightHand", leftHand:"slotLeftHand", armor:"slotArmor", arms:"slotArms", boots:"slotBoots", ring:"slotRing", accessory:"slotAccessory" };
  const RARITY_KEYS = { common:"rarityCommon", uncommon:"rarityUncommon", rare:"rarityRare", epic:"rarityEpic", legendary:"rarityLegendary" };
  if (item.rarity) metaParts.push(t(RARITY_KEYS[item.rarity]) || item.rarity);
  if (item.type) metaParts.push(t(TYPE_KEYS[item.type]) || item.type);
  if (item.slot) metaParts.push(t(SLOT_KEYS[item.slot]) || item.slot);
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
        extra = ` <span class="stat-diff-positive">(+${diff} ${t('vsEquipped')})</span>`;
      } else if (diff < 0) {
        extra = ` <span class="stat-diff-negative">(${diff} ${t('vsEquipped')})</span>`;
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
    const isConsumable = CONSUMABLE_TYPES.has(item.type);
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
        if (ok) showItemDetails(itemId, item);
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
  const equipOverview = document.getElementById('invEquipOverview');
  const grid = document.querySelector('.inventory-grid');
  if (detailCard) detailCard.style.display = 'none';
  if (detailEmpty) detailEmpty.style.display = '';
  if (equipOverview) equipOverview.style.display = '';
  if (grid) grid.classList.remove('detail-open');
  document.querySelectorAll('#inventoryList li.active').forEach(li => li.classList.remove('active'));
}

function useItem(itemId, item) {
  if (!removeItemFromInventory(gameState.inventory, itemId, 1)) {
    addMessage(t('itemNotOwned'), 'system');
    return false;
  }

  // SPEC-0607: pergaminos de habilidad universal — el tipo "scroll" con
  // teachesSkill:<skillId> existía en items.js (scroll_of_rally/power/arcane,
  // en venta en castle_shop) pero useItem() nunca lo manejaba: se consumían
  // sin hacer nada. Si ya la sabe, se devuelve el pergamino (no se pierde).
  if (item.type === 'scroll' && item.teachesSkill) {
    const skillName = localizeText(LEARNABLE_SKILLS[item.teachesSkill]?.name) || item.teachesSkill;
    if (hasLearnedSkill(gameState, item.teachesSkill)) {
      gameState.inventory[itemId] = (gameState.inventory[itemId] || 0) + 1;
      addMessage(formatText(t('scrollAlreadyKnown'), { skill: skillName }), 'system');
    } else {
      learnUniversalSkill(gameState, item.teachesSkill);
      addMessage(formatText(t('scrollLearnedSkill'), { skill: skillName }), 'stat');
    }
  }
  // Specific known items still supported for backwards-compatibility
  else if (itemId === 'health_potion') {
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

  // Recalculate derived stats after equipping so STR/INT/HP bonuses take effect
  applyDerivedMaxes();
  updateUI();
  renderInventory();
  return true;
}
