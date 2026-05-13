import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";

const EVENT_CHANCE = 0.22;

// biomes: null = cualquier bioma | array = biomas específicos
const TRAVEL_EVENTS = [

  // ── Universales ─────────────────────────────────────────────────
  {
    id: "stray_traveler",
    icon: "🧑‍🦯",
    title: "Viajero herido",
    text: "Encuentras a un viajero herido al borde del camino. Te mira con ojos suplicantes.",
    biomes: null,
    choices: [
      {
        label: "Ayudarle",
        icon: "💊",
        apply() {
          const hasPot = (gameState.inventory.health_potion ?? 0) > 0;
          if (hasPot) {
            gameState.inventory.health_potion--;
            if (gameState.inventory.health_potion <= 0) delete gameState.inventory.health_potion;
            gameState.player.experience += 25;
            return "Le das una poción. Agradecido, te comparte su conocimiento. +25 XP";
          }
          gameState.player.experience += 10;
          return "Sin pociones, le curas las heridas con lo que encuentras. +10 XP";
        }
      },
      {
        label: "Seguir tu camino",
        icon: "🚶",
        apply() {
          return "Pasas de largo. Estas tierras no perdonan a los débiles... ni a los indiferentes.";
        }
      }
    ]
  },

  {
    id: "lost_coin_purse",
    icon: "👝",
    title: "Una bolsa perdida",
    text: "Algo brilla entre la hojarasca del camino. Es una bolsa de monedas sin dueño aparente.",
    biomes: null,
    choices: [
      {
        label: "Recogerla",
        icon: "💰",
        apply() {
          const amount = 15 + Math.floor(Math.random() * 20);
          gameState.player.gold = (gameState.player.gold ?? 0) + amount;
          return `Dentro hay ${amount} monedas de oro. Alguien tuvo mala suerte hoy. +${amount} oro`;
        }
      },
      {
        label: "Dejarla",
        icon: "🤷",
        apply() {
          return "La dejas donde estaba. Quizás su dueño vuelva a buscarla.";
        }
      }
    ]
  },

  {
    id: "old_shrine",
    icon: "🏛️",
    title: "Santuario olvidado",
    text: "Una pequeña capilla con una estatua desgastada asoma entre la maleza. Todavía emana una energía extraña.",
    biomes: null,
    choices: [
      {
        label: "Orar ante la estatua",
        icon: "🙏",
        apply() {
          const hp = 15, mp = 8;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return `La estatua emite un suave resplandor. Sientes cuerpo y mente renovados. +${hp} HP, +${mp} MP`;
        }
      },
      {
        label: "Ignorarlo",
        icon: "🚶",
        apply() {
          return "No es momento para rezar. Sigues adelante con paso firme.";
        }
      }
    ]
  },

  {
    id: "suspicious_merchant",
    icon: "🧙",
    title: "Mercader misterioso",
    text: "Un extraño con capucha aparece de la nada y te ofrece pociones 'de primera calidad' a precio de saldo.",
    biomes: null,
    choices: [
      {
        label: "Comprar poción (−8 oro)",
        icon: "🧪",
        apply() {
          if ((gameState.player.gold ?? 0) < 8) {
            return "No tienes suficiente oro. El mercader desaparece con una carcajada.";
          }
          gameState.player.gold -= 8;
          gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
          return "Parece auténtica. O al menos no huele mal. −8 oro, +1 Poción de Salud";
        }
      },
      {
        label: "Rechazar y seguir",
        icon: "🛑",
        apply() {
          return "El mercader encoge los hombros y desaparece entre las sombras.";
        }
      }
    ]
  },

  {
    id: "wandering_bard",
    icon: "🎵",
    title: "El juglar errante",
    text: "Un bardo solitario toca una melodía melancólica junto al camino. Sus canciones hablan de héroes caídos.",
    biomes: null,
    choices: [
      {
        label: "Escuchar su historia",
        icon: "👂",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 5);
          return "Sus canciones te llenan de nostalgia y determinación. +20 XP, +5 MP";
        }
      },
      {
        label: "Continuar sin parar",
        icon: "🚶",
        apply() {
          return "No tienes tiempo para canciones. La música se desvanece a tu espalda.";
        }
      }
    ]
  },

  // ── Bosque / Jungla / Jardín ─────────────────────────────────────
  {
    id: "wild_berries",
    icon: "🫐",
    title: "Bayas silvestres",
    text: "Encuentras un arbusto repleto de bayas de color púrpura. Parecen maduras y comestibles.",
    biomes: ["forest", "jungle", "garden"],
    choices: [
      {
        label: "Comerlas",
        icon: "😋",
        apply() {
          const hp = 12;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          return `Deliciosas y restauradoras. +${hp} HP`;
        }
      },
      {
        label: "Ignorarlas (podrían ser venenosas)",
        icon: "⚠️",
        apply() {
          return "Más vale prevenir. Sigues tu camino con el estómago vacío.";
        }
      }
    ]
  },

  {
    id: "fairy_circle",
    icon: "🍄",
    title: "Círculo de hadas",
    text: "Un perfecto anillo de hongos iluminados por una luz azulada. La magia antigua impregna el aire.",
    biomes: ["forest", "garden"],
    choices: [
      {
        label: "Entrar en el círculo",
        icon: "✨",
        apply() {
          if (Math.random() < 0.6) {
            gameState.inventory.mana_potion = (gameState.inventory.mana_potion ?? 0) + 1;
            gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 15);
            return "La magia te envuelve en luz. +15 MP, +1 Poción de Maná";
          }
          const dmg = 8;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return `La magia caótica te expulsa. −${dmg} HP`;
        }
      },
      {
        label: "Rodearlo con cuidado",
        icon: "🚶",
        apply() {
          return "Rodeas el anillo con respeto. Las hadas observan, pero no actúan.";
        }
      }
    ]
  },

  {
    id: "ancient_tree",
    icon: "🌳",
    title: "El Árbol Antiguo",
    text: "Un árbol colosal, más viejo que el reino. Su corteza está cubierta de runas talladas por manos olvidadas.",
    biomes: ["forest", "jungle"],
    choices: [
      {
        label: "Tocar la corteza y meditar",
        icon: "🧘",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + 10);
          return "El árbol comparte memorias de siglos. +20 XP, +10 HP";
        }
      },
      {
        label: "Seguir adelante",
        icon: "🚶",
        apply() {
          return "Es solo un árbol grande. Sigues tu camino.";
        }
      }
    ]
  },

  // ── Mazmorra / Cueva ─────────────────────────────────────────────
  {
    id: "trapped_chest",
    icon: "📦",
    title: "Cofre sospechoso",
    text: "Un cofre de madera vieja yace en un rincón. Parece demasiado conveniente. Podría tener trampa...",
    biomes: ["dungeon", "cave"],
    choices: [
      {
        label: "Abrirlo (arriesgarse)",
        icon: "🔓",
        apply() {
          if (Math.random() < 0.55) {
            const gold = 20 + Math.floor(Math.random() * 30);
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return `¡Sin trampa! Dentro hay ${gold} monedas de oro. +${gold} oro`;
          }
          const dmg = 12 + Math.floor(Math.random() * 10);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          const consolation = 5;
          gameState.player.gold = (gameState.player.gold ?? 0) + consolation;
          return `¡Trampa! Dardos envenenados. −${dmg} HP. En el fondo había ${consolation} monedas, al menos.`;
        }
      },
      {
        label: "Ignorarlo",
        icon: "🤚",
        apply() {
          return "Tu instinto de supervivencia te dice que no lo toques. Lo dejas atrás.";
        }
      }
    ]
  },

  {
    id: "dungeon_spring",
    icon: "💧",
    title: "Manantial subterráneo",
    text: "Un hilo de agua cristalina emerge de la roca. El sonido del agua es lo más tranquilo que has oído en días.",
    biomes: ["dungeon", "cave"],
    choices: [
      {
        label: "Beber del manantial",
        icon: "🚰",
        apply() {
          const hp = 20, mp = 10;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return `El agua fría restaura tu energía. +${hp} HP, +${mp} MP`;
        }
      },
      {
        label: "No arriesgarse",
        icon: "⚠️",
        apply() {
          return "Prudencia es virtud. Sigues adelante con sed.";
        }
      }
    ]
  },

  {
    id: "mysterious_rune",
    icon: "🔮",
    title: "Runa misteriosa",
    text: "En la pared de piedra alguien grabó un símbolo que emite un débil resplandor azul. Conocimiento muy antiguo.",
    biomes: ["dungeon", "cave", "mountain"],
    choices: [
      {
        label: "Estudiarla detenidamente",
        icon: "📖",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 12);
          return "Descifras parte del signo. El conocimiento fluye hacia ti. +25 XP, +12 MP";
        }
      },
      {
        label: "Ignorarla",
        icon: "🚶",
        apply() {
          return "Símbolos de locos. Sigues adelante.";
        }
      }
    ]
  },

  // ── Montaña ──────────────────────────────────────────────────────
  {
    id: "falling_rocks",
    icon: "🪨",
    title: "Desprendimiento",
    text: "Un crujido ominoso llega desde arriba. Rocas enormes comienzan a caer por la ladera.",
    biomes: ["mountain", "cave"],
    choices: [
      {
        label: "¡Correr a cubierto!",
        icon: "💨",
        apply() {
          const agi = gameState.player.agility ?? 8;
          if (agi >= 12 || Math.random() < 0.65) {
            return "Tu agilidad te salva. Las rocas pasan a centímetros de ti. Ileso.";
          }
          const dmg = 10 + Math.floor(Math.random() * 8);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return `Una roca te golpea de refilón. −${dmg} HP. Consigues ponerte a cubierto.`;
        }
      },
      {
        label: "Cubrirse y aguantar",
        icon: "🛡️",
        apply() {
          const dmg = 5;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return `Sufres algo de daño pero estás vivo. −${dmg} HP`;
        }
      }
    ]
  },

  {
    id: "mountain_spring",
    icon: "🏔️",
    title: "Fuente de montaña",
    text: "Un manantial de agua helada brota entre las rocas. El agua es tan pura que puedes ver tu reflejo con nitidez.",
    biomes: ["mountain", "tundra"],
    choices: [
      {
        label: "Beber y descansar",
        icon: "💧",
        apply() {
          const hp = 20;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          return `El agua helada te revitaliza. +${hp} HP`;
        }
      },
      {
        label: "Seguir el camino",
        icon: "🚶",
        apply() {
          return "No es momento de descansar. Sigues ascendiendo.";
        }
      }
    ]
  },

  // ── Mar / Playa ──────────────────────────────────────────────────
  {
    id: "message_bottle",
    icon: "🍾",
    title: "Mensaje en una botella",
    text: "Las olas traen a tus pies una botella sellada. Dentro hay un mensaje escrito con letra temblorosa.",
    biomes: ["sea", "beach"],
    choices: [
      {
        label: "Leer el mensaje",
        icon: "📜",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          const msgs = [
            "Habla de un tesoro hundido frente a las Islas del Sur. Un día... +20 XP",
            "Es una carta de amor nunca enviada. Te llena de determinación. +20 XP",
            "Un mapa ilegible y una advertencia: 'No confíes en el capitán Brennan'. +20 XP"
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        }
      },
      {
        label: "Devolverla al mar",
        icon: "🌊",
        apply() {
          return "La lanzas de vuelta a las olas. Que siga su destino.";
        }
      }
    ]
  },

  {
    id: "washed_chest",
    icon: "⚓",
    title: "Cofre varado",
    text: "Las mareas han depositado un cofre con metal oxidado en la orilla.",
    biomes: ["sea", "beach"],
    choices: [
      {
        label: "Forzar la cerradura",
        icon: "🔓",
        apply() {
          const gold = 25 + Math.floor(Math.random() * 25);
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return `Lleno de botín pirata. +${gold} oro`;
        }
      },
      {
        label: "Dejarlo (podría ser trampa)",
        icon: "🏴‍☠️",
        apply() {
          return "La discreción es a veces la mejor estrategia. Sigues tu camino.";
        }
      }
    ]
  },

  // ── Pantano / Desierto ───────────────────────────────────────────
  {
    id: "toxic_mushrooms",
    icon: "🍄",
    title: "Hongos extraños",
    text: "Unos hongos de colores brillantes crecen en el barro. Los locales dicen que son curativos... o peor.",
    biomes: ["swamp"],
    choices: [
      {
        label: "Probar uno (50/50)",
        icon: "🤔",
        apply() {
          if (Math.random() < 0.5) {
            const hp = 18;
            gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
            return `¡Eran curativos! +${hp} HP`;
          }
          const dmg = 10;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return `Sabían terrible y tu estómago no lo agradece. −${dmg} HP`;
        }
      },
      {
        label: "Evitarlos",
        icon: "🚫",
        apply() {
          return "La supervivencia se basa en no probar cosas aleatorias en un pantano. Sabio.";
        }
      }
    ]
  },

  {
    id: "quicksand",
    icon: "⚡",
    title: "Arenas movedizas",
    text: "De repente el suelo cede bajo tus pies. Las arenas te engullen hasta la rodilla.",
    biomes: ["swamp", "desert"],
    choices: [
      {
        label: "Forcejear para salir",
        icon: "💪",
        apply() {
          const dmg = 8;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          gameState.player.experience = (gameState.player.experience ?? 0) + 10;
          return `Con un esfuerzo titánico logras salir. −${dmg} HP, +10 XP`;
        }
      },
      {
        label: "Moverte despacio y con cuidado",
        icon: "🐢",
        apply() {
          return "La calma es tu mejor arma. Lentamente te liberas sin sufrir daño.";
        }
      }
    ]
  },

  {
    id: "desert_oasis",
    icon: "🏜️",
    title: "Oasis en el desierto",
    text: "Entre las dunas surge un oasis: palmeras y agua cristalina. ¿Real o espejismo?",
    biomes: ["desert"],
    choices: [
      {
        label: "Beber y descansar",
        icon: "💧",
        apply() {
          const hp = 25, mp = 10;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return `Era real. El oasis restaura tus fuerzas. +${hp} HP, +${mp} MP`;
        }
      },
      {
        label: "Ignorar (podría ser un espejismo)",
        icon: "⚠️",
        apply() {
          return "Te mantienes alerta. Sigues avanzando por las dunas.";
        }
      }
    ]
  },

  // ── Tundra ───────────────────────────────────────────────────────
  {
    id: "blizzard_warning",
    icon: "🌨️",
    title: "Tormenta inminente",
    text: "El cielo se oscurece de repente. Un viento helado te corta la piel. Una ventisca llega.",
    biomes: ["tundra"],
    choices: [
      {
        label: "Buscar refugio",
        icon: "🏕️",
        apply() {
          return "Encuentras una cueva pequeña y esperas que pase. Llegas ileso.";
        }
      },
      {
        label: "Avanzar a través de la tormenta",
        icon: "❄️",
        apply() {
          const dmg = 15;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return `El frío extremo muerde cada centímetro expuesto. −${dmg} HP. Llegas más rápido.`;
        }
      }
    ]
  },

  {
    id: "frozen_corpse",
    icon: "🧊",
    title: "Aventurero congelado",
    text: "Otro viajero no tuvo tanta suerte. Su cuerpo preservado por el frío yace contra una roca.",
    biomes: ["tundra"],
    choices: [
      {
        label: "Registrar sus pertenencias",
        icon: "🔍",
        apply() {
          if (Math.random() < 0.6) {
            gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
            return "Entre sus ropas encuentras una poción intacta. +1 Poción de Salud";
          }
          const gold = 10 + Math.floor(Math.random() * 10);
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return `Solo llevaba algunas monedas. +${gold} oro`;
        }
      },
      {
        label: "Dejarlo en paz",
        icon: "🙏",
        apply() {
          return "Le dedicas un momento de silencio. Que descanse.";
        }
      }
    ]
  },

  // ── Jardín / Volcán ──────────────────────────────────────────────
  {
    id: "magical_spring_garden",
    icon: "🌸",
    title: "Fuente encantada",
    text: "Una fuente de aguas tornasoladas brota entre flores mágicas. El agua emite luz propia.",
    biomes: ["garden"],
    choices: [
      {
        label: "Beber del agua mágica",
        icon: "✨",
        apply() {
          const hp = 20, mp = 15;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return `El agua mágica restaura cuerpo y alma. +${hp} HP, +${mp} MP`;
        }
      },
      {
        label: "Simplemente admirarla",
        icon: "👁️",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 10;
          return "La belleza también nutre el espíritu. +10 XP";
        }
      }
    ]
  },

  {
    id: "lava_crystal",
    icon: "🌋",
    title: "Cristal de lava",
    text: "Un cristal rojo ardiente emerge de una fisura. Su calor es insoportable, pero su poder arcano es innegable.",
    biomes: ["volcano"],
    choices: [
      {
        label: "Tomar el cristal (−5 HP de calor)",
        icon: "💎",
        apply() {
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - 5);
          gameState.player.experience = (gameState.player.experience ?? 0) + 30;
          const gold = 20;
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return `El calor quema pero el cristal vale una fortuna. −5 HP, +30 XP, +${gold} oro`;
        }
      },
      {
        label: "No vale la pena quemarse",
        icon: "🤚",
        apply() {
          return "La prudencia te salva de quemaduras. El cristal sigue ahí, brillando desafiante.";
        }
      }
    ]
  }

];

export function getTravelEvent(biome) {
  if (Math.random() > EVENT_CHANCE) return null;
  const filtered = TRAVEL_EVENTS.filter(e =>
    e.biomes === null || (biome && biome !== "none" && e.biomes.includes(biome))
  );
  if (!filtered.length) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function showTravelEvent(event) {
  const modal = document.getElementById("travelEventModal");
  if (!modal) return;

  document.getElementById("teIcon").textContent  = event.icon;
  document.getElementById("teTitle").textContent = event.title;
  document.getElementById("teText").textContent  = event.text;

  const choicesEl    = document.getElementById("teChoices");
  const resultEl     = document.getElementById("teResult");
  const continueBtn  = document.getElementById("teContinueBtn");

  choicesEl.innerHTML = "";
  resultEl.classList.add("hidden");
  resultEl.textContent = "";
  continueBtn.classList.add("hidden");
  choicesEl.classList.remove("hidden");

  event.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "btn te-choice-btn";
    btn.innerHTML = `${choice.icon} ${choice.label}`;
    btn.onclick = () => {
      const resultText = choice.apply();
      playSound("loot");
      addMessage(`📍 Evento — ${event.title}: ${resultText}`, "narrative");
      updateUI();
      checkAchievements();
      choicesEl.classList.add("hidden");
      resultEl.textContent = resultText;
      resultEl.classList.remove("hidden");
      continueBtn.classList.remove("hidden");
    };
    choicesEl.appendChild(btn);
  });

  modal.classList.remove("hidden");
  gameState.isProcessingMove = true;
}

export function setupTravelEventModal() {
  const modal       = document.getElementById("travelEventModal");
  const continueBtn = document.getElementById("teContinueBtn");
  if (!modal || !continueBtn) return;
  continueBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    gameState.isProcessingMove = false;
    updateUI();
  });
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      gameState.isProcessingMove = false;
      updateUI();
    }
  });
}
