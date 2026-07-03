// ══════════════════════════════════════════════════════
//  SPECIALIZATION MODAL — Elección de especialización (nivel 10+)
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { getClassSpecializations, chooseSpecialization, canSpecialize } from "./specializations.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { showToast } from "./toast.js";
import { playSound } from "./sounds.js";
import { saveGame } from "./saveSystem.js";
import { t, formatText } from "./i18n.js";

export function showSpecializationModal() {
  if (!canSpecialize(gameState.player)) return;
  document.getElementById("specModal")?.remove();

  const specs = getClassSpecializations(gameState.player.class);
  if (!specs.length) return;

  const modal = document.createElement("div");
  modal.id = "specModal";
  modal.className = "modal";
  modal.style.cssText = "opacity:1;pointer-events:auto;z-index:290";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "specModalTitle");

  modal.innerHTML = `
    <div class="modal-content" style="max-width:560px">
      <div class="modal-header">
        <h2 id="specModalTitle">${t('specChooseTitle')}</h2>
      </div>
      <p style="text-align:center;color:var(--c-muted);margin-bottom:16px;font-style:italic">
        ${t('specChooseDesc')}
      </p>
      <div class="spec-choice-grid" role="radiogroup" aria-label="${t('specChooseTitle')}">
        ${specs.map(s => `
          <button type="button" class="spec-card" data-spec="${s.id}">
            <span class="spec-card-emoji">${s.emoji}</span>
            <span class="spec-card-name">${s.name}</span>
            <span class="spec-card-desc">${s.desc}</span>
          </button>
        `).join("")}
      </div>
      <button class="btn outlined" id="specLaterBtn" style="margin-top:var(--sp-4);width:100%">
        ${t('specLaterButton')}
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll("[data-spec]").forEach(btn => {
    btn.addEventListener("click", () => {
      const spec = chooseSpecialization(btn.dataset.spec);
      if (!spec) return;
      modal.remove();
      playSound("level_up");
      addMessage(formatText(t('specChosenMsg'), { emoji: spec.emoji, name: spec.name, desc: spec.desc }), "stat");
      showToast(`${spec.emoji} ${spec.name}`);
      updateUI();
      setTimeout(() => saveGame(), 600);
    });
  });

  modal.querySelector("#specLaterBtn")?.addEventListener("click", () => {
    modal.remove();
    addMessage(t('specLaterHint'), "system");
  });
}
