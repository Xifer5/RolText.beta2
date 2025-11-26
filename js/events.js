import { initializeGame, gameState } from "./state.js";
import { saveGame, loadGame, deleteSave, hasSavedGame } from "./saveSystem.js";
import { toggleMainMenu, updateSaveInfo, updateUI } from "./ui.js";
import { addMessage } from "./story.js";

export function setupMainMenuListeners() {
  const map = {
    newGameBtn: () => {
      if (hasSavedGame() && !confirm("Start a new game? Unsaved progress will be lost.")) return;
      deleteSave();
      initializeGame();
      toggleMainMenu(false);
      addMessage("New game started.", "system");
      updateUI();
    },
    continueBtn: () => { if (loadGame()) toggleMainMenu(false); },
    saveGameBtn: () => { if (saveGame()) updateSaveInfo(); },
    loadGameBtn: () => { if (loadGame()) toggleMainMenu(false); },
    deleteSaveBtn: () => { if (confirm('Delete saved game?')) { deleteSave(); updateSaveInfo(); } },
    closeMenuBtn: () => toggleMainMenu(false)
  };

  Object.entries(map).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  });
}