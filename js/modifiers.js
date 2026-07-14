// SPEC-1004 — modificadores de partida: retos apilables elegidos al crear
// personaje. Cada uno endurece una dimensión (visión/supervivencia/economía)
// a cambio de +10% XP; la Crónica los recuerda. Funciones puras, testeables sin DOM.

export const MODIFIER_XP_BONUS = 0.1;   // +10% XP por modificador activo
export const CRUEL_ATK_MULT    = 1.15;  // se apila con el mult de dificultad
export const CRUEL_REST_PCT    = 0.5;   // el descanso cura solo la mitad de lo que falta
export const CRUEL_REST_COST   = 10;    // oro por descansar (paga lo que tengas)
export const SCARCE_GOLD_MULT  = 0.5;
export const SCARCE_LOOT_CHANCE = 0.5;  // probabilidad de CONSERVAR cada ítem
export const SCARCE_PRICE_MULT = 1.25;

export const MODIFIERS = {
  fog: {
    id: "fog",
    emoji: "🌫️",
    color: "#8b9dc3",
    name: { en: "Dense Fog", es: "Niebla densa" },
    description: {
      en: "Maps are hidden and enemies never telegraph their next move.",
      es: "Los mapas quedan ocultos y los enemigos nunca telegrafían su próximo movimiento."
    }
  },
  cruel: {
    id: "cruel",
    emoji: "💀",
    color: "#c94040",
    name: { en: "Cruel World", es: "Mundo cruel" },
    description: {
      en: "Resting heals only half and costs 10 gold; enemies hit 15% harder.",
      es: "Descansar cura solo la mitad y cuesta 10 de oro; los enemigos pegan un 15% más."
    }
  },
  scarce: {
    id: "scarce",
    emoji: "🪙",
    color: "#e0b839",
    name: { en: "Scarce Loot", es: "Botín escaso" },
    description: {
      en: "Half the combat gold, drops may be lost, shop prices +25%.",
      es: "La mitad de oro en combate, los drops pueden perderse y la tienda sube +25%."
    }
  }
};

/** Modificadores activos válidos (ignora ids desconocidos y saves sin el campo). */
export function activeModifiers(state) {
  const list = state?.modifiers;
  return Array.isArray(list) ? list.filter(id => MODIFIERS[id]) : [];
}

export function isActive(state, id) {
  return activeModifiers(state).includes(id);
}

/** 1.0 / 1.1 / 1.2 / 1.3 — se apila con el xpMult de dificultad. */
export function modifierXpMult(state) {
  return 1 + MODIFIER_XP_BONUS * activeModifiers(state).length;
}

export function cruelAtkMult(state) {
  return isActive(state, "cruel") ? CRUEL_ATK_MULT : 1;
}

export function scarceGoldMult(state) {
  return isActive(state, "scarce") ? SCARCE_GOLD_MULT : 1;
}

export function isIntentAlwaysHidden(state) {
  return isActive(state, "fog");
}

export function areMapsHidden(state) {
  return isActive(state, "fog");
}

/** Precio de compra efectivo (redondeo hacia arriba con botín escaso). */
export function buyPriceOf(item, state) {
  const price = item?.price ?? 0;
  return isActive(state, "scarce") ? Math.ceil(price * SCARCE_PRICE_MULT) : price;
}

/** Con botín escaso cada ítem tiene 50% de perderse. RNG inyectable para tests. */
export function filterLoot(loot, state, rng = Math.random) {
  if (!Array.isArray(loot)) return [];
  if (!isActive(state, "scarce")) return loot;
  return loot.filter(() => rng() < SCARCE_LOOT_CHANCE);
}

/**
 * Ejecuta el descanso sobre el estado y devuelve lo ocurrido.
 * Normal: cura todo, gratis. Mundo cruel: 50% de lo faltante y cobra
 * min(10, oro) — nunca se bloquea, solo empeora.
 */
export function applyRest(state) {
  const p = state.player;
  const missingHp = Math.max(0, (p.maxHp || 0) - (p.hp || 0));
  const missingMp = Math.max(0, (p.maxMp || 0) - (p.mp || 0));
  const cruel = isActive(state, "cruel");
  if (!cruel) {
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    return { hpGain: missingHp, mpGain: missingMp, goldCost: 0, cruel };
  }
  const hpGain = Math.floor(missingHp * CRUEL_REST_PCT);
  const mpGain = Math.floor(missingMp * CRUEL_REST_PCT);
  const goldCost = Math.min(CRUEL_REST_COST, p.gold || 0);
  p.hp = (p.hp || 0) + hpGain;
  p.mp = (p.mp || 0) + mpGain;
  p.gold = (p.gold || 0) - goldCost;
  return { hpGain, mpGain, goldCost, cruel };
}
