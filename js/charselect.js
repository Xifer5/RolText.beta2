// ══════════════════════════════════════════════════════
//  CHARACTER SELECTION — Pantalla de inicio de juego
// ══════════════════════════════════════════════════════
import { CLASS_DEFINITIONS, applyClassBonuses } from "./classes.js";
import { DIFFICULTY_CONFIG } from "./difficulty.js";
import { gameState, resetState } from "./state.js";
import { calculateTotalStats } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { t, formatText } from "./i18n.js";

export function showCharacterSelect(onComplete) {
  // Remove existing if any
  document.getElementById("charSelectModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "charSelectModal";
  modal.className = "modal";
  modal.style.cssText = "opacity:1;pointer-events:auto;z-index:300";

  modal.innerHTML = `
    <div class="modal-content" style="max-width:680px">
      <div class="modal-header">
        <h2>${t('characterSelectTitle')}</h2>
      </div>
      <p style="text-align:center;color:var(--c-muted);margin-bottom:20px;font-style:italic">
        ${t('characterSelectDescription')}
      </p>

      <div class="name-row">
        <label for="playerNameInput">${t('heroNameLabel')}</label>
        <input type="text" id="playerNameInput" placeholder="${t('heroNamePlaceholder')}" maxlength="20" />
      </div>

      <div class="class-select-grid" role="radiogroup" aria-label="${t('characterSelectTitle')}" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);margin:var(--sp-5) 0">
        ${Object.values(CLASS_DEFINITIONS).map(cls => `
          <div class="class-card" data-class="${cls.id}" style="--cls-color:${cls.color}"
               role="radio" aria-checked="false" tabindex="0" aria-label="${cls.name}">
            <div class="class-card-emoji">${cls.emoji}</div>
            <div class="class-card-name" style="color:${cls.color}">${cls.name}</div>
            <p class="class-card-desc">${cls.description}</p>
            <div class="class-base-stats">
              <div class="cbs-row"><span>💪 STR</span><div class="cbs-bar"><div style="width:${cls.baseStats.strength/20*100}%;background:${cls.color}"></div></div><span>${cls.baseStats.strength}</span></div>
              <div class="cbs-row"><span>🏃 AGI</span><div class="cbs-bar"><div style="width:${cls.baseStats.agility/20*100}%;background:${cls.color}"></div></div><span>${cls.baseStats.agility}</span></div>
              <div class="cbs-row"><span>🔮 INT</span><div class="cbs-bar"><div style="width:${cls.baseStats.intelligence/20*100}%;background:${cls.color}"></div></div><span>${cls.baseStats.intelligence}</span></div>
            </div>
            <div class="class-perks">
              ${cls.perks.map(p => `<span class="perk-chip">${p}</span>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="difficulty-row">
        <label class="difficulty-label">${t('difficultyLabel')}</label>
        <div class="difficulty-chips" role="radiogroup" aria-label="${t('difficultyLabel')}">
          ${Object.values(DIFFICULTY_CONFIG).map(d => `
            <button type="button" class="diff-chip${d.id === 'easy' ? ' selected' : ''}" data-diff="${d.id}"
                    style="--diff-color:${d.color}" role="radio" aria-checked="${d.id === 'easy'}">
              ${d.emoji} ${d.name}
            </button>
          `).join("")}
        </div>
        <p class="diff-desc" id="diffDesc">${DIFFICULTY_CONFIG.easy.description}</p>
      </div>

      <button id="startAdventureBtn" class="btn-action" disabled style="max-width:320px;margin:0 auto;display:block;text-align:center">
        ${t('startAdventureButton')} →
      </button>
      <p style="text-align:center;margin-top:12px;font-size:.78rem;color:var(--c-muted);font-style:italic" id="classSelectHint">
        ${t('selectClassHint')}
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedClass = null;
  let selectedDifficulty = "easy";

  // Difficulty selection
  modal.querySelectorAll(".diff-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      modal.querySelectorAll(".diff-chip").forEach(c => {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      chip.classList.add("selected");
      chip.setAttribute("aria-checked", "true");
      selectedDifficulty = chip.dataset.diff;
      const desc = modal.querySelector("#diffDesc");
      if (desc) desc.textContent = DIFFICULTY_CONFIG[selectedDifficulty]?.description || "";
    });
  });

  // Class selection
  const selectCard = (card) => {
    modal.querySelectorAll(".class-card").forEach(c => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });
    card.classList.add("selected");
    card.setAttribute("aria-checked", "true");
    selectedClass = card.dataset.class;
    const startBtn = document.getElementById("startAdventureBtn");
    startBtn.disabled = false;
    document.getElementById("classSelectHint").textContent =
      `${t('classSelectedPrefix')} ${CLASS_DEFINITIONS[selectedClass].name} ${t('classSelectedSuffix')}`;
  };
  modal.querySelectorAll(".class-card").forEach(card => {
    card.addEventListener("click", () => selectCard(card));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCard(card);
      }
    });
  });

  // Start button
  document.getElementById("startAdventureBtn").addEventListener("click", () => {
    if (!selectedClass) return;
    const name = document.getElementById("playerNameInput").value.trim() || t('defaultPlayerName');

    resetState();
    gameState.difficulty = selectedDifficulty;
    gameState.player.name = name;
    applyClassBonuses(gameState.player, selectedClass);
    // Sync hp/mp to the recalculated maximums for the chosen class
    const s = calculateTotalStats(gameState.player, gameState.equipment);
    gameState.player.maxHp = s.maxHp;
    gameState.player.maxMp = s.maxMp;
    gameState.player.hp = s.maxHp;
    gameState.player.mp = s.maxMp;

    // Give starting items by class
    if (selectedClass === "warrior") {
      gameState.inventory["health_potion"] = 2;
      gameState.inventory["sword"] = 1;
    } else if (selectedClass === "mage") {
      gameState.inventory["mana_potion"] = 3;
      gameState.inventory["health_potion"] = 1;
    } else if (selectedClass === "rogue") {
      gameState.inventory["health_potion"] = 2;
      gameState.inventory["goblin_dagger"] = 1;
    }

    modal.remove();

    const cls = CLASS_DEFINITIONS[selectedClass];
    addMessage(formatText(t('characterSelectWelcome'), { name, className: cls.name, classDesc: cls.description_long }), "system");
    addMessage(formatText(t('characterSelectStartingStats'), {
      str: gameState.player.strength,
      agi: gameState.player.agility,
      intl: gameState.player.intelligence
    }), "stat");
    const diffCfg = DIFFICULTY_CONFIG[selectedDifficulty];
    addMessage(formatText(t('difficultyChosenMsg'), { emoji: diffCfg.emoji, name: diffCfg.name }), "system");

    updateUI();

    // Update profile card
    const profileName = document.getElementById("profile-name");
    const profileRole = document.querySelector(".profile-role");
    const profileAvatar = document.querySelector(".profile-avatar");
    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = `${t('profileLevelPrefix')} 1 ${cls.name.toUpperCase()}`;
    if (profileAvatar) profileAvatar.textContent = cls.emoji;

    if (onComplete) onComplete();
  });
}
