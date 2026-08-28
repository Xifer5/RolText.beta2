import { playMusic } from "./sounds.js";

// ── Páginas del cómic ────────────────────────────────────────
// Cada página tiene hasta 3 paneles revelados uno a uno.
// img: ruta relativa desde la raíz (null = usa fondo CSS como fallback).
const PAGES = [
  // Página 1 — El Mundo que Cantaba
  {
    layout: "wide-top",
    music: "forest",
    panels: [
      {
        visual: "ipv-stars",
        caption: "En el principio, Aetheria era un mundo joven. Sus bosques cantaban, sus ríos guardaban la luz de las estrellas y la magia corría libre bajo la tierra.",
        img: "img/intro/p1_stars.webp"
      },
      {
        visual: "ipv-guardian",
        caption: "Sobre aquel mundo velaba un dragón. No gobernaba desde un trono ni exigía obediencia. Enseñó a los ríos su camino, entregó la magia a los mortales y protegió cuanto había aprendido a amar.",
        img: "img/intro/p1_guardian.webp"
      },
      {
        visual: "ipv-name",
        caption: "Tuvo un nombre. Uno que fue pronunciado en canciones, juramentos y plegarias. Pero el tiempo pasó... y Aetheria aprendió a olvidarlo.",
        img: "img/intro/p1_name.webp"
      }
    ]
  },
  // Página 2 — El Nombre Borrado
  {
    layout: "tall-left",
    music: "cave",
    panels: [
      {
        visual: "ipv-hourglass",
        caption: "Mil años después, solo quedaron leyendas contradictorias: unas hablaban de un guardián; otras, de un rey terrible que quiso someter el mundo.",
        img: "img/intro/p2_hourglass.webp"
      },
      {
        visual: "ipv-cracks",
        caption: "Sus templos fueron abandonados. Sus estatuas perdieron el rostro. Su nombre desapareció de los libros... como si alguien hubiera querido arrancarlo de la historia.",
        img: "img/intro/p2_cracks.webp"
      },
      {
        visual: "ipv-forest",
        caption: "Pero aquello que el mundo olvida no siempre desaparece. A veces permanece bajo las raíces, esperando. A veces sueña.",
        img: "img/intro/p2_forest.webp"
      }
    ]
  },
  // Página 3 — Las Heridas del Mundo
  {
    layout: "wide-bottom",
    music: "swamp",
    panels: [
      {
        visual: "ipv-volcano",
        caption: "Entonces las montañas despertaron envueltas en fuego. El hielo descendió desde el norte y antiguas ruinas abrieron sus ojos bajo la tierra.",
        img: "img/intro/p3_volcano.webp"
      },
      {
        visual: "ipv-eyes",
        caption: "Criaturas que alguna vez fueron pacíficas comenzaron a atacar. No por hambre. No por crueldad. Huían de algo que solo ellas podían escuchar.",
        img: "img/intro/p3_eyes.webp"
      },
      {
        visual: "ipv-people",
        caption: "Los reinos se acusaron entre sí. Los sabios hablaron de una maldición. Nadie comprendía la verdad. Solo sabían que Aetheria estaba muriendo... y que algo antiguo lloraba bajo sus ruinas.",
        img: "img/intro/p3_people.webp"
      }
    ]
  },
  // Página 4 — La Voz en Oakhaven
  {
    layout: "tall-left",
    music: "forest",
    panels: [
      {
        visual: "ipv-candle",
        caption: "Una noche, durante la Fiesta de las Primeras Nieves, las campanas de Oakhaven sonaron sin que nadie tocara sus cuerdas.",
        img: "img/intro/p4_candle.webp"
      },
      {
        visual: "ipv-scroll",
        caption: "Entre la música y el viento, una sola persona escuchó una voz imposible:\n\n\"Devuélveme... mi nombre.\"",
        img: "img/intro/p4_scroll.webp"
      },
      {
        visual: "ipv-hero",
        caption: "No respondió un rey. Ni un héroe anunciado por las profecías. Respondió alguien sin leyendas a sus espaldas... pero con el valor suficiente para escuchar.",
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
        caption: "Un mundo está olvidando su propia historia.\nUn dragón sueña bajo sus heridas.\n\nAetheria te llama.\n¿Qué elegirás recordar?",
        isLast: true,
        img: null
      }
    ]
  }
];

const TYPEWRITER_MS = 30;
const TOTAL_PANELS  = PAGES.reduce((n, p) => n + p.panels.length, 0);

// En móvil la intro es un slideshow: una viñeta por pantalla
const _isMobileIntro = () => window.matchMedia("(max-width: 599px)").matches;

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

  _updateCounter();

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

  // Panel especial: el nombre borrado — mismas letras animadas de siempre,
  // pero ahora redactadas (▓) en vez de deletrear "ASTERION". El texto de
  // esta página evita nombrar al dragón a propósito (se revela recién en
  // el clímax) — mostrar el nombre completo acá lo arruinaría de entrada.
  // La animación ahora LEE como "un nombre tachado", no como una revelación.
  if (panel.visual === "ipv-name") {
    const wrap = document.createElement("div");
    wrap.className = "ipv-name-letters";
    "▓▓▓▓▓▓▓▓".split("").forEach(ch => {
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

  // Slideshow móvil: solo el panel activo es visible
  const prevActive = document.querySelector(".comic-panel.active");
  if (prevActive && prevActive !== panelEl) prevActive.classList.remove("active");
  panelEl.classList.add("active");
  void panelEl.offsetWidth; // reflow: permite animar la entrada tras display:none
  _updateCounter();

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

// ── Contador: páginas en desktop, viñetas en móvil ────────────
function _updateCounter() {
  const counter = document.getElementById("introPageCounter");
  if (!counter) return;
  if (_isMobileIntro()) {
    const before = PAGES.slice(0, _pg).reduce((n, p) => n + p.panels.length, 0);
    counter.textContent = `${before + Math.max(_panelIdx + 1, 1)} / ${TOTAL_PANELS}`;
  } else {
    counter.textContent = `${_pg + 1} / ${PAGES.length}`;
  }
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
