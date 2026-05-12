import { gameState } from "./state.js";
import { autoScroll, forceScroll } from "./scrollManager.js";

/**
 * Añade un mensaje al área de historia con scroll automático
 * @param {string} text - Contenido del mensaje
 * @param {string} type - Tipo de mensaje (narrative, combat, loot, stat, shop, system)
 */
export function addMessage(text, type = "narrative") {
  const storyEl = document.getElementById("story");
  if (!storyEl) return;
  
  const p = document.createElement("p");
  p.textContent = text;
  p.className = `msg msg-${type}`;
  storyEl.insertBefore(p, storyEl.firstChild);
  
  // Guardar mensaje en estado del juego
  gameState.messages = gameState.messages || [];
  gameState.messages.push({ text, type, t: Date.now() });
  
  // Hacer scroll automático al final de forma segura
  autoScroll();
}

/**
 * Limpia el área de historia
 */
export function clearStory() {
  const storyEl = document.getElementById("story");
  if (storyEl) {
    storyEl.innerHTML = "";
  }
  forceScroll();
}

/**
 * Obtiene los últimos mensajes
 * @param {number} count - Número de mensajes a obtener
 * @returns {Array} Array de últimos mensajes
 */
export function getLastMessages(count = 10) {
  const messages = gameState.messages || [];
  return messages.slice(-count);
}

/**
 * Obtiene todos los mensajes
 * @returns {Array} Array de todos los mensajes
 */
export function getAllMessages() {
  return gameState.messages || [];
}

/**
 * Fuerza scroll al final inmediatamente
 */
export function scrollToBottom() {
  forceScroll();
}