// SPEC-1227 — buildShopCompare() solo miraba ATK/DEF/MAG y devolvía null
// (sin renderizar NADA) cuando esos 3 daban delta 0 -- ej. un jugador sin
// nada equipado probando un ítem que solo aporta HP/MP máx, o cualquier
// ítem con nada equipado en esa ranura. El jugador pedía: aunque no haya
// nada equipado, debe verse igual lo que el ítem otorga y en qué stat.
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { buildShopCompare } from "../js/shop.js";

// domStub.mjs's createElement() da elementos con appendChild/querySelectorAll
// stubeados como no-ops (no guardan hijos de verdad) -- suficiente para el
// resto del repo, que solo llama a estas funciones sin inspeccionar el
// resultado, pero acá SÍ necesitamos leer los chips que buildShopCompare()
// arma. Override local mínimo con un DOM-en-memoria real.
function makeRealElement(tag) {
  return {
    tagName: tag, className: "", textContent: "", children: [],
    appendChild(child) { this.children.push(child); return child; },
    querySelectorAll(sel) {
      const cls = sel.replace(".", "");
      return this.children.filter(c => (c.className || "").split(" ").includes(cls));
    },
  };
}
document.createElement = (tag) => makeRealElement(tag);

beforeEach(() => resetState());

function chipTexts(wrap) {
  return wrap.querySelectorAll(".shop-compare-chip").map(c => c.textContent);
}

test("buildShopCompare: sin nada equipado, un ítem con ATK real SÍ muestra comparación (antes no pasaba nada)", () => {
  gameState.equipment = {};
  const sword = { slot: "rightHand", attack: 10 };
  const wrap = buildShopCompare(sword);
  assert.ok(wrap, "debe devolver un elemento, no null");
  const texts = chipTexts(wrap);
  assert.ok(texts.some(t => t.includes("ATK") && t.includes("+10")));
});

test("buildShopCompare: sin nada equipado, un ítem que SOLO aporta HP/MP máx (nada en ATK/DEF/MAG) ya no desaparece", () => {
  gameState.equipment = {};
  const trinket = { slot: "accessory", hpBonus: 20 };
  const wrap = buildShopCompare(trinket);
  assert.ok(wrap, "antes del fix esto devolvía null porque solo miraba ATK/DEF/MAG");
  const texts = chipTexts(wrap);
  assert.ok(texts.some(t => t.includes("HP") && t.includes("+20")));
});

test("buildShopCompare: con un ítem ya equipado, sigue mostrando la comparación normal (no se rompió el caso existente)", () => {
  gameState.equipment = { rightHand: { slot: "rightHand", attack: 5 } };
  const upgrade = { slot: "rightHand", attack: 12 };
  const wrap = buildShopCompare(upgrade);
  assert.ok(wrap);
  const texts = chipTexts(wrap);
  assert.ok(texts.some(t => t.includes("ATK") && t.includes("+7")), "delta debe ser 12-5=+7");
});

test("buildShopCompare: devuelve null solo cuando de verdad no hay ningún cambio en ningún stat", () => {
  gameState.equipment = { rightHand: { slot: "rightHand", attack: 10 } };
  const identical = { slot: "rightHand", attack: 10 };
  assert.equal(buildShopCompare(identical), null);
});
