import { gameState, initialGameState } from "./state.js";
import { addMessage } from "./story.js";
import { deepClone } from "./utils.js";

const SAVE_KEY = "pixelQuestSave";

export function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function saveGame() {
  try {
    const payload = { gameState, timestamp: new Date().toISOString(), version: "3.0" };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    addMessage("💾 Partida guardada.", "system");
    window.dispatchEvent(new Event("pixel:saveChanged"));
    return true;
  } catch(e) {
    addMessage("❌ Error al guardar.", "system");
    return false;
  }
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { addMessage("❌ Sin partida guardada.", "system"); return false; }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.gameState) throw new Error("Formato inválido");
    // Merge: defaults primero → guardado encima, garantiza que campos nuevos existan
    Object.assign(gameState, deepClone(initialGameState), deepClone(parsed.gameState));
    // Restore profile card
    setTimeout(() => {
      const p = gameState.player;
      const nameEl   = document.getElementById("profile-name");
      const roleEl   = document.querySelector(".profile-role");
      const avatarEl = document.querySelector(".profile-avatar");
      if (nameEl   && p.name)      nameEl.textContent   = p.name;
      if (roleEl   && p.className) roleEl.textContent   = `NIVEL ${p.level} ${p.className.toUpperCase()}`;
      if (avatarEl && p.classEmoji) avatarEl.textContent = p.classEmoji;
    }, 100);
    window.dispatchEvent(new Event("pixel:stateUpdated"));
    addMessage(`📂 Partida cargada. ¡Bienvenido de vuelta, ${gameState.player.name || "aventurero"}!`, "system");
    return true;
  } catch(e) {
    addMessage("❌ Partida corrupta.", "system");
    return false;
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
  addMessage("🗑️ Partida eliminada.", "system");
  window.dispatchEvent(new Event("pixel:saveChanged"));
}
