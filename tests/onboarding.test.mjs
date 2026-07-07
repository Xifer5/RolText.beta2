import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  STEP_IDS, defaultState, parseState, shouldShow, markSeen, resetSeen
} = await import("../js/onboarding.js");

test("hay 6 pasos que cubren los 5 puntos del onboarding", () => {
  assert.deepEqual(STEP_IDS, [
    "welcome_move", "talk_elara", "quest_tracker",
    "first_combat", "first_loot", "rest_save"
  ]);
});

test("defaultState arranca habilitado y sin pasos vistos", () => {
  const st = defaultState();
  assert.equal(st.enabled, true);
  assert.deepEqual(st.seen, {});
});

test("parseState reconstruye un estado válido", () => {
  const st = parseState(JSON.stringify({ enabled: true, seen: { welcome_move: true } }));
  assert.equal(st.enabled, true);
  assert.deepEqual(st.seen, { welcome_move: true });
});

test("parseState preserva enabled=false", () => {
  const st = parseState(JSON.stringify({ enabled: false, seen: {} }));
  assert.equal(st.enabled, false);
});

test("parseState cae al default ante corrupción", () => {
  assert.deepEqual(parseState("{no es json"), defaultState());
  assert.deepEqual(parseState(null), defaultState());
  assert.deepEqual(parseState('"string"'), defaultState());
  assert.deepEqual(parseState(JSON.stringify({ sinSeen: 1 })), defaultState());
});

test("shouldShow: cada paso se muestra una sola vez", () => {
  let st = defaultState();
  for (const id of STEP_IDS) {
    assert.equal(shouldShow(st, id), true, `${id} debe mostrarse la 1ª vez`);
    st = markSeen(st, id);
    assert.equal(shouldShow(st, id), false, `${id} no debe repetirse`);
  }
});

test("shouldShow: pasos desconocidos y estado deshabilitado no muestran nada", () => {
  const st = defaultState();
  assert.equal(shouldShow(st, "paso_inventado"), false);
  assert.equal(shouldShow(null, "welcome_move"), false);
  assert.equal(shouldShow({ enabled: false, seen: {} }, "welcome_move"), false);
});

test("markSeen no muta el estado original", () => {
  const st = defaultState();
  const st2 = markSeen(st, "welcome_move");
  assert.deepEqual(st.seen, {});
  assert.deepEqual(st2.seen, { welcome_move: true });
});

test("resetSeen reactiva y limpia lo visto (secuencia revive)", () => {
  let st = { enabled: false, seen: { welcome_move: true, first_combat: true } };
  st = resetSeen(st);
  assert.equal(st.enabled, true);
  for (const id of STEP_IDS) {
    assert.equal(shouldShow(st, id), true, `${id} debe volver a mostrarse tras reset`);
  }
});
