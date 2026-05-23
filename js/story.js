import { gameState } from "./state.js";
import { autoScroll, forceScroll } from "./scrollManager.js";

/**
 * Formatea de forma segura un mensaje de log agregando iconos y clases de M3 para números.
 * @param {string} text - Contenido del mensaje original
 * @param {string} type - Tipo de mensaje
 * @returns {string} HTML formateado seguro
 */
function formatLogHTML(text, type) {
  let icon = "";
  if (type === "combat") {
    if (text.includes("💥") || text.includes("CRÍTICO") || text.includes("CRITICAL")) {
      icon = "💥 ";
    } else if (text.includes("esquiva") || text.includes("dodge") || text.includes("evad")) {
      icon = "💨 ";
    } else if (text.includes("cura") || text.includes("heal") || text.includes("sana")) {
      icon = "💚 ";
    } else {
      icon = "⚔️ ";
    }
  } else if (type === "loot") {
    icon = "🎁 ";
  } else if (type === "stat") {
    icon = "⭐ ";
  } else if (type === "system") {
    icon = "⚙️ ";
  } else if (type === "shop") {
    icon = "🛒 ";
  } else if (type === "narrative") {
    icon = "📖 ";
  }

  // Sanitización básica para evitar inyección XSS de cadenas dinámicas
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Colorear números según el contexto de forma semántica
  if (type === "combat") {
    if (text.includes("cura") || text.includes("heal") || text.includes("sana")) {
      formatted = formatted.replace(/(\d+)/g, '<span class="log-heal-number">$1</span>');
    } else {
      formatted = formatted.replace(/(\d+)/g, '<span class="log-number">$1</span>');
    }
  } else if (type === "stat" || type === "shop") {
    formatted = formatted.replace(/(\d+)/g, '<span class="log-stat-number">$1</span>');
  }

  return `<span class="log-icon">${icon}</span><span class="log-text">${formatted}</span>`;
}

/**
 * Añade un mensaje al área de historia con scroll automático
 * @param {string} text - Contenido del mensaje
 * @param {string} type - Tipo de mensaje (narrative, combat, loot, stat, shop, system)
 */
export function addMessage(text, type = "narrative") {
  const storyEl = document.getElementById("story");
  if (!storyEl) return;
  
  const p = document.createElement("p");
  p.innerHTML = formatLogHTML(text, type);
  p.className = `msg msg-${type}`;
  p.setAttribute("data-type", type);
  storyEl.insertBefore(p, storyEl.firstChild);
  
  // Guardar mensaje en estado del juego (guardar texto plano para persistencia limpia)
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