// SPEC-0904 — lectura táctica: consejo por intent y por resistencias
import "./helpers/domStub.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { getWeakestResistance, ENEMY_COMBAT_DATA, DAMAGE_TYPES } = await import("../js/damageTypes.js");
const { resistanceAdviceFor } = await import("../js/combat.js");
const { INTENT_ADVICE_KEYS } = await import("../js/ui.js");
const { ACTION_META } = await import("../js/enemyAI.js");
const { dictionaries } = await import("../js/i18n.js");

test("getWeakestResistance: gana el valor más bajo (vulnerabilidad primero)", () => {
  assert.deepEqual(getWeakestResistance({ slash: 30, fire: -20, ice: 10 }), { type: "fire", value: -20 });
  assert.deepEqual(getWeakestResistance({ slash: 30 }), { type: "slash", value: 30 });
  assert.equal(getWeakestResistance({}), null);
  assert.equal(getWeakestResistance(), null);
});

test("resistanceAdviceFor: vulnerable → recomienda el tipo débil concreto", () => {
  // busca en los datos reales un enemigo con resistencia ≥20 Y una vulnerabilidad
  const entry = Object.entries(ENEMY_COMBAT_DATA).find(([, d]) => {
    const r = d.resistances ?? {};
    return Object.values(r).some(v => v >= 20) && Object.values(r).some(v => v < 0);
  });
  assert.ok(entry, "existe al menos un enemigo con resistencia fuerte y vulnerabilidad");
  const [id, data] = entry;
  const resisted = Object.keys(data.resistances).find(t => data.resistances[t] >= 20);
  const advice = resistanceAdviceFor(id, resisted);
  assert.equal(advice.key, "combatResistAdviceVuln");
  assert.ok(advice.params.bad && advice.params.good, `bad/good presentes (${JSON.stringify(advice.params)})`);
});

test("resistanceAdviceFor: resistencia sin vulnerabilidad → consejo genérico", () => {
  const entry = Object.entries(ENEMY_COMBAT_DATA).find(([, d]) => {
    const vals = Object.values(d.resistances ?? {});
    return vals.some(v => v >= 20) && vals.every(v => v >= 0);
  });
  assert.ok(entry, "existe al menos un enemigo resistente sin vulnerabilidades");
  const [id, data] = entry;
  const resisted = Object.keys(data.resistances).find(t => data.resistances[t] >= 20);
  assert.equal(resistanceAdviceFor(id, resisted).key, "combatResistAdvice");
});

test("resistanceAdviceFor: sin resistencia relevante → null", () => {
  assert.equal(resistanceAdviceFor("wolf", "slash"), null);      // wolf no resiste slash
  assert.equal(resistanceAdviceFor("no_existe", "slash"), null);
});

test("INTENT_ADVICE_KEYS: acciones válidas y claves i18n en EN y ES", () => {
  for (const [action, key] of Object.entries(INTENT_ADVICE_KEYS)) {
    assert.ok(ACTION_META[action], `${action} es una acción conocida`);
    assert.ok(dictionaries.en[key], `${key} en EN`);
    assert.ok(dictionaries.es[key], `${key} en ES`);
  }
  // attack normal y status no aconsejan (ruido); unknown jamás (jefe oculto)
  assert.ok(!INTENT_ADVICE_KEYS.attack && !INTENT_ADVICE_KEYS.unknown);
});

test("los tipos de daño de los consejos tienen etiqueta legible", () => {
  for (const d of Object.values(ENEMY_COMBAT_DATA)) {
    for (const type of Object.keys(d.resistances ?? {})) {
      assert.ok(DAMAGE_TYPES[type], `tipo ${type} con etiqueta`);
    }
  }
});
