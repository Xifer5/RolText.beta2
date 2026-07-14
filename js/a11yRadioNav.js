// SPEC-1006 — navegación por flechas en radiogroups (ARIA APG).
// Aplica a grupos role="radio" reales (clase, origen, dificultad).
// NO aplica a .mod-chip (aria-pressed toggle, multi-select, Tab normal).

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

/** Índice siguiente dado el actual, la tecla y el total de ítems (con wrap). */
export function nextRadioIndex(current, key, length) {
  if (length <= 1) return 0 <= current && current < length ? current : 0;
  if (!ARROW_KEYS.has(key)) return current;
  const forward = key === "ArrowRight" || key === "ArrowDown";
  const delta = forward ? 1 : -1;
  return (current + delta + length) % length;
}

/**
 * Cablea las flechas sobre un radiogroup ya existente en el DOM.
 * onSelect(item) debe aplicar la misma lógica que el click (clase selected,
 * aria-checked, actualizar estado) — se reusa el handler de click existente.
 */
export function setupRadioGroupArrowNav(container, itemSelector, onSelect) {
  if (!container) return;
  container.addEventListener("keydown", (e) => {
    if (!ARROW_KEYS.has(e.key)) return;
    const items = Array.from(container.querySelectorAll(itemSelector));
    if (!items.length) return;
    const active = document.activeElement;
    const current = Math.max(0, items.indexOf(active));
    const next = nextRadioIndex(current, e.key, items.length);
    e.preventDefault();
    items[next].focus();
    onSelect(items[next]);
  });
}
