import { gameState } from "./state.js";

export function addMessage(text, type = "narrative") {
  const storyEl = document.getElementById("story");
  if (!storyEl) return;
  const p = document.createElement("p");
  p.textContent = text;
  p.className = `msg msg-${type}`;
  storyEl.appendChild(p);
  storyEl.scrollTop = storyEl.scrollHeight;
  gameState.messages = gameState.messages || [];
  gameState.messages.push({ text, type, t: Date.now() });
}

export function clearStory() {
  const storyEl = document.getElementById("story");
  if (storyEl) storyEl.innerHTML = "";
}