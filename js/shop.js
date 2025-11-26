import { allItems, shopInventories, addItemToInventory, removeItemFromInventory } from "./items.js";
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";

export function renderShop() {
  const buyList = document.getElementById("shopBuyList");
  const sellList = document.getElementById("shopSellList");
  const goldEl = document.getElementById("shopGold");
  if (!buyList || !sellList || !goldEl) return;

  buyList.innerHTML = "";
  sellList.innerHTML = "";
  goldEl.textContent = gameState.player.gold;

  // Decide which shop inventory to show based on current location
  const locId = gameState.currentLocationId;
  const inventory = shopInventories[locId] || shopInventories.shop || [];

  // Show a friendly shop name if available
  const shopModalTitle = document.querySelector('#shopModal .modal-content h2');
  if (shopModalTitle) {
    // try to use the worldMap name if available, else fall back to simple mapping
    const worldMapRef = window.worldMap?.[locId];
    shopModalTitle.textContent = worldMapRef?.name || (locId === 'castle_shop' ? "Castle Shop" : (locId === 'port' ? "Port Vendor" : "General Store"));
  }

  inventory.forEach(id => {
    const item = allItems[id];
    if (!item) return;
    const li = document.createElement("li");
    li.innerHTML = `${item.name} - ${item.price}g `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Buy";
    btn.addEventListener("click", () => buyItem(item));
    li.appendChild(btn);
    buyList.appendChild(li);
  });

  for (const [itemId, qty] of Object.entries(gameState.inventory)) {
    const item = allItems[itemId];
    if (!item || !item.price) continue;
    const sellPrice = Math.floor(item.price / 2);
    const li = document.createElement("li");
    li.innerHTML = `${item.name} x${qty} - ${sellPrice}g `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Sell";
    btn.addEventListener("click", () => sellItem(itemId, sellPrice));
    li.appendChild(btn);
    sellList.appendChild(li);
  }
}

export function buyItem(item) {
  if (gameState.player.gold < item.price) {
    addMessage("Not enough gold!", "system");
    return false;
  }
  gameState.player.gold -= item.price;
  addItemToInventory(gameState.inventory, item.id, 1);
  addMessage(`Bought ${item.name} for ${item.price}g.`, "shop");
  renderShop();
  updateUI();
  return true;
}

export function sellItem(itemId, price) {
  if (!removeItemFromInventory(gameState.inventory, itemId)) {
    addMessage("You don't have that item.", "system");
    return false;
  }
  const item = allItems[itemId] || { name: itemId };
  gameState.player.gold += price;
  addMessage(`Sold ${item.name} for ${price}g.`, "shop");
  renderShop();
  updateUI();
  return true;
}