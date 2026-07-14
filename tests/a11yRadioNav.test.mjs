// SPEC-1006 — navegación por flechas en radiogroups (clase/origen/dificultad)
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextRadioIndex } from "../js/a11yRadioNav.js";

test("ArrowRight/ArrowDown avanzan al siguiente índice", () => {
  assert.equal(nextRadioIndex(0, "ArrowRight", 3), 1);
  assert.equal(nextRadioIndex(1, "ArrowDown", 3), 2);
});

test("ArrowLeft/ArrowUp retroceden al índice anterior", () => {
  assert.equal(nextRadioIndex(2, "ArrowLeft", 3), 1);
  assert.equal(nextRadioIndex(1, "ArrowUp", 3), 0);
});

test("wrap: ArrowRight en el último vuelve al primero", () => {
  assert.equal(nextRadioIndex(2, "ArrowRight", 3), 0);
});

test("wrap: ArrowLeft en el primero vuelve al último", () => {
  assert.equal(nextRadioIndex(0, "ArrowLeft", 3), 2);
});

test("teclas no-flecha son no-op (devuelven el índice actual)", () => {
  assert.equal(nextRadioIndex(1, "Enter", 3), 1);
  assert.equal(nextRadioIndex(1, " ", 3), 1);
  assert.equal(nextRadioIndex(1, "Tab", 3), 1);
});

test("length<=0 o 1: no revienta, devuelve el índice sin cambios", () => {
  assert.equal(nextRadioIndex(0, "ArrowRight", 0), 0);
  assert.equal(nextRadioIndex(0, "ArrowRight", 1), 0);
  assert.equal(nextRadioIndex(0, "ArrowLeft", 1), 0);
});
