import { allItems, shopInventories, classShopBonus, addItemToInventory, removeItemFromInventory } from "./items.js";
import { createIconElement } from "./utils.js";
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { t, formatText } from "./i18n.js";
import { calculateTotalStats } from "./stats.js";

export function renderShop() {
  const buyList  = document.getElementById("shopBuyList");
  const sellList = document.getElementById("shopSellList");
  const goldEl   = document.getElementById("shopGold");
  if (!buyList || !sellList || !goldEl) return;

  buyList.innerHTML = "";
  sellList.innerHTML = "";
  goldEl.textContent = gameState.player.gold;

  const locId = gameState.currentLocationId;
  const worldRef = window.worldMap?.[locId];
  const titleEl = document.querySelector("#shopModal .modal-content h2");
  if (titleEl) titleEl.textContent = worldRef?.name || t('shopModalTitle');

  // Base inventory + class-specific bonus items
  const base = shopInventories[locId] || shopInventories.shop || [];
  const bonus = classShopBonus[gameState.player.class] || [];
  const inventory = [...new Set([...base, ...bonus])];

  inventory.forEach(id => {
    const item = allItems[id];
    if (!item || !item.price) return;

    const li = makeShopItem(item, "buy");
    li.querySelector(".shop-btn")?.addEventListener("click", () => buyItem(item));
    buyList.appendChild(li);
  });

  let hasItems = false;
  for (const [itemId, qty] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item || !item.price) continue;
    hasItems = true;
    const sellPrice = Math.floor(item.price * 0.5);
    const li = makeShopItem(item, "sell", qty, sellPrice);
    li.querySelector(".shop-btn")?.addEventListener("click", () => sellItem(itemId, sellPrice));
    sellList.appendChild(li);
  }

  if (!hasItems) {
    sellList.innerHTML = `<li class="empty-list-row" aria-disabled="true">${t('shopNoItemsToSell')}</li>`;
  }
}

function makeShopItem(item, mode, qty, price) {
  const li = document.createElement("li");
  li.classList.add("shop-row");

  const icon = createIconElement(item.icon || "✨", 32);
  icon.classList.add("shop-row-icon");

  const info = document.createElement("div");
  info.className = "shop-row-info";

  const name = document.createElement("div");
  name.textContent = item.name + (qty ? ` ×${qty}` : "");
  name.className = "shop-row-name";

  const attrs = buildAttrString(item);
  const sub = document.createElement("div");
  sub.textContent = attrs;
  sub.className = "shop-row-attrs";

  info.appendChild(name);
  if (attrs) info.appendChild(sub);
  if (mode === "buy" && item.slot) {
    const compare = buildShopCompare(item);
    if (compare) info.appendChild(compare);
  }

  const priceSpan = document.createElement("span");
  priceSpan.className = "shop-row-price";
  priceSpan.textContent = `${price ?? item.price} 🪙`;

  const btn = document.createElement("button");
  btn.className = "btn small shop-btn";
  btn.textContent = mode === "buy" ? t('shopBuyButton') : t('shopSellButton');
  if (mode === "sell") { btn.className += " tonal"; }
  if (mode === "buy" && (gameState.player.gold || 0) < item.price) {
    btn.disabled = true;
    btn.textContent = "Falta oro";
    li.classList.add("is-unaffordable");
  }

  li.appendChild(icon);
  li.appendChild(info);
  li.appendChild(priceSpan);
  li.appendChild(btn);
  return li;
}

function buildShopCompare(item) {
  const currentStats = calculateTotalStats(gameState.player, gameState.equipment);
  const nextStats = calculateTotalStats(gameState.player, { ...gameState.equipment, [item.slot]: item });
  const stats = [
    ["ATK", "attack"],
    ["DEF", "defense"],
    ["MAG", "magic"]
  ].map(([label, key]) => ({ label, delta: (nextStats[key] || 0) - (currentStats[key] || 0) }));
  if (stats.every(s => s.delta === 0)) return null;

  const wrap = document.createElement("div");
  wrap.className = "shop-compare";
  stats.forEach(({ label, delta }) => {
    const chip = document.createElement("span");
    chip.className = `shop-compare-chip ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-even"}`;
    chip.textContent = `${label} ${delta > 0 ? "+" : ""}${delta}`;
    wrap.appendChild(chip);
  });
  return wrap;
}

function buildAttrString(item) {
  const parts = [];
  if (item.attack)     parts.push(`ATK +${item.attack}`);
  if (item.defense)    parts.push(`DEF +${item.defense}`);
  if (item.magic)      parts.push(`MAG +${item.magic}`);
  if (item.strength)   parts.push(`STR +${item.strength}`);
  if (item.agility)    parts.push(`AGI +${item.agility}`);
  if (item.intelligence) parts.push(`INT +${item.intelligence}`);
  if (item.hpBonus)    parts.push(`MaxHP +${item.hpBonus}`);
  if (item.restoreHp)   parts.push(formatText('shopRestoresHp', { value: item.restoreHp }));
  if (item.restoreMp)   parts.push(formatText('shopRestoresMp', { value: item.restoreMp }));
  if (item.curesPoison) parts.push(t('shopCuresPoison'));
  if (item.curesBurn)   parts.push(t('shopCuresBurn'));
  if (item.curesAll)    parts.push(t('shopCuresAllEffects'));
  return parts.join(" · ");
}

export function buyItem(item) {
  if ((gameState.player.gold||0) < item.price) {
    addMessage(t('shopNoGold'), "system");
    showFloatingText(t('shopNoGoldFloat'), window.innerWidth/2, window.innerHeight/2, "#fbbf24");
    return false;
  }
  gameState.player.gold -= item.price;
  addItemToInventory(gameState.inventory, item.id, 1);
  addMessage(formatText('shopBuyMessage', { item: item.name, price: item.price }), "shop");
  renderShop();
  updateUI();
  return true;
}

function showFloatingText(text, x, y, color) {
  import("./ui.js").then(m => m.showFloatingText(text, x, y, color));
}

export function sellItem(itemId, price) {
  if (!removeItemFromInventory(gameState.inventory, itemId)) {
    addMessage(t('shopNoItem'), "system");
    return false;
  }
  const item = allItems[itemId] || { name: itemId };
  gameState.player.gold += price;
  addMessage(formatText(t('shopSellMessage'), { item: item.name, price }), "shop");
  renderShop();
  updateUI();
  return true;
}
