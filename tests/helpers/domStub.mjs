// Stub mínimo de DOM/browser para poder importar los módulos del juego en Node.
// Los módulos solo tocan el DOM dentro de funciones, pero la cadena de imports
// (state → stats → ui → …) necesita que los globals existan al evaluarse.
const noop = () => {};

// Código como toast.js agenda setTimeout de varios segundos (duración real de
// UI) que no importan en un test — pero por default mantienen vivo el proceso
// de `node --test` hasta que disparan, sumando segundos muertos a la suite.
// unref() no cambia el delay ni cancela nada: solo le dice a Node que no
// cuente ese timer para decidir si el proceso sigue vivo.
const _origSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...args) => {
  const id = _origSetTimeout(fn, ms, ...args);
  id?.unref?.();
  return id;
};

function makeElement() {
  return {
    style: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    dataset: {},
    textContent: "",
    innerHTML: "",
    value: "",
    disabled: false,
    addEventListener: noop,
    removeEventListener: noop,
    appendChild: noop,
    prepend: noop,
    remove: noop,
    replaceWith: noop,
    cloneNode: () => makeElement(),
    setAttribute: noop,
    getAttribute: () => null,
    removeAttribute: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    focus: noop,
    click: noop,
    scrollIntoView: noop,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
  };
}

globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: makeElement,
  createTextNode: () => ({}),
  addEventListener: noop,
  removeEventListener: noop,
  body: makeElement(),
  head: makeElement(),
  documentElement: makeElement(),
  activeElement: null,
};

// Global "pelado", no solo window.*: varios módulos (ej. toast.js) llaman
// requestAnimationFrame(...) directo sin el prefijo window. — sin esto,
// cualquier código que dispare un toast durante un test revienta con
// "requestAnimationFrame is not defined" (encontrado real al testear
// increaseStat(), que ahora muestra un toast de diff de stats — SPEC-1209).
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

globalThis.window = {
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: noop,
  location: { href: "http://localhost/", search: "" },
  innerWidth: 1280,
  innerHeight: 800,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  requestAnimationFrame: globalThis.requestAnimationFrame,
  setTimeout,
  clearTimeout,
};

globalThis.localStorage = {
  _store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; },
};

globalThis.Audio = class { constructor() { this.volume = 1; } play() { return Promise.resolve(); } pause() {} load() {} };
globalThis.AudioContext = class { constructor() { this.destination = {}; } createGain() { return { connect: noop, gain: { value: 1 } }; } createOscillator() { return { connect: noop, start: noop, stop: noop, frequency: { value: 0 }, type: "" }; } resume() { return Promise.resolve(); } };
if (!("navigator" in globalThis)) globalThis.navigator = { userAgent: "node-test" };
