// ══════════════════════════════════════════════════════
//  FOCUS TRAP — accesibilidad de modales (a11y M3)
//  Observa apertura/cierre de .modal vía MutationObserver
//  para no tocar los ~40 puntos que hacen classList.add/remove.
// ══════════════════════════════════════════════════════

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const openerByModal = new WeakMap();
const wasOpenByModal = new WeakMap();

function isOpen(modal) {
  return modal.isConnected && !modal.classList.contains("hidden");
}

function topOpenModal() {
  const open = document.querySelectorAll(".modal:not(.hidden)");
  return open.length ? open[open.length - 1] : null;
}

function focusables(modal) {
  return Array.from(modal.querySelectorAll(FOCUSABLE))
    .filter((el) => el.getClientRects().length > 0);
}

function handleOpen(modal) {
  const opener = document.activeElement;
  if (opener && opener !== document.body) openerByModal.set(modal, opener);
  const target = focusables(modal)[0];
  if (target) target.focus();
}

function handleClose(modal) {
  const opener = openerByModal.get(modal);
  openerByModal.delete(modal);
  const top = topOpenModal();
  if (top) {
    // Queda otro modal abierto debajo: el foco no debe escapar de él
    if (!top.contains(document.activeElement)) focusables(top)[0]?.focus();
    return;
  }
  if (opener && opener.isConnected && opener.getClientRects().length > 0) {
    opener.focus();
  }
}

function checkModal(modal) {
  const open = isOpen(modal);
  const was = wasOpenByModal.get(modal) === true;
  if (open === was) return;
  wasOpenByModal.set(modal, open);
  if (open) handleOpen(modal);
  else handleClose(modal);
}

export function setupFocusTrap() {
  document.querySelectorAll(".modal").forEach((m) => {
    wasOpenByModal.set(m, isOpen(m));
  });

  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      if (mut.type === "attributes" && mut.target.classList?.contains("modal")) {
        checkModal(mut.target);
      } else if (mut.type === "childList") {
        for (const node of mut.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.classList?.contains("modal")) {
            wasOpenByModal.set(node, false);
            checkModal(node);
          }
        }
        for (const node of mut.removedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.classList?.contains("modal") && wasOpenByModal.get(node)) {
            wasOpenByModal.set(node, false);
            handleClose(node);
          }
        }
      }
    }
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true,
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const modal = topOpenModal();
    if (!modal) return;
    const els = focusables(modal);
    if (!els.length) {
      event.preventDefault();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement;
    if (!modal.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);
}
