import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { getRandomEncounter } from "./combat.js";
import { updateUI } from "./ui.js";

export function setupMovement() {
  window.addEventListener("pixel:move", (e) => {
    const dir = e.detail?.direction;
    if (!dir) return;
    handleMove(dir);
  });
}

export function handleMove(direction) {
  if (gameState.isGameOver) return;
  if (gameState.isInCombat) {
    addMessage("You can't move during combat!", "system");
    return;
  }

  const cur = window.worldMap[gameState.currentLocationId];
  const nextId = cur.exits?.[direction];
  if (!nextId || !worldMap[nextId]) {
    addMessage("You can't go that way.", "system");
    return;
  }

  gameState.currentLocationId = nextId;
  const newLoc = window.worldMap[nextId];
  addMessage(`You travel ${direction} to ${newLoc.name}.`, "narrative");
  if (Array.isArray(newLoc.description)) {
    addMessage(newLoc.description[Math.floor(Math.random() * newLoc.description.length)], "narrative");
  } else if (newLoc.description) {
    addMessage(newLoc.description, "narrative");
  }

  const encounterId = getRandomEncounter(nextId);
  if (encounterId) {
    window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: encounterId } }));
  }

  updateUI();
}
