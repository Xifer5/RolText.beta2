// SPEC-1002 — rasgos de origen: quién eras antes de la aventura.
// Bonos pequeños al crear + un worldFlag que los eventos pueden recordar.

export const ORIGINS = {
  exile: {
    id: "exile",
    emoji: "🏜️",
    color: "#e07b39",
    name: { en: "Exile", es: "Exiliado" },
    description: { en: "You survived alone in the wilds. +2 Agility, +1 Health Potion.", es: "Sobreviviste solo en tierras salvajes. +2 Agilidad, +1 Poción de Salud." },
    bonuses: { agility: 2 },
    startItems: { health_potion: 1 },
    startGold: 0,
    flag: "origin_exile"
  },
  apprentice: {
    id: "apprentice",
    emoji: "📜",
    color: "#5b9bd5",
    name: { en: "Apprentice", es: "Aprendiz" },
    description: { en: "Raised among the tower's books. +2 Intelligence, +1 Mana Potion.", es: "Criado entre los libros de la torre. +2 Inteligencia, +1 Poción de Maná." },
    bonuses: { intelligence: 2 },
    startItems: { mana_potion: 1 },
    startGold: 0,
    flag: "origin_apprentice"
  },
  mercenary: {
    id: "mercenary",
    emoji: "🪙",
    color: "#4caf7d",
    name: { en: "Mercenary", es: "Mercenario" },
    description: { en: "Steel for coin, always paid up front. +2 Strength, +30 gold.", es: "Acero por monedas, siempre por adelantado. +2 Fuerza, +30 oro." },
    bonuses: { strength: 2 },
    startItems: {},
    startGold: 30,
    flag: "origin_mercenary"
  }
};

/** Aplica el origen al estado recién creado (antes de recalcular máximos). */
export function applyOrigin(state, originId) {
  const o = ORIGINS[originId];
  if (!o || !state?.player) return false;
  state.player.origin = originId;
  for (const [stat, v] of Object.entries(o.bonuses)) {
    state.player[stat] = (state.player[stat] || 0) + v;
  }
  for (const [item, n] of Object.entries(o.startItems)) {
    state.inventory[item] = (state.inventory[item] || 0) + n;
  }
  if (o.startGold) state.player.gold = (state.player.gold || 0) + o.startGold;
  (state.worldFlags ??= {})[o.flag] = true;
  return true;
}
