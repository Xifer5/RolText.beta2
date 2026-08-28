import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { localizeText, t } from "./i18n.js";
import { applyDerivedMaxes } from "./stats.js";
import { MORAL_DECISIONS } from "./endings.js";
import { showToast } from "./toast.js";

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
    biomes: ["beach"],
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
    biomes: ["beach"],
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

  // ── Origen (SPEC-1002) — tu pasado te alcanza una vez por partida ─
  {
    id: "origin_exile_tracks",
    icon: "🏜️",
    condition: () => hasFlag("origin_exile") && !hasFlag("origin_exile_seen"),
    title: { en: "Familiar Tracks", es: "Huellas conocidas" },
    text: { en: "Broken branches, ash buried the old way. Someone camped here like the exiles do — like you did, all those nights.", es: "Ramas quebradas, ceniza enterrada a la vieja usanza. Alguien acampó aquí como lo hacen los exiliados — como lo hiciste tú tantas noches." },
    biomes: null,
    choices: [
      {
        label: { en: "Scavenge the camp", es: "Rebuscar en el campamento" },
        icon: "🔍",
        apply() {
          setFlag("origin_exile_seen");
          const hp = 12;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          return { en: `Dried meat and a windbreak. Old habits keep you alive. +${hp} HP, +20 XP`, es: `Carne seca y un cortavientos. Los viejos hábitos te mantienen vivo. +${hp} HP, +20 XP` };
        }
      },
      {
        label: { en: "Leave it for the next exile", es: "Dejarlo para el siguiente exiliado" },
        icon: "🤝",
        apply() {
          setFlag("origin_exile_seen");
          gameState.player.experience = (gameState.player.experience ?? 0) + 30;
          return { en: "You add your own supplies to the cache. The road code lives on. +30 XP", es: "Añades provisiones propias al escondite. El código del camino sigue vivo. +30 XP" };
        }
      }
    ]
  },

  {
    id: "origin_apprentice_notes",
    icon: "📜",
    condition: () => hasFlag("origin_apprentice") && !hasFlag("origin_apprentice_seen"),
    title: { en: "Margin Notes", es: "Notas al margen" },
    text: { en: "A weathered waystone bears a rune you copied a hundred times in the tower. Your old master's hand wrote the margin note beside it.", es: "Un mojón desgastado luce una runa que copiaste cien veces en la torre. La nota al margen es de puño y letra de tu viejo maestro." },
    biomes: null,
    choices: [
      {
        label: { en: "Decipher the full inscription", es: "Descifrar la inscripción completa" },
        icon: "📖",
        apply() {
          setFlag("origin_apprentice_seen");
          const mp = 12;
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          return { en: `The words rearrange themselves for a trained eye. +${mp} MP, +25 XP`, es: `Las palabras se reordenan ante un ojo entrenado. +${mp} MP, +25 XP` };
        }
      },
      {
        label: { en: "Trace the rune and move on", es: "Calcar la runa y seguir" },
        icon: "✍️",
        apply() {
          setFlag("origin_apprentice_seen");
          gameState.player.experience = (gameState.player.experience ?? 0) + 20;
          return { en: "For later study, like the tower taught you. +20 XP", es: "Para estudiarla después, como enseñaba la torre. +20 XP" };
        }
      }
    ]
  },

  {
    id: "origin_mercenary_debt",
    icon: "🪙",
    condition: () => hasFlag("origin_mercenary") && !hasFlag("origin_mercenary_seen"),
    title: { en: "An Old Contract", es: "Un viejo contrato" },
    text: { en: "A scarred veteran squints at you. \"Guild colors, eh? I owe your company from the border war. Never paid my share.\"", es: "Un veterano lleno de cicatrices te escruta. «Colores del gremio, ¿eh? Le debo a tu compañía desde la guerra de la frontera. Nunca pagué mi parte.»" },
    biomes: null,
    choices: [
      {
        label: { en: "Collect the debt", es: "Cobrar la deuda" },
        icon: "💰",
        apply() {
          setFlag("origin_mercenary_seen");
          gameState.player.gold = (gameState.player.gold ?? 0) + 25;
          return { en: "\"A debt's a debt.\" He counts out the coins without complaint. +25 gold", es: "«Una deuda es una deuda.» Cuenta las monedas sin rechistar. +25 oro" };
        }
      },
      {
        label: { en: "Cancel it for a war story", es: "Perdonarla a cambio de una historia" },
        icon: "🍺",
        apply() {
          setFlag("origin_mercenary_seen");
          gameState.player.experience = (gameState.player.experience ?? 0) + 30;
          return { en: "His tale of the border war is worth more than coin. +30 XP", es: "Su historia de la guerra de la frontera vale más que el oro. +30 XP" };
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
    id: "echo_grateful",
    icon: "🍃",
    followUp: true,
    condition: () => hasFlag("echo_freed") && !hasFlag("echo_resolved"),
    title: { en: "The Forest Remembers", es: "El bosque recuerda" },
    text: { en: "A familiar glow weaves between the trees: the echo you freed, whole again. It circles you once, joyful, and lets something fall at your feet.", es: "Un brillo familiar serpentea entre los árboles: el eco que liberaste, entero de nuevo. Te rodea una vez, jubiloso, y deja caer algo a tus pies." },
    biomes: null,
    choices: [
      {
        label: { en: "Pick it up", es: "Recogerlo" },
        icon: "🎁",
        apply() {
          setFlag("echo_resolved");
          gameState.inventory.health_potion = (gameState.inventory.health_potion ?? 0) + 1;
          gameState.player.experience = (gameState.player.experience ?? 0) + 30;
          return { en: "Dew condensed into a potion, still warm with dream-light. +1 Health Potion, +30 XP", es: "Rocío condensado en una poción, aún tibia de luz de sueño. +1 Poción de Salud, +30 XP" };
        }
      },
      {
        label: { en: "Just watch it go", es: "Solo verlo partir" },
        icon: "👋",
        apply() {
          setFlag("echo_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 40;
          return { en: "Some debts are paid in understanding. The forest feels less foreign now. +40 XP", es: "Algunas deudas se pagan en comprensión. El bosque se siente menos ajeno ahora. +40 XP" };
        }
      }
    ]
  },

  {
    id: "echo_silence",
    icon: "🕳️",
    followUp: true,
    condition: () => hasFlag("echo_absorbed") && !hasFlag("echo_resolved"),
    title: { en: "A Silence in the Woods", es: "Un silencio en el bosque" },
    text: { en: "You pass a clearing that should be humming with dream-light. It isn't. The birds skirt around it. You know exactly why.", es: "Pasas junto a un claro que debería vibrar con luz de sueño. No lo hace. Los pájaros lo rodean sin entrar. Sabes exactamente por qué." },
    biomes: null,
    choices: [
      {
        label: { en: "Stop and reflect", es: "Detenerte a reflexionar" },
        icon: "🤔",
        apply() {
          setFlag("echo_resolved");
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          return { en: "Power has a price; today you can name it. You won't forget this clearing. +25 XP", es: "El poder tiene un precio; hoy puedes ponerle nombre. No olvidarás este claro. +25 XP" };
        }
      },
      {
        label: { en: "Walk on without looking", es: "Seguir sin mirar" },
        icon: "🚶",
        apply() {
          setFlag("echo_resolved");
          return { en: "You quicken your pace. The silence follows you a while longer than it should.", es: "Aprietas el paso. El silencio te sigue un rato más de lo que debería." };
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
  },

  // ── SPEC-1107: eventos con riesgo dependiente de clase/origen/stats ─────
  // (roadmap ítem #7) — mismo patrón que "Desprendimiento": la clase o
  // estadística correcta abre una vía segura; cualquier otro build puede
  // arriesgarse igual (55-65% de éxito) al mismo daño real (8-17 HP) que
  // ya usan los eventos de riesgo existentes.
  {
    id: "light_among_trees",
    icon: "🌟",
    title: { en: "A Light Among the Trees", es: "Luz entre los árboles" },
    text: { en: "A soft light flickers between the trunks, drifting closer with every breath. It could be harmless — or it could be a lure.", es: "Una luz suave parpadea entre los troncos, acercándose con cada respiración. Podría ser inofensiva... o un señuelo." },
    biomes: ["forest", "garden", "jungle"],
    choices: [
      {
        label: { en: "Investigate", es: "Investigar" },
        icon: "🔎",
        apply() {
          const p = gameState.player;
          const safe = p.class === "mage" || (p.intelligence ?? 0) >= 12;
          if (safe || Math.random() < 0.6) {
            p.mp = Math.min(p.maxMp, (p.mp ?? 0) + 15);
            p.experience = (p.experience ?? 0) + 20;
            const msg = safe
              ? { en: "You recognize it at once — harmless arcane residue. You study it safely. +15 MP, +20 XP", es: "La reconoces al instante: residuo arcano inofensivo. La estudias sin riesgo. +15 MP, +20 XP" }
              : { en: "It turns out to be harmless residue after all. +15 MP, +20 XP", es: "Resulta ser un residuo inofensivo. +15 MP, +20 XP" };
            return msg;
          }
          const dmg = 10 + Math.floor(Math.random() * 8);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          return { en: `It was a lure — a will-o'-wisp bites at your mind. −${dmg} HP`, es: `Era un señuelo — un fuego fatuo muerde tu mente. −${dmg} HP` };
        }
      },
      {
        label: { en: "Walk past", es: "Seguir de largo" },
        icon: "🚶",
        apply() {
          return { en: "You leave the light behind, unanswered.", es: "Dejas la luz atrás, sin respuesta." };
        }
      }
    ]
  },

  {
    id: "broken_bridge",
    icon: "🌉",
    title: { en: "Broken Bridge", es: "Puente roto" },
    text: { en: "The bridge ahead has collapsed in the middle — only a narrow beam remains, spanning a long drop.", es: "El puente se ha derrumbado en el medio — solo queda una viga angosta, sobre una caída larga." },
    biomes: ["mountain", "jungle", "tundra"],
    choices: [
      {
        label: { en: "Cross the beam", es: "Cruzar por la viga" },
        icon: "🤸",
        apply() {
          const p = gameState.player;
          const safe = p.class === "rogue" || (p.agility ?? 0) >= 12;
          if (safe || Math.random() < 0.6) {
            p.experience = (p.experience ?? 0) + 20;
            const msg = safe
              ? { en: "You cross the beam with practiced ease. +20 XP", es: "Cruzas la viga con soltura de experto. +20 XP" }
              : { en: "You wobble, but make it across. +20 XP", es: "Te tambaleas, pero logras cruzar. +20 XP" };
            return msg;
          }
          const dmg = 10 + Math.floor(Math.random() * 8);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          return { en: `You slip and catch the edge hard on the way down. −${dmg} HP, but you make it across.`, es: `Resbalas y te golpeas fuerte al caer. −${dmg} HP, pero logras cruzar.` };
        }
      },
      {
        label: { en: "Find another way", es: "Buscar otro camino" },
        icon: "🧭",
        apply() {
          return { en: "The detour costs you time, but you arrive unharmed.", es: "El desvío te cuesta tiempo, pero llegas ileso." };
        }
      }
    ]
  },

  {
    id: "ancient_altar",
    icon: "🗿",
    title: { en: "Ancient Altar", es: "Altar antiguo" },
    text: { en: "Runes cover a weathered altar, still humming faintly with old power. Reading them wrong could wake something.", es: "Runas cubren un altar desgastado, aún vibrando débilmente con poder antiguo. Leerlas mal podría despertar algo." },
    biomes: ["ruin", "dungeon", "catacomb"],
    choices: [
      {
        label: { en: "Study the runes", es: "Estudiar las runas" },
        icon: "📖",
        apply() {
          const p = gameState.player;
          const safe = hasFlag("origin_apprentice") || (p.intelligence ?? 0) >= 12;
          if (safe || Math.random() < 0.55) {
            p.mp = Math.min(p.maxMp, (p.mp ?? 0) + 12);
            p.experience = (p.experience ?? 0) + 25;
            const msg = safe
              ? { en: "You decipher the runes with ease. The altar's power settles calmly. +12 MP, +25 XP", es: "Descifras las runas sin esfuerzo. El poder del altar se calma. +12 MP, +25 XP" }
              : { en: "You piece the meaning together just in time. +12 MP, +25 XP", es: "Logras entender el significado justo a tiempo. +12 MP, +25 XP" };
            return msg;
          }
          const dmg = 10 + Math.floor(Math.random() * 8);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          return { en: `You misread a rune — a ward flares and burns you. −${dmg} HP`, es: `Lees mal una runa — una salvaguarda estalla y te quema. −${dmg} HP` };
        }
      },
      {
        label: { en: "Leave it undisturbed", es: "Dejarlo en paz" },
        icon: "🙏",
        apply() {
          return { en: "Whatever sleeps here, you let it sleep.", es: "Lo que sea que duerme aquí, lo dejas dormir." };
        }
      }
    ]
  },

  {
    id: "wounded_enemy",
    icon: "🩹",
    title: { en: "A Wounded Enemy", es: "Un enemigo herido" },
    text: { en: "A creature lies in the road, too hurt to fight. It watches you, waiting to see what you'll do.", es: "Una criatura yace en el camino, demasiado herida para luchar. Te observa, esperando a ver qué haces." },
    biomes: null,
    choices: [
      {
        label: { en: "Finish it off", es: "Rematarlo" },
        icon: "⚔️",
        apply() {
          setFlag("wounded_enemy_killed");
          const gold = 10 + Math.floor(Math.random() * 11);
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          gameState.player.experience = (gameState.player.experience ?? 0) + 5;
          return { en: `A quick, cold end. You find ${gold} gold on it. +5 XP`, es: `Un final rápido y frío. Le encuentras ${gold} de oro. +5 XP` };
        }
      },
      {
        label: { en: "Let it go", es: "Dejarlo ir" },
        icon: "🕊️",
        apply() {
          setFlag("wounded_enemy_spared");
          const p = gameState.player;
          const safe = p.class === "warrior" || (p.strength ?? 0) >= 12;
          if (safe || Math.random() < 0.55) {
            p.experience = (p.experience ?? 0) + 15;
            const msg = safe
              ? { en: "You back away in full control. It limps into the brush. +15 XP", es: "Retrocedes con pleno control. Se aleja cojeando hacia la maleza. +15 XP" }
              : { en: "It slips away into the brush without incident. +15 XP", es: "Se escabulle hacia la maleza sin incidentes. +15 XP" };
            return msg;
          }
          const dmg = 8 + Math.floor(Math.random() * 7);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          p.experience = (p.experience ?? 0) + 5;
          return { en: `It lashes out as you turn — −${dmg} HP — then flees. +5 XP`, es: `Ataca cuando te das vuelta — −${dmg} HP — y luego huye. +5 XP` };
        }
      }
    ]
  },

  // ── Expansión de variedad (auditoría de jugabilidad 2026-08-27, hallazgo
  // bajo #7): ruinas/catacumbas/volcán/desierto/playa tenían muy pocos
  // eventos propios frente a los universales — el jugador veía repeticiones
  // mucho antes de terminar una partida típica. 8 eventos nuevos, mismo
  // patrón y escala de riesgo/recompensa que los ya existentes. ─────────
  {
    id: "sealed_sarcophagus",
    icon: "⚱️",
    title: { en: "Sealed Sarcophagus", es: "Sarcófago sellado" },
    text: { en: "A stone sarcophagus, sealed for centuries, radiates a faint chill. The lid isn't fully closed.", es: "Un sarcófago de piedra, sellado por siglos, irradia un frío tenue. La tapa no está del todo cerrada." },
    biomes: ["catacomb", "ruin"],
    choices: [
      {
        label: { en: "Pry it open", es: "Forzar la tapa" },
        icon: "🔓",
        apply() {
          if (Math.random() < 0.5) {
            const gold = 20 + Math.floor(Math.random() * 21);
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return { en: `Ancient grave goods, untouched. +${gold} gold`, es: `Ofrendas funerarias intactas. +${gold} oro` };
          }
          const dmg = 10;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `A curse-ward flares as the seal breaks. −${dmg} HP`, es: `Una salvaguarda maldita estalla al romperse el sello. −${dmg} HP` };
        }
      },
      {
        label: { en: "Leave the dead in peace", es: "Dejar a los muertos en paz" },
        icon: "🙏",
        apply() {
          return { en: "Whatever rests here, you let it rest.", es: "Lo que sea que descanse ahí, lo dejas descansar." };
        }
      }
    ]
  },

  {
    id: "fallen_statue",
    icon: "👑",
    title: { en: "The Fallen King", es: "El rey caído" },
    text: { en: "A toppled statue of a forgotten king lies face-down in the rubble, one hand still clutching a shattered scepter.", es: "La estatua caída de un rey olvidado yace boca abajo entre los escombros, una mano todavía aferrada a un cetro roto." },
    biomes: ["ruin"],
    choices: [
      {
        label: { en: "Study the inscription at its base", es: "Estudiar la inscripción de la base" },
        icon: "📖",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 25;
          return { en: "A name history erased, and why. The knowledge unsettles you a little. +25 XP", es: "Un nombre que la historia borró, y por qué. El saber te inquieta un poco. +25 XP" };
        }
      },
      {
        label: { en: "Take the scepter fragment", es: "Tomar el fragmento del cetro" },
        icon: "💰",
        apply() {
          const gold = 20;
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return { en: `Old gold is still gold. +${gold} gold`, es: `El oro viejo sigue siendo oro. +${gold} oro` };
        }
      }
    ]
  },

  {
    id: "catacomb_whispers",
    icon: "👻",
    title: { en: "Whispers in the Dark", es: "Susurros en la oscuridad" },
    text: { en: "Voices murmur from the walls, just at the edge of hearing. They seem to be saying your name.", es: "Voces murmuran desde las paredes, justo al borde de lo audible. Parecen decir tu nombre." },
    biomes: ["catacomb"],
    choices: [
      {
        label: { en: "Listen closely", es: "Escuchar con atención" },
        icon: "👂",
        apply() {
          const p = gameState.player;
          const safe = p.class === "mage" || (p.intelligence ?? 0) >= 12;
          if (safe || Math.random() < 0.55) {
            p.mp = Math.min(p.maxMp, (p.mp ?? 0) + 10);
            p.experience = (p.experience ?? 0) + 15;
            const msg = safe
              ? { en: "A trained mind sorts the whispers from the noise — old echoes, nothing more. +10 MP, +15 XP", es: "Una mente entrenada separa los susurros del ruido — ecos viejos, nada más. +10 MP, +15 XP" }
              : { en: "Just echoes of old grief, not a warning. +10 MP, +15 XP", es: "Solo ecos de un viejo duelo, no una advertencia. +10 MP, +15 XP" };
            return msg;
          }
          const dmg = 8 + Math.floor(Math.random() * 8);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          return { en: `A whisper claws at your mind. −${dmg} HP`, es: `Un susurro araña tu mente. −${dmg} HP` };
        }
      },
      {
        label: { en: "Cover your ears and hurry past", es: "Taparte los oídos y apurar el paso" },
        icon: "🏃",
        apply() {
          gameState.player.experience = (gameState.player.experience ?? 0) + 5;
          return { en: "Better not to know. +5 XP", es: "Mejor no saber. +5 XP" };
        }
      }
    ]
  },

  {
    id: "ash_vent",
    icon: "💨",
    title: { en: "Ash Vent", es: "Grieta de ceniza" },
    text: { en: "A vent in the rock hisses super-heated ash. Something glints within the cloud.", es: "Una grieta en la roca exhala ceniza sobrecalentada. Algo brilla dentro de la nube." },
    biomes: ["volcano"],
    choices: [
      {
        label: { en: "Reach into the ash", es: "Meter la mano en la ceniza" },
        icon: "🖐️",
        apply() {
          if (Math.random() < 0.55) {
            const gold = 15 + Math.floor(Math.random() * 16);
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return { en: `Volcanic glass, prized by alchemists. +${gold} gold`, es: `Vidrio volcánico, apreciado por los alquimistas. +${gold} oro` };
          }
          const dmg = 8 + Math.floor(Math.random() * 9);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `The ash burns worse than it looks. −${dmg} HP`, es: `La ceniza quema más de lo que parece. −${dmg} HP` };
        }
      },
      {
        label: { en: "Skirt around it", es: "Rodearla" },
        icon: "🚶",
        apply() {
          return { en: "Not worth the burn. You continue on.", es: "No vale la pena quemarse. Sigues adelante." };
        }
      }
    ]
  },

  {
    id: "sleeping_salamander",
    icon: "🦎",
    title: { en: "Sleeping Salamander", es: "Salamandra dormida" },
    text: { en: "A massive fire salamander sleeps curled around a nest of smoldering gems.", es: "Una salamandra de fuego enorme duerme enroscada sobre un nido de gemas humeantes." },
    biomes: ["volcano"],
    choices: [
      {
        label: { en: "Steal a gem quietly", es: "Robar una gema sin hacer ruido" },
        icon: "🤏",
        apply() {
          const p = gameState.player;
          const safe = p.class === "rogue" || (p.agility ?? 0) >= 12;
          if (safe || Math.random() < 0.6) {
            const gold = 25 + Math.floor(Math.random() * 21);
            p.gold = (p.gold ?? 0) + gold;
            const msg = safe
              ? { en: `Not even a scale twitches. +${gold} gold`, es: `Ni una escama se mueve. +${gold} oro` }
              : { en: `Your hand is steadier than you expected. +${gold} gold`, es: `Tu mano está más firme de lo que esperabas. +${gold} oro` };
            return msg;
          }
          const dmg = 12 + Math.floor(Math.random() * 9);
          p.hp = Math.max(1, (p.hp ?? 0) - dmg);
          return { en: `It snaps awake, furious. −${dmg} HP, but you escape with nothing.`, es: `Despierta de golpe, furiosa. −${dmg} HP, pero escapas con las manos vacías.` };
        }
      },
      {
        label: { en: "Let it sleep", es: "Dejarla dormir" },
        icon: "😴",
        apply() {
          return { en: "Some treasures aren't worth waking a dragon's cousin for.", es: "Algunos tesoros no valen la pena si hay que despertar a un primo de dragón." };
        }
      }
    ]
  },

  {
    id: "gleaming_shell",
    icon: "🐚",
    title: { en: "Gleaming Shell", es: "Concha reluciente" },
    text: { en: "Something catches the sun in the wet sand — a shell unlike any you've seen, humming faintly.", es: "Algo refleja el sol en la arena mojada — una concha como nunca viste, vibrando levemente." },
    biomes: ["beach"],
    choices: [
      {
        label: { en: "Pick it up", es: "Recogerla" },
        icon: "🐚",
        apply() {
          const gold = 15;
          gameState.player.gold = (gameState.player.gold ?? 0) + gold;
          return { en: `A collector in town would pay well for this. +${gold} gold`, es: `Un coleccionista del pueblo pagaría bien por esto. +${gold} oro` };
        }
      },
      {
        label: { en: "Leave it for the tide", es: "Dejarla para la marea" },
        icon: "🌊",
        apply() {
          return { en: "The sea gave it, the sea can keep it.", es: "El mar la dio, el mar se la queda." };
        }
      }
    ]
  },

  {
    id: "desert_caravan_ruins",
    icon: "🐫",
    title: { en: "Lost Caravan", es: "Caravana perdida" },
    text: { en: "The bones of camels and broken wagon wheels mark a caravan that never finished its crossing.", es: "Huesos de camellos y ruedas de carreta rotas marcan una caravana que nunca terminó de cruzar." },
    biomes: ["desert"],
    choices: [
      {
        label: { en: "Search the wreckage", es: "Registrar los restos" },
        icon: "🔍",
        apply() {
          if (Math.random() < 0.55) {
            const gold = 20 + Math.floor(Math.random() * 16);
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return { en: `Coins scattered under the sand. +${gold} gold`, es: `Monedas dispersas bajo la arena. +${gold} oro` };
          }
          const dmg = 8 + Math.floor(Math.random() * 7);
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `A scorpion nest was using the wreck for shade. −${dmg} HP`, es: `Un nido de escorpiones usaba los restos como sombra. −${dmg} HP` };
        }
      },
      {
        label: { en: "Move on, respectfully", es: "Seguir, con respeto" },
        icon: "🙏",
        apply() {
          return { en: "Whoever they were, they deserve to rest undisturbed.", es: "Quienesquiera que fueran, merecen descansar sin que los molesten." };
        }
      }
    ]
  },

  {
    id: "cruel_mirage",
    icon: "🌀",
    title: { en: "Cruel Mirage", es: "Espejismo cruel" },
    text: { en: "Shapes shimmer on the horizon — water, shade, a city of glass. The desert loves to lie.", es: "Formas titilan en el horizonte — agua, sombra, una ciudad de cristal. Al desierto le encanta mentir." },
    biomes: ["desert"],
    choices: [
      {
        label: { en: "Chase it", es: "Perseguirlo" },
        icon: "🏃",
        apply() {
          if (Math.random() < 0.45) {
            const gold = 15;
            gameState.player.gold = (gameState.player.gold ?? 0) + gold;
            return { en: `Real, this time — a buried supply cache. +${gold} gold`, es: `Real, esta vez — un alijo de provisiones enterrado. +${gold} oro` };
          }
          const dmg = 10;
          gameState.player.hp = Math.max(1, (gameState.player.hp ?? 0) - dmg);
          return { en: `Just sand, and precious energy wasted chasing it. −${dmg} HP`, es: `Solo arena, y energía preciosa desperdiciada persiguiéndolo. −${dmg} HP` };
        }
      },
      {
        label: { en: "Trust your instincts and rest instead", es: "Confiar en tu instinto y descansar" },
        icon: "🧘",
        apply() {
          const hp = 8, mp = 5;
          gameState.player.hp = Math.min(gameState.player.maxHp, (gameState.player.hp ?? 0) + hp);
          gameState.player.mp = Math.min(gameState.player.maxMp, (gameState.player.mp ?? 0) + mp);
          return { en: `You know better than to chase ghosts. +${hp} HP, +${mp} MP`, es: `Sabes que no hay que perseguir fantasmas. +${hp} HP, +${mp} MP` };
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
      // SPEC-1110: toast de "decisión importante" — cualquier flag nuevo
      // de MORAL_DECISIONS que esta elección acabe de marcar por primera
      // vez, sin curar una lista nueva de qué es "importante".
      const before = MORAL_DECISIONS.map(d => !!gameState.worldFlags?.[d.flag]);
      const resultText = choice.apply();
      MORAL_DECISIONS.forEach((d, i) => {
        if (!before[i] && gameState.worldFlags?.[d.flag]) {
          showToast(t(d.recapKey), "decision");
        }
      });
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
  const close = () => {
    modal.classList.add("hidden");
    gameState.isProcessingMove = false;
    updateUI();
    window.dispatchEvent(new Event("pixel:travelEventClosed"));
  };
  continueBtn.addEventListener("click", close);
  modal.addEventListener("click", e => {
    if (e.target === modal) close();
  });
}
