import { gameState, initialGameState } from "./state.js";
import { addMessage } from "./story.js";

const SAVE_KEY = "pixelQuestSave";

export function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function saveGame() {
  try {
    const payload = { gameState, timestamp: new Date().toISOString() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    addMessage("💾 Game saved!", "system");
    // Notify UI that save state changed (so menus can refresh save info)
    window.dispatchEvent(new Event("pixel:saveChanged"));
    return true;
  } catch (e) {
    console.error(e);
    addMessage("❌ Failed to save game.", "system");
    return false;
  }
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    addMessage("❌ No save found.", "system");
    return false;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.gameState) throw new Error("Bad save format");
    Object.assign(gameState, parsed.gameState);
    // Inform UI to refresh, but avoid direct import to prevent circular modules
    window.dispatchEvent(new Event("pixel:stateUpdated"));
    addMessage("📂 Game loaded!", "system");
    return true;
  } catch (e) {
    console.error(e);
    addMessage("❌ Corrupted save.", "system");
    return false;
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  addMessage("🗑️ Save deleted.", "system");
  window.dispatchEvent(new Event("pixel:saveChanged"));
}