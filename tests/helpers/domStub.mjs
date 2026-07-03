// Stub mínimo de DOM/browser para poder importar los módulos del juego en Node.
// Los módulos solo tocan el DOM dentro de funciones, pero la cadena de imports
// (state → stats → ui → …) necesita que los globals existan al evaluarse.
const noop = () => {};

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

globalThis.window = {
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: noop,
  location: { href: "http://localhost/", search: "" },
  innerWidth: 1280,
  innerHeight: 800,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
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
