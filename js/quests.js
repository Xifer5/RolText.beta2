/**
 * quests.js — Sistema de misiones de Pixel Quest Echoes
 *
 * Tipos de condición:
 *   "visit"   — el jugador ha estado en cierta locationId
 *   "collect" — el jugador tiene ≥ qty de un ítem en inventario
 *   "kill"    — el jugador ha matado ≥ count de cierto enemigo
 */
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { allItems } from "./items.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { t, formatText, localizeText } from "./i18n.js";
import { maybeShowHint } from "./onboarding.js";

// ── DEFINICIONES ───────────────────────────────────────────────────
export const QUEST_DATA = {

  explore_forest: {
    id: "explore_forest",
    title: { en: "The Valdris Forest", es: "El Bosque de Valdris" },
    type: "visit",
    target: "forest_3",
    reward: { item: "world_map", xp: 50, gold: 30 },
    dialogues: {
      inactive: [
        { en: "Traveler, the Valdris Forest hides something that should not exist.", es: "Viajero, el Bosque de Valdris oculta algo que no debería existir." },
        { en: "Would you dare to venture to its heart and return with what you discover?", es: "¿Tendrías el valor de adentrarte hasta su corazón y regresar con lo que descubras?" }
      ],
      active: [
        { en: "The forest's heart still waits for you.", es: "El corazón del bosque aún te espera." },
        { en: "Head north from here. Valdris Forest is the third zone.", es: "Sigue hacia el norte desde aquí. El Bosque de Valdris es la tercera zona." }
      ],
      completed: [
        { en: "You have seen it with your own eyes. Darkness grows.", es: "Lo has visto con tus propios ojos. La oscuridad crece." },
        { en: "Take this World Map — it will reveal paths you don't yet know.", es: "Toma este Mapa del Mundo — te mostrará caminos que aún no conoces." }
      ]
    }
  },

  collect_crystal: {
    id: "collect_crystal",
    title: { en: "The Arcane Shard", es: "El Fragmento Arcano" },
    type: "collect",
    item: "crystal_shard",
    qty: 1,
    consumeItem: false,
    reward: { item: "arcane_key", xp: 120, gold: 80 },
    dialogues: {
      inactive: [
        { en: "The Eldrast Ruins are sealed by ancient magic. Only an Arcane Key can open them.", es: "Las Ruinas de Eldrast están selladas con magia antigua. Solo una Llave Arcana puede abrirlas." },
        { en: "I can forge it, but I need a Crystal Shard from the deep caverns. Will you fetch it?", es: "Yo puedo forjarla, pero necesito un Crystal Shard de las cavernas profundas. ¿Lo conseguirás?" }
      ],
      active: [
        { en: "You still don't have the Crystal Shard.", es: "Todavía no tienes el Crystal Shard." },
        { en: "Search the Echo Caves and Ironcroft Dungeons.", es: "Búscalo en las Cavernas del Eco y las Mazmorras de Ironcroft." }
      ],
      completed: [
        { en: "Excellent. With this I forge the Arcane Key.", es: "Excelente. Con esto forjo la Llave Arcana." },
        { en: "The Eldrast Ruins await you — be careful. What sleeps there has not been disturbed for centuries.", es: "Las Ruinas de Eldrast te esperan — pero ten cuidado. Lo que duerme allí lleva siglos sin ser perturbado." }
      ]
    }
  },

  kill_pirates: {
    id: "kill_pirates",
    title: { en: "Pirate Coast", es: "La Costa de los Piratas" },
    type: "kill",
    enemy: "pirate",
    count: 3,
    reward: { item: "navigation_chart", xp: 100, gold: 120 },
    dialogues: {
      inactive: [
        { en: "Damned pirates. They have blocked all underground access to the Areth Catacombs.", es: "Malditos piratas. Han bloqueado todos los accesos subterráneos a las Catacumbas de Areth." },
        { en: "Defeat three of them on the Siren Coast and I will give you the Navigation Chart.", es: "Derrota a tres de ellos en la Costa de las Sirenas y te daré la Carta de Navegación." }
      ],
      active_template: { en: "Keep fighting. You need to defeat {remaining} more pirate(s) on the Siren Coast.", es: "Sigue luchando. Necesitas derrotar a {remaining} pirata(s) más en la Costa de las Sirenas." },
      completed: [
        { en: "The pirates are retreating!", es: "¡Los piratas están en retirada!" },
        { en: "Take the Navigation Chart — it will open your way to the Areth Catacombs.", es: "Toma la Carta de Navegación — te abrirá paso a las Catacumbas de Areth." }
      ]
    }
  },

  collect_fairy_dust: {
    id: "collect_fairy_dust",
    title: { en: "Fairy Dust", es: "El Polvo de las Hadas" },
    type: "collect",
    item: "fairy_dust",
    qty: 1,
    consumeItem: false,
    reward: { item: "garden_key", xp: 80, gold: 50 },
    dialogues: {
      inactive: [
        { en: "The Forgotten Vault can only be opened with the essence of this garden.", es: "La Bóveda Olvidada solo puede abrirse con la esencia de este jardín." },
        { en: "A little Fairy Dust will be enough. It blooms here if you dare to seek it among the creatures guarding it.", es: "Un poco de Fairy Dust sería suficiente. Florece aquí mismo, si te atreves a buscarlo entre las criaturas que lo custodian." }
      ],
      active: [
        { en: "Fairy Dust blooms in this garden.", es: "El Fairy Dust florece en este jardín." },
        { en: "Defeat the creatures guarding it and return to me.", es: "Derrota a las criaturas que lo guardan y regresa conmigo." }
      ],
      completed: [
        { en: "Beautiful. The garden's essence hums with primal magic.", es: "Precioso. La esencia del jardín vibra con magia primordial." },
        { en: "Take this Garden Key — it will open the Forgotten Vault.", es: "Toma esta Llave del Jardín — abrirá La Bóveda Olvidada." }
      ]
    }
  },

  collect_ice_crystal: {
    id: "collect_ice_crystal",
    title: { en: "Frozen Crystal", es: "El Cristal Helado" },
    type: "collect",
    item: "ice_crystal",
    qty: 1,
    consumeItem: false,
    reward: { item: "mountain_pass", xp: 150, gold: 100 },
    dialogues: {
      inactive: [
        { en: "Beyond the Eternal Summit lies the Endless Tundra — but the cold kills the reckless.", es: "Más allá de la Cumbre Eterna está la Tundra Eterna — pero el frío mata a los imprudentes." },
        { en: "Bring me an Ice Crystal and I will forge a Mountain Pass. Giants and golems on those peaks carry it.", es: "Dame un Ice Crystal y forjaré un Pase de Montaña. Los gigantes y golems de estas cimas lo portan." }
      ],
      active: [
        { en: "Without the Ice Crystal I cannot forge the pass.", es: "Sin el Ice Crystal no puedo forjar el pase." },
        { en: "Keep exploring the Iron Ridges. The crystal is carried by giants and golems there.", es: "Sigue explorando las Crestas de Hierro. El cristal lo portan los gigantes y golems del lugar." }
      ],
      completed: [
        { en: "Perfect. Take the Mountain Pass.", es: "Perfecto. Toma el Pase de Montaña." },
        { en: "The Endless Tundra is brutal, adventurer — but I trust you are ready for what comes.", es: "La Tundra Eterna es brutal, aventurero — pero confío en que estás listo para lo que viene." }
      ]
    }
  },

  defeat_dark_lord: {
    id: "defeat_dark_lord",
    title: { en: "The Dark Lord", es: "El Señor Oscuro" },
    type: "visit",
    target: "dungeon_7",
    reward: { item: "dragon_key", xp: 300, gold: 200 },
    dialogues: {
      inactive: [
        { en: "The Dragon King can only be defeated by someone who has already stared into the Dark Lord's eyes.", es: "El Rey Dragón solo puede ser vencido por alguien que ya haya mirado a los ojos al Señor Oscuro." },
        { en: "Have you reached the Dark Lord's Chamber in the Ironcroft Dungeons?", es: "¿Has llegado a la Cámara del Señor Oscuro en las Mazmorras de Ironcroft?" }
      ],
      active: [
        { en: "You must reach the Dark Lord's Chamber, deep within Ironcroft.", es: "Debes llegar a la Cámara del Señor Oscuro, en las profundidades de Ironcroft." },
        { en: "Only then will I give you the Dragon Key and you can open the Dragon Gate.", es: "Solo entonces te daré la Llave del Dragón y podrás abrir la Puerta del Dragón." }
      ],
      completed: [
        { en: "Impressive. Few souls survive Ironcroft's dungeons.", es: "Impresionante. Pocas almas sobreviven a las Mazmorras de Ironcroft." },
        { en: "Take the Dragon Key. The Dragon King's Throne awaits you.", es: "Toma la Llave del Dragón. El Trono del Rey Dragón te espera." },
        { en: "The fate of Aetheria is in your hands.", es: "El destino de Aetheria está en tus manos." }
      ]
    }
  },

  // ── MISIONES PRINCIPALES — El Último Sueño del Dragón ─────────────

  mq_01_la_cancion: {
    id: "mq_01_la_cancion",
    title: { en: "The Song of the World", es: "La Canción del Mundo" },
    type: "visit",
    target: "forest_1",
    reward: { item: "ancient_relic", xp: 50 },
    dialogues: {
      inactive: [
        { en: "Tonight, during the Feast of First Snows, a girl named Mara asked me how her grandmother's old song continued: 'When eight lights guard the sky…' Neither she nor I know the rest.", es: "Esta noche, durante la Fiesta de las Primeras Nieves, una niña llamada Mara me preguntó cómo seguía una vieja canción de su abuela: 'Cuando ocho luces guarden el cielo…' Ni ella ni yo conocemos el resto." },
        { en: "Soon after, the bells rang on their own. I heard your name in a dream, adventurer.", es: "Poco después, las campanas sonaron solas. Escuché tu nombre en un sueño, aventurero." },
        { en: "The stars weep and the dragon dreams of fire. Only one who hears the echo of the world can restore the song. Take this… it will react when you are near the truth.", es: "Las estrellas lloran y el dragón sueña con fuego. Solo quien escuche el eco del mundo podrá restaurar la canción. Toma esto… reaccionará cuando estés cerca de la verdad." },
        { en: "Begin in the Valdris Forest, to the north. The echo will guide you.", es: "Empieza en el Bosque de Valdris, al norte. El eco te guiará." }
      ],
      active: [
        { en: "The Valdris Forest awaits you. Head north from Oakhaven.", es: "El Bosque de Valdris te aguarda. Sigue al norte desde Oakhaven." },
        { en: "Before you left, a beast from the forest attacked the village. As it fell, it whispered something it should not have known to say: 'Don't let them erase it again.'", es: "Antes de que partieras, una bestia del bosque atacó el pueblo. Al caer, susurró algo que no debía saber decir: 'No dejes que vuelvan a borrarlo.'" }
      ],
      completed: [
        { en: "You have taken the first step. The relic in your hands trembles… the guardian still breathes.", es: "Has dado el primer paso. La reliquia en tus manos tiembla… el guardián aún respira." },
        { en: "Whatever you find out there, remember: you did not go to save the world. You went to listen to it.", es: "Sea lo que sea que encuentres ahí fuera, recuerda: no fuiste a salvar el mundo. Fuiste a escucharlo." }
      ]
    }
  },

  mq_02_los_sellos: {
    id: "mq_02_los_sellos",
    title: { en: "The Guardian's Seals", es: "Los Sellos del Guardián" },
    type: "kill",
    enemy: "forest_titan",
    count: 1,
    reward: { xp: 200, gold: 150 },
    prerequisiteQuest: "mq_01_la_cancion",
    dialogues: {
      locked: [
        { en: "I haven't finished my analysis yet. Come back when you've ventured into the forest.", es: "No he terminado mi análisis todavía. Vuelve cuando hayas adentrado en el bosque." }
      ],
      inactive: [
        { en: "The arcane fragments I study carry the signature of an ancient essence.", es: "Los fragmentos arcanos que estudio llevan la firma de una esencia antigua." },
        { en: "Someone — or something — divided its soul into eight parts. If all those seals shatter at once… the world will lose its magic. I must ask something difficult of you.", es: "Alguien — o algo — dividió su alma en ocho partes. Si esos sellos se rompen todos a la vez… el mundo quedará sin magia. Debo pedirte algo difícil." },
        { en: "The Forest Titan is the first wound of the guardian. Defeat it. And listen to what it says as it falls.", es: "El Titán del Bosque es la primera herida del guardián. Derrótalo. Y escucha lo que diga al caer." }
      ],
      active: [
        { en: "The Forest Titan roams the deep heart of the Valdris Forest.", es: "El Titán del Bosque vaga por el corazón profundo del Bosque de Valdris." },
        { en: "It will not be easy. But it is necessary.", es: "No será fácil. Pero es necesario." }
      ],
      completed: [
        { en: "Extraordinary. The Titan fell... but did you hear what it said? 'The dragon is crying.'", es: "Extraordinario. El titán cayó… ¿pero escuchaste lo que dijo? 'El dragón está llorando.'" },
        { en: "This confirms everything I suspected. The guardians are not corrupted — they are grieving.", es: "Esto confirma todo lo que sospechaba. Los guardianes no están corrompidos — están de luto." },
        { en: "Listen — as you find the other seals, bring them to me. Someone must keep them together, away from careless hands. I only want to understand them. I swear it.", es: "Escucha — a medida que encuentres los demás sellos, tráemelos a mí. Alguien debe mantenerlos juntos, lejos de manos descuidadas. Solo quiero comprenderlos. Lo juro." }
      ]
    }
  },

  mq_03_ecos: {
    id: "mq_03_ecos",
    title: { en: "Echoes of the Past", es: "Ecos del Pasado" },
    type: "collect",
    item: "ancient_core",
    qty: 1,
    consumeItem: false,
    reward: { item: "garden_key", xp: 250, gold: 100 },
    prerequisiteQuest: "mq_02_los_sellos",
    dialogues: {
      locked: [
        { en: "The garden is quiet today. Come back when you have learned more of the world.", es: "El jardín está en silencio hoy. Ven cuando hayas aprendido más del mundo." }
      ],
      inactive: [
        { en: "Dragons also feel lonely, you know? Asterion played here with us when the world was young.", es: "Los dragones también se sienten solos, ¿sabes? Asterion jugaba aquí con nosotras cuando el mundo era joven." },
        { en: "He taught us how to make stars bloom. But one day he stopped coming… and the garden began to wither.", es: "Nos enseñó a hacer florecer las estrellas. Pero un día dejó de venir… y el jardín empezó a marchitarse." },
        { en: "An Ancient Core still holds his memory. The creatures guarding this garden carry it.", es: "Un Núcleo Antiguo aún guarda su recuerdo. Las criaturas que custodian este jardín lo portan." }
      ],
      active: [
        { en: "The Ancient Core rests within this garden. Defeat the creatures guarding it.", es: "El Núcleo Antiguo descansa en este jardín. Derrota las criaturas que lo custodian." }
      ],
      completed: [
        { en: "Yes… I can feel it. An echo of joy. Of play. Of an age when everything was alive.", es: "Sí… puedo sentirlo. Un eco de alegría. De juego. De una época en que todo estaba vivo." },
        { en: "This was the last memory I had of his voice. Now it belongs to the key in your hands, not to me anymore.", es: "Este era el último recuerdo que tenía de su voz. Ahora le pertenece a la llave que llevas, no a mí." },
        { en: "Tell me... was he kind?", es: "Dime... ¿era bondadoso?" },
        { en: "Take this Garden Key. The Forgotten Vault holds more of his memories. Perhaps they will show you how to reach him.", es: "Toma esta Llave del Jardín. La Bóveda Olvidada guarda más de sus recuerdos. Quizás te muestren cómo llegar a él." }
      ]
    }
  },

  mq_04_la_verdad: {
    id: "mq_04_la_verdad",
    title: { en: "The Truth of Eldrast", es: "La Verdad de Eldrast" },
    type: "visit",
    target: "ruin_4",
    reward: { item: "arcane_relic", xp: 300 },
    prerequisiteQuest: "mq_03_ecos",
    dialogues: {
      locked: [
        { en: "You have not yet gathered the echoes from the garden. Eryndel is waiting for you.", es: "Aún no has recogido los ecos del jardín. Eryndel te espera." }
      ],
      inactive: [
        { en: "The Ancient Construct in the Eldrast Ruins holds the truth we have been missing.", es: "El Constructo Antiguo en las Ruinas de Eldrast guarda la verdad que nos ha faltado." },
        { en: "It will not speak willingly. But when it falls, it will have no choice. Bring the Arcane Key with you.", es: "No hablará de buena gana. Pero cuando caiga, no tendrá elección. Lleva la Llave Arcana contigo." },
        { en: "Find the Dead Square in the ruins. What sleeps there has waited a long time for someone to hear it.", es: "Encuentra la Plaza de los Muertos en las ruinas. Lo que duerme allí ha esperado mucho tiempo a que alguien lo escuche." }
      ],
      active: [
        { en: "The Eldrast Ruins lie east of the dungeons. Reach the Dead Square.", es: "Las Ruinas de Eldrast están al este de las mazmorras. Llega a la Plaza de los Muertos." }
      ],
      completed: [
        { en: "'Asterion is not destroying the world. The world is killing him.' I knew it.", es: "'Asterion no destruye el mundo. El mundo lo está matando.' Lo sabía." },
        { en: "When I too understand his memories, I will be able to make sure no one repeats this mistake. Not the dragon. Not us.", es: "Cuando yo también comprenda sus recuerdos, podré asegurarme de que nadie vuelva a cometer este error. Ni el dragón. Ni nosotros." },
        { en: "The Dragon Gate exists. Seek Pyrax at the Eternal Volcano — he has guarded that door since the first eruption.", es: "La Puerta del Dragón existe. Busca a Pyrax en el Volcán Eterno — él ha custodiado esa puerta desde la primera erupción." }
      ]
    }
  },

  mq_05_el_ultimo_sueno: {
    id: "mq_05_el_ultimo_sueno",
    title: { en: "The Last Dream", es: "El Último Sueño" },
    type: "visit",
    target: "inferno_1",
    reward: { xp: 500, gold: 300 },
    prerequisiteQuest: "mq_04_la_verdad",
    dialogues: {
      locked: [
        { en: "The Gate cannot be opened yet. First learn the truth of Eldrast.", es: "La Puerta no puede abrirse todavía. Primero aprende la verdad de Eldrast." }
      ],
      inactive: [
        { en: "I feared this day. The Dragon Gate only opens when the world is ready to remember.", es: "Temía este día. La Puerta del Dragón solo se abre cuando el mundo está listo para recordar." },
        { en: "And you… carry the echo in your hands. Go. But do not go to kill the dragon. Go to listen to him.", es: "Y tú… llevas el eco en tus manos. Ve. Pero no vayas a matar al dragón. Ve a escucharlo." },
        { en: "You will need the three keys — Arcane, Garden, Dragon. Only then will the Throne open.", es: "Necesitarás las tres llaves — Arcana, Jardín, Dragón. Solo entonces se abrirá el Trono." }
      ],
      active: [
        { en: "Beyond the Infernal Threshold lies the Dragon King's Throne. Carry the three keys.", es: "Más allá del Umbral del Infierno está el Trono del Rey Dragón. Lleva las tres llaves." },
        { en: "You will not find a king behind that door. You will find everything a king was unable to forgive himself for.", es: "No hallarás un rey detrás de esa puerta. Hallarás todo aquello que un rey fue incapaz de perdonarse." }
      ],
      completed: [
        { en: "You have seen it. You have heard it. The dragon's last dream… is over.", es: "Lo has visto. Lo has escuchado. El último sueño del dragón… ha terminado." },
        { en: "Aetheria will remember. Not his name, perhaps. But his hope.", es: "Aetheria recordará. No su nombre, quizás. Pero sí su esperanza." }
      ]
    }
  }

};

// ── FUNCIONES DE ESTADO ────────────────────────────────────────────

/** @returns {"inactive"|"active"|"completed"} */
export function getQuestStatus(questId) {
  return gameState.quests?.[questId] ?? "inactive";
}

// SPEC-1224: ¿hay una misión activa de tipo "kill" apuntando a este enemigo?
// Usado por movement.js para aumentar la chance de encontrar al jefe de
// zona correspondiente mientras el jugador lo está cazando por misión (ej.
// mq_02_los_sellos de Valdris → forest_titan). Genérico a propósito: cubre
// cualquier misión "kill" futura sin tocar movement.js de nuevo.
export function hasActiveKillQuestFor(enemyId) {
  return Object.values(QUEST_DATA).some(q =>
    q.type === "kill" && q.enemy === enemyId && getQuestStatus(q.id) === "active"
  );
}

// SPEC-1233: mismo patrón que hasActiveKillQuestFor, pero para misiones
// "collect". Usado por lootTables.js para subir la chance de drop del ítem
// pedido mientras la misión está activa (ej. mq_03_ecos de Eryndel →
// ancient_core en garden/ruins) -- antes de aceptar la misión, el ítem
// dropea a su tasa normal; al aceptarla, sube. Genérico a propósito.
export function hasActiveCollectQuestFor(itemId) {
  return Object.values(QUEST_DATA).some(q =>
    q.type === "collect" && q.item === itemId && getQuestStatus(q.id) === "active"
  );
}

/** Activa una misión (inactive → active) */
export function activateQuest(questId) {
  if (!gameState.quests) gameState.quests = {};
  const q = QUEST_DATA[questId];
  if (q?.prerequisiteQuest && getQuestStatus(q.prerequisiteQuest) !== "completed") return;
  if (!gameState.quests[questId] || gameState.quests[questId] === "inactive") {
    gameState.quests[questId] = "active";
    maybeShowHint("quest_tracker"); // SPEC-0801: primera misión aceptada
  }
}

// SPEC-1109: "rumores" — objetivos secundarios por partida (roadmap ítem
// #9). Son las mismas 6 misiones secundarias de siempre (nunca las
// principales, que sí tienen prerequisiteQuest y dependen de la historia),
// pero auto-activadas al empezar la run en vez de esperar a hablar con un
// NPC — la fantasía de "ya oíste el rumor, no necesitás que alguien te lo
// cuente". Reusa por completo activateQuest()/checkQuestCondition()/
// completeQuest() y el tracker ya existentes, sin sistema paralelo.
export const RUMOR_POOL = [
  "explore_forest", "collect_crystal", "kill_pirates",
  "collect_fairy_dust", "collect_ice_crystal", "defeat_dark_lord"
];
export const RUMOR_COUNT = 3;

/** Elige `count` (default RUMOR_COUNT) ids distintos de RUMOR_POOL y los activa.
 *  rng inyectable para tests. `count` override lo usa el perk de legado
 *  "Oído en el Camino" (metaProgress.js) para sumar 1 rumor extra. */
export function rollRumors(rng = Math.random, count = RUMOR_COUNT) {
  const pool = [...RUMOR_POOL];
  const chosen = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  chosen.forEach(activateQuest);
  return chosen;
}

/** ¿Se cumple la condición de entrega? */
export function checkQuestCondition(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return false;
  if (getQuestStatus(questId) !== "active") return false;

  switch (q.type) {
    case "visit":
      return !!(gameState.visitedLocations?.[q.target]);
    case "collect":
      return (gameState.inventory?.[q.item] ?? 0) >= q.qty;
    case "kill": {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      return killed >= q.count;
    }
    default:
      return false;
  }
}

/**
 * Entrega la misión, da recompensas y la marca como completada.
 * @returns {boolean} true si se completó correctamente
 */
export function completeQuest(questId) {
  const q = QUEST_DATA[questId];
  if (!q || !checkQuestCondition(questId)) return false;

  gameState.quests[questId] = "completed";
  playSound("quest_done");
  checkAchievements();

  // Consumir ítem de la misión si así se configuró
  if (q.consumeItem && q.item) {
    const current = gameState.inventory[q.item] ?? 0;
    const remaining = Math.max(0, current - q.qty);
    if (remaining === 0) delete gameState.inventory[q.item];
    else gameState.inventory[q.item] = remaining;
  }

  // Dar recompensas
  const { item, xp, gold } = q.reward;
  if (item) {
    gameState.inventory[item] = (gameState.inventory[item] ?? 0) + 1;
    addMessage(formatText(t("questRewardItems"), {
      items: localizeText(allItems[item]?.name) || item
    }), "loot");
  }
  if (xp) {
    gameState.player.experience = (gameState.player.experience ?? 0) + xp;
    addMessage(formatText(t("questRewardXp"), {
      xp,
      title: localizeText(q.title)
    }), "stat");
  }
  if (gold) {
    gameState.player.gold = (gameState.player.gold ?? 0) + gold;
    addMessage(formatText(t("questRewardGold"), { gold }), "loot");
  }

  return true;
}

// ── HELPERS PARA UI ────────────────────────────────────────────────

/** ¿Está inactiva Y bloqueada por una prerequisiteQuest sin completar? */
export function isQuestLocked(questId) {
  const q = QUEST_DATA[questId];
  if (!q?.prerequisiteQuest) return false;
  return getQuestStatus(questId) === "inactive"
    && getQuestStatus(q.prerequisiteQuest) !== "completed";
}

/** Líneas de diálogo según estado actual de la misión */
export function getQuestDialogue(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return [formatText(t("qlProgressInactive"), { npc: t("unknownLocation") })];
  const status = getQuestStatus(questId);

  if (status === "completed") {
    return q.dialogues.completed.map(localizeText);
  }

  if (status === "active") {
    if (q.type === "kill" && q.dialogues.active_template) {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      const remaining = Math.max(0, q.count - killed);
      return [localizeText(q.dialogues.active_template).replace("{remaining}", remaining)];
    }
    return q.dialogues.active.map(localizeText);
  }

  // inactive — show locked dialogue if prerequisite not yet completed
  if (isQuestLocked(questId)) {
    return (q.dialogues.locked ?? q.dialogues.inactive).map(localizeText);
  }

  return q.dialogues.inactive.map(localizeText);
}

/**
 * Etiqueta del botón de acción en el modal del NPC.
 * null = no mostrar botón.
 */
export function getQuestActionLabel(questId) {
  const status = getQuestStatus(questId);
  if (status === "completed") return null;
  if (status === "active" && checkQuestCondition(questId)) return t("qlActionTurnInQuest");
  if (status === "inactive") {
    if (isQuestLocked(questId)) return null;
    return t("qlActionAcceptQuest");
  }
  return null; // activa pero condición no cumplida
}
