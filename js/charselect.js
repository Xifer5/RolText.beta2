// ══════════════════════════════════════════════════════
//  CHARACTER SELECTION — Pantalla de inicio de juego
// ══════════════════════════════════════════════════════
import { CLASS_DEFINITIONS, applyClassBonuses } from "./classes.js";
import { gameState, resetState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";

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
        <h2>⚔ Elige tu Destino</h2>
      </div>
      <p style="text-align:center;color:var(--c-muted);margin-bottom:20px;font-style:italic">
        Tu elección define tu estilo de combate, habilidades únicas y desarrollo del personaje.
      </p>

      <div class="name-row">
        <label for="playerNameInput">Nombre del héroe</label>
        <input type="text" id="playerNameInput" placeholder="Tu nombre..." maxlength="20" />
      </div>

      <div class="class-select-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);margin:var(--sp-5) 0">
        ${Object.values(CLASS_DEFINITIONS).map(cls => `
          <div class="class-card" data-class="${cls.id}" style="--cls-color:${cls.color}">
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

      <button id="startAdventureBtn" class="btn-action" disabled style="max-width:320px;margin:0 auto;display:block;text-align:center">
        Comenzar aventura →
      </button>
      <p style="text-align:center;margin-top:12px;font-size:.78rem;color:var(--c-muted);font-style:italic" id="classSelectHint">
        Selecciona una clase para continuar
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedClass = null;

  // Class selection
  modal.querySelectorAll(".class-card").forEach(card => {
    card.addEventListener("click", () => {
      modal.querySelectorAll(".class-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedClass = card.dataset.class;
      const startBtn = document.getElementById("startAdventureBtn");
      startBtn.disabled = false;
      document.getElementById("classSelectHint").textContent =
        `✓ ${CLASS_DEFINITIONS[selectedClass].name} seleccionado`;
    });
  });

  // Start button
  document.getElementById("startAdventureBtn").addEventListener("click", () => {
    if (!selectedClass) return;
    const name = document.getElementById("playerNameInput").value.trim() || "Aventurero";

    resetState();
    gameState.player.name = name;
    applyClassBonuses(gameState.player, selectedClass);

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
    addMessage(`¡Bienvenido, ${name}! Has elegido el camino del ${cls.name}. ${cls.description_long}`, "system");
    addMessage(`Empiezas con: STR ${gameState.player.strength} · AGI ${gameState.player.agility} · INT ${gameState.player.intelligence}`, "stat");

    updateUI();

    // Update profile card
    const profileName = document.getElementById("profile-name");
    const profileRole = document.querySelector(".profile-role");
    const profileAvatar = document.querySelector(".profile-avatar");
    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = `NIVEL 1 ${cls.name.toUpperCase()}`;
    if (profileAvatar) profileAvatar.textContent = cls.emoji;

    if (onComplete) onComplete();
  });
}
