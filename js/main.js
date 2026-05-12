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
import { initLocalization, setLocale, getLocale, t } from "./i18n.js";
import { setupKeyboard } from "./keyboard.js";
import { initAudio, preloadSounds } from "./sounds.js";
import { setupTravelEventModal } from "./travelEvents.js";
import { renderLocalMinimap } from "./localMinimap.js";

window.addEventListener("DOMContentLoaded", () => {
  initAudio();
  initScrollManager();
  setupMainMenuListeners();
  initializeGame();
  updateUI();
  renderLocalMinimap();

  try {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc?.name) addMessage(`${t('locationIntro')} ${loc.name}: ${Array.isArray(loc.description) ? loc.description[0] : loc.description}`, "system");
  } catch(e) {}

  setupMovement();
  setupCombat();
  setupUIListeners();
  setupPanelListeners();
  setupKeyboard();
  setupTravelEventModal();

  // Pre-carga sonidos tras primera interacción del usuario
  document.addEventListener("pointerdown", preloadSounds, { once: true });

  toggleMainMenu(false);
  addMessage(t('welcomeMessage'), "system");

  // Show character select on first load if no class chosen
  if (!gameState.player.class) {
    setTimeout(() => {
      showCharacterSelect(() => {
        addMessage(t('adventureBeginMessage'), "system");
      });
    }, 600);
  }
});

// Wire New Game button to show character selection
window.addEventListener("pixel:newGame", () => {
  showCharacterSelect(() => {
    addMessage("¡Comienza tu aventura!", "system");
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
