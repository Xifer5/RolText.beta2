import { craftingRecipes, canCraft, craftItem } from "./craftingRecipes.js";
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { allItems } from "./items.js";
import { checkAchievements } from "./achievements.js";
import { t, formatText } from "./i18n.js";

const TAB_META = {
  forge:   { label: t('craftTabForge'),     desc: t('craftTabForgeDesc') },
  alchemy: { label: t('craftTabAlchemy'),   desc: t('craftTabAlchemyDesc') },
  arcane:  { label: t('craftTabArcane'),    desc: t('craftTabArcaneDesc') }
};

const RARITY_LABEL = {
  common: "Común", uncommon: "Poco común", rare: "Raro",
  epic: "Épico", legendary: "Legendario"
};

function _matName(id) {
  return allItems[id]?.name ?? id.replace(/_/g, " ");
}

function _recipesHTML(tab) {
  const recipes = craftingRecipes[tab] ?? {};
  if (!Object.keys(recipes).length) {
    return `<div class="craft-empty">${t('noRecipesAvailable')}</div>`;
  }
  return Object.entries(recipes).map(([key, r]) => {
    const craftable = canCraft(r, gameState.inventory, gameState.player.level).ok;
    return `
      <div class="craft-recipe-card ${craftable ? "craftable" : ""}" data-recipe="${key}">
        <span class="craft-recipe-icon">${r.icon ?? "⚙️"}</span>
        <div class="craft-recipe-info">
          <div class="craft-recipe-name">${r.name}</div>
          <div class="craft-rarity-tag rarity-${r.rarity}">${RARITY_LABEL[r.rarity] ?? r.rarity}</div>
        </div>
        ${craftable ? `<span class="craft-can-dot" title="${t('youCanCraft')}">✓</span>` : ""}
      </div>`;
  }).join("");
}

function _detailHTML(tab, recipeKey) {
  const recipe = craftingRecipes[tab]?.[recipeKey];
  if (!recipe) return `<div class="craft-empty">← Selecciona una receta para ver detalles</div>`;

  const { ok: craftable } = canCraft(recipe, gameState.inventory, gameState.player.level);
  const levelOk = gameState.player.level >= (recipe.levelReq ?? 1);

  const mats = Object.entries(recipe.ingredients).map(([id, qty]) => {
    const have = gameState.inventory[id] ?? 0;
    const ok = have >= qty;
    return `<li class="craft-mat-row">
      <span class="craft-mat-name">${_matName(id)}</span>
      <span class="${ok ? "mat-ok" : "mat-lack"}">${have}/${qty}</span>
    </li>`;
  }).join("");

  const r = recipe.result;
  const stats = [];
  if (r.attack)       stats.push(`⚔️ ATK +${r.attack}`);
  if (r.defense)      stats.push(`🛡️ DEF +${r.defense}`);
  if (r.magic)        stats.push(`✨ MAG +${r.magic}`);
  if (r.strength)     stats.push(`💪 STR +${r.strength}`);
  if (r.agility)      stats.push(`🏃 AGI +${r.agility}`);
  if (r.intelligence) stats.push(`🔮 INT +${r.intelligence}`);
  if (r.hpBonus)      stats.push(`❤️ MaxHP +${r.hpBonus}`);
  if (r.restoreHp)    stats.push(`💊 Cura ${r.restoreHp} HP`);
  if (r.restoreMp)    stats.push(`💧 Restaura ${r.restoreMp} MP`);

  return `
    <div class="craft-detail-card">
      <div class="craft-detail-header">
        <span class="craft-detail-icon">${recipe.icon ?? "⚙️"}</span>
        <div>
          <div class="craft-detail-name">${recipe.name}</div>
          <span class="craft-rarity-tag rarity-${recipe.rarity}">${RARITY_LABEL[recipe.rarity] ?? recipe.rarity}</span>
        </div>
      </div>
      ${stats.length ? `<div class="craft-result-stats">${stats.join(" &nbsp;·&nbsp; ")}</div>` : ""}
      <div class="craft-section-label">Materiales necesarios</div>
      <ul class="craft-mats-list">${mats}</ul>
      ${!levelOk ? `<p class="craft-level-warn">🔒 Requiere nivel ${recipe.levelReq}</p>` : ""}
      <button id="craftBtn" class="btn ${craftable ? "" : "outlined"}" ${craftable ? "" : "disabled"}>
        ${craftable ? `${recipe.icon ?? "⚒️"} Fabricar ${recipe.name}` : "Materiales insuficientes"}
      </button>
    </div>`;
}

export function renderCrafting() {
  return `
    <div class="craft-panel">
      <div class="craft-tabs">
        ${Object.entries(TAB_META).map(([key, m]) =>
          `<button class="craft-tab ${key === "forge" ? "active" : ""}" data-craft-tab="${key}">
            ${m.label}
          </button>`
        ).join("")}
      </div>
      <div class="craft-body">
        <div class="craft-list" id="craftRecipeList"></div>
        <div class="craft-detail" id="craftDetail">
          <div class="craft-empty">← Selecciona una receta para ver detalles</div>
        </div>
      </div>
    </div>`;
}

export function wireCraftingPanel(container) {
  let currentTab       = "forge";
  let currentRecipeKey = null;

  function refreshList() {
    const list = container.querySelector("#craftRecipeList");
    if (!list) return;
    list.innerHTML = _recipesHTML(currentTab);
    list.querySelectorAll("[data-recipe]").forEach(card => {
      card.addEventListener("click", () => {
        currentRecipeKey = card.dataset.recipe;
        list.querySelectorAll("[data-recipe]").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        refreshDetail();
      });
      // Re-select previously active card
      if (card.dataset.recipe === currentRecipeKey) card.classList.add("active");
    });
  }

  function refreshDetail() {
    const detail = container.querySelector("#craftDetail");
    if (!detail) return;
    detail.innerHTML = _detailHTML(currentTab, currentRecipeKey);
    const craftBtn = detail.querySelector("#craftBtn");
    if (!craftBtn) return;
    craftBtn.onclick = () => {
      const recipe = craftingRecipes[currentTab]?.[currentRecipeKey];
      if (!recipe) return;
      const result = craftItem(recipe, gameState.inventory, gameState.player.level);
      if (result) {
        playSound("loot");
        addMessage(formatText(t('craftedItem'), { item: recipe.name }), "loot");
        checkAchievements();
        updateUI();
        refreshDetail();
        refreshList();
      }
    };
  }

  container.querySelectorAll("[data-craft-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.craftTab;
      currentRecipeKey = null;
      container.querySelectorAll("[data-craft-tab]").forEach(b =>
        b.classList.toggle("active", b.dataset.craftTab === currentTab)
      );
      refreshList();
      const detail = container.querySelector("#craftDetail");
      if (detail) detail.innerHTML = `<div class="craft-empty">← ${t('selectRecipeToViewDetails')}</div>`;
    });
  });

  refreshList();
}
