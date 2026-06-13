import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { localizeText } from "./i18n.js";

const EVENT_CHANCE = 0.22;

// biomes: null = cualquier bioma | array = biomas específicos
const TRAVEL_EVENTS = [

  // ── Universales ─────────────────────────────────────────────────
  {
    id: "stray_traveler",
    icon: "🧑‍🦯",
    title: { en: "Stray Traveler", es: "Viajero herido" },
    text: { en: "You find a wounded traveler at the roadside. They look at you with pleading eyes.", es: "Encuentras a un viajero herido al borde del camino. Te mira con ojos suplicantes." },
    biomes: null,
    choices: [
      {
        label: { en: "Help them", es: "Ayudarle" },
        icon: "💊",
        apply() {
          const hasPot = (gameState.inventory.health_potion ?? 0) > 0;
          if (hasPot) {
            gameState.inventory.health_potion--;
            if (gameState.inventory.health_potion <= 0) delete gameState.inventory.health_potion;
            gameState.player.experience += 25;
            return { en: `You give them a potion. Grateful, they share their knowledge. +25 XP`, es: `Le das una poción. Agradecido, te comparte su conocimiento. +25 XP` };
          }
          gameState.player.experience += 10;
          return { en: `No potions, you bandage their wounds with what you have. +10 XP`, es: `Sin pociones, le curas las heridas con lo que encuentras. +10 XP` };
        }
      },
      {
        label: { en: "Keep going", es: "Seguir tu camino" },
        icon: "🚶",
        apply() {
          return { en: `You pass by. These lands spare neither the weak nor the indifferent.`, es: `Pasas de largo. Estas tierras no perdonan a los débiles... ni a los indiferentes.` };
        }
      }
    ]
  },

  {
    id: "lost_coin_purse",
    icon: "👝",
    title: { en: "Lost Coin Purse", es: "Una bolsa perdida" },
    text: { en: "Something glints in the leaf litter. It's a coin purse with no apparent owner.", es: "Algo brilla entre la hojarasca del camino. Es una bolsa de monedas sin dueño aparente." },
    biomes: null,
    choices: [
      {
        label: { en: "Pick it up", es: "Recogerla" },
        icon: "💰",
        apply() {
          const amount = 15 + Math.floor(Math.random() * 20);
          gameState.player.gold = (gameState.player.gold ?? 0) + amount;
          return { en: `Inside are ${amount} gold coins. Someone had a bad day. +${amount} gold`, es: `Dentro hay ${amount} monedas de oro. Alguien tuvo mala suerte hoy. +${amount} oro` };
        }
      },
      {
        label: { en: "Leave it", es: "Dejarla" },
        icon: "🤷",
        apply() {
          return { en: `You leave it as it was. Perhaps its owner will come back for it.`, es: `La dejas donde estaba. Quizás su dueño vuelva a buscarla.` };
        }
      }
    ]
  },

  {
    id: "old_shrine",
    icon: "🏛️",
    title: { en: "Old Shrine", es: "Santuario olvidado" },
    text: { en: "A small chapel with a worn statue peeks from the brush. It still hums with strange energy.", es: "Una pequeña capilla con una estatua desgastada asoma entre la maleza. Todavía emana una energía extraña." },
    biomes: null,
    choices: [
      {
        label: { en: "Pray at the statue", es: "Orar ante la estatua" },
        icon: "🙏",
        apply() {
          const hp = 15, mp = 8;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return { en: `The statue emits a soft glow. You feel body and mind renewed. +${hp} HP, +${mp} MP`, es: `La estatua emite un suave resplandor. Sientes cuerpo y mente renovados. +${hp} HP, +${mp} MP` };
        }
      },
      {
        label: { en: "Ignore it", es: "Ignorarlo" },
        icon: "🚶",
        apply() {
          return { en: `Not the time for prayer. You move on with steady steps.`, es: `No es momento para rezar. Sigues adelante con paso firme.` };
        }
      }
    ]
  },

  {
    id: "suspicious_merchant",
    icon: "🧙",
    title: { en: "Suspicious Merchant", es: "Mercader misterioso" },
    text: { en: "A hooded stranger appears out of nowhere offering 'top quality' potions at bargain prices.", es: "Un extraño con capucha aparece de la nada y te ofrece pociones 'de primera calidad' a precio de saldo." },
    biomes: null,
    choices: [
      {
        label: { en: "Buy potion (−8 gold)", es: "Comprar poción (−8 oro)" },
        icon: "🧪",
        apply() {
          if ((gameState.player.gold ?? 0) < 8) {
            return { en: `You don't have enough gold. The merchant disappears with a laugh.`, es: `No tienes suficiente oro. El mercader desaparece con una carcajada.` };
          }
          gameState.player.gold -= 8;
          gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
          return { en: `Seems genuine. Or at least it doesn't smell bad. −8 gold, +1 Health Potion`, es: `Parece auténtica. O al menos no huele mal. −8 oro, +1 Poción de Salud` };
        }
      },
      {
        label: { en: "Decline and move on", es: "Rechazar y seguir" },
        icon: "🛑",
        apply() {
          return { en: `The merchant shrugs and fades into the shadows.`, es: `El mercader encoge los hombros y desaparece entre las sombras.` };
        }
      }
    ]
  },

  {
    id: "wandering_bard",
    icon: "🎵",
    title: { en: "Wandering Bard", es: "El juglar errante" },
    text: { en: "A lone bard plays a melancholic tune by the road. Their songs speak of fallen heroes.", es: "Un bardo solitario toca una melodía melancólica junto al camino. Sus canciones hablan de héroes caídos." },
    biomes: null,
    choices: [
      {
        label: { en: "Listen to their tale", es: "Escuchar su historia" },
        icon: "👂",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 5);
          return { en: `Their songs fill you with nostalgia and resolve. +20 XP, +5 MP`, es: `Sus canciones te llenan de nostalgia y determinación. +20 XP, +5 MP` };
        }
      },
      {
        label: { en: "Keep walking", es: "Continuar sin parar" },
        icon: "🚶",
        apply() {
          return { en: `No time for songs. The music fades behind you.`, es: `No tienes tiempo para canciones. La música se desvanece a tu espalda.` };
        }
      }
    ]
  },

  // ── Bosque / Jungla / Jardín ─────────────────────────────────────
  {
    id: "wild_berries",
    icon: "🫐",
    title: { en: "Wild Berries", es: "Bayas silvestres" },
    text: { en: "You find a bush full of purple berries. They look ripe and edible.", es: "Encuentras un arbusto repleto de bayas de color púrpura. Parecen maduras y comestibles." },
    biomes: ["forest", "jungle", "garden"],
    choices: [
      {
        label: { en: "Eat them", es: "Comerlas" },
        icon: "😋",
        apply() {
          const hp = 12;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          return { en: `Delicious and restorative. +${hp} HP`, es: `Deliciosas y restauradoras. +${hp} HP` };
        }
      },
      {
        label: { en: "Ignore them (might be poisonous)", es: "Ignorarlas (podrían ser venenosas)" },
        icon: "⚠️",
        apply() {
          return { en: `Better safe than sorry. You continue on with an empty stomach.`, es: `Más vale prevenir. Sigues tu camino con el estómago vacío.` };
        }
      }
    ]
  },

  {
    id: "fairy_circle",
    icon: "🍄",
    title: { en: "Fairy Circle", es: "Círculo de hadas" },
    text: { en: "A perfect ring of mushrooms glowing with bluish light. Ancient magic fills the air.", es: "Un perfecto anillo de hongos iluminados por una luz azulada. La magia antigua impregna el aire." },
    biomes: ["forest", "garden"],
    choices: [
      {
        label: { en: "Enter the circle", es: "Entrar en el círculo" },
        icon: "✨",
        apply() {
          if (Math.random() < 0.6) {
            gameState.inventory.mana_potion = (gameState.inventory.mana_potion ?? 0) + 1;
            gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 15);
            return { en: `Magic surrounds you in light. +15 MP, +1 Mana Potion`, es: `La magia te envuelve en luz. +15 MP, +1 Poción de Maná` };
          }
          const dmg = 8;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `Chaotic magic throws you out. −${dmg} HP`, es: `La magia caótica te expulsa. −${dmg} HP` };
        }
      },
      {
        label: { en: "Circle around carefully", es: "Rodearlo con cuidado" },
        icon: "🚶",
        apply() {
          return { en: `You walk around the ring with respect. The fairies watch but do not act.`, es: `Rodeas el anillo con respeto. Las hadas observan, pero no actúan.` };
        }
      }
    ]
  },

  {
    id: "ancient_tree",
    icon: "🌳",
    title: { en: "Ancient Tree", es: "El Árbol Antiguo" },
    text: { en: "A colossal tree older than the kingdom. Its bark is covered in runes carved by forgotten hands.", es: "Un árbol colosal, más viejo que el reino. Su corteza está cubierta de runas talladas por manos olvidadas." },
    biomes: ["forest", "jungle"],
    choices: [
      {
        label: { en: "Touch the bark and meditate", es: "Tocar la corteza y meditar" },
        icon: "🧘",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + 10);
          return { en: `The tree shares memories of centuries. +20 XP, +10 HP`, es: `El árbol comparte memorias de siglos. +20 XP, +10 HP` };
        }
      },
      {
        label: { en: "Move on", es: "Seguir adelante" },
        icon: "🚶",
        apply() {
          return { en: `Just a big tree. You continue on.`, es: `Es solo un árbol grande. Sigues tu camino.` };
        }
      }
    ]
  },

  // ── Mazmorra / Cueva ─────────────────────────────────────────────
  {
    id: "trapped_chest",
    icon: "📦",
    title: { en: "Trapped Chest", es: "Cofre sospechoso" },
    text: { en: "An old wooden chest lies in a corner. It seems too convenient. It might be trapped...", es: "Un cofre de madera vieja yace en un rincón. Parece demasiado conveniente. Podría tener trampa..." },
    biomes: ["dungeon", "cave"],
    choices: [
      {
        label: { en: "Open it (risk it)", es: "Abrirlo (arriesgarse)" },
        icon: "🔓",
        apply() {
          if (Math.random() < 0.55) {
            const gold = 20 + Math.floor(Math.random() * 30);
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return { en: `No trap! Inside are ${gold} gold coins. +${gold} gold`, es: `¡Sin trampa! Dentro hay ${gold} monedas de oro. +${gold} oro` };
          }
          const dmg = 12 + Math.floor(Math.random() * 10);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          const consolation = 5;
          gameState.player.gold = (gameState.player.gold ?? 0) + consolation;
          return { en: `Trap! Poison darts. −${dmg} HP. At least there were ${consolation} coins inside.`, es: `¡Trampa! Dardos envenenados. −${dmg} HP. En el fondo había ${consolation} monedas, al menos.` };
        }
      },
      {
        label: { en: "Ignore it", es: "Ignorarlo" },
        icon: "🤚",
        apply() {
          return { en: `Your survival instinct tells you not to touch it. You leave it behind.`, es: `Tu instinto de supervivencia te dice que no lo toques. Lo dejas atrás.` };
        }
      }
    ]
  },

  {
    id: "dungeon_spring",
    icon: "💧",
    title: { en: "Dungeon Spring", es: "Manantial subterráneo" },
    text: { en: "A thin stream of crystal water emerges from the rock. The sound is the calmest you've heard in days.", es: "Un hilo de agua cristalina emerge de la roca. El sonido del agua es lo más tranquilo que has oído en días." },
    biomes: ["dungeon", "cave"],
    choices: [
      {
        label: { en: "Drink from the spring", es: "Beber del manantial" },
        icon: "🚰",
        apply() {
          const hp = 20, mp = 10;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return { en: `The cold water restores your energy. +${hp} HP, +${mp} MP`, es: `El agua fría restaura tu energía. +${hp} HP, +${mp} MP` };
        }
      },
      {
        label: { en: "Don't risk it", es: "No arriesgarse" },
        icon: "⚠️",
        apply() {
          return { en: `Prudence is a virtue. You move on thirsty.`, es: `Prudencia es virtud. Sigues adelante con sed.` };
        }
      }
    ]
  },

  {
    id: "mysterious_rune",
    icon: "🔮",
    title: { en: "Mysterious Rune", es: "Runa misteriosa" },
    text: { en: "Someone carved a symbol on the stone wall that emits a faint blue glow. Very ancient knowledge.", es: "En la pared de piedra alguien grabó un símbolo que emite un débil resplandor azul. Conocimiento muy antiguo." },
    biomes: ["dungeon", "cave", "mountain"],
    choices: [
      {
        label: { en: "Study it closely", es: "Estudiarla detenidamente" },
        icon: "📖",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + 12);
          return { en: `You decipher part of the sign. Knowledge flows to you. +25 XP, +12 MP`, es: `Descifras parte del signo. El conocimiento fluye hacia ti. +25 XP, +12 MP` };
        }
      },
      {
        label: { en: "Ignore it", es: "Ignorarla" },
        icon: "🚶",
        apply() {
          return { en: `Symbols of the mad. You continue on.`, es: `Símbolos de locos. Sigues adelante.` };
        }
      }
    ]
  },

  // ── Montaña ──────────────────────────────────────────────────────
  {
    id: "falling_rocks",
    icon: "🪨",
    title: { en: "Falling Rocks", es: "Desprendimiento" },
    text: { en: "An ominous crack comes from above. Huge rocks begin tumbling down the slope.", es: "Un crujido ominoso llega desde arriba. Rocas enormes comienzan a caer por la ladera." },
    biomes: ["mountain", "cave"],
    choices: [
      {
        label: { en: "Run to cover!", es: "¡Correr a cubierto!" },
        icon: "💨",
        apply() {
          const agi = gameState.player.agility ?? 8;
          if (agi >= 12 || Math.random() < 0.65) {
            return { en: `Your agility saves you. Rocks pass inches from you. Unharmed.`, es: `Tu agilidad te salva. Las rocas pasan a centímetros de ti. Ileso.` };
          }
          const dmg = 10 + Math.floor(Math.random() * 8);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `A rock grazes you. −${dmg} HP. You manage to find cover.`, es: `Una roca te golpea de refilón. −${dmg} HP. Consigues ponerte a cubierto.` };
        }
      },
      {
        label: { en: "Cover and endure", es: "Cubrirse y aguantar" },
        icon: "🛡️",
        apply() {
          const dmg = 5;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `You take some damage but survive. −${dmg} HP`, es: `Sufres algo de daño pero estás vivo. −${dmg} HP` };
        }
      }
    ]
  },

  {
    id: "mountain_spring",
    icon: "🏔️",
    title: { en: "Mountain Spring", es: "Fuente de montaña" },
    text: { en: "A spring of icy water wells up between the rocks. The water is so pure you can see your reflection clearly.", es: "Un manantial de agua helada brota entre las rocas. El agua es tan pura que puedes ver tu reflejo con nitidez." },
    biomes: ["mountain", "tundra"],
    choices: [
      {
        label: { en: "Drink and rest", es: "Beber y descansar" },
        icon: "💧",
        apply() {
          const hp = 20;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          return { en: `The icy water revitalizes you. +${hp} HP`, es: `El agua helada te revitaliza. +${hp} HP` };
        }
      },
      {
        label: { en: "Continue on", es: "Seguir el camino" },
        icon: "🚶",
        apply() {
          return { en: `Not the time to rest. You keep climbing.`, es: `No es momento de descansar. Sigues ascendiendo.` };
        }
      }
    ]
  },

  // ── Mar / Playa ──────────────────────────────────────────────────
  {
    id: "message_bottle",
    icon: "🍾",
    title: { en: "Message in a Bottle", es: "Mensaje en una botella" },
    text: { en: "The waves bring a sealed bottle to your feet. Inside is a message written in a trembling hand.", es: "Las olas traen a tus pies una botella sellada. Dentro hay un mensaje escrito con letra temblorosa." },
    biomes: ["sea", "beach"],
    choices: [
      {
        label: { en: "Read the message", es: "Leer el mensaje" },
        icon: "📜",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          const msgs = [
            { en: "It speaks of a sunken treasure off the Southern Isles. One day... +20 XP", es: "Habla de un tesoro hundido frente a las Islas del Sur. Un día... +20 XP" },
            { en: "It's an unsent love letter. It fills you with determination. +20 XP", es: "Es una carta de amor nunca enviada. Te llena de determinación. +20 XP" },
            { en: "An unreadable map and a warning: 'Don't trust Captain Brennan'. +20 XP", es: "Un mapa ilegible y una advertencia: 'No confíes en el capitán Brennan'. +20 XP" }
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        }
      },
      {
        label: { en: "Return it to the sea", es: "Devolverla al mar" },
        icon: "🌊",
        apply() {
          return { en: `You throw it back to the waves. Let it follow its fate.`, es: `La lanzas de vuelta a las olas. Que siga su destino.` };
        }
      }
    ]
  },

  {
    id: "washed_chest",
    icon: "⚓",
    title: { en: "Washed Chest", es: "Cofre varado" },
    text: { en: "The tides have deposited a rusted metal chest on the shore.", es: "Las mareas han depositado un cofre con metal oxidado en la orilla." },
    biomes: ["sea", "beach"],
    choices: [
      {
        label: { en: "Force the lock", es: "Forzar la cerradura" },
        icon: "🔓",
        apply() {
          const gold = 25 + Math.floor(Math.random() * 25);
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return { en: `Full of pirate booty. +${gold} gold`, es: `Lleno de botín pirata. +${gold} oro` };
        }
      },
      {
        label: { en: "Leave it (might be trapped)", es: "Dejarlo (podría ser trampa)" },
        icon: "🏴‍☠️",
        apply() {
          return { en: `Discretion is sometimes the best strategy. You continue on.`, es: `La discreción es a veces la mejor estrategia. Sigues tu camino.` };
        }
      }
    ]
  },

  // ── Pantano / Desierto ───────────────────────────────────────────
  {
    id: "toxic_mushrooms",
    icon: "🍄",
    title: { en: "Toxic Mushrooms", es: "Hongos extraños" },
    text: { en: "Brightly colored mushrooms grow in the mud. Locals say they can be healing... or worse.", es: "Unos hongos de colores brillantes crecen en el barro. Los locales dicen que son curativos... o peor." },
    biomes: ["swamp"],
    choices: [
      {
        label: { en: "Try one (50/50)", es: "Probar uno (50/50)" },
        icon: "🤔",
        apply() {
          if (Math.random() < 0.5) {
            const hp = 18;
            gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
            return { en: `They were healing! +${hp} HP`, es: `¡Eran curativos! +${hp} HP` };
          }
          const dmg = 10;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `They tasted terrible and your stomach pays the price. −${dmg} HP`, es: `Sabían terrible y tu estómago no lo agradece. −${dmg} HP` };
        }
      },
      {
        label: { en: "Avoid them", es: "Evitarlos" },
        icon: "🚫",
        apply() {
          return { en: `Survival is about not eating random things in a swamp. Wise.`, es: `La supervivencia se basa en no probar cosas aleatorias en un pantano. Sabio.` };
        }
      }
    ]
  },

  {
    id: "quicksand",
    icon: "⚡",
    title: { en: "Quicksand", es: "Arenas movedizas" },
    text: { en: "Suddenly the ground gives way beneath your feet. The sand swallows you up to your knees.", es: "De repente el suelo cede bajo tus pies. Las arenas te engullen hasta la rodilla." },
    biomes: ["swamp", "desert"],
    choices: [
      {
        label: { en: "Struggle to escape", es: "Forcejear para salir" },
        icon: "💪",
        apply() {
          const dmg = 8;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          gameState.player.experience = (gameState.player.experience ?? 0) + 10;
          return { en: `With titanic effort you manage to escape. −${dmg} HP, +10 XP`, es: `Con un esfuerzo titánico logras salir. −${dmg} HP, +10 XP` };
        }
      },
      {
        label: { en: "Move slowly and carefully", es: "Moverte despacio y con cuidado" },
        icon: "🐢",
        apply() {
          return { en: `Calm is your best weapon. Slowly you free yourself unharmed.`, es: `La calma es tu mejor arma. Lentamente te liberas sin sufrir daño.` };
        }
      }
    ]
  },

  {
    id: "desert_oasis",
    icon: "🏜️",
    title: { en: "Desert Oasis", es: "Oasis en el desierto" },
    text: { en: "Among the dunes a palm-filled oasis with crystal water appears. Real or mirage?", es: "Entre las dunas surge un oasis: palmeras y agua cristalina. ¿Real o espejismo?" },
    biomes: ["desert"],
    choices: [
      {
        label: { en: "Drink and rest", es: "Beber y descansar" },
        icon: "💧",
        apply() {
          const hp = 25, mp = 10;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return { en: `It was real. The oasis restores your strength. +${hp} HP, +${mp} MP`, es: `Era real. El oasis restaura tus fuerzas. +${hp} HP, +${mp} MP` };
        }
      },
      {
        label: { en: "Ignore it (might be mirage)", es: "Ignorar (podría ser un espejismo)" },
        icon: "⚠️",
        apply() {
          return { en: `You stay alert and continue across the dunes.`, es: `Te mantienes alerta. Sigues avanzando por las dunas.` };
        }
      }
    ]
  },

  // ── Tundra ───────────────────────────────────────────────────────
  {
    id: "blizzard_warning",
    icon: "🌨️",
    title: { en: "Blizzard Warning", es: "Tormenta inminente" },
    text: { en: "The sky darkens suddenly. A biting wind cuts your skin. A blizzard approaches.", es: "El cielo se oscurece de repente. Un viento helado te corta la piel. Una ventisca llega." },
    biomes: ["tundra"],
    choices: [
      {
        label: { en: "Seek shelter", es: "Buscar refugio" },
        icon: "🏕️",
        apply() {
          return { en: `You find a small cave and wait it out. You arrive unharmed.`, es: `Encuentras una cueva pequeña y esperas que pase. Llegas ileso.` };
        }
      },
      {
        label: { en: "Push through the storm", es: "Avanzar a través de la tormenta" },
        icon: "❄️",
        apply() {
          const dmg = 15;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `Extreme cold bites every exposed inch. −${dmg} HP. You arrive faster.`, es: `El frío extremo muerde cada centímetro expuesto. −${dmg} HP. Llegas más rápido.` };
        }
      }
    ]
  },

  {
    id: "frozen_corpse",
    icon: "🧊",
    title: { en: "Frozen Adventurer", es: "Aventurero congelado" },
    text: { en: "Another traveler wasn't so lucky. Their body preserved by the cold lies against a rock.", es: "Otro viajero no tuvo tanta suerte. Su cuerpo preservado por el frío yace contra una roca." },
    biomes: ["tundra"],
    choices: [
      {
        label: { en: "Search their belongings", es: "Registrar sus pertenencias" },
        icon: "🔍",
        apply() {
          if (Math.random() < 0.6) {
            gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
            return { en: `Among their clothes you find an intact potion. +1 Health Potion`, es: `Entre sus ropas encuentras una poción intacta. +1 Poción de Salud` };
          }
          const gold = 10 + Math.floor(Math.random() * 10);
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return { en: `They only carried a few coins. +${gold} gold`, es: `Solo llevaba algunas monedas. +${gold} oro` };
        }
      },
      {
        label: { en: "Leave it be", es: "Dejarlo en paz" },
        icon: "🙏",
        apply() {
          return { en: `You give a moment of silence. Rest in peace.`, es: `Le dedicas un momento de silencio. Que descanse.` };
        }
      }
    ]
  },

  // ── Jardín / Volcán ──────────────────────────────────────────────
  {
    id: "magical_spring_garden",
    icon: "🌸",
    title: { en: "Magical Spring", es: "Fuente encantada" },
    text: { en: "An iridescent spring wells among magical flowers. The water emits its own light.", es: "Una fuente de aguas tornasoladas brota entre flores mágicas. El agua emite luz propia." },
    biomes: ["garden"],
    choices: [
      {
        label: { en: "Drink the magic water", es: "Beber del agua mágica" },
        icon: "✨",
        apply() {
          const hp = 20, mp = 15;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return { en: `The magic water restores body and soul. +${hp} HP, +${mp} MP`, es: `El agua mágica restaura cuerpo y alma. +${hp} HP, +${mp} MP` };
        }
      },
      {
        label: { en: "Simply admire it", es: "Simplemente admirarla" },
        icon: "👁️",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 10;
          return { en: `Beauty also nourishes the spirit. +10 XP`, es: `La belleza también nutre el espíritu. +10 XP` };
        }
      }
    ]
  },

  {
    id: "lava_crystal",
    icon: "🌋",
    title: { en: "Lava Crystal", es: "Cristal de lava" },
    text: { en: "A burning red crystal emerges from a fissure. Its heat is unbearable, but its arcane power undeniable.", es: "Un cristal rojo ardiente emerge de una fisura. Su calor es insoportable, pero su poder arcano es innegable." },
    biomes: ["volcano"],
    choices: [
      {
        label: { en: "Take the crystal (−5 HP from heat)", es: "Tomar el cristal (−5 HP de calor)" },
        icon: "💎",
        apply() {
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - 5);
          gameState.player.experience = (gameState.player.experience ?? 0) + 30;
          const gold = 20;
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return { en: `The heat burns but the crystal is worth a fortune. −5 HP, +30 XP, +${gold} gold`, es: `El calor quema pero el cristal vale una fortuna. −5 HP, +30 XP, +${gold} oro` };
        }
      },
      {
        label: { en: "Not worth the burn", es: "No vale la pena quemarse" },
        icon: "🤚",
        apply() {
          return { en: `Prudence saves you from burns. The crystal remains, shining defiantly.`, es: `La prudencia te salva de quemaduras. El cristal sigue ahí, brillando desafiante.` };
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
  document.getElementById("teTitle").textContent = localizeText(event.title);
  document.getElementById("teText").textContent  = localizeText(event.text);

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
    btn.innerHTML = `${choice.icon} ${localizeText(choice.label)}`;
    btn.onclick = () => {
      const resultText = choice.apply();
      playSound("loot");
      addMessage(`📍 Evento — ${localizeText(event.title)}: ${localizeText(resultText)}`, "narrative");
      updateUI();
      checkAchievements();
      choicesEl.classList.add("hidden");
      resultEl.textContent = localizeText(resultText);
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
