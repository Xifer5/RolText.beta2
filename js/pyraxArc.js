// SPEC-1219 (Fase 3 del plan docs/PLAN-HISTORIA-FASE4.md) — Pyrax, la prueba
// de las tres llaves. Mismo patrón que echoIntro.js/valdrisArc.js: eventos
// guionizados vía showTravelEvent()/pixel:travelEventClosed, encadenados uno
// tras otro para simular un "trial de 3 pasos" sin escribir UI nueva
// (travelEvents.js solo soporta un choice por evento, así que 3 pasos reales
// = 3 eventos consecutivos, no un modal con 3 secciones).
//
// 100% narrativo: ninguna elección cambia stats/items/flags de juego más
// allá de avanzar el propio trial — a propósito, coherente con "sin cambios
// estructurales" del plan. No reemplaza ni duplica el gate mecánico real de
// inferno_1 (dragon_key, ver ZONE_GATES en movement.js / defeat_dark_lord en
// quests.js), solo lo viste narrativamente.
import { gameState } from "./state.js";
import { showTravelEvent } from "./travelEvents.js";
import { getQuestStatus } from "./quests.js";

const flags = () => (gameState.worldFlags ??= {});

export const PYRAX_TRIAL_KNOWLEDGE = {
  id: "pyrax_trial_knowledge",
  icon: "📖",
  title: { en: "The first key: what you know", es: "La primera llave: lo que sabés" },
  text: {
    en: "Pyrax blocks the path with his molten spear, not in threat, but in ritual. \"Before I let you pass, tell me, traveler — what sleeps on the other side of that Gate?\"",
    es: "Pyrax bloquea el paso con su lanza de magma, no como amenaza sino como ritual. —Antes de dejarte pasar, decime, viajero: ¿qué es lo que duerme del otro lado de esa Puerta?"
  },
  biomes: null,
  choices: [
    {
      label: { en: "A guardian the world chose to forget", es: "Un guardián que el mundo decidió olvidar" },
      icon: "📖",
      apply() {
        flags().pyrax_trial_step = 2;
        return { en: "Pyrax nods slowly. \"Forgetting was easier than forgiving. Go on.\"", es: "Pyrax asiente despacio. —Olvidar fue más fácil que perdonar. Seguí." };
      }
    },
    {
      label: { en: "Something that stopped being dangerous the day we stopped listening", es: "Algo que dejó de ser peligroso el día que dejamos de escucharlo" },
      icon: "🔍",
      apply() {
        flags().pyrax_trial_step = 2;
        return { en: "\"Careful,\" Pyrax says. \"That's closer to the truth than most kingdoms ever got.\"", es: "—Cuidado —dice Pyrax—. Eso está más cerca de la verdad de lo que llegaron nunca la mayoría de los reinos." };
      }
    }
  ]
};

export const PYRAX_TRIAL_COMPASSION = {
  id: "pyrax_trial_compassion",
  icon: "🌿",
  title: { en: "The second key: what you feel", es: "La segunda llave: lo que sentís" },
  text: {
    en: "\"Eryndel gave a piece of herself for every seal you carry,\" Pyrax says. \"She's forgetting who she is, one memory at a time. Tell me — was it worth asking that of her?\"",
    es: "—Eryndel entregó un pedazo de sí misma por cada sello que llevás —dice Pyrax—. Se está olvidando de quién es, un recuerdo a la vez. Decime — ¿valió la pena pedirle eso?"
  },
  biomes: null,
  choices: [
    {
      label: { en: "I chose to listen, even when it hurt", es: "Elegí escuchar, aunque doliera" },
      icon: "🕊️",
      apply() {
        flags().pyrax_trial_step = 3;
        return { en: "\"Then you understand the price already,\" Pyrax says quietly. \"Most never do.\"", es: "—Entonces ya conocés el precio —dice Pyrax en voz baja—. La mayoría nunca llega a saberlo." };
      }
    },
    {
      label: { en: "I chose to stay, even when I couldn't fix anything", es: "Elegí quedarme, aunque no pudiera arreglar nada" },
      icon: "💧",
      apply() {
        flags().pyrax_trial_step = 3;
        return { en: "Pyrax is silent for a moment. \"That's rarer than courage, traveler. Staying with no fix in hand.\"", es: "Pyrax queda en silencio un momento. —Eso es más raro que el valor, viajero. Quedarse sin tener arreglo en la mano." };
      }
    }
  ]
};

export const PYRAX_TRIAL_COURAGE = {
  id: "pyrax_trial_courage",
  icon: "🌋",
  title: { en: "The third key: what you're willing to lose", es: "La tercera llave: lo que estás dispuesto a perder" },
  text: {
    en: "\"There is no glory behind that Gate,\" Pyrax warns, stepping aside at last. \"Only the truth, and whatever it costs you to hold it. Are you ready to lose the comfortable version of this story?\"",
    es: "—No hay gloria detrás de esa Puerta —advierte Pyrax, haciéndose a un lado por fin—. Solo la verdad, y lo que cueste sostenerla. ¿Estás listo para perder la versión cómoda de esta historia?"
  },
  biomes: null,
  choices: [
    {
      label: { en: "I'd rather an uncomfortable truth than a protective lie", es: "Prefiero la verdad incómoda a una mentira que proteja" },
      icon: "⚔️",
      apply() {
        flags().pyrax_trial_resolved = true;
        delete flags().pyrax_trial_step;
        return { en: "\"Then go,\" Pyrax says, lowering his spear. \"The Gate was never mine to guard from someone like you.\"", es: "—Entonces andá —dice Pyrax, bajando la lanza—. La Puerta nunca fue mía para guardarla de alguien como vos." };
      }
    },
    {
      label: { en: "I've already lost things along the way. This won't be different", es: "Ya perdí cosas por el camino. Esto no va a ser distinto" },
      icon: "🔥",
      apply() {
        flags().pyrax_trial_resolved = true;
        delete flags().pyrax_trial_step;
        return { en: "Pyrax steps fully aside. \"Then you already know the third key better than I do.\"", es: "Pyrax se hace a un lado del todo. —Entonces ya conocés la tercera llave mejor que yo." };
      }
    }
  ]
};

/** Llamar al llegar a una zona. true = la escena arranca y movement no debe tirar el encuentro normal.
 *  Resumible: si el jugador cerró un paso anterior sin elegir (ej. con ESC —
 *  ver el safety-net de travelEventModal en ui.js, que NO dispara
 *  pixel:travelEventClosed), la próxima llegada retoma desde el paso donde
 *  quedó en vez de reiniciar o quedar atascado para siempre. */
export function maybeStartPyraxTrial(locationId) {
  if (locationId !== "volcano_4") return false;
  const f = flags();
  if (f.pyrax_trial_resolved) return false;
  if (getQuestStatus("mq_04_la_verdad") !== "completed") return false;
  if (f.pyrax_trial_step === 2) { setTimeout(() => showTravelEvent(PYRAX_TRIAL_COMPASSION), 700); return true; }
  if (f.pyrax_trial_step === 3) { setTimeout(() => showTravelEvent(PYRAX_TRIAL_COURAGE), 700); return true; }
  setTimeout(() => showTravelEvent(PYRAX_TRIAL_KNOWLEDGE), 700);
  return true;
}

/** Al cerrarse cada paso del modal: encadena el siguiente, si corresponde. */
export function advancePyraxTrialIfPending() {
  const step = gameState.worldFlags?.pyrax_trial_step;
  if (step === 2) { setTimeout(() => showTravelEvent(PYRAX_TRIAL_COMPASSION), 700); return true; }
  if (step === 3) { setTimeout(() => showTravelEvent(PYRAX_TRIAL_COURAGE), 700); return true; }
  return false;
}

export function setupPyraxArc() {
  window.addEventListener("pixel:travelEventClosed", () => advancePyraxTrialIfPending());
}
