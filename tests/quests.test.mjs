// SPEC-1109 — rumores: objetivos secundarios por partida (roadmap ítem #9)
import "./helpers/domStub.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import { rollRumors, RUMOR_POOL, RUMOR_COUNT, getQuestStatus, QUEST_DATA } from "../js/quests.js";
import { allItems } from "../js/items.js";

beforeEach(() => resetState());

const rngOf = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test("RUMOR_POOL: los 6 ids son misiones secundarias reales, ninguna principal", () => {
  assert.equal(RUMOR_POOL.length, 6);
  for (const id of RUMOR_POOL) {
    assert.ok(QUEST_DATA[id], `${id} no existe en QUEST_DATA`);
    assert.ok(!id.startsWith("mq_"), `${id} es una misión principal, no debería estar en el pool de rumores`);
    assert.equal(QUEST_DATA[id].prerequisiteQuest, undefined, `${id} no debería depender de otra misión`);
  }
});

test("rollRumors activa exactamente RUMOR_COUNT misiones distintas", () => {
  const chosen = rollRumors();
  assert.equal(chosen.length, RUMOR_COUNT);
  assert.equal(new Set(chosen).size, RUMOR_COUNT, "no debe repetir ids");
  for (const id of chosen) {
    assert.equal(getQuestStatus(id), "active");
  }
});

test("rollRumors deja las misiones NO elegidas en 'inactive'", () => {
  const chosen = rollRumors();
  const notChosen = RUMOR_POOL.filter(id => !chosen.includes(id));
  for (const id of notChosen) {
    assert.equal(getQuestStatus(id), "inactive");
  }
});

test("rollRumors con rng determinista elige por índice, sin reemplazo (splice del pool)", () => {
  // idx 0 del pool de 6 → primero; luego idx 0 del pool de 5 restante → segundo; etc.
  const chosen = rollRumors(rngOf(0, 0, 0));
  assert.deepEqual(chosen, RUMOR_POOL.slice(0, 3));
});

test("las misiones principales (mq_*) nunca se activan vía rollRumors", () => {
  rollRumors();
  for (const id of Object.keys(QUEST_DATA)) {
    if (id.startsWith("mq_")) assert.equal(getQuestStatus(id), "inactive");
  }
});

// SPEC-1109: bug real encontrado en vivo — collect_fairy_dust apuntaba a un
// item ("fairy_dust") que nunca existió en allItems, así que la misión
// jamás podía completarse Y el tracker de misiones (ui.js) rompía al
// intentar mostrar su nombre. Guarda de regresión: todo item objetivo de
// una misión "collect" debe existir de verdad.
test("toda misión 'collect' apunta a un ítem que existe en allItems", () => {
  for (const q of Object.values(QUEST_DATA)) {
    if (q.type === "collect") {
      assert.ok(allItems[q.item], `${q.id}: el ítem '${q.item}' no existe en allItems`);
    }
  }
});
