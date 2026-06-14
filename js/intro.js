import { playMusic } from "./sounds.js";

// ── Páginas del cómic ────────────────────────────────────────
// Cada página tiene hasta 3 paneles revelados uno a uno.
// img: ruta relativa desde la raíz (null = usa fondo CSS como fallback).
const PAGES = [
  // Página 1 — El Mundo que Fue
  {
    layout: "wide-top",
    music: "forest",
    panels: [
      {
        visual: "ipv-stars",
        caption: "En el principio, Aetheria era un mundo de magia y luz. Sus bosques cantaban, sus ríos brillaban, sus montañas tocaban las estrellas.",
        img: "img/intro/p1_stars.webp"
      },
      {
        visual: "ipv-guardian",
        caption: "Un dragón antiguo velaba por todo ello. No como conquistador. Como guardián. Los humanos lo llamaban: el Rey Dragón.",
        img: "img/intro/p1_guardian.webp"
      },
      {
        visual: "ipv-name",
        caption: "Su nombre era Asterion. Hoy, nadie lo recuerda.",
        img: "img/intro/p1_name.webp"
      }
    ]
  },
  // Página 2 — El Fin de una Era
  {
    layout: "tall-left",
    music: "cave",
    panels: [
      {
        visual: "ipv-hourglass",
        caption: "Hace mil años, Asterion murió.\nO eso creían todos.",
        img: "img/intro/p2_hourglass.webp"
      },
      {
        visual: "ipv-cracks",
        caption: "Pero los sueños de un dragón no mueren fácilmente.",
        img: "img/intro/p2_cracks.webp"
      },
      {
        visual: "ipv-forest",
        caption: "Y los sueños que sangran... se convierten en pesadillas.",
        img: "img/intro/p2_forest.webp"
      }
    ]
  },
  // Página 3 — La Corrupción
  {
    layout: "wide-bottom",
    music: "swamp",
    panels: [
      {
        visual: "ipv-volcano",
        caption: "Las montañas vomitaron fuego. Las tormentas no cedían.",
        img: "img/intro/p3_volcano.webp"
      },
      {
        visual: "ipv-eyes",
        caption: "Y en el fondo de todo... algo antiguo comenzó a despertar.",
        img: "img/intro/p3_eyes.webp"
      },
      {
        visual: "ipv-people",
        caption: "Nadie sabía qué causaba la corrupción. Solo sabían que Aetheria estaba muriendo.",
        img: "img/intro/p3_people.webp"
      }
    ]
  },
  // Página 4 — La Esperanza
  {
    layout: "tall-left",
    music: "forest",
    panels: [
      {
        visual: "ipv-candle",
        caption: "Una anciana en Oakhaven escuchó algo.\nUn susurro entre las ruinas.",
        img: "img/intro/p4_candle.webp"
      },
      {
        visual: "ipv-scroll",
        caption: "\"No busques al dragón para matarlo,\" susurraba.\n\"Búscalo para recordarlo.\"",
        img: "img/intro/p4_scroll.webp"
      },
      {
        visual: "ipv-hero",
        caption: "Y así llega alguien. Sin leyendas a sus espaldas. Sin destino escrito. Solo la voluntad de escuchar.",
        img: "img/intro/p4_hero.webp"
      }
    ]
  },
  // Página 5 — El Llamado (CSS puro, sin imagen)
  {
    layout: "full",
    music: "castle",
    panels: [
      {
        visual: "ipv-title",
        caption: null,
        isTitle: true,
        img: null
      },
      {
        visual: "ipv-dark",
        caption: "Aetheria te llama.\n¿Quién serás tú?",
        isLast: true,
        img: null
      }
    ]
  }
];

const TYPEWRITER_MS = 30;

let _pg        = 0;
let _panelIdx  = -1;
let _typing    = false;
let _typeTimer = null;
let _onFinish  = null;

// ── API pública ───────────────────────────────────────────────
export function showIntro(onFinish) {
  // ?intro en la URL fuerza mostrar la intro (útil para pruebas)
  const forced = new URLSearchParams(location.search).has("intro");
  if (!forced && sessionStorage.getItem("introSeen")) { onFinish?.(); return; }

  _onFinish = onFinish;
  _pg       = 0;
  _panelIdx = -1;

  const screen = document.getElementById("introScreen");
  if (!screen) { _finish(); return; }

  screen.classList.remove("hidden");
  _wireControls();
  _loadPage(0);
}

// ── Controles ─────────────────────────────────────────────────
function _wireControls() {
  _wire("introSkipBtn",  "click", _finish);
  _wire("introNextBtn",  "click", _onNext);
  _wire("introStartBtn", "click", _finish);
}

function _wire(id, event, fn) {
  const el = document.getElementById(id);
  if (el && !el.dataset.wired) { el.dataset.wired = "1"; el.addEventListener(event, fn); }
}

// ── Cargar página ─────────────────────────────────────────────
function _loadPage(pageIdx) {
  const page = PAGES[pageIdx];
  if (!page) { _finish(); return; }

  _pg       = pageIdx;
  _panelIdx = -1;
  _typing   = false;
  _clearTypeTimer();

  const counter = document.getElementById("introPageCounter");
  if (counter) counter.textContent = `${pageIdx + 1} / ${PAGES.length}`;

  const container = document.getElementById("comicPage");
  if (!container) return;

  container.className = `comic-page comic-layout-${page.layout}`;
  container.innerHTML = "";

  page.panels.forEach((panel, i) => container.appendChild(_buildPanel(panel, i)));

  if (page.music) { try { playMusic(page.music); } catch(e) {} }

  _setBtn("skip");
  setTimeout(() => _revealNext(), 260);
}

function _buildPanel(panel, idx) {
  const el = document.createElement("div");
  el.className = "comic-panel pending";
  el.dataset.pi = idx;

  const vis = document.createElement("div");
  vis.className = `cp-visual ${panel.visual}`;

  if (panel.img) {
    const img = document.createElement("img");
    img.src     = panel.img;
    img.alt     = "";
    img.loading = "lazy";
    img.className = "cp-img";
    vis.appendChild(img);
    // Viñeta para suavizar la imagen y resaltar la leyenda
    const vig = document.createElement("div");
    vig.className = "cp-vignette";
    vis.appendChild(vig);
  }

  // Panel especial: ASTERION — letras animadas desde distintas direcciones
  if (panel.visual === "ipv-name") {
    const wrap = document.createElement("div");
    wrap.className = "ipv-name-letters";
    "ASTERION".split("").forEach(ch => {
      const span = document.createElement("span");
      span.className = "name-letter";
      span.textContent = ch;
      wrap.appendChild(span);
    });
    vis.appendChild(wrap);
    // Después de que entren, activa pulso continuo
    setTimeout(() => {
      wrap.querySelectorAll(".name-letter").forEach(s => {
        s.classList.add("pulsing");
        s.style.animationDelay = `${Math.random() * 0.8}s`;
      });
    }, 2200);
  }

  el.appendChild(vis);

  if (panel.isTitle) {
    const ov = document.createElement("div");
    ov.className = "cp-title-overlay";
    ov.innerHTML =
      `<div class="intro-logo">PIXEL QUEST ECHOES</div>` +
      `<div class="intro-subtitle">El Último Sueño del Dragón</div>`;
    el.appendChild(ov);
  }

  if (panel.caption) {
    const cap = document.createElement("div");
    cap.className = "cp-caption";
    const txt = document.createElement("p");
    txt.className = "cp-caption-text";
    cap.appendChild(txt);
    el.appendChild(cap);
  }

  return el;
}

// ── Revelar siguiente panel ───────────────────────────────────
function _revealNext() {
  const page = PAGES[_pg];
  _panelIdx++;

  if (_panelIdx >= page.panels.length) {
    _setBtn(_pg >= PAGES.length - 1 ? "start" : "next-page");
    return;
  }

  const panel   = page.panels[_panelIdx];
  const panelEl = document.querySelector(`.comic-panel[data-pi="${_panelIdx}"]`);
  if (!panelEl) return;

  panelEl.classList.remove("pending");
  panelEl.classList.add("revealing");
  setTimeout(() => {
    panelEl.classList.remove("revealing");
    panelEl.classList.add("revealed");
  }, 440);

  if (panel.caption) {
    _setBtn("skip");
    _typing = true;
    const txt = panelEl.querySelector(".cp-caption-text");
    _typeText(txt, panel.caption, () => {
      _typing = false;
      const isLastPanel = _panelIdx >= page.panels.length - 1;
      const isLastPage  = _pg >= PAGES.length - 1;
      if (isLastPanel && isLastPage) _setBtn("start");
      else if (isLastPanel)          _setBtn("next-page");
      else                           _setBtn("next");
    });
  } else {
    // Panel de título: sin caption, auto-continúa tras pausa
    setTimeout(() => _revealNext(), 900);
  }
}

// ── Manejador del botón principal ────────────────────────────
function _onNext() {
  if (_typing) { _skipTypewriter(); return; }

  const page       = PAGES[_pg];
  const allShown   = _panelIdx >= page.panels.length - 1;
  const isLastPage = _pg >= PAGES.length - 1;

  if (!allShown)   { _revealNext();               return; }
  if (isLastPage)  { _finish();                   return; }

  _transitionToPage(_pg + 1);
}

// ── Transición entre páginas ──────────────────────────────────
function _transitionToPage(nextIdx) {
  const container = document.getElementById("comicPage");
  const flash     = document.getElementById("introFlash");

  if (container) {
    container.style.opacity    = "0";
    container.style.transition = "opacity 0.25s ease";
  }
  if (flash) {
    flash.style.opacity = "0.65";
    setTimeout(() => { flash.style.opacity = "0"; }, 140);
  }

  setTimeout(() => {
    if (container) {
      container.style.opacity    = "";
      container.style.transition = "";
    }
    _loadPage(nextIdx);
    // Aplica la animación de entrada DESPUÉS de que _loadPage renderice el contenido
    if (container) {
      void container.offsetWidth; // fuerza reflow
      container.style.animation = "page-enter 0.35s cubic-bezier(0.2,0,0.2,1) forwards";
      setTimeout(() => { container.style.animation = ""; }, 380);
    }
  }, 280);
}

// ── Typewriter ────────────────────────────────────────────────
function _typeText(el, text, onDone) {
  if (!el) { onDone?.(); return; }
  el.textContent = "";
  let i = 0;
  _clearTypeTimer();
  _typeTimer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) { _clearTypeTimer(); onDone?.(); }
  }, TYPEWRITER_MS);
}

function _skipTypewriter() {
  _clearTypeTimer();
  _typing = false;

  const panel   = PAGES[_pg].panels[_panelIdx];
  const panelEl = document.querySelector(`.comic-panel[data-pi="${_panelIdx}"]`);
  const txt     = panelEl?.querySelector(".cp-caption-text");
  if (txt && panel?.caption) txt.textContent = panel.caption;

  const isLastPanel = _panelIdx >= PAGES[_pg].panels.length - 1;
  const isLastPage  = _pg >= PAGES.length - 1;
  if (isLastPanel && isLastPage) _setBtn("start");
  else if (isLastPanel)          _setBtn("next-page");
  else                           _setBtn("next");
}

function _clearTypeTimer() {
  if (_typeTimer) { clearInterval(_typeTimer); _typeTimer = null; }
}

// ── Estado del botón ──────────────────────────────────────────
function _setBtn(state) {
  const next  = document.getElementById("introNextBtn");
  const start = document.getElementById("introStartBtn");

  const cfg = {
    skip:       ["Saltar texto",        true,  false],
    next:       ["Continuar →",         false, false],
    "next-page":["Siguiente página →",  false, false],
    start:      [null,                  false, true ]
  };
  const [label, dim, showStart] = cfg[state] ?? ["Continuar →", false, false];

  if (next) {
    next.style.display = showStart ? "none" : "inline-flex";
    if (label) next.textContent = label;
    next.classList.toggle("intro-btn-dim", !!dim);
  }
  if (start) {
    start.style.display = showStart ? "inline-flex" : "none";
  }
}

// ── Salida ────────────────────────────────────────────────────
function _finish() {
  _clearTypeTimer();
  sessionStorage.setItem("introSeen", "1");
  const screen = document.getElementById("introScreen");
  if (screen) screen.classList.add("hidden");
  try { playMusic("none"); } catch(e) {}
  _onFinish?.();
}
