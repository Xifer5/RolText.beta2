// SPEC-1001 — finales según decisiones
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { MORAL_DECISIONS, computeEndingTone, getEndingContent } = await import("../js/endings.js");
const { dictionaries } = await import("../js/i18n.js");

test("tono: luz con ≥2 buenas, oscuro con ≤−2, gris en medio", () => {
  assert.equal(computeEndingTone({ echo_freed: true, traveler_helped: true }).tone, "light");
  assert.equal(computeEndingTone({ echo_absorbed: true, purse_taken: true }).tone, "dark");
  assert.equal(computeEndingTone({}).tone, "gray");
  assert.equal(computeEndingTone({ echo_freed: true }).tone, "gray");
  // decisiones opuestas se cancelan
  assert.equal(computeEndingTone({ echo_freed: true, traveler_helped: true, purse_taken: true }).tone, "gray");
});

test("una partida bondadosa completa alcanza el final de luz", () => {
  const flags = { echo_freed: true, traveler_helped: true, purse_left: true, shrine_prayed: true };
  const c = getEndingContent(flags);
  assert.equal(c.tone, "light");
  assert.equal(c.score, 4);
  assert.equal(c.titleKey, "endingTitleLight");
  assert.equal(c.recapKeys.length, 4);
});

test("el recap lista exactamente las decisiones tomadas, en orden", () => {
  const c = getEndingContent({ purse_taken: true, echo_absorbed: true });
  assert.deepEqual(c.recapKeys, ["recapEchoAbsorbed", "recapPurseTaken"]);
  assert.equal(c.tone, "dark");
});

test("sin decisiones: recap vacío y tono gris", () => {
  const c = getEndingContent({});
  assert.deepEqual(c.recapKeys, []);
  assert.equal(c.textKey, "endingTextGray");
});

test("flags irrelevantes (mecánicos) no afectan el tono", () => {
  const c = getEndingContent({ echo_intro_done: true, echo_reward_pending: true, merchant_bought: true });
  assert.equal(c.tone, "gray");
  assert.deepEqual(c.recapKeys, []);
});

test("todas las claves de recap y de final existen en EN y ES", () => {
  const keys = [
    ...MORAL_DECISIONS.map(d => d.recapKey),
    "recapNone", "endingDecisionsLabel",
    ...["Light", "Gray", "Dark"].flatMap(t => [`endingTitle${t}`, `endingText${t}`])
  ];
  for (const k of keys) {
    assert.ok(dictionaries.en[k], `${k} en EN`);
    assert.ok(dictionaries.es[k], `${k} en ES`);
  }
});

// SPEC-1219 (Fase 5) — elección real del jugador (finalChoiceId) determina
// el final ESTRUCTURAL en vez del cómputo por tono, sin reemplazarlo: el
// tono sigue ahí para la frase de sabor por clase (classBeatKey).
test("finalChoiceId presente: titleKey/textKey vienen del final estructural, no del tono", () => {
  const flags = { finalChoiceId: "return_memories" };
  const c = getEndingContent(flags);
  assert.equal(c.titleKey, "endingTitleConstellation");
  assert.equal(c.textKey, "endingTextConstellation");
});

test("los 3 finalChoiceId mapean a sus 3 finales estructurales", () => {
  assert.equal(getEndingContent({ finalChoiceId: "return_memories" }).titleKey, "endingTitleConstellation");
  assert.equal(getEndingContent({ finalChoiceId: "take_crown" }).titleKey, "endingTitleGuardian");
  assert.equal(getEndingContent({ finalChoiceId: "destroy_heart" }).titleKey, "endingTitleMortalAge");
});

test("finalChoiceId ausente (ej. derrota): cae al cómputo por tono de siempre", () => {
  const c = getEndingContent({ echo_freed: true, traveler_helped: true });
  assert.equal(c.titleKey, "endingTitleLight");
});

test("finalChoiceId no afecta el tono ni el recap — ambos sistemas conviven", () => {
  const c = getEndingContent({ finalChoiceId: "destroy_heart", echo_absorbed: true, purse_taken: true });
  assert.equal(c.titleKey, "endingTitleMortalAge");
  assert.equal(c.tone, "dark", "el tono se sigue calculando igual, para el classBeatKey");
  assert.deepEqual(c.recapKeys, ["recapEchoAbsorbed", "recapPurseTaken"]);
});

test("las 3 claves de los finales estructurales existen en EN y ES", () => {
  for (const k of ["endingTitleConstellation", "endingTextConstellation", "endingTitleGuardian", "endingTextGuardian", "endingTitleMortalAge", "endingTextMortalAge"]) {
    assert.ok(dictionaries.en[k], `${k} en EN`);
    assert.ok(dictionaries.es[k], `${k} en ES`);
  }
});
