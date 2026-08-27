export const DIFFICULTY_CONFIG = {
  easy: {
    id: "easy",
    name: { en: "Easy", es: "Fácil" },
    emoji: "🌿",
    color: "#4caf7d",
    description: { en: "Explore the story without frustration.", es: "Para explorar la historia sin frustración." },
    hp:   1.0,
    atk:  1.0,
    def:  1.0,
    xpMult:   1.0,
    goldMult: 1.0,
    penalty: null
  },
  adventure: {
    id: "adventure",
    name: { en: "Adventure", es: "Aventura" },
    emoji: "⚔️",
    color: "#5b9bd5",
    description: { en: "The ideal balance. Challenging fights.", es: "El equilibrio ideal. Combates desafiantes." },
    hp:   1.4,
    atk:  1.3,
    def:  1.2,
    xpMult:   1.2,
    goldMult: 1.1,
    penalty: null
  },
  hard: {
    id: "hard",
    name: { en: "Hard", es: "Difícil" },
    emoji: "🔥",
    color: "#e07b39",
    description: { en: "Aggressive enemies, more of them with a random trait. Resistances and potions matter.", es: "Enemigos agresivos, más de ellos con un rasgo aleatorio. Las resistencias y pociones importan." },
    hp:   2.0,
    atk:  1.7,
    def:  1.5,
    xpMult:   1.4,
    goldMult: 1.2,
    penalty: null
  },
  impossible: {
    id: "impossible",
    name: { en: "Impossible", es: "Imposible" },
    emoji: "💀",
    color: "#c94040",
    description: { en: "No mercy: no tactical advice on enemy intents, and even more enemies carry a random trait.", es: "Sin piedad: sin consejo táctico sobre las intenciones enemigas, y todavía más enemigos con rasgo aleatorio." },
    hp:   3.0,
    atk:  2.5,
    def:  2.0,
    xpMult:   1.8,
    goldMult: 1.5,
    penalty: null
  }
};

export function getDifficultyConfig(key) {
  return DIFFICULTY_CONFIG[key] ?? DIFFICULTY_CONFIG.easy;
}

const pct = m => `${m > 1 ? "+" : ""}${Math.round((m - 1) * 100)}%`;

/**
 * Efectos concretos de una dificultad, derivados de sus multiplicadores
 * (única fuente de verdad — el copy de la UI no puede desincronizarse).
 */
export function getDifficultyEffects(cfg) {
  const standard = [cfg.hp, cfg.atk, cfg.def, cfg.xpMult, cfg.goldMult].every(m => m === 1);
  return {
    standard,
    hp:   pct(cfg.hp),
    atk:  pct(cfg.atk),
    def:  pct(cfg.def),
    xp:   pct(cfg.xpMult),
    gold: pct(cfg.goldMult)
  };
}
