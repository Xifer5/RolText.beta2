// ScrollManager — log de aventura con scroll invertido (más nuevo arriba)

let storyEl     = null;
let _autoScroll = true;
let indicator   = null;

export function initScrollManager() {
  storyEl = document.getElementById("story");
  if (!storyEl) return;

  indicator = document.createElement("button");
  indicator.className  = "story-new-indicator";
  indicator.textContent = "↑";
  indicator.title       = "Ir al mensaje más reciente";
  indicator.setAttribute("aria-label", "Ir al mensaje más reciente");
  indicator.addEventListener("click", () => {
    storyEl.scrollTo({ top: 0, behavior: "smooth" });
    indicator.classList.remove("visible");
    _autoScroll = true;
  });
  storyEl.parentElement.style.position = "relative";
  storyEl.parentElement.appendChild(indicator);

  storyEl.addEventListener("scroll", _onUserScroll, { passive: true });
}

function _isNearTop(threshold = 80) {
  if (!storyEl) return true;
  return storyEl.scrollTop <= threshold;
}

function _onUserScroll() {
  if (!storyEl) return;
  _autoScroll = _isNearTop();
  if (_autoScroll && indicator) indicator.classList.remove("visible");
}

/** Llamar tras añadir un mensaje. */
export function autoScroll() {
  if (!storyEl) return;
  if (_autoScroll) {
    storyEl.scrollTop = 0;
  } else if (indicator) {
    indicator.classList.add("visible");
  }
}

/** Fuerza scroll al inicio (al cargar partida, limpiar log, etc.). */
export function forceScroll() {
  if (!storyEl) return;
  _autoScroll = true;
  storyEl.scrollTop = 0;
  if (indicator) indicator.classList.remove("visible");
}
