// ══════════════════════════════════════════════════════
//  SISTEMA DE CLASES DE PERSONAJE
//  Warrior · Mage · Rogue (Agility path)
// ══════════════════════════════════════════════════════

export const CLASS_DEFINITIONS = {
  warrior: {
    id: "warrior",
    name: "Guerrero",
    emoji: "⚔️",
    description: "Maestro del combate cuerpo a cuerpo. Alto HP y daño físico devastador.",
    primaryStat: "strength",
    baseStats: { strength: 14, agility: 8, intelligence: 4 },
    bonusHp: 30,
    bonusMp: 0,
    color: "#ef4444",
    perks: ["Golpe Brutal", "Postura Defensiva", "Furia de Batalla", "Grito de Guerra"],
    description_long: "El Guerrero es un combatiente sin igual. Cada punto en STR aumenta tu daño físico y HP máximo. Tu camino: destruir a los enemigos antes de que te destruyan a ti.",
    levelBonuses: {
      5:  { name: "Postura del Berserker", desc: "+15% daño físico permanente" },
      10: { name: "Piel de Hierro",        desc: "+20 DEF base" },
      15: { name: "Maestría con Armas",    desc: "Ataques normales tienen 20% de doble golpe" },
      20: { name: "Avatar de la Guerra",   desc: "+50% HP máximo" }
    }
  },
  mage: {
    id: "mage",
    name: "Mago",
    emoji: "🔮",
    description: "Controlador de arcanos. Alto daño mágico y habilidades únicas.",
    primaryStat: "intelligence",
    baseStats: { strength: 5, agility: 8, intelligence: 15 },
    bonusHp: 0,
    bonusMp: 40,
    color: "#818cf8",
    perks: ["Bola de Fuego", "Rayo de Hielo", "Escudo Arcano", "Teletransportación"],
    description_long: "El Mago domina las fuerzas arcanas. Cada punto en INT aumenta tu daño mágico y MP máximo. Tu camino: conocimiento profundo y hechizos devastadores.",
    levelBonuses: {
      5:  { name: "Mente Expandida",      desc: "+25% MP máximo permanente" },
      10: { name: "Amplificación Arcana", desc: "Hechizos cuestan -30% MP" },
      15: { name: "Dominación Mental",    desc: "Hechizos ignoran 40% DEF enemiga" },
      20: { name: "Archimago",            desc: "Daño mágico x2" }
    }
  },
  rogue: {
    id: "rogue",
    name: "Pícaro",
    emoji: "🗡️",
    description: "Ágil y letal. Alta evasión, críticos frecuentes y venenos.",
    primaryStat: "agility",
    baseStats: { strength: 8, agility: 16, intelligence: 6 },
    bonusHp: 10,
    bonusMp: 15,
    color: "#34d399",
    perks: ["Golpe Furtivo", "Veneno", "Evasión", "Golpe Doble"],
    description_long: "El Pícaro golpea rápido y esquiva todo. Cada punto en AGI aumenta tu evasión y probabilidad de crítico. Tu camino: movimiento, astucia y precisión letal.",
    levelBonuses: {
      5:  { name: "Sombras Perpetuas",  desc: "+25% probabilidad de evasión" },
      10: { name: "Veneno Potenciado",  desc: "Veneno hace 3x más daño" },
      15: { name: "Frenesí",            desc: "Golpe doble se activa 40% del tiempo" },
      20: { name: "Fantasma",           desc: "50% de evadir cualquier ataque" }
    }
  }
};

export const SKILLS_BY_CLASS = {
  warrior: [
    {
      id: "bash",
      name: "Golpe Brutal",
      emoji: "💥",
      mpCost: 8,
      levelReq: 1,
      description: "Golpe contundente que ignora el 30% de la defensa enemiga.",
      effect: (stats, enemy) => {
        const dmg = Math.max(1, Math.floor(stats.attack * 1.4 * (0.9 + Math.random() * 0.2)));
        const atkMitigated = Math.floor((enemy.defense || 0) * 0.7);
        return { damage: Math.max(1, dmg - atkMitigated), msg: `Golpe Brutal: ${dmg} daño (ignora defensa)` };
      }
    },
    {
      id: "defend",
      name: "Postura Defensiva",
      emoji: "🛡️",
      mpCost: 5,
      levelReq: 3,
      description: "Recupera 15% HP y reduce el próximo daño recibido a la mitad.",
      effect: (stats, enemy, player) => {
        const heal = Math.floor((player.maxHp || 100) * 0.15);
        return { heal, buff: "defend_stance", msg: `Postura Defensiva: recuperas ${heal} HP` };
      }
    },
    {
      id: "warcry",
      name: "Grito de Guerra",
      emoji: "📣",
      mpCost: 12,
      levelReq: 6,
      description: "Aumenta tu ATK un 30% durante 3 turnos.",
      effect: (stats, enemy, player) => {
        return { buff: "warcry", buffTurns: 3, msg: "¡Grito de Guerra! ATK +30% por 3 turnos" };
      }
    },
    {
      id: "whirlwind",
      name: "Torbellino",
      emoji: "🌀",
      mpCost: 20,
      levelReq: 10,
      description: "Ataque giratorio que golpea 2-3 veces al azar.",
      effect: (stats, enemy) => {
        const hits = 2 + Math.floor(Math.random() * 2);
        let total = 0;
        for (let i = 0; i < hits; i++) {
          total += Math.max(1, Math.floor(stats.attack * (0.6 + Math.random() * 0.4)));
        }
        return { damage: total, msg: `Torbellino: ${hits} golpes por ${total} daño total` };
      }
    },
    {
      id: "berserker_rage",
      name: "Frenesí Bersérker",
      emoji: "🩸",
      mpCost: 15,
      levelReq: 15,
      description: "Sacrifica 15% de tu HP para asestar un golpe devastador (×3 ATK).",
      effect: (stats, enemy, player) => {
        const sacrifice = Math.floor((player.maxHp || 100) * 0.15);
        player.hp = Math.max(1, (player.hp || 1) - sacrifice);
        const dmg = Math.max(1, Math.floor(stats.attack * 3.0 * (0.9 + Math.random() * 0.2)));
        return { damage: dmg, msg: `🩸 Frenesí Bersérker! Pierdes ${sacrifice} HP, infliges ${dmg} daño brutal` };
      }
    },
    {
      id: "avatar_of_war",
      name: "Avatar de la Guerra",
      emoji: "⚡",
      mpCost: 30,
      levelReq: 20,
      description: "Restaura 30% HP y activa Grito de Guerra por 4 turnos.",
      effect: (stats, enemy, player) => {
        const heal = Math.floor((player.maxHp || 100) * 0.30);
        player.hp = Math.min(player.maxHp, (player.hp || 0) + heal);
        return { heal, buff: "warcry", buffTurns: 4, msg: `⚡ Avatar de la Guerra: +${heal} HP y ATK +30% por 4 turnos` };
      }
    }
  ],
  mage: [
    {
      id: "fireball",
      name: "Bola de Fuego",
      emoji: "🔥",
      mpCost: 12,
      levelReq: 1,
      description: "Lanza una bola de fuego que quema al enemigo (2 turnos de daño).",
      effect: (stats) => {
        const dmg = Math.max(5, Math.floor(stats.magic * 1.6 * (0.9 + Math.random() * 0.2)));
        const burnDmg = Math.max(2, Math.floor(stats.magic * 0.4));
        return { damage: dmg, ignoresDef: true, debuff: "burn", debuffTurns: 2, debuffDmg: burnDmg, msg: `Bola de Fuego: ${dmg} daño + quemadura (${burnDmg}/turno)` };
      }
    },
    {
      id: "icebolt",
      name: "Rayo de Hielo",
      emoji: "❄️",
      mpCost: 10,
      levelReq: 3,
      description: "Congela al enemigo, reduciendo su ATK un 25% por 2 turnos.",
      effect: (stats) => {
        const dmg = Math.max(3, Math.floor(stats.magic * 1.2 * (0.9 + Math.random() * 0.2)));
        return { damage: dmg, ignoresDef: true, debuff: "frozen", debuffTurns: 2, msg: `Rayo de Hielo: ${dmg} daño + enemigo congelado (ATK -25%)` };
      }
    },
    {
      id: "arcane_shield",
      name: "Escudo Arcano",
      emoji: "💠",
      mpCost: 15,
      levelReq: 6,
      description: "Barrera mágica que absorbe el 40% del próximo daño recibido.",
      effect: (stats, enemy, player) => {
        return { buff: "arcane_shield", msg: "Escudo Arcano activo: absorberá 40% del próximo daño" };
      }
    },
    {
      id: "meteor",
      name: "Meteoro",
      emoji: "☄️",
      mpCost: 35,
      levelReq: 10,
      description: "Invoca un meteoro devastador. Daño masivo que ignora toda defensa.",
      effect: (stats) => {
        const dmg = Math.max(20, Math.floor(stats.magic * 3.0 * (0.85 + Math.random() * 0.3)));
        return { damage: dmg, ignoresDef: true, msg: `¡METEORO! ${dmg} daño arcano devastador` };
      }
    },
    {
      id: "arcane_storm",
      name: "Tormenta Arcana",
      emoji: "🌩️",
      mpCost: 28,
      levelReq: 15,
      description: "Tres rayos arcanos consecutivos que ignoran defensa.",
      effect: (stats) => {
        const hits = [0, 0, 0].map(() => Math.max(3, Math.floor(stats.magic * 0.9 * (0.8 + Math.random() * 0.4))));
        const total = hits.reduce((a, b) => a + b, 0);
        return { damage: total, ignoresDef: true, msg: `Tormenta Arcana: ${hits.join(" + ")} = ${total} daño` };
      }
    },
    {
      id: "singularity",
      name: "Singularidad",
      emoji: "🌀",
      mpCost: 50,
      levelReq: 20,
      description: "Colapso arcano masivo: daño devastador + drena 25% HP del enemigo.",
      effect: (stats, enemy, player) => {
        const dmg = Math.max(30, Math.floor(stats.magic * 4.5 * (0.9 + Math.random() * 0.2)));
        const drain = Math.floor((enemy.maxHp || enemy.hp || 50) * 0.25);
        const healed = Math.min(player.maxHp - (player.hp || 0), drain);
        player.hp = Math.min(player.maxHp, (player.hp || 0) + healed);
        return { damage: dmg, ignoresDef: true, heal: healed, msg: `✨ ¡Singularidad! ${dmg} daño arcano + drenas ${healed} HP` };
      }
    }
  ],
  rogue: [
    {
      id: "backstab",
      name: "Golpe Furtivo",
      emoji: "🗡️",
      mpCost: 8,
      levelReq: 1,
      description: "Golpe crítico garantizado con daño x2.5.",
      effect: (stats) => {
        const dmg = Math.max(1, Math.floor(stats.attack * 2.5 * (0.9 + Math.random() * 0.2)));
        return { damage: dmg, msg: `¡Golpe Furtivo CRÍTICO! ${dmg} daño` };
      }
    },
    {
      id: "poison",
      name: "Veneno",
      emoji: "☠️",
      mpCost: 6,
      levelReq: 3,
      description: "Envenena al enemigo, causando daño continuo por 4 turnos.",
      effect: (stats) => {
        const poisonDmg = Math.max(2, Math.floor(stats.agility * 0.8));
        return { damage: poisonDmg, debuff: "poison", debuffTurns: 4, debuffDmg: poisonDmg, msg: `Veneno aplicado: ${poisonDmg} daño/turno por 4 turnos` };
      }
    },
    {
      id: "smoke_bomb",
      name: "Bomba de Humo",
      emoji: "💨",
      mpCost: 10,
      levelReq: 6,
      description: "Lanza una bomba de humo. 70% de escapar del combate inmediatamente.",
      effect: (stats, enemy, player) => {
        const escaped = Math.random() < 0.7;
        return { escape: escaped, msg: escaped ? "¡Bomba de Humo! Escapas entre las sombras." : "La bomba de humo falla..." };
      }
    },
    {
      id: "double_strike",
      name: "Golpe Doble",
      emoji: "⚡",
      mpCost: 15,
      levelReq: 10,
      description: "Ataca dos veces seguidas con probabilidad de crítico en cada golpe.",
      effect: (stats) => {
        const hit1 = Math.max(1, Math.floor(stats.attack * (Math.random() < 0.35 ? 2.0 : 1.0) * (0.8 + Math.random() * 0.4)));
        const hit2 = Math.max(1, Math.floor(stats.attack * (Math.random() < 0.35 ? 2.0 : 1.0) * (0.8 + Math.random() * 0.4)));
        return { damage: hit1 + hit2, msg: `Golpe Doble: ${hit1} + ${hit2} = ${hit1+hit2} daño total` };
      }
    },
    {
      id: "shadow_strike",
      name: "Golpe de Sombra",
      emoji: "🌑",
      mpCost: 18,
      levelReq: 15,
      description: "Emerges de las sombras con un crítico garantizado (×4 ATK).",
      effect: (stats) => {
        const dmg = Math.max(1, Math.floor(stats.attack * 4.0 * (0.9 + Math.random() * 0.2)));
        return { damage: dmg, ignoresDef: true, msg: `🌑 Golpe de Sombra: ¡CRÍTICO FATAL! ${dmg} daño` };
      }
    },
    {
      id: "death_dance",
      name: "Danza de la Muerte",
      emoji: "💀",
      mpCost: 28,
      levelReq: 20,
      description: "5 ataques relámpago consecutivos, cada uno con chance de crítico.",
      effect: (stats) => {
        const hits = [0,0,0,0,0].map(() => {
          const crit = Math.random() < 0.4;
          return Math.max(1, Math.floor(stats.attack * (crit ? 2.0 : 0.8) * (0.85 + Math.random() * 0.3)));
        });
        const total = hits.reduce((a,b) => a+b, 0);
        return { damage: total, msg: `💀 Danza de la Muerte: ${hits.join("+")} = ${total} daño` };
      }
    }
  ]
};

// Habilidades universales aprendibles con pergaminos/libros
export const LEARNABLE_SKILLS = {
  rally: {
    id: "rally",
    name: "Reagruparse",
    emoji: "🌟",
    mpCost: 15,
    levelReq: 1,
    description: "Recupera 20% HP y elimina un estado negativo activo.",
    effect: (stats, enemy, player) => {
      const heal = Math.floor((player.maxHp || 100) * 0.20);
      player.hp = Math.min(player.maxHp, (player.hp || 0) + heal);
      return { heal, removeOneDebuff: true, msg: `🌟 Reagruparse: +${heal} HP` };
    }
  },
  power_strike: {
    id: "power_strike",
    name: "Golpe Potente",
    emoji: "💫",
    mpCost: 12,
    levelReq: 1,
    description: "Golpe que ignora defensa con 50% de probabilidad de crítico.",
    effect: (stats) => {
      const isCrit = Math.random() < 0.50;
      const dmg = Math.max(1, Math.floor(stats.attack * (isCrit ? 2.2 : 1.5) * (0.9 + Math.random() * 0.2)));
      return { damage: dmg, ignoresDef: true, msg: `💫 Golpe Potente: ${dmg} daño${isCrit ? " ¡CRÍTICO!" : ""}` };
    }
  },
  arcane_bolt: {
    id: "arcane_bolt",
    name: "Descarga Arcana",
    emoji: "🔮",
    mpCost: 18,
    levelReq: 1,
    description: "Rayo mágico que ignora defensa. Usa tu mayor stat (ATK o MAGIC).",
    effect: (stats) => {
      const base = Math.max(stats.attack || 0, stats.magic || 0);
      const dmg = Math.max(5, Math.floor(base * 2.0 * (0.85 + Math.random() * 0.3)));
      return { damage: dmg, ignoresDef: true, msg: `🔮 Descarga Arcana: ${dmg} daño mágico puro` };
    }
  }
};

// Obtener habilidades disponibles para el player actual
export function getAvailableSkills(playerClass, playerLevel, learnedSkillIds = []) {
  const classSkills = (SKILLS_BY_CLASS[playerClass] || []).filter(s => s.levelReq <= playerLevel);
  const learned = learnedSkillIds.map(id => LEARNABLE_SKILLS[id]).filter(Boolean);
  return [...classSkills, ...learned];
}

// Aplicar bonificaciones de clase al estado inicial
export function applyClassBonuses(player, classId) {
  const cls = CLASS_DEFINITIONS[classId];
  if (!cls) return player;
  player.class = classId;
  player.className = cls.name;
  player.classEmoji = cls.emoji;
  player.strength = cls.baseStats.strength;
  player.agility = cls.baseStats.agility;
  player.intelligence = cls.baseStats.intelligence;
  // Store class vitality bonuses so calculateTotalStats can read them (single source of truth)
  player.bonusHp = cls.bonusHp ?? 0;
  player.bonusMp = cls.bonusMp ?? 0;
  // maxHp/maxMp/hp/mp are set by the caller via calculateTotalStats after this returns
  return player;
}
