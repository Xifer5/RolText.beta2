/**
 * keyboard.js — Atajos de teclado Material Design 3
 *
 * Combate:  1=Atacar  2=Magia  3=Ítem  4=Huir
 * Movimiento: WASD o flechas
 * ESC: cierra el modal más reciente
 * M: abre/cierra menú principal
 */
import { gameState } from "./state.js";
import { renderInventory } from "./inventory.js";

const MOVE_KEYS = {
  ArrowUp:    "north", w: "north", W: "north",
  ArrowDown:  "south", s: "south", S: "south",
  ArrowLeft:  "west",  a: "west",  A: "west",
  ArrowRight: "east",  d: "east",  D: "east",
};

const COMBAT_KEYS = {
  "1": "pixel:attack",
  "2": "pixel:magic",
  "4": "pixel:flee",
};

export function setupKeyboard() {
  document.addEventListener("keydown", onKey, { capture: false });
}

function onKey(e) {
  /* Ignorar si el foco está en un campo de texto */
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  /* ESC — cierra el modal más reciente que esté visible */
  if (e.key === "Escape") {
    const modals = [...document.querySelectorAll(".modal:not(.hidden)")];
    if (modals.length > 0) {
      modals[modals.length - 1].classList.add("hidden");
      e.preventDefault();
      return;
    }
  }

  /* M — menú principal */
  if (e.key === "m" || e.key === "M") {
    const anyModalOpen = document.querySelector(".modal:not(.hidden)");
    if (!anyModalOpen) {
      window.dispatchEvent(new Event("pixel:openMenu"));
      e.preventDefault();
    }
    return;
  }

  /* ── COMBATE ─────────────────────────────────────────── */
  if (gameState.isInCombat) {
    const evt = COMBAT_KEYS[e.key];
    if (evt) {
      window.dispatchEvent(new Event(evt));
      e.preventDefault();
      return;
    }
    /* 3 → abrir inventario de ítems */
    if (e.key === "3") {
      renderInventory();
      document.getElementById("inventoryModal")?.classList.remove("hidden");
      e.preventDefault();
      return;
    }
    return; /* En combate las flechas no mueven */
  }

  /* ── MOVIMIENTO ──────────────────────────────────────── */
  const dir = MOVE_KEYS[e.key];
  if (dir) {
    window.dispatchEvent(
      new CustomEvent("pixel:move", { detail: { direction: dir } })
    );
    e.preventDefault();
  }
}
