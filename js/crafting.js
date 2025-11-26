import { craftingRecipes, canCraft, craftItem } from "./craftingRecipes.js";
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";

let selectedRecipe = null;
let selectedTab = "forge";

export function renderCrafting() {
  const tabs = document.querySelectorAll(".crafting-tab");
  const list = document.getElementById("recipesList");
  const details = document.getElementById("recipeDetails");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      selectedTab = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderRecipeList();
    });
  });

  renderRecipeList();
  document.getElementById("craftButton").addEventListener("click", () => {
    if (!selectedRecipe) return;
    const result = craftItem(selectedRecipe, gameState.inventory, gameState.player.level);
    if (result) {
      addMessage(`Crafted: ${result.name}`, "system");
      renderRecipeList();
      updateUI();
    } else {
      addMessage("Cannot craft this item.", "system");
    }
  });
}

function renderRecipeList() {
  const list = document.getElementById("recipesList");
  list.innerHTML = "";
  const recipes = craftingRecipes[selectedTab] || {};
  for (const [key, recipe] of Object.entries(recipes)) {
    const btn = document.createElement("button");
    btn.className = "recipe-button";
    btn.innerHTML = `${recipe.name} <span>${recipe.rarity}</span>`;
    btn.addEventListener("click", () => {
      selectedRecipe = recipe;
      renderRecipeDetails(recipe);
    });
    list.appendChild(btn);
  }
}

function renderRecipeDetails(recipe) {
  const details = document.getElementById("recipeDetails");
  details.classList.remove("hidden");
  document.getElementById("recipeName").textContent = recipe.name;
  document.getElementById("recipeRarity").textContent = `Rarity: ${recipe.rarity}`;
  const mats = document.getElementById("materialsList");
  mats.innerHTML = "";
  for (const [mat, qty] of Object.entries(recipe.ingredients)) {
    const li = document.createElement("li");
    const have = gameState.inventory[mat] || 0;
    li.textContent = `${mat}: ${have}/${qty}`;
    li.style.color = have >= qty ? "green" : "red";
    mats.appendChild(li);
  }
}

