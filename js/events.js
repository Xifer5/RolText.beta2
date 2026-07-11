import { gameState, initializeGame } from "./state.js";
import { updateUI, toggleMainMenu } from "./ui.js";
import { loadGame } from "./saveSystem.js";
import { openSaveSlotsModal, setupSaveSlotsModal } from "./saveSlotsModal.js";
import { t } from "./i18n.js";
import { isOnboardingEnabled, toggleOnboarding } from "./onboarding.js";
import { showToast } from "./toast.js";

function updateOnboardingLabel() {
  const btn = document.getElementById("onboardingToggleBtn");
  if (btn) btn.textContent = t(isOnboardingEnabled() ? "onbTipsOn" : "onbTipsOff");
}

export function setupMainMenuListeners() {
  /* pixel:openMenu — disparado desde teclado (tecla M) */
  window.addEventListener("pixel:openMenu", () => toggleMainMenu(true));

  updateOnboardingLabel();
  document.getElementById("onboardingToggleBtn")?.addEventListener("click", () => {
    const enabled = toggleOnboarding();
    updateOnboardingLabel();
    showToast(t(enabled ? "onbTipsReactivated" : "onbTipsDisabled"), "info");
  });

  document.getElementById("newGameBtn")?.addEventListener("click", () => {
    toggleMainMenu(false);
    window.dispatchEvent(new Event("pixel:newGame"));
  });

  document.getElementById("continueBtn")?.addEventListener("click", () => {
    if (loadGame()) {
      toggleMainMenu(false);
      updateUI();
    }
  });

  document.getElementById("saveGameBtn")?.addEventListener("click", () => {
    openSaveSlotsModal("save");
  });

  document.getElementById("loadGameBtn")?.addEventListener("click", () => {
    openSaveSlotsModal("load");
  });

  setupSaveSlotsModal();

  document.getElementById("closeMenuBtn")?.addEventListener("click", () => {
    toggleMainMenu(false);
  });

  document.getElementById("restartBtn")?.addEventListener("click", () => {
    document.getElementById("gameOverModal")?.classList.add("hidden");
    window.dispatchEvent(new Event("pixel:newGame"));
  });

  document.getElementById("endingRestartBtn")?.addEventListener("click", () => {
    document.getElementById("endingModal")?.classList.add("hidden");
    window.dispatchEvent(new Event("pixel:newGame"));
  });

  document.getElementById("endingCloseBtn")?.addEventListener("click", () => {
    document.getElementById("endingModal")?.classList.add("hidden");
  });
}
