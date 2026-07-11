import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { localizeText } from "./i18n.js";
import { applyDerivedMaxes } from "./stats.js";

// Pacing (SPEC-0804): cooldown duro + probabilidad creciente hasta un tope
export const COOLDOWN_STEPS = 3;
export const BASE_CHANCE = 0.10;
export const RAMP_PER_STEP = 0.05;
export const MAX_CHANCE = 0.35;
export const RECENT_MEMORY = 3;

// worldFlags — memoria persistente de decisiones; los guards ?? cubren saves anteriores a SPEC-0803
const setFlag = k => { (gameState.worldFlags ??= {})[k] = true; };
const hasFlag = k => !!(gameState.worldFlags ?? {})[k];

// travelPacing — guard ??= para saves anteriores a SPEC-0804
const pacing = () => (gameState.travelPacing ??= { steps: 0, recent: [] });

/** Probabilidad de evento según movimientos pacíficos desde el último. */
export function eventChance(steps) {
  if (steps <= COOLDOWN_STEPS) return 0;
  return Math.min(MAX_CHANCE, BASE_CHANCE + RAMP_PER_STEP * (steps - COOLDOWN_STEPS - 1));
}

// biomes: null = cualquier bioma | array = biomas específicos
export const TRAVEL_EVENTS = [

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
          setFlag("traveler_helped");
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
          setFlag("traveler_ignored");
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
          setFlag("purse_taken");
          const amount = 15 + Math.floor(Math.random() * 20);
          gameState.player.gold = (gameState.player.gold ?? 0) + amount;
          return { en: `Inside are ${amount} gold coins. Someone had a bad day. +${amount} gold`, es: `Dentro hay ${amount} monedas de oro. Alguien tuvo mala suerte hoy. +${amount} oro` };
        }
      },
      {
        label: { en: "Leave it", es: "Dejarla" },
        icon: "🤷",
        apply() {
          setFlag("purse_left");
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
          setFlag("shrine_prayed");
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
          setFlag("merchant_bought");
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
  },

  // ── Follow-ups (SPEC-0803) — el mundo recuerda tus decisiones ────
  {
    id: "traveler_grateful",
    icon: "🧑‍🦯",
    followUp: true,
    condition: () => hasFlag("traveler_helped") && !hasFlag("traveler_resolved"),
    title: { en: "A Familiar Face", es: "Una cara conocida" },
    text: { en: "A figure by a campfire waves at you. It's the wounded traveler you helped — their wounds have healed, and their eyes light up on seeing you.", es: "Una figura junto a una hoguera te saluda. Es el viajero herido al que ayudaste: sus heridas han sanado y sus ojos se iluminan al verte." },
    biomes: null,
    choices: [
      {
        label: { en: "Greet them", es: "Saludarle" },
        icon: "👋",
        apply() {
          setFlag("traveler_resolved");
          gameState.player.gold = (gameState.player.gold ?? 0) + 40;
          gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
          return { en: `"I owe you my life." They press a pouch and a potion into your hands. +40 gold, +1 Health Potion`, es: `«Te debo la vida.» Te pone en las manos una bolsa y una poción. +40 oro, +1 Poción de Salud` };
        }
      },
      {
        label: { en: "Refuse any reward", es: "Rehusar la recompensa" },
        icon: "🙏",
        apply() {
          setFlag("traveler_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          return { en: `"Then take my story instead." Their tale of the roads teaches you plenty. +25 XP`, es: `«Entonces acepta mi historia.» Su relato de los caminos te enseña mucho. +25 XP` };
        }
      }
    ]
  },

  {
    id: "traveler_grave",
    icon: "🪦",
    followUp: true,
    condition: () => hasFlag("traveler_ignored") && !hasFlag("traveler_resolved"),
    title: { en: "By the Roadside", es: "Al borde del camino" },
    text: { en: "A fresh burial mound by the road, a walking stick planted on top. The wounded traveler you passed by never made it.", es: "Un túmulo reciente junto al camino, con un bastón clavado encima. El viajero herido al que pasaste de largo no lo consiguió." },
    biomes: null,
    choices: [
      {
        label: { en: "Pay your respects", es: "Presentar tus respetos" },
        icon: "🕯️",
        apply() {
          setFlag("traveler_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 15;
          return { en: `You stand in silence. These lands forgive nothing — a lesson you won't forget. +15 XP`, es: `Guardas silencio. Estas tierras no perdonan nada: una lección que no olvidarás. +15 XP` };
        }
      },
      {
        label: { en: "Walk on", es: "Seguir adelante" },
        icon: "🚶",
        apply() {
          setFlag("traveler_resolved");
          return { en: `You look away and keep walking. The road remembers, even if you'd rather not.`, es: `Apartas la mirada y sigues andando. El camino recuerda, aunque tú prefieras no hacerlo.` };
        }
      }
    ]
  },

  {
    id: "farmer_searching",
    icon: "🧑‍🌾",
    followUp: true,
    condition: () => hasFlag("purse_taken") && !hasFlag("purse_resolved"),
    title: { en: "The Searching Farmer", es: "El granjero que busca" },
    text: { en: "A farmer combs the roadside, distraught. \"My coin purse... a whole harvest's earnings. Have you seen it?\"", es: "Un granjero rastrea el borde del camino, desesperado. «Mi bolsa de monedas... lo ganado con toda una cosecha. ¿La has visto?»" },
    biomes: null,
    choices: [
      {
        label: { en: "Return the money (−25 gold)", es: "Devolverle el dinero (−25 oro)" },
        icon: "🤝",
        apply() {
          setFlag("purse_resolved");
          if ((gameState.player.gold ?? 0) >= 25) {
            gameState.player.gold -= 25;
            gameState.player.experience = (gameState.player.experience ?? 0) + 50;
            return { en: `You hand back what you found. His relief is worth more than gold. −25 gold, +50 XP`, es: `Le devuelves lo que encontraste. Su alivio vale más que el oro. −25 oro, +50 XP` };
          }
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          return { en: `You confess you spent it and promise to repay him someday. He nods, weary. +25 XP`, es: `Confiesas que lo gastaste y prometes devolvérselo algún día. Él asiente, cansado. +25 XP` };
        }
      },
      {
        label: { en: "Lie: \"haven't seen it\"", es: "Mentir: «no la he visto»" },
        icon: "🤫",
        apply() {
          setFlag("purse_resolved");
          return { en: `He thanks you anyway and trudges off. The coins in your pocket feel heavier now.`, es: `Te da las gracias de todos modos y se aleja arrastrando los pies. Las monedas de tu bolsillo pesan más ahora.` };
        }
      }
    ]
  },

  {
    id: "farmer_grateful",
    icon: "🧑‍🌾",
    followUp: true,
    condition: () => hasFlag("purse_left") && !hasFlag("purse_resolved"),
    title: { en: "The Grateful Farmer", es: "El granjero agradecido" },
    text: { en: "A farmer recognizes you. \"I saw you from the hill — you found my purse and left it be. I got everything back thanks to you.\"", es: "Un granjero te reconoce. «Te vi desde la colina: encontraste mi bolsa y la dejaste en su sitio. Lo recuperé todo gracias a ti.»" },
    biomes: null,
    choices: [
      {
        label: { en: "Accept his reward", es: "Aceptar su recompensa" },
        icon: "💰",
        apply() {
          setFlag("purse_resolved");
          gameState.player.gold = (gameState.player.gold ?? 0) + 30;
          return { en: `"Honesty deserves payment." He insists you take it. +30 gold`, es: `«La honradez merece pago.» Insiste en que lo aceptes. +30 oro` };
        }
      },
      {
        label: { en: "Decline politely", es: "Rechazarla con humildad" },
        icon: "😊",
        apply() {
          setFlag("purse_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          return { en: `He smiles and shares the best shortcuts in the region instead. +20 XP`, es: `Sonríe y a cambio te enseña los mejores atajos de la región. +20 XP` };
        }
      }
    ]
  },

  {
    id: "merchant_returns",
    icon: "🧙",
    followUp: true,
    condition: () => hasFlag("merchant_bought") && !hasFlag("merchant_resolved"),
    title: { en: "The Merchant Returns", es: "El mercader regresa" },
    text: { en: "The hooded merchant emerges from the shadows. \"My favorite customer! For you, something special: a greater elixir, almost a gift.\"", es: "El mercader encapuchado surge de las sombras. «¡Mi cliente favorito! Para ti, algo especial: un gran elixir, casi un regalo.»" },
    biomes: null,
    choices: [
      {
        label: { en: "Buy the elixir (−15 gold)", es: "Comprar el elixir (−15 oro)" },
        icon: "🧪",
        apply() {
          if ((gameState.player.gold ?? 0) < 15) {
            return { en: `"No coin? Then we shall meet again, friend." He vanishes with a chuckle.`, es: `«¿Sin monedas? Entonces volveremos a vernos, amigo.» Se desvanece con una risita.` };
          }
          gameState.player.gold -= 15;
          gameState.inventory.greater_elixir = (gameState.inventory.greater_elixir ?? 0) + 1;
          setFlag("merchant_resolved");
          return { en: `The elixir glows faintly. This time it really is top quality. −15 gold, +1 Greater Elixir`, es: `El elixir emite un leve brillo. Esta vez sí es de primera calidad. −15 oro, +1 Gran Elixir` };
        }
      },
      {
        label: { en: "Decline the offer", es: "Rechazar la oferta" },
        icon: "🛑",
        apply() {
          setFlag("merchant_resolved");
          return { en: `"Your loss." The merchant bows and fades away — this time for good.`, es: `«Tú te lo pierdes.» El mercader hace una reverencia y se desvanece... esta vez para siempre.` };
        }
      }
    ]
  },

  {
    id: "shrine_gratitude",
    icon: "🏛️",
    followUp: true,
    condition: () => hasFlag("shrine_prayed") && !hasFlag("shrine_resolved"),
    title: { en: "The Shrine's Gratitude", es: "La gratitud del santuario" },
    text: { en: "A warm presence surrounds you mid-step. The shrine's spirit has followed your journey — and wishes to repay your prayer.", es: "Una presencia cálida te envuelve a mitad de camino. El espíritu del santuario ha seguido tu viaje... y desea recompensar tu plegaria." },
    biomes: null,
    choices: [
      {
        label: { en: "Accept the blessing", es: "Aceptar la bendición" },
        icon: "✨",
        apply() {
          setFlag("shrine_resolved");
          gameState.player.permanentHpBonus = (gameState.player.permanentHpBonus ?? 0) + 5;
          applyDerivedMaxes();
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + 5);
          return { en: `Divine energy settles in your body forever. +5 Max HP`, es: `La energía divina se asienta en tu cuerpo para siempre. +5 HP máximo` };
        }
      },
      {
        label: { en: "Decline respectfully", es: "Declinar con respeto" },
        icon: "🙏",
        apply() {
          setFlag("shrine_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          return { en: `The presence hums, pleased by your humility, and shares ancient wisdom instead. +20 XP`, es: `La presencia vibra, complacida por tu humildad, y a cambio comparte antigua sabiduría. +20 XP` };
        }
      }
    ]
  }

];

export function eligibleEvents(biome) {
  const available = TRAVEL_EVENTS.filter(e =>
    (e.biomes === null || (biome && biome !== "none" && e.biomes.includes(biome))) &&
    (!e.condition || e.condition())
  );
  // Un follow-up pendiente tiene prioridad absoluta sobre los eventos normales
  const followUps = available.filter(e => e.followUp);
  return followUps.length ? followUps : available;
}

export function getTravelEvent(biome, rng = Math.random) {
  const p = pacing();
  p.steps = (p.steps ?? 0) + 1;
  if (rng() >= eventChance(p.steps)) return null;

  let pool = eligibleEvents(biome);
  // anti-repetición: los normales recientes salen del sorteo (los follow-ups no,
  // p. ej. el mercader sin resolver debe poder volver); si vacía el pool, fallback
  const fresh = pool.filter(e => e.followUp || !(p.recent ?? []).includes(e.id));
  if (fresh.length) pool = fresh;
  if (!pool.length) return null;

  const event = pool[Math.floor(rng() * pool.length)];
  p.steps = 0;
  p.recent = [...(p.recent ?? []), event.id].slice(-RECENT_MEMORY);
  return event;
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
