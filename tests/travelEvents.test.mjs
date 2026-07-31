import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { gameState, resetState } from "../js/state.js";
import {
  TRAVEL_EVENTS, eligibleEvents, getTravelEvent, eventChance,
  COOLDOWN_STEPS, BASE_CHANCE, MAX_CHANCE, RECENT_MEMORY
} from "../js/travelEvents.js";

const ev = id => TRAVEL_EVENTS.find(e => e.id === id);
const choose = (id, i) => ev(id).choices[i].apply();
const ids = pool => pool.map(e => e.id);

beforeEach(() => resetState());

test("viajero: ambas ramas marcan su flag", () => {
  choose("stray_traveler", 0);
  assert.equal(gameState.worldFlags.traveler_helped, true);
  resetState();
  choose("stray_traveler", 1);
  assert.equal(gameState.worldFlags.traveler_ignored, true);
});

test("bolsa: ambas ramas marcan su flag", () => {
  choose("lost_coin_purse", 0);
  assert.equal(gameState.worldFlags.purse_taken, true);
  resetState();
  choose("lost_coin_purse", 1);
  assert.equal(gameState.worldFlags.purse_left, true);
});

test("santuario: orar marca flag, ignorar no", () => {
  choose("old_shrine", 1);
  assert.equal(gameState.worldFlags.shrine_prayed, undefined);
  choose("old_shrine", 0);
  assert.equal(gameState.worldFlags.shrine_prayed, true);
});

test("mercader: solo marca flag si la compra se completa", () => {
  gameState.player.gold = 5;
  choose("suspicious_merchant", 0);
  assert.equal(gameState.worldFlags.merchant_bought, undefined);
  gameState.player.gold = 10;
  choose("suspicious_merchant", 0);
  assert.equal(gameState.worldFlags.merchant_bought, true);
  assert.equal(gameState.player.gold, 2);
});

// SPEC-1107: eventos con riesgo dependiente de clase/origen/stats
function withRandom(value, fn) {
  const orig = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = orig; }
}

test("luz entre los árboles: mago o INT≥12 siempre segura, el resto arriesga daño con RNG baja", () => {
  gameState.player.class = "mage";
  gameState.player.intelligence = 5;
  gameState.player.mp = 0; // deja espacio para ver el +15 MP de la rama segura
  withRandom(0.99, () => choose("light_among_trees", 0)); // aunque el roll "falle", mago es siempre seguro
  assert.ok(gameState.player.mp > 0, "mago siempre gana MP, nunca pierde HP");

  resetState();
  gameState.player.class = "warrior";
  gameState.player.intelligence = 5;
  const hpBefore = gameState.player.hp;
  withRandom(0.99, () => choose("light_among_trees", 0)); // sin calzar clase/stat y RNG alta → falla
  assert.ok(gameState.player.hp < hpBefore, "sin mago/INT alta, RNG alta dispara el daño");
});

test("puente roto: pícaro o AGI≥12 siempre seguro, el resto arriesga caída con RNG baja", () => {
  gameState.player.class = "rogue";
  gameState.player.agility = 5;
  const hpBefore = gameState.player.hp;
  withRandom(0.99, () => choose("broken_bridge", 0));
  assert.equal(gameState.player.hp, hpBefore, "pícaro nunca pierde HP al cruzar");

  resetState();
  gameState.player.class = "mage";
  gameState.player.agility = 5;
  const hpBefore2 = gameState.player.hp;
  withRandom(0.99, () => choose("broken_bridge", 0));
  assert.ok(gameState.player.hp < hpBefore2, "sin pícaro/AGI alta, RNG alta dispara la caída");
});

test("altar antiguo: origen aprendiz o INT≥12 siempre seguro", () => {
  gameState.worldFlags = { origin_apprentice: true };
  gameState.player.intelligence = 5;
  const hpBefore = gameState.player.hp;
  withRandom(0.99, () => choose("ancient_altar", 0));
  assert.equal(gameState.player.hp, hpBefore, "origen aprendiz nunca activa la salvaguarda");

  resetState();
  gameState.worldFlags = {};
  gameState.player.intelligence = 5;
  const hpBefore2 = gameState.player.hp;
  withRandom(0.99, () => choose("ancient_altar", 0));
  assert.ok(gameState.player.hp < hpBefore2, "sin origen/INT alta, RNG alta activa la salvaguarda");
});

test("enemigo herido: rematar marca flag oscuro; dejarlo ir marca flag de luz SIEMPRE, incluso si sale mal", () => {
  choose("wounded_enemy", 0);
  assert.equal(gameState.worldFlags.wounded_enemy_killed, true);

  resetState();
  gameState.player.class = "mage"; // no calza guerrero/fuerza → puede arriesgar
  gameState.player.strength = 5;
  const hpBefore = gameState.player.hp;
  withRandom(0.99, () => choose("wounded_enemy", 1)); // RNG alta → sale mal
  assert.equal(gameState.worldFlags.wounded_enemy_spared, true, "el flag de compasión se marca aunque el roll salga mal");
  assert.ok(gameState.player.hp < hpBefore, "pero SÍ se recibe el daño del zarpazo");
});

test("sin flags no hay follow-ups elegibles", () => {
  const pool = eligibleEvents("forest");
  assert.ok(pool.length > 0);
  assert.ok(pool.every(e => !e.followUp));
});

test("follow-up elegible tiene prioridad absoluta sobre eventos normales", () => {
  gameState.worldFlags = { shrine_prayed: true };
  assert.deepEqual(ids(eligibleEvents("forest")), ["shrine_gratitude"]);
  // resuelto → el pool vuelve a los eventos normales
  gameState.worldFlags.shrine_resolved = true;
  assert.ok(eligibleEvents("forest").every(e => !e.followUp));
});

test("follow-up resuelto no vuelve jamás", () => {
  gameState.worldFlags = { traveler_helped: true };
  assert.ok(ids(eligibleEvents(null)).includes("traveler_grateful"));
  const goldBefore = gameState.player.gold;
  choose("traveler_grateful", 0);
  assert.equal(gameState.worldFlags.traveler_resolved, true);
  assert.equal(gameState.player.gold, goldBefore + 40);
  assert.equal(gameState.inventory.health_potion, 1);
  assert.ok(eligibleEvents(null).every(e => !e.followUp));
});

test("las dos ramas del viajero comparten resolución (solo un segundo acto)", () => {
  gameState.worldFlags = { traveler_helped: true, traveler_ignored: true };
  choose("traveler_grave", 0);
  assert.ok(!ids(eligibleEvents(null)).includes("traveler_grateful"));
  assert.ok(!ids(eligibleEvents(null)).includes("traveler_grave"));
});

test("granjero: devolver el oro cuesta 25 y da 50 XP", () => {
  gameState.worldFlags = { purse_taken: true };
  gameState.player.gold = 30;
  const xpBefore = gameState.player.experience;
  choose("farmer_searching", 0);
  assert.equal(gameState.player.gold, 5);
  assert.equal(gameState.player.experience, xpBefore + 50);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("granjero: sin oro para devolver, resuelve igualmente con confesión", () => {
  gameState.worldFlags = { purse_taken: true };
  gameState.player.gold = 10;
  choose("farmer_searching", 0);
  assert.equal(gameState.player.gold, 10);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("granjero agradecido: honradez pagada con 30 oro", () => {
  gameState.worldFlags = { purse_left: true };
  const goldBefore = gameState.player.gold;
  choose("farmer_grateful", 0);
  assert.equal(gameState.player.gold, goldBefore + 30);
  assert.equal(gameState.worldFlags.purse_resolved, true);
});

test("mercader regresa: sin oro suficiente NO se resuelve y volverá", () => {
  gameState.worldFlags = { merchant_bought: true };
  gameState.player.gold = 5;
  choose("merchant_returns", 0);
  assert.ok(!gameState.worldFlags.merchant_resolved);
  assert.ok(ids(eligibleEvents(null)).includes("merchant_returns"));
  gameState.player.gold = 20;
  choose("merchant_returns", 0);
  assert.equal(gameState.worldFlags.merchant_resolved, true);
  assert.equal(gameState.player.gold, 5);
  assert.equal(gameState.inventory.greater_elixir, 1);
});

test("bendición: +5 maxHp permanente que sobrevive guardar/cargar", () => {
  gameState.worldFlags = { shrine_prayed: true };
  const maxBefore = gameState.player.maxHp;
  choose("shrine_gratitude", 0);
  assert.equal(gameState.player.maxHp, maxBefore + 5);
  // roundtrip de save: saveGame serializa gameState completo como JSON
  const loaded = JSON.parse(JSON.stringify(gameState));
  assert.equal(loaded.player.maxHp, maxBefore + 5);
  assert.equal(loaded.worldFlags.shrine_resolved, true);
});

test("save antiguo sin worldFlags: los apply lo crean y la cadena funciona", () => {
  delete gameState.worldFlags;
  assert.ok(eligibleEvents("forest").every(e => !e.followUp));
  choose("lost_coin_purse", 1);
  assert.equal(gameState.worldFlags.purse_left, true);
  assert.ok(ids(eligibleEvents(null)).includes("farmer_grateful"));
});

test("los follow-ups respetan el filtro de bioma universal (biomes null)", () => {
  gameState.worldFlags = { merchant_bought: true };
  for (const biome of ["forest", "desert", "tundra", null]) {
    assert.deepEqual(ids(eligibleEvents(biome)), ["merchant_returns"]);
  }
});

// ── SPEC-0804 — pacing: cooldown + pity timer + anti-repetición ──

// RNG determinista en secuencia
const rngOf = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test("curva: 0% en cooldown, 10% en el paso 4, tope 35% desde el 9", () => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);
  for (let s = 1; s <= COOLDOWN_STEPS; s++) assert.equal(eventChance(s), 0);
  close(eventChance(4), BASE_CHANCE);
  close(eventChance(5), 0.15);
  close(eventChance(8), 0.30);
  close(eventChance(9), MAX_CHANCE);
  close(eventChance(50), MAX_CHANCE);
});

test("durante el cooldown jamás sale evento, ni con rng=0", () => {
  resetState();
  for (let i = 0; i < COOLDOWN_STEPS; i++) {
    assert.equal(getTravelEvent("forest", rngOf(0)), null);
  }
  // paso 4: con rng=0 (< 10%) ya puede salir
  assert.notEqual(getTravelEvent("forest", rngOf(0)), null);
});

test("tras disparar: contador a 0, ID en recientes, y cooldown de nuevo", () => {
  resetState();
  gameState.travelPacing.steps = 10;
  const ev = getTravelEvent("forest", rngOf(0));
  assert.ok(ev);
  assert.equal(gameState.travelPacing.steps, 0);
  assert.deepEqual(gameState.travelPacing.recent, [ev.id]);
  for (let i = 0; i < COOLDOWN_STEPS; i++) {
    assert.equal(getTravelEvent("forest", rngOf(0)), null);
  }
});

test("anti-repetición: un evento reciente no vuelve a salir si hay alternativas", () => {
  resetState();
  for (let round = 0; round < 6; round++) {
    gameState.travelPacing.steps = 20;
    const before = [...gameState.travelPacing.recent];
    const ev = getTravelEvent("forest", rngOf(0)); // rng 0 elige siempre el índice 0
    assert.ok(ev, `ronda ${round}: salió evento`);
    assert.ok(!before.includes(ev.id), `ronda ${round}: ${ev.id} no estaba en recientes`);
  }
  assert.equal(gameState.travelPacing.recent.length, RECENT_MEMORY);
});

test("anti-repetición: si el filtro vacía el pool, cae al pool completo", () => {
  resetState();
  // fuerza recientes = TODOS los ids elegibles del bioma
  gameState.travelPacing.recent = eligibleEvents("forest").map(e => e.id);
  gameState.travelPacing.steps = 20;
  // RECENT_MEMORY normalmente lo impide, pero el fallback debe cubrirlo igual
  const ev = getTravelEvent("forest", rngOf(0));
  assert.ok(ev, "sale evento aunque todos estén en recientes");
});

test("follow-ups: exentos de anti-repetición pero sujetos a cooldown", () => {
  resetState();
  gameState.worldFlags = { merchant_bought: true };
  gameState.travelPacing.steps = 10;
  const first = getTravelEvent(null, rngOf(0));
  assert.equal(first?.id, "merchant_returns");
  // sin resolver: en cooldown no vuelve...
  assert.equal(getTravelEvent(null, rngOf(0)), null);
  // ...pero pasado el cooldown vuelve aunque esté en recientes
  gameState.travelPacing.steps = 10;
  assert.equal(getTravelEvent(null, rngOf(0))?.id, "merchant_returns");
});

test("save antiguo sin travelPacing: se crea solo y el roundtrip lo conserva", () => {
  resetState();
  delete gameState.travelPacing;
  assert.equal(getTravelEvent("forest", rngOf(0.99)), null); // paso 1: cooldown
  assert.equal(gameState.travelPacing.steps, 1);
  const loaded = JSON.parse(JSON.stringify(gameState));
  assert.deepEqual(loaded.travelPacing, { steps: 1, recent: [] });
});
