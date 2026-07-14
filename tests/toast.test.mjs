// Regression: toast.js — el toast de logro mostraba [object Object] para
// title/desc bilingües (encontrado en QA manual de los primeros 10 minutos,
// 2026-07-14). achToastMarkup nunca localizaba esos campos.
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { setLocale } from "../js/i18n.js";
import { achToastMarkup } from "../js/toast.js";

const ACH = {
  id: "first_kill", icon: "⚔️", rarity: "common",
  title: { en: "First Blood", es: "Primer Golpe" },
  desc: { en: "Defeat your first enemy.", es: "Derrota tu primer enemigo." }
};

test("achToastMarkup localiza title/desc en español (no [object Object])", () => {
  setLocale("es");
  const { html } = achToastMarkup(ACH);
  assert.ok(html.includes("Primer Golpe"), "título localizado ES presente");
  assert.ok(html.includes("Derrota tu primer enemigo."), "descripción localizada ES presente");
  assert.ok(!html.includes("[object Object]"), "sin [object Object] en el toast");
});

test("achToastMarkup localiza title/desc en inglés", () => {
  setLocale("en");
  const { html } = achToastMarkup(ACH);
  assert.ok(html.includes("First Blood"), "título localizado EN presente");
  assert.ok(html.includes("Defeat your first enemy."), "descripción localizada EN presente");
  assert.ok(!html.includes("[object Object]"), "sin [object Object] en el toast");
  setLocale("es");
});

test("achToastMarkup: los 14 logros reales del juego nunca producen [object Object]", async () => {
  const { ACHIEVEMENTS } = await import("../js/achievements.js");
  assert.ok(ACHIEVEMENTS.length >= 14, `esperaba ~14+ logros, hay ${ACHIEVEMENTS.length}`);
  for (const locale of ["es", "en"]) {
    setLocale(locale);
    for (const ach of ACHIEVEMENTS) {
      const { html } = achToastMarkup(ach);
      assert.ok(!html.includes("[object Object]"), `${ach.id} (${locale}) sin [object Object]`);
    }
  }
  setLocale("es");
});
