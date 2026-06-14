export const DIFFICULTY_CONFIG = {
  easy: {
    id: "easy",
    name: "Fácil",
    emoji: "🌿",
    color: "#4caf7d",
    description: "Para explorar la historia sin frustración.",
    hp:   1.0,
    atk:  1.0,
    def:  1.0,
    xpMult:   1.0,
    goldMult: 1.0,
    penalty: null
  },
  adventure: {
    id: "adventure",
    name: "Aventura",
    emoji: "⚔️",
    color: "#5b9bd5",
    description: "El equilibrio ideal. Combates desafiantes.",
    hp:   1.4,
    atk:  1.3,
    def:  1.2,
    xpMult:   1.2,
    goldMult: 1.1,
    penalty: null
  },
  hard: {
    id: "hard",
    name: "Difícil",
    emoji: "🔥",
    color: "#e07b39",
    description: "Enemigos agresivos. Cada batalla importa.",
    hp:   2.0,
    atk:  1.7,
    def:  1.5,
    xpMult:   1.4,
    goldMult: 1.2,
    penalty: null
  },
  impossible: {
    id: "impossible",
    name: "Imposible",
    emoji: "💀",
    color: "#c94040",
    description: "Sin piedad. Solo para los más valientes.",
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
