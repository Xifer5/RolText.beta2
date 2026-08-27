// ══════════════════════════════════════════════════════
//  CHARACTER SELECTION — Pantalla de inicio de juego
// ══════════════════════════════════════════════════════
import { CLASS_DEFINITIONS, applyClassBonuses } from "./classes.js";
import { DIFFICULTY_CONFIG, getDifficultyEffects } from "./difficulty.js";
import { ORIGINS, applyOrigin } from "./origins.js";
import { MODIFIERS, MODIFIER_XP_BONUS } from "./modifiers.js";
import { LEGACY_PERKS, isPerkUnlocked, applyLegacyPerk, getVictories } from "./metaProgress.js";
import { gameState, resetState } from "./state.js";
import { calculateTotalStats } from "./stats.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { t, formatText, localizeText } from "./i18n.js";
import { setupRadioGroupArrowNav } from "./a11yRadioNav.js";
import { rollRumors, QUEST_DATA, RUMOR_COUNT } from "./quests.js";

const STEP_COUNT = 5; // SPEC-1006: 0=Clase+Nombre 1=Origen 2=Dificultad 3=Modificadores 4=Confirmar

export function showCharacterSelect(onComplete) {
  // Remove existing if any
  document.getElementById("charSelectModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "charSelectModal";
  modal.className = "modal";
  modal.style.cssText = "opacity:1;pointer-events:auto;z-index:300";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "charSelectTitle");

  modal.innerHTML = `
    <div class="modal-content" style="max-width:680px">
      <div class="modal-header">
        <h2 id="charSelectTitle">${t('characterSelectTitle')}</h2>
      </div>
      <p style="text-align:center;color:var(--c-muted);margin-bottom:20px;font-style:italic">
        ${t('characterSelectDescription')}
      </p>

      <div class="cs-progress" aria-hidden="true">
        ${Array.from({ length: STEP_COUNT }, (_, i) => `<span class="cs-dot" data-dot="${i}"></span>`).join("")}
      </div>

      <div class="cs-step" data-step="0">
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
        <p style="text-align:center;margin-top:12px;font-size:.78rem;color:var(--c-muted);font-style:italic" id="classSelectHint">
          ${t('selectClassHint')}
        </p>
      </div>

      <div class="cs-step" data-step="1">
        <div class="difficulty-row">
          <label class="difficulty-label">${t('originLabel')}</label>
          <div class="difficulty-chips" role="radiogroup" aria-label="${t('originLabel')}">
            ${Object.values(ORIGINS).map(o => `
              <button type="button" class="origin-chip${o.id === 'exile' ? ' selected' : ''}" data-origin="${o.id}"
                      style="--diff-color:${o.color}" role="radio" aria-checked="${o.id === 'exile'}">
                ${o.emoji} ${localizeText(o.name)}
              </button>
            `).join("")}
          </div>
          <p class="diff-desc" id="originDesc"></p>
        </div>
      </div>

      <div class="cs-step" data-step="2">
        <div class="difficulty-row">
          <label class="difficulty-label">${t('difficultyLabel')}</label>
          <div class="difficulty-chips" role="radiogroup" aria-label="${t('difficultyLabel')}">
            ${Object.values(DIFFICULTY_CONFIG).map(d => `
              <button type="button" class="diff-chip${d.id === 'easy' ? ' selected' : ''}" data-diff="${d.id}"
                      style="--diff-color:${d.color}" role="radio" aria-checked="${d.id === 'easy'}">
                ${d.emoji} ${localizeText(d.name)}
              </button>
            `).join("")}
          </div>
          <p class="diff-desc" id="diffDesc"></p>
          <p class="diff-effects" id="diffEffects"></p>
        </div>
      </div>

      <div class="cs-step" data-step="3">
        <div class="difficulty-row">
          <label class="difficulty-label">${t('modLabel')}</label>
          <div class="difficulty-chips" role="group" aria-label="${t('modLabel')}">
            ${Object.values(MODIFIERS).map(m => `
              <button type="button" class="mod-chip" data-mod="${m.id}"
                      style="--diff-color:${m.color}" aria-pressed="false">
                ${m.emoji} ${localizeText(m.name)}
              </button>
            `).join("")}
          </div>
          <p class="diff-desc" id="modDesc"></p>
        </div>
        ${LEGACY_PERKS.some(p => isPerkUnlocked(p.id)) ? `
        <div class="difficulty-row" style="margin-top:var(--sp-4)">
          <label class="difficulty-label">${t('legacyLabel')}</label>
          <div class="difficulty-chips" role="group" aria-label="${t('legacyLabel')}">
            ${LEGACY_PERKS.filter(p => isPerkUnlocked(p.id)).map(p => `
              <button type="button" class="mod-chip selected" data-legacy="${p.id}" aria-pressed="true">
                ${p.icon} ${localizeText(p.name)}
              </button>
            `).join("")}
          </div>
          <p class="diff-desc" id="legacyDesc"></p>
        </div>` : ""}
      </div>

      <div class="cs-step" data-step="4">
        <p class="cs-summary" id="csSummary"></p>
        <button id="startAdventureBtn" class="btn-action" disabled style="max-width:320px;margin:0 auto;display:block;text-align:center">
          ${t('startAdventureButton')} →
        </button>
      </div>

      <div class="cs-nav">
        <button type="button" id="csBackBtn" class="btn-action secondary">${t('csBackButton')}</button>
        <button type="button" id="csNextBtn" class="btn-action" disabled>${t('csNextButton')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // SPEC-1006: flujo por pasos — solo visible ≤767px vía CSS (@media),
  // en desktop todos los .cs-step quedan visibles y esto es un no-op inerte.
  let currentStep = 0;
  const steps = Array.from(modal.querySelectorAll(".cs-step"));
  const dots = Array.from(modal.querySelectorAll(".cs-dot"));
  const backBtn = modal.querySelector("#csBackBtn");
  const nextBtn = modal.querySelector("#csNextBtn");

  const renderSummary = () => {
    const el = modal.querySelector("#csSummary");
    if (!el) return;
    const clsName = selectedClass ? CLASS_DEFINITIONS[selectedClass]?.name : "—";
    const originName = localizeText(ORIGINS[selectedOrigin]?.name);
    const diffName = localizeText(DIFFICULTY_CONFIG[selectedDifficulty]?.name);
    const modsText = selectedModifiers.size
      ? [...selectedModifiers].map(id => localizeText(MODIFIERS[id]?.name)).join(", ")
      : t('modNoneLine');
    el.textContent = `${clsName} · ${originName} · ${diffName} · ${modsText}`;
  };

  const goToStep = (n) => {
    currentStep = Math.max(0, Math.min(STEP_COUNT - 1, n));
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === currentStep));
    dots.forEach(d => d.classList.toggle("cs-dot-active", Number(d.dataset.dot) === currentStep));
    backBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
    nextBtn.style.display = currentStep === STEP_COUNT - 1 ? "none" : "";
    nextBtn.disabled = currentStep === 0 && !selectedClass;
    if (currentStep === STEP_COUNT - 1) renderSummary();
  };
  backBtn.addEventListener("click", () => goToStep(currentStep - 1));
  nextBtn.addEventListener("click", () => goToStep(currentStep + 1));

  let selectedClass = null;
  let selectedDifficulty = "easy";
  let selectedOrigin = "exile";
  const selectedModifiers = new Set(); // SPEC-1004: 0-3 apilables, ninguno por defecto
  // SPEC-1201: perks de legado ya desbloqueados, activos por defecto (el
  // jugador ya pagó el fragmento — apagarlos es la excepción, no la regla).
  const selectedLegacyPerks = new Set(LEGACY_PERKS.filter(p => isPerkUnlocked(p.id)).map(p => p.id));

  // Modifier selection (SPEC-1004) — chips checkbox, no radio
  const updateModInfo = () => {
    const el = modal.querySelector("#modDesc");
    if (!el) return;
    if (!selectedModifiers.size) {
      el.textContent = t('modNoneLine');
      return;
    }
    const descs = [...selectedModifiers].map(id => localizeText(MODIFIERS[id]?.description)).join(" ");
    const xp = Math.round(selectedModifiers.size * MODIFIER_XP_BONUS * 100);
    el.textContent = `${descs} ${formatText('modXpBonusLine', { xp })}`;
  };
  updateModInfo();
  // :not([data-legacy]) — los chips de legado de abajo reusan la clase visual
  // .mod-chip pero NO son modificadores; sin este filtro este querySelectorAll
  // también los agarra y les pega un segundo listener que ensucia
  // selectedModifiers con `undefined` (bug real, encontrado en vivo con gstack).
  modal.querySelectorAll(".mod-chip:not([data-legacy])").forEach(chip => {
    chip.addEventListener("click", () => {
      const id = chip.dataset.mod;
      const active = selectedModifiers.has(id);
      if (active) selectedModifiers.delete(id); else selectedModifiers.add(id);
      chip.classList.toggle("selected", !active);
      chip.setAttribute("aria-pressed", String(!active));
      updateModInfo();
    });
  });

  // Legacy perk toggles (SPEC-1201) — chips, no radio, apagables individualmente
  const updateLegacyInfo = () => {
    const el = modal.querySelector("#legacyDesc");
    if (!el) return;
    const active = LEGACY_PERKS.filter(p => selectedLegacyPerks.has(p.id));
    el.textContent = active.length ? active.map(p => localizeText(p.desc)).join(" ") : t('legacyNoneLine');
  };
  updateLegacyInfo();
  modal.querySelectorAll("[data-legacy]").forEach(chip => {
    chip.addEventListener("click", () => {
      const id = chip.dataset.legacy;
      const active = selectedLegacyPerks.has(id);
      if (active) selectedLegacyPerks.delete(id); else selectedLegacyPerks.add(id);
      chip.classList.toggle("selected", !active);
      chip.setAttribute("aria-pressed", String(!active));
      updateLegacyInfo();
    });
  });

  // Origin selection (SPEC-1002)
  const updateOriginInfo = (id) => {
    const el = modal.querySelector("#originDesc");
    if (el) el.textContent = localizeText(ORIGINS[id]?.description) || "";
  };
  updateOriginInfo("exile");
  modal.querySelectorAll(".origin-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      modal.querySelectorAll(".origin-chip").forEach(c => {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      chip.classList.add("selected");
      chip.setAttribute("aria-checked", "true");
      selectedOrigin = chip.dataset.origin;
      updateOriginInfo(selectedOrigin);
    });
  });

  // Difficulty selection — descripción + efectos concretos derivados de los multiplicadores
  const updateDiffInfo = (id) => {
    const cfg = DIFFICULTY_CONFIG[id];
    if (!cfg) return;
    const desc = modal.querySelector("#diffDesc");
    const eff  = modal.querySelector("#diffEffects");
    if (desc) desc.textContent = localizeText(cfg.description);
    if (eff) {
      const e = getDifficultyEffects(cfg);
      eff.textContent = e.standard
        ? t("diffStandardLine")
        : formatText("diffEffectsLine", { hp: e.hp, atk: e.atk, def: e.def, xp: e.xp, gold: e.gold });
    }
  };
  updateDiffInfo("easy");
  modal.querySelectorAll(".diff-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      modal.querySelectorAll(".diff-chip").forEach(c => {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      chip.classList.add("selected");
      chip.setAttribute("aria-checked", "true");
      selectedDifficulty = chip.dataset.diff;
      updateDiffInfo(selectedDifficulty);
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
    if (currentStep === 0) nextBtn.disabled = false; // SPEC-1006
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

  // SPEC-1006: navegación por flechas en los 3 radiogroups reales
  // (.mod-chip es aria-pressed/multi-select, no aplica — Tab normal)
  setupRadioGroupArrowNav(modal.querySelector(".class-select-grid"), ".class-card", selectCard);
  setupRadioGroupArrowNav(modal.querySelectorAll(".difficulty-chips")[0], ".origin-chip", chip => chip.click());
  setupRadioGroupArrowNav(modal.querySelectorAll(".difficulty-chips")[1], ".diff-chip", chip => chip.click());

  goToStep(0);

  // Start button
  document.getElementById("startAdventureBtn").addEventListener("click", () => {
    if (!selectedClass) return;
    const name = document.getElementById("playerNameInput").value.trim() || t('defaultPlayerName');

    resetState();
    gameState.difficulty = selectedDifficulty;
    gameState.modifiers = [...selectedModifiers]; // SPEC-1004
    gameState.player.name = name;
    applyClassBonuses(gameState.player, selectedClass);
    applyOrigin(gameState, selectedOrigin); // antes de recalcular máximos: sus stats cuentan
    // SPEC-1201: perks de legado (oro/ítem inicial) — después del origen, no tocan stats base
    selectedLegacyPerks.forEach(id => applyLegacyPerk(gameState, id));
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
    const originCfg = ORIGINS[selectedOrigin];
    addMessage(formatText(t('originChosenMsg'), { emoji: originCfg.emoji, name: localizeText(originCfg.name) }), "system");
    const diffCfg = DIFFICULTY_CONFIG[selectedDifficulty];
    addMessage(formatText(t('difficultyChosenMsg'), { emoji: diffCfg.emoji, name: localizeText(diffCfg.name) }), "system");
    if (selectedModifiers.size) {
      const list = [...selectedModifiers].map(id => `${MODIFIERS[id].emoji} ${localizeText(MODIFIERS[id].name)}`).join(", ");
      const xp = Math.round(selectedModifiers.size * MODIFIER_XP_BONUS * 100);
      addMessage(formatText('modChosenMsg', { list, xp }), "system");
    }

    // SPEC-1109: objetivos secundarios de esta partida — 3 rumores al azar
    // (+1 si el perk de legado "Oído en el Camino" está activo — SPEC-1201)
    const rumorCount = RUMOR_COUNT + (selectedLegacyPerks.has("legacy_rumor") ? 1 : 0);
    const rumors = rollRumors(Math.random, rumorCount);
    if (rumors.length) {
      const list = rumors.map(id => localizeText(QUEST_DATA[id].title)).join(", ");
      addMessage(formatText(t('rumorsRolledMsg'), { list }), "system");
    }

    // SPEC-1204: New Game+ liviano — badge cosmético, cero cambios de balance
    const ngPlus = getVictories();
    if (ngPlus > 0) {
      addMessage(formatText(t('ngPlusMsg'), { n: ngPlus }), "system");
    }

    updateUI();
    // El minimapa local solo se re-renderiza con este evento; sin él, una run
    // con Niebla densa mostraría el mapa normal hasta el primer movimiento
    window.dispatchEvent(new CustomEvent("pixel:locationChanged"));

    // Update profile card
    const profileName = document.getElementById("profile-name");
    const profileRole = document.querySelector(".profile-role");
    const profileAvatar = document.querySelector(".profile-avatar");
    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = `${t('profileLevelPrefix')} 1 ${cls.name.toUpperCase()}${ngPlus > 0 ? ` · NG+${ngPlus}` : ""}`;
    if (profileAvatar) profileAvatar.textContent = cls.emoji;

    if (onComplete) onComplete();
  });
}
