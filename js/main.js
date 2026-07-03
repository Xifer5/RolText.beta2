import "./worldMap.js";
import { initializeGame, gameState } from "./state.js";
import { setupMainMenuListeners } from "./events.js";
import { setupMovement } from "./movement.js";
import { setupCombat } from "./combat.js";
import { setupUIListeners, toggleMainMenu, updateUI } from "./ui.js";
import { addMessage } from "./story.js";
import { initScrollManager } from "./scrollManager.js";
import { setupPanelListeners } from "./panels.js";
import { showCharacterSelect } from "./charselect.js";
import { initLocalization, setLocale, getLocale, t, localizeText } from "./i18n.js";
import { setupKeyboard } from "./keyboard.js";
import { initAudio, preloadSounds } from "./sounds.js";
import { setupTravelEventModal } from "./travelEvents.js";
import { renderLocalMinimap } from "./localMinimap.js";
import { showIntro } from "./intro.js";
import { setupFocusTrap } from "./focusTrap.js";

window.addEventListener("DOMContentLoaded", () => {
  initLocalization();
  initAudio();
  initScrollManager();
  setupMainMenuListeners();
  initializeGame();
  updateUI();
  renderLocalMinimap();

  try {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc?.name) {
      const locationName = localizeText(loc.name);
      const locationDesc = localizeText(Array.isArray(loc.description) ? loc.description[0] : loc.description);
      addMessage(`${t('locationIntro')} ${locationName}: ${locationDesc}`, "system");
    }
  } catch(e) {}

  setupMovement();
  setupCombat();
  setupUIListeners();
  setupPanelListeners();
  setupKeyboard();
  setupTravelEventModal();
  setupFocusTrap();

  // Pre-carga sonidos tras primera interacción del usuario
  document.addEventListener("pointerdown", preloadSounds, { once: true });

  toggleMainMenu(false);
  addMessage(t('welcomeMessage'), "system");

  // New player (no class yet) must always see the intro
  if (!gameState.player.class) sessionStorage.removeItem("introSeen");

  showIntro(() => {
    if (!gameState.player.class) {
      setTimeout(() => {
        showCharacterSelect(() => {
          addMessage(t('adventureBeginMessage'), "system");
        });
      }, 300);
    }
  });
});

// Wire New Game button — clear intro flag so story replays, then show character select
window.addEventListener("pixel:newGame", () => {
  sessionStorage.removeItem("introSeen");
  showIntro(() => {
    showCharacterSelect(() => {
      addMessage(t('adventureBeginMessage'), "system");
    });
  });
});

// Auto-save toast helper
export function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
