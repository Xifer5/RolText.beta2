// ══════════════════════════════════════════════════════
//  TIME OF DAY — Sistema de día/noche
//  SPEC-0701
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";

// ── Reglas por enemigo ──────────────────────────────────
// nightOnly: solo aparece de noche
// dayOnly:   solo aparece de día
// nightBonus: { attack, defense } multiplicadores adicionales de noche
// dayBonus:  { attack, defense } multiplicadores adicionales de día
// dayPenalty: reducción de ataque de día (0–1)
const ENEMY_TIME_DATA = {
  // Muertos vivientes — exclusivamente nocturnos
  vampire:           { nightOnly: true },
  zombie:            { nightOnly: true },
  squeletor:         { nightOnly: true },
  imp:               { nightOnly: true },
  diablo:            { nightOnly: true },

  // Más poderosos de noche, debilitados de día
  warlock:           { nightBonus: { attack: 0.30, defense: 0.20 }, dayPenalty: 0.35 },
  dark_knight:       { nightBonus: { attack: 0.25, defense: 0.15 }, dayPenalty: 0.20 },
  cultist:           { nightBonus: { attack: 0.15 }, dayPenalty: 0.10 },
  cave_bat:          { nightBonus: { attack: 0.20, defense: 0.15 } },
  wolf:              { nightBonus: { attack: 0.20 } },
  drider:            { nightBonus: { attack: 0.15, defense: 0.10 } },
  linchorn:          { nightBonus: { attack: 0.20 } },
  dragon_king:       { nightBonus: { attack: 0.20 } },

  // Más poderosos de día (calor, luz)
  lava_golem:        { dayBonus: { attack: 0.20 } },
  pyro_elemental:    { dayBonus: { attack: 0.25 } },
  Inferno_elemental: { dayBonus: { attack: 0.20 } },
  inferno_dragon:    { dayBonus: { attack: 0.15 } },
  genie:             { dayOnly: false, dayBonus: { attack: 0.15, defense: 0.10 } },
  pegasus:           { dayBonus: { attack: 0.20, defense: 0.15 } },
};

// ── Modificadores de tipo de daño por hora ──────────────
// De noche: la oscuridad amplifica el daño oscuro/maldito
// De día: la luz sagrada y el fuego solar son más potentes
const TIME_DAMAGE_MULTS = {
  night: { dark: 1.30, cursed: 1.25, poison_dmg: 1.15, holy: 0.80, light: 0.80, fire: 0.90 },
  day:   { holy: 1.25, light: 1.20, fire: 1.10, dark: 0.80, cursed: 0.80 }
};

// ── API pública ─────────────────────────────────────────

export function isNight() {
  return gameState.timeOfDay === "night";
}

export function getTimeLabel() {
  return isNight() ? "🌙 Noche" : "☀️ Día";
}

// Avanza el tiempo y sincroniza el tema visual.
// El caller debe llamar updateUI() después si necesita refrescar el HUD.
export function advanceTime() {
  gameState.timeOfDay = isNight() ? "day" : "night";
  syncThemeToTime();
  window.dispatchEvent(new Event("pixel:timeChanged"));
  return gameState.timeOfDay;
}

// Sincroniza data-theme del documento al estado actual de gameState.timeOfDay
export function syncThemeToTime() {
  const theme = isNight() ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pqe-theme", theme);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.textContent = isNight() ? "🌙" : "☀️";
}

// Conecta el botón de tema para que también actualice gameState.
// Llamar una sola vez desde setupUIListeners().
export function setupThemeToggle() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn || btn.dataset.timewired) return;
  btn.dataset.timewired = "1";
  // El inline script ya cambió data-theme visualmente.
  // Aquí sincronizamos gameState y disparamos el evento.
  btn.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme;
    gameState.timeOfDay = theme === "dark" ? "night" : "day";
    window.dispatchEvent(new Event("pixel:timeChanged"));
  });
  // Sync inicial desde el tema guardado
  const stored = localStorage.getItem("pqe-theme") || "dark";
  gameState.timeOfDay = stored === "dark" ? "night" : "day";
}

// ¿Puede aparecer este enemigo en la hora actual?
export function isEnemyAvailable(enemyId) {
  const data = ENEMY_TIME_DATA[enemyId];
  if (!data) return true;
  if (data.nightOnly && !isNight()) return false;
  if (data.dayOnly  &&  isNight()) return false;
  return true;
}

// Aplica modificadores de tiempo al ataque/defensa base del enemigo.
export function applyTimeModifiers(enemyId, baseAttack, baseDefense) {
  const data = ENEMY_TIME_DATA[enemyId];
  if (!data) return { attack: baseAttack, defense: baseDefense };

  let atkMult = 1.0;
  let defMult = 1.0;

  if (isNight()) {
    atkMult += (data.nightBonus?.attack  || 0);
    defMult += (data.nightBonus?.defense || 0);
  } else {
    atkMult += (data.dayBonus?.attack  || 0);
    defMult += (data.dayBonus?.defense || 0);
    atkMult -= (data.dayPenalty || 0);
  }

  return {
    attack:  Math.max(1, Math.floor(baseAttack  * Math.max(0.1, atkMult))),
    defense: Math.max(0, Math.floor(baseDefense * Math.max(0.1, defMult)))
  };
}

// Multiplicador adicional por tipo de daño según la hora
export function getTimeDamageMultiplier(damageType) {
  const table = isNight() ? TIME_DAMAGE_MULTS.night : TIME_DAMAGE_MULTS.day;
  return table[damageType] ?? 1.0;
}

// Mensaje narrativo al cambiar de hora
export function getTimeTransitionMessage(newTime) {
  return newTime === "night"
    ? "🌙 El sol se pone. La oscuridad envuelve el mundo... Los no-muertos despiertan."
    : "☀️ Amanece. La luz del sol disipa las sombras. Un nuevo día comienza.";
}
