import "./worldMap.js";
import { initializeGame, gameState } from "./state.js";
import { setupMainMenuListeners } from "./events.js";
import { setupMovement } from "./movement.js";
import { setupCombat } from "./combat.js";
import { setupUIListeners, toggleMainMenu, updateUI } from "./ui.js";
import { addMessage } from "./story.js";

window.addEventListener("DOMContentLoaded", () => {
  setupMainMenuListeners();
  initializeGame();
  updateUI();
  // Announce starting location
  try {
    const loc = window.worldMap?.[gameState.currentLocationId];
    if (loc && loc.name) addMessage(`You are at ${loc.name}: ${Array.isArray(loc.description) ? loc.description[0] : loc.description}`, "system");
  } catch (e) {
    console.warn('Failed to show starting location', e);
  }
  setupMovement();
  setupCombat();
  setupUIListeners();
  // Start with game active and main menu hidden.
  toggleMainMenu(false);
  addMessage("Welcome to Pixel Quest Echoes!", "system");
});