import { gameState, initializeGame } from "./state.js";
import { updateUI, toggleMainMenu } from "./ui.js";
import { saveGame, loadGame, deleteSave } from "./saveSystem.js";
import { addMessage } from "./story.js";

export function setupMainMenuListeners() {
  /* pixel:openMenu — disparado desde teclado (tecla M) */
  window.addEventListener("pixel:openMenu", () => toggleMainMenu(true));

  document.getElementById("newGameBtn")?.addEventListener("click", () => {
    toggleMainMenu(false);
    window.dispatchEvent(new Event("pixel:newGame"));
  });

  document.getElementById("continueBtn")?.addEventListener("click", () => {
    loadGame();
    toggleMainMenu(false);
    updateUI();
  });

  document.getElementById("saveGameBtn")?.addEventListener("click", () => {
    saveGame();
    addMessage("Partida guardada.", "system");
  });

  document.getElementById("loadGameBtn")?.addEventListener("click", () => {
    loadGame();
    toggleMainMenu(false);
    updateUI();
  });

  document.getElementById("deleteSaveBtn")?.addEventListener("click", () => {
    if (confirm("¿Borrar la partida guardada?")) {
      deleteSave();
      addMessage("Partida eliminada.", "system");
    }
  });

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
