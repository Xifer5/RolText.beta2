import { gameState, initialGameState } from "./state.js";
import { addMessage } from "./story.js";
import { deepClone } from "./utils.js";
import { t, formatText } from "./i18n.js";
import { migratePermanentBonuses, applyDerivedMaxes } from "./stats.js";
import { migrateUnknownSpecialization } from "./specializations.js";

const LEGACY_KEY = "pixelQuestSave";
export const SAVE_SLOTS = ["auto", "slot1", "slot2", "slot3"];
const keyOf = id => `${LEGACY_KEY}.${id}`;

// El save único pre-SPEC-0805 pasa a la ranura 1 (una sola vez; idempotente)
function migrateLegacySave() {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === null) return;
  if (localStorage.getItem(keyOf("slot1")) === null) {
    localStorage.setItem(keyOf("slot1"), legacy);
  }
  localStorage.removeItem(LEGACY_KEY);
}

/** Payload parseado de una ranura, o null si está vacía o corrupta. */
export function readSlot(slotId) {
  migrateLegacySave();
  const raw = localStorage.getItem(keyOf(slotId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.gameState ? parsed : null;
  } catch { return null; }
}

export function listSlots() {
  return SAVE_SLOTS.map(id => ({ id, data: readSlot(id) }));
}

/** Ranura con el timestamp más reciente, o null si no hay ninguna. */
export function latestSlotId() {
  let best = null, bestTime = -Infinity;
  for (const { id, data } of listSlots()) {
    if (!data) continue;
    const ts = Date.parse(data.timestamp) || 0;
    if (ts > bestTime) { best = id; bestTime = ts; }
  }
  return best;
}

export function hasSavedGame() {
  return latestSlotId() !== null;
}

export function saveToSlot(slotId) {
  if (!SAVE_SLOTS.includes(slotId)) return false;
  try {
    migrateLegacySave();
    const payload = { gameState, timestamp: new Date().toISOString(), version: "3.1" };
    localStorage.setItem(keyOf(slotId), JSON.stringify(payload));
    addMessage(t("saveGameSaved"), "system");
    window.dispatchEvent(new Event("pixel:saveChanged"));
    return true;
  } catch(e) {
    addMessage(t("saveGameCorrupt"), "system");
    return false;
  }
}

export function loadFromSlot(slotId) {
  const parsed = readSlot(slotId);
  if (!parsed) { addMessage(t("noSavedGame"), "system"); return false; }
  try {
    // Merge: defaults primero → guardado encima, garantiza que campos nuevos existan
    Object.assign(gameState, deepClone(initialGameState), deepClone(parsed.gameState));
    // Saves antiguos acumulaban level-ups mutando maxHp/maxMp; reconstruye los bonos permanentes
    if (migratePermanentBonuses(gameState.player, gameState.equipment)) applyDerivedMaxes();
    // SPEC-1105: saves con un id de especialización que ya no existe (ej. "sword_master")
    // vuelven a null — el jugador puede elegir de nuevo entre las 9 especializaciones actuales
    if (migrateUnknownSpecialization(gameState.player)) applyDerivedMaxes();
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
    addMessage(formatText("loadGameWelcome", { player: gameState.player.name || t("defaultPlayerName") }), "system");
    return true;
  } catch(e) {
    addMessage(t("saveGameCorrupt"), "system");
    return false;
  }
}

export function deleteSlot(slotId) {
  migrateLegacySave();
  localStorage.removeItem(keyOf(slotId));
  window.dispatchEvent(new Event("pixel:saveChanged"));
}

// ── Compat — los autosaves (combat.js, specModal.js) y "Continuar" no cambian ──

/** Autoguardado: escribe siempre en la ranura "auto". */
export function saveGame() {
  return saveToSlot("auto");
}

/** "Continuar": carga la ranura más reciente. */
export function loadGame() {
  const id = latestSlotId();
  if (!id) { addMessage(t("noSavedGame"), "system"); return false; }
  return loadFromSlot(id);
}
