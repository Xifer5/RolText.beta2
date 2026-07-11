/**
 * onboarding.js — SPEC-0801 Primeros 5 minutos (onboarding contextual)
 *
 * Hints no bloqueantes de primera sesión. Cada "primera vez" del jugador
 * (moverse, hablar con Elara, aceptar misión, combatir, lotear, volver
 * herido a zona segura) dispara una tarjeta M3 con botón "Entendido".
 *
 * Persistencia: localStorage["pqe.onboarding.v1"], FUERA del save — el
 * onboarding se ve una vez por dispositivo y es reactivable desde el menú.
 *
 * La lógica pura (parseState/shouldShow/markSeen) no toca DOM ni
 * localStorage para poder testearse con node --test.
 */
import { gameState } from "./state.js";
import { t } from "./i18n.js";

const STORAGE_KEY = "pqe.onboarding.v1";

export const STEP_IDS = [
  "welcome_move",
  "talk_elara",
  "quest_tracker",
  "first_combat",
  "enemy_intent",
  "first_loot",
  "rest_save"
];

const STEP_META = {
  welcome_move:  { icon: "🧭", key: "onbWelcomeMove",  anchor: "#navigation-menu" },
  talk_elara:    { icon: "💬", key: "onbTalkElara",    anchor: "#npc-talk-btn" },
  quest_tracker: { icon: "📜", key: "onbQuestTracker", anchor: "#questTracker" },
  first_combat:  { icon: "⚔️", key: "onbFirstCombat",  anchor: "#combat-menu" },
  enemy_intent:  { icon: "👁️", key: "onbEnemyIntent",  anchor: "#enemy-panel" },
  first_loot:    { icon: "🎒", key: "onbFirstLoot",    anchor: null },
  rest_save:     { icon: "🛏️", key: "onbRestSave",     anchor: null }
};

// ── Lógica pura (testeable sin DOM) ─────────────────────────────────

export function defaultState() {
  return { enabled: true, seen: {} };
}

/** Parsea el JSON crudo de localStorage; ante corrupción vuelve al default. */
export function parseState(raw) {
  try {
    const s = JSON.parse(raw);
    if (s && typeof s === "object" && s.seen && typeof s.seen === "object") {
      return { enabled: s.enabled !== false, seen: { ...s.seen } };
    }
  } catch (e) { /* corrupto → default */ }
  return defaultState();
}

export function shouldShow(state, stepId) {
  if (!state || state.enabled === false) return false;
  if (!STEP_IDS.includes(stepId)) return false;
  return !state.seen[stepId];
}

export function markSeen(state, stepId) {
  return { ...state, seen: { ...state.seen, [stepId]: true } };
}

export function resetSeen(state) {
  return { enabled: true, seen: {} };
}

// ── Persistencia (localStorage con fallback en memoria) ─────────────

let _state = null;

function loadState() {
  if (_state) return _state;
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* modo privado */ }
  _state = parseState(raw);
  return _state;
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch (e) { /* no persiste, no rompe */ }
}

export function isOnboardingEnabled() {
  return loadState().enabled !== false;
}

/** Toggle del menú: al reactivar se resetea `seen` para que la secuencia reviva. */
export function toggleOnboarding() {
  const st = loadState();
  if (st.enabled === false) {
    _state = resetSeen(st);
  } else {
    _state = { ...st, enabled: false };
    _dismissCurrent(false);
    _queue.length = 0;
  }
  saveState();
  return _state.enabled;
}

// ── Render de la tarjeta (una a la vez, con cola) ───────────────────

let _queue = [];
let _current = null;      // stepId visible
let _cardEl = null;
let _anchorEl = null;

function _container() {
  let c = document.getElementById("onb-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "onb-container";
    document.body.appendChild(c);
  }
  return c;
}

/**
 * Punto de entrada de los triggers. Encola el hint si procede;
 * se marca como visto AL MOSTRARSE (recargar no lo repite).
 */
export function maybeShowHint(stepId) {
  const st = loadState();
  if (!shouldShow(st, stepId)) return false;
  if (_current === stepId || _queue.includes(stepId)) return false;
  if (!gameState?.player?.class) return false; // aún sin personaje
  _queue.push(stepId);
  if (!_current) _showNext();
  return true;
}

function _showNext() {
  const stepId = _queue.shift();
  if (!stepId) return;
  const st = loadState();
  if (!shouldShow(st, stepId)) { _showNext(); return; }

  _state = markSeen(st, stepId);
  saveState();
  _current = stepId;

  const meta = STEP_META[stepId];
  const card = document.createElement("div");
  card.className = "onb-card";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");

  const icon = document.createElement("span");
  icon.className = "onb-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = meta.icon;

  const text = document.createElement("div");
  text.className = "onb-text";
  text.textContent = t(meta.key);

  const btn = document.createElement("button");
  btn.className = "onb-btn";
  btn.type = "button";
  btn.textContent = t("onbGotIt");
  btn.addEventListener("click", () => _dismissCurrent(true));

  card.append(icon, text, btn);
  _container().appendChild(card);
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("visible")));
  _cardEl = card;

  // Resalta el control ancla solo si existe y está visible en este layout
  if (meta.anchor) {
    const el = document.querySelector(meta.anchor);
    if (el && el.offsetParent !== null && !el.classList.contains("hidden")) {
      el.classList.add("onb-highlight");
      _anchorEl = el;
    }
  }
}

function _dismissCurrent(runHooks) {
  if (_anchorEl) { _anchorEl.classList.remove("onb-highlight"); _anchorEl = null; }
  if (_cardEl) {
    const el = _cardEl;
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 300);
    _cardEl = null;
  }
  const dismissed = _current;
  _current = null;

  if (runHooks && dismissed === "welcome_move") {
    // Empuja la historia: tras entender el movimiento, señala a Elara (si sigue en town)
    setTimeout(() => {
      if (gameState.currentLocationId === "town" && !gameState.isInCombat) {
        maybeShowHint("talk_elara");
      }
    }, 1200);
  }
  if (_queue.length) setTimeout(_showNext, 350);
}
