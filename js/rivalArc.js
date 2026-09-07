// SPEC-1108 — Kestrel, el rival recurrente (roadmap "siguiente nivel" ítem
// #8).
//
// SPEC-1236 — el usuario reportó que en su partida solo vio a Kestrel al
// final: los encuentros originalmente exigían estar parado EXACTO en
// "town"/"garden_1" cuando se cumplía la condición, algo que no siempre
// pasa naturalmente (quests "visit" se completan hablando con el NPC, no
// necesariamente de vuelta en esa sala). Se sacó el requisito de sala salvo
// donde sigue teniendo sentido (inferno_1, cuello de botella obligatorio).
//
// SPEC-1237 — rediseño completo del arco (diseñado vía /office-hours, ver
// memoria de sesión) en 4 etapas:
//   0. Duelo amistoso (obligatorio, tras mq_01) — combate real contra
//      kestrel_early, una versión débil separada. Ganar la deja picada
//      (rival_score -1); perder es la introducción normal a una rival de
//      verdad (rival_score +1) -- invierte a propósito la intuición de que
//      "ganar siempre es lo bueno" para el vínculo.
//   1. Discursos por bioma (una vez por cada uno de los 7 biomas con jefe de
//      zona, solo tras el duelo 0) -- enriquecen su arquetipo y dan pistas
//      de cómo ganarse su confianza, sin elección ni impacto en el score.
//   2. Segundo duelo (mitad de juego, tras vencer 3 jefes de zona) -- combate
//      real contra kestrel_rival_2, que reusa la guardia de forest_titan
//      (ver combat.js) en vez de mecánica nueva. Ganar sube el score en
//      serio (+2, un respeto genuino, no una picardía de rivalidad menor).
//   3. Prueba de confianza (en inferno_1, reemplaza la resolución
//      automática por score puro) -- una acción real y explícita del
//      jugador (aliarse / desafiarla / dejarla robar) decide la relación
//      final. El score acumulado en las etapas 0-2 queda como flavor
//      (influye qué tone beat aparece), no como el árbitro.
//
// Restricción real de arquitectura (verificada antes de diseñar): un combate
// perdido es Game Over normal (gameState.isGameOver = true en combat.js,
// nunca pasa por endCombat) -- no existe en todo el juego un sistema de
// "muerte segura" (ver auditoría de jugabilidad, decisión explícita de no
// inventar uno). Por eso "si Kestrel gana, se burla" solo puede foreshadow-
// earse en el texto del desafío ANTES del combate -- la reacción concreta y
// scriptada solo es entregable en el camino que SÍ tiene callback (ganar).
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { showTravelEvent } from "./travelEvents.js";
import { getQuestStatus } from "./quests.js";
import { computeEndingTone } from "./endings.js";
import { getVictories } from "./metaProgress.js";
import { maybeStartValdrisEncounter } from "./valdrisArc.js";
import { zoneBossesDefeatedCount } from "./eryndelArc.js";

const flags = () => (gameState.worldFlags ??= {});
const setFlag = k => { flags()[k] = true; };
const hasFlag = k => !!flags()[k];
const rivalScore = () => flags().rival_score || 0;
const addRivalScore = n => { flags().rival_score = rivalScore() + n; };

// SPEC-1108b — más voz para Kestrel: 3 "beats" cortos que se anexan al texto
// base según quién sos jugando (clase, encuentro 1), de dónde venís (origen,
// encuentro 2) y cómo jugaste hasta ahora (tono moral, resolución final).
// Si el dato no está disponible (ej. save viejo sin origen), no se agrega
// nada — el texto base ya funciona solo.
function withBeat(base, beat) {
  if (!beat) return base;
  return { en: `${base.en} ${beat.en}`, es: `${base.es} ${beat.es}` };
}
const CLASS_BEATS = {
  warrior: {
    en: "She sizes up your blade before your face. \"Muscle. Predictable — I can work with that.\"",
    es: "Te mide primero la espada, después la cara. \"Músculo. Predecible — con eso puedo trabajar.\""
  },
  mage: {
    en: "Her eyes flick to the runes worn into your sleeve. \"A spellslinger. Try not to torch the ruins before I get my cut.\"",
    es: "Sus ojos van directo a las runas gastadas en tu manga. \"Una hechicera. Tratá de no prender fuego las ruinas antes de que cobre mi parte.\""
  },
  rogue: {
    en: "She notices you noticed her first. \"Light-footed. I hate working with people faster than me.\"",
    es: "Nota que la notaste primero. \"Ligera de pies. Odio trabajar con gente más rápida que yo.\""
  }
};
const ORIGIN_BEATS = {
  exile: {
    en: "\"Wilds-raised, aren't you. Didn't even hesitate before touching fae work. Most people hesitate.\"",
    es: "\"Criada en tierras salvajes, ¿no? No dudaste ni un segundo antes de tocar magia feérica. La mayoría duda.\""
  },
  apprentice: {
    en: "\"Tower books taught you that unraveling trick. I've seen that exact motion in exactly one place.\"",
    es: "\"Los libros de la torre te enseñaron ese truco para deshacerla. Vi ese movimiento exacto en un solo lugar.\""
  },
  mercenary: {
    en: "\"You checked what I was carrying before you helped. Good. At least one of us thinks like a professional.\"",
    es: "\"Revisaste qué llevaba encima antes de ayudar. Bien. Al menos una de las dos piensa como profesional.\""
  }
};
const TONE_BEATS = {
  light: {
    en: "\"Word travels. They say you let things go you didn't have to. Soft reputation. Doesn't mean soft hands, apparently.\"",
    es: "\"Se corre la voz. Dicen que dejaste ir cosas que no tenías por qué. Fama de blanda. Aunque no de manos blandas, al parecer.\""
  },
  dark: {
    en: "\"I've heard what you did to the ones who didn't fight back. Don't expect me to lose sleep over what happens here.\"",
    es: "\"Escuché lo que le hiciste a los que no se defendían. No esperes que pierda el sueño por lo que pase acá.\""
  },
  gray: {
    en: "\"Nobody quite agrees on what you are. Neither do I, honestly.\"",
    es: "\"Nadie se pone de acuerdo en qué sos. Yo tampoco, para ser sincera.\""
  }
};

// SPEC-1237: el primer encuentro ahora es un desafío a duelo -- el texto
// foreshadowea ambas reacciones posibles ("me río" / "me enojo") porque solo
// una de las dos es entregable como callback real tras el combate (ver
// comentario de cabecera sobre la restricción de "muerte segura").
const RIVAL_DUEL_1_BASE_TEXT = {
  en: "A stranger steps into your path, already drawing a blade, grinning. \"Kestrel. I hunt the same seals you do — for the fee, not the fate of the world. Let's see what you're made of before I decide if you're worth my time. Friendly duel, first blood. Win and I'll be insufferable about it. Lose and you'll never hear the end of it either.\"",
  es: "Un desconocido te corta el paso, ya desenvainando un arma, sonriendo. \"Kestrel. Cazo los mismos sellos que vos — por la paga, no por el destino del mundo. Veamos de qué estás hecho antes de decidir si valés mi tiempo. Duelo amistoso, primera sangre. Si ganás, voy a ser insoportable al respecto. Si perdés, tampoco te vas a librar de escucharlo.\""
};

// SPEC-1211 — voz narrativa ampliada (revisión 2026-08-28, ítem #6): Kestrel
// reacciona a que esta NO es tu primera vuelta (New Game+, ver
// metaProgress.js). Solo en el primer encuentro — es un guiño de
// reconocimiento al arrancar la relación, no algo que repetir en las demás
// apariciones. Sin beat en la primera partida (getVictories()===0), mismo
// patrón null-safe que CLASS_BEATS/ORIGIN_BEATS/TONE_BEATS.
const NG_BEATS = {
  returning: {
    en: "She studies you a beat too long. \"Do I know you? No — but I'd swear I've done this dance with you before.\"",
    es: "Te mira un segundo de más. \"¿Nos conocemos? No... pero juraría que ya bailé esto con vos antes.\""
  }
};

// SPEC-1237 — Etapa 0: duelo amistoso, obligatorio y temprano (tras mq_01).
// Único choice a propósito: no es una elección de tono, es aceptar el
// desafío. El resultado real (rival_score, mensaje reactivo) se resuelve en
// combatRewards.js al terminar el combate contra kestrel_early.
export const RIVAL_DUEL_1_INTRO = {
  id: "rival_duel_1_intro",
  icon: "🗡️",
  title: { en: "A Friendly Challenge", es: "Un desafío amistoso" },
  get text() {
    const withClass = withBeat(RIVAL_DUEL_1_BASE_TEXT, CLASS_BEATS[gameState.player?.class]);
    return withBeat(withClass, getVictories() > 0 ? NG_BEATS.returning : null);
  },
  biomes: null,
  choices: [{
    label: { en: "Accept the duel", es: "Aceptar el duelo" },
    icon: "⚔️",
    apply() {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: "kestrel_early", isBoss: false } }));
      }, 900);
      return { en: "Blades out. No hard feelings — yet.", es: "Armas afuera. Sin resentimientos — todavía." };
    }
  }]
};

const ENCOUNTER_2_BASE_TEXT = {
  en: "You find Kestrel tangled in a fairy ward, cursing under their breath. They spot you and stop struggling, waiting to see what you'll do.",
  es: "Encuentras a Kestrel enredado en una salvaguarda de hadas, maldiciendo por lo bajo. Te ve y deja de forcejear, esperando a ver qué hacés."
};

export const RIVAL_ENCOUNTER_2 = {
  id: "rival_encounter_2",
  icon: "🧚",
  title: { en: "Kestrel in Trouble", es: "Kestrel en apuros" },
  get text() {
    return withBeat(ENCOUNTER_2_BASE_TEXT, ORIGIN_BEATS[gameState.player?.origin]);
  },
  biomes: null,
  choices: [
    {
      label: { en: "Help them", es: "Ayudarlo" },
      icon: "🩹",
      apply() {
        addRivalScore(1);
        gameState.player.experience = (gameState.player.experience ?? 0) + 20;
        return { en: "You unravel the ward. Kestrel mutters a thanks they clearly aren't used to giving. +20 XP", es: "Deshaces la salvaguarda. Kestrel murmura un gracias que claramente no está acostumbrado a dar. +20 XP" };
      }
    },
    {
      label: { en: "Let them handle it", es: "Dejarlo resolverlo solo" },
      icon: "🚶",
      apply() {
        addRivalScore(-1);
        const gold = 15;
        gameState.player.gold = (gameState.player.gold ?? 0) + gold;
        return { en: `You walk past, pocketing a dropped pouch on the way. +${gold} gold`, es: `Pasas de largo, embolsándote una bolsa caída en el camino. +${gold} de oro` };
      }
    }
  ]
};

// SPEC-1237 — Etapa 1: un discurso por bioma, una sola vez cada uno, solo en
// los 7 biomas con jefe de zona (mismo criterio que el narrador oculto,
// SPEC-1223) y solo tras el duelo 0 (Kestrel ya establecida en la historia).
// Puro flavor -- sin choice de tono ni impacto en rival_score: son pistas de
// arquetipo, no puntos de decisión.
function biomeSpeech(id, icon, title, text) {
  return {
    id: `rival_biome_${id}`,
    icon,
    title,
    text,
    biomes: null,
    choices: [{
      label: { en: "Keep moving", es: "Seguir camino" },
      icon: "🚶",
      apply() { return { en: "She's already gone.", es: "Ya se fue." }; }
    }]
  };
}
export const BIOME_SPEECHES = {
  forest: biomeSpeech("forest", "🌲", { en: "Old Wounds", es: "Heridas viejas" }, {
    en: "Kestrel falls into step beside you without asking, scanning the tree line out of habit. \"I used to work jobs like this with a partner. Ended badly — they wanted glory, I wanted paid. Different currencies. People who confuse the two get others killed.\" She peels off before you can answer.",
    es: "Kestrel camina a tu lado sin pedir permiso, escaneando la línea de árboles por costumbre. \"Antes hacía trabajos como este con un compañero. Terminó mal — él quería gloria, yo quería cobrar. Monedas distintas. La gente que confunde las dos termina matando a otros.\" Se aparta antes de que puedas responder."
  }),
  cave: biomeSpeech("cave", "🕳️", { en: "Honest Dark", es: "Oscuridad honesta" }, {
    en: "You find her crouched at a cave mouth, listening. \"Caves are honest,\" she says without turning. \"They don't pretend to be safer than they are. Wish I could say the same about most people I've worked with. You, I still haven't decided.\"",
    es: "La encontrás agachada en la entrada de una cueva, escuchando. \"Las cuevas son honestas\", dice sin darse vuelta. \"No fingen ser más seguras de lo que son. Ojalá pudiera decir lo mismo de la mayoría de la gente con la que trabajé. Vos, todavía no te tengo decidida.\""
  }),
  mountain: biomeSpeech("mountain", "⛰️", { en: "No Titles Up Here", es: "Sin títulos allá arriba" }, {
    en: "Kestrel is already at the summit trail when you arrive, unimpressed by the view. \"Height doesn't make you important. I've robbed kings and beggars from the same ledge. Gravity doesn't care about your title, and neither do I — only about whether you're worth the climb.\"",
    es: "Kestrel ya está en el sendero de la cumbre cuando llegás, sin impresionarse por la vista. \"La altura no te hace importante. Robé a reyes y a mendigos desde el mismo saliente. A la gravedad no le importa tu título, y a mí tampoco — solo si valés la subida.\""
  }),
  ruin: biomeSpeech("ruin", "🏛️", { en: "What Ruins Keep", es: "Lo que guardan las ruinas" }, {
    en: "She's picking through rubble when you find her, careful not to disturb something. \"Ruins keep better secrets than people do. People lie to your face. Ruins just... wait. I respect that. If you ever want my trust, try waiting instead of asking.\"",
    es: "Está revisando escombros cuando la encontrás, con cuidado de no perturbar algo. \"Las ruinas guardan mejor los secretos que la gente. La gente te miente en la cara. Las ruinas solo... esperan. Respeto eso. Si alguna vez querés mi confianza, probá esperar en vez de pedir.\""
  }),
  swamp: biomeSpeech("swamp", "🐍", { en: "No Questions Asked", es: "Sin hacer preguntas" }, {
    en: "Kestrel wades out of the mud with a scowl, boots ruined. \"I take jobs like this because the pay's good and nobody asks questions. Lately you're the one making me ask questions. I don't love it. Don't get used to it either.\"",
    es: "Kestrel sale del barro con el ceño fruncido, botas arruinadas. \"Acepto trabajos así porque la paga es buena y nadie hace preguntas. Últimamente sos vos la que me hace hacer preguntas. No me encanta. Tampoco te acostumbres.\""
  }),
  volcano: biomeSpeech("volcano", "🌋", { en: "What's Left After", es: "Lo que queda después" }, {
    en: "She watches the lava fields with an expression you can't read. \"Heat like this burns away anything fake fast. Loyalty, love, all of it — cheap talk melts first. What's left after is the only thing worth trusting. We'll see what's left of you.\"",
    es: "Observa los campos de lava con una expresión que no podés leer. \"Un calor así quema rápido todo lo falso. Lealtad, amor, todo eso — la palabrería barata se derrite primero. Lo que queda después es lo único que vale la pena confiar. Vamos a ver qué queda de vos.\""
  }),
  tundra: biomeSpeech("tundra", "❄️", { en: "Slow to Warm", es: "Lenta para entrar en confianza" }, {
    en: "Kestrel's breath fogs as she catches up, uncharacteristically quiet. \"Cold like this kills the ones who trust the wrong person to keep watch. I've buried people who trusted wrong. Don't take it personally if I'm slow to warm up to you — it's kept me alive this long.\"",
    es: "El aliento de Kestrel se hace vapor mientras te alcanza, inusualmente callada. \"Un frío así mata a los que confían en la persona equivocada para hacer guardia. Enterré gente que confió mal. No te lo tomes personal si tardo en entrar en confianza — eso me mantuvo viva hasta ahora.\""
  }),
};

// SPEC-1237 — Etapa 2: segundo duelo, mitad de juego (tras 3 jefes de zona
// vencidos). Esta vez es real -- kestrel_rival_2 reusa la guardia de
// forest_titan (ver combat.js). Igual que el duelo 0, el texto foreshadowea
// ambas reacciones porque solo ganar tiene callback real (ver cabecera).
const RIVAL_DUEL_2_BASE_TEXT = {
  en: "Kestrel drops from a rooftop, weapon already drawn, no pleasantries this time. \"You're still standing. Good — makes this worth doing right.\" Her eyes are sharper now, calculating. \"Half-measures got us this far. Let's see if there's anything real behind them. Win and I'll actually respect you. Lose and I'll make sure you remember exactly how.\"",
  es: "Kestrel cae desde un techo, arma ya desenvainada, sin cortesías esta vez. \"Seguís de pie. Bien — eso hace que valga la pena hacer esto en serio.\" Sus ojos están más afilados ahora, calculando. \"Las medias tintas nos trajeron hasta acá. Veamos si hay algo real detrás. Si ganás, te voy a respetar de verdad. Si perdés, me voy a asegurar de que te acuerdes exactamente cómo.\""
};
export const RIVAL_DUEL_2_INTRO = {
  id: "rival_duel_2_intro",
  icon: "⚔️",
  title: { en: "No More Half-Measures", es: "Se acabaron las medias tintas" },
  text: RIVAL_DUEL_2_BASE_TEXT,
  biomes: null,
  choices: [{
    label: { en: "Fight for real", es: "Pelear en serio" },
    icon: "⚔️",
    apply() {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: "kestrel_rival_2", isBoss: true } }));
      }, 900);
      return { en: "This time, neither of you is holding back.", es: "Esta vez, ninguna de las dos se guarda nada." };
    }
  }]
};

// SPEC-1237: forcedOutcome ("ally"|"traitor"|"competitor") permite que
// RIVAL_TRUST_TEST decida la relación por una acción explícita del jugador
// en vez de por el score acumulado. Sin argumento, cae al umbral de score de
// siempre (compatibilidad con los tests existentes, que solo fijan score).
export function rivalResolutionEvent(forcedOutcome = null) {
  const score = rivalScore();
  const outcome = forcedOutcome ?? (score >= 1 ? "ally" : score <= -1 ? "traitor" : "competitor");
  // SPEC-1108b: Kestrel decide cuánto confiar en vos también según cómo
  // jugaste hasta ahora, no solo según el propio historial que tiene con
  // ella — mismo tono (light/dark/gray) que ya usa el epílogo de la run.
  const toneBeat = TONE_BEATS[computeEndingTone(gameState.worldFlags).tone];
  if (outcome === "ally") {
    return {
      id: "rival_resolution_ally",
      icon: "🤝",
      title: { en: "An Unlikely Ally", es: "Un aliado inesperado" },
      text: withBeat({ en: "Kestrel's grin turns real for half a second. \"Together, then. Try to keep up.\"", es: "La sonrisa de Kestrel se vuelve real por medio segundo. \"Juntas, entonces. Tratá de seguirme el ritmo.\"" }, toneBeat),
      biomes: null,
      choices: [{
        label: { en: "Accept the help", es: "Aceptar la ayuda" },
        icon: "✨",
        apply() {
          setFlag("rival_resolved_ally");
          setFlag("rival_chain_valdris_pending"); // SPEC-1236: ver maybeChainValdrisAfterRival()
          const p = gameState.player;
          p.hp = p.maxHp;
          if (!gameState.activeBuffs) gameState.activeBuffs = {};
          gameState.activeBuffs.warcry = 5;
          return { en: "Kestrel's cover fire steadies your nerves. Full HP restored, +30% attack for this fight.", es: "El fuego de cobertura de Kestrel calma tus nervios. HP restaurado por completo, +30% de ataque en este combate." };
        }
      }]
    };
  }
  if (outcome === "traitor") {
    return {
      id: "rival_resolution_traitor",
      icon: "🔪",
      title: { en: "A Familiar Betrayal", es: "Una traición conocida" },
      text: withBeat({ en: "Kestrel doesn't hesitate. \"Your loss. Try not to think about it while I'm gone.\"", es: "Kestrel no duda. \"Perdiste vos. Tratá de no pensar en eso mientras no esté.\"" }, toneBeat),
      biomes: null,
      choices: [{
        label: { en: "...", es: "..." },
        icon: "😠",
        apply() {
          setFlag("rival_resolved_traitor");
          setFlag("rival_chain_valdris_pending"); // SPEC-1236: ver maybeChainValdrisAfterRival()
          const p = gameState.player;
          const stolen = Math.max(1, Math.floor((p.gold || 0) * 0.20));
          p.gold = Math.max(0, (p.gold || 0) - stolen);
          return { en: `She takes you at your word, and then some — Kestrel lifts ${stolen} gold from your own pack on her way out, just to make a point.`, es: `Te toma la palabra, y un poco más — Kestrel te saca ${stolen} de oro de tu propia mochila al irse, solo para dejar un mensaje.` };
        }
      }]
    };
  }
  return {
    id: "rival_resolution_competitor",
    icon: "⚔️",
    title: { en: "One Last Contest", es: "Un último desafío" },
    text: withBeat({ en: "Kestrel's jaw sets. \"Fine. Prove it, then.\" She draws steel.", es: "Kestrel aprieta la mandíbula. \"Bien. Entonces demostralo.\" Desenvaina." }, toneBeat),
    biomes: null,
    choices: [{
      label: { en: "Accept the duel", es: "Aceptar el duelo" },
      icon: "⚔️",
      apply() {
        setFlag("rival_resolved_competitor");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: "kestrel_rival", isBoss: false } }));
        }, 900);
        return { en: "Steel meets steel.", es: "El acero choca contra el acero." };
      }
    }]
  };
}

// SPEC-1237 — Etapa 3: prueba de confianza. Reemplaza la resolución
// automática por score puro con una acción explícita y concreta: el jugador
// decide directamente si Kestrel termina siendo aliada, enemiga o traidora,
// delegando a las 3 ramas ya existentes de rivalResolutionEvent() (mismo
// mecanismo de recompensa/combate, solo elegido a mano en vez de por
// umbral). El score acumulado en las etapas 0-2 solo elige el toneBeat de
// cada rama (ver rivalResolutionEvent) -- ya no decide el resultado.
export const RIVAL_TRUST_TEST = {
  id: "rival_trust_test",
  icon: "🗝️",
  title: { en: "One Real Question", es: "Una pregunta de verdad" },
  text: {
    en: "Kestrel blocks the threshold one last time, no games left in her voice. \"There's a vault two turns back — Valdris's old stash, probably. Enough gold to retire on. I found it an hour ago and haven't touched it. I'm asking, not telling: do we do this together, or do I disappear the second that door opens?\"",
    es: "Kestrel bloquea el umbral una última vez, sin juegos en la voz. \"Hay una bóveda dos vueltas atrás — el escondite viejo de Valdris, probablemente. Oro suficiente para retirarme. La encontré hace una hora y no la toqué. Te lo pregunto, no te lo digo: ¿hacemos esto juntas, o desaparezco apenas se abra esa puerta?\""
  },
  biomes: null,
  choices: [
    {
      label: { en: "Fight beside me — we split it after", es: "Pelear a mi lado — lo repartimos después" },
      icon: "🤝",
      apply() { return rivalResolutionEvent("ally").choices[0].apply(); }
    },
    {
      label: { en: "Not until you prove you mean it", es: "No hasta que demuestres que hablás en serio" },
      icon: "⚔️",
      apply() { return rivalResolutionEvent("competitor").choices[0].apply(); }
    },
    {
      label: { en: "Take it. Just go.", es: "Tomala. Andate." },
      icon: "🔪",
      apply() { return rivalResolutionEvent("traitor").choices[0].apply(); }
    }
  ]
};

/** Llamar al llegar a una zona. true = un encuentro con Kestrel arranca y
 *  movement no debe tirar encuentros/eventos normales este movimiento.
 *  SPEC-1236/1237: las etapas 0-2 disparan en la PRÓXIMA llegada a
 *  CUALQUIER lugar tras cumplirse su condición (ya no exigen town/garden_1
 *  exactos -- ver comentario de cabecera). La etapa 3 sigue atada a
 *  inferno_1 a propósito (cuello de botella obligatorio del final). */
export function maybeStartRivalEncounter(locationId) {
  // Etapa 0: duelo amistoso, obligatorio y temprano.
  if (getQuestStatus("mq_01_la_cancion") === "completed" && !hasFlag("rival_duel1_seen")) {
    setFlag("rival_duel1_seen");
    setTimeout(() => showTravelEvent(RIVAL_DUEL_1_INTRO), 700);
    return true;
  }
  // "Kestrel en apuros" (jardín) -- sin cambios de disparador ni contenido.
  if (getQuestStatus("mq_03_ecos") === "completed" && !hasFlag("rival_encounter_2_seen")) {
    setFlag("rival_encounter_2_seen");
    setTimeout(() => showTravelEvent(RIVAL_ENCOUNTER_2), 700);
    return true;
  }
  // Etapa 1: discurso por bioma (solo tras el duelo 0, una vez por bioma).
  if (hasFlag("rival_duel1_seen")) {
    const biomeId = window.worldMap?.[locationId]?.biome;
    const speech = biomeId ? BIOME_SPEECHES[biomeId] : null;
    if (speech && !hasFlag("rival_biome_seen_" + biomeId)) {
      setFlag("rival_biome_seen_" + biomeId);
      setTimeout(() => showTravelEvent(speech), 700);
      return true;
    }
  }
  // Etapa 2: segundo duelo, mitad de juego (tras 3 jefes de zona vencidos).
  if (hasFlag("rival_duel1_seen") && zoneBossesDefeatedCount(gameState) >= 3 && !hasFlag("rival_duel2_seen")) {
    setFlag("rival_duel2_seen");
    setTimeout(() => showTravelEvent(RIVAL_DUEL_2_INTRO), 700);
    return true;
  }
  // Etapa 3: prueba de confianza -- reemplaza la resolución automática.
  if (locationId === "inferno_1" && getQuestStatus("mq_04_la_verdad") === "completed" && !hasFlag("rival_trust_test_seen")) {
    setFlag("rival_trust_test_seen");
    setTimeout(() => showTravelEvent(RIVAL_TRUST_TEST), 700);
    return true;
  }
  return false;
}

// SPEC-1236 — bug real: el encuentro final de Kestrel (arriba) y la
// confrontación de Valdris (valdrisArc.js) disparan en el MISMO umbral
// (inferno_1), pero movement.js corta con un early-return apenas
// maybeStartRivalEncounter() devuelve true -- Valdris nunca llegaba a
// chequearse en esa misma llegada. El jugador tenía que salir y volver a
// entrar para que se disparara. Los caminos "aliado"/"traidor" (sin
// combate) encadenan acá, al cerrarse su modal; el camino "competidor" (el
// duelo real) encadena en cambio desde combatRewards.js, al terminar ESE
// combate -- si lo hiciéramos acá, Valdris aparecería ENCIMA del duelo que
// todavía no empezó.
export function maybeChainValdrisAfterRival() {
  if (!hasFlag("rival_chain_valdris_pending")) return false;
  flags().rival_chain_valdris_pending = false;
  setTimeout(() => maybeStartValdrisEncounter("inferno_1"), 700);
  return true;
}

export function setupRivalArc() {
  window.addEventListener("pixel:travelEventClosed", () => maybeChainValdrisAfterRival());
}
