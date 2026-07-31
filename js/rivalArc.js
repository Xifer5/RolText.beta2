// SPEC-1108 — Kestrel, el rival recurrente (roadmap "siguiente nivel" ítem
// #8). Aparece en 3 puntos de la cadena principal (tras mq_01, tras mq_03,
// y antes de mq_05/Rey Dragón). Las primeras 2 apariciones suman/restan
// `worldFlags.rival_score` (mini-tono propio, independiente de
// MORAL_DECISIONS); la 3ra resuelve la relación: aliado (score≥1, ayuda
// antes del jefe final), competidor (score===0, duelo directo) o traidor
// (score≤-1, te roba y desaparece).
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { showTravelEvent } from "./travelEvents.js";
import { getQuestStatus } from "./quests.js";

const flags = () => (gameState.worldFlags ??= {});
const setFlag = k => { flags()[k] = true; };
const hasFlag = k => !!flags()[k];
const rivalScore = () => flags().rival_score || 0;
const addRivalScore = n => { flags().rival_score = rivalScore() + n; };

export const RIVAL_ENCOUNTER_1 = {
  id: "rival_encounter_1",
  icon: "🗡️",
  title: { en: "An Unexpected Rival", es: "Un rival inesperado" },
  text: {
    en: "A stranger blocks your path in town, grinning. \"Kestrel. I hunt the same seals you do — for the fee, not the fate of the world. Trade notes, or keep your secrets?\"",
    es: "Un desconocido te corta el paso en el pueblo, sonriendo. \"Kestrel. Cazo los mismos sellos que vos — por la paga, no por el destino del mundo. ¿Compartimos lo que sabemos, o guardás tus secretos?\""
  },
  biomes: null,
  choices: [
    {
      label: { en: "Share what you know", es: "Compartir lo que sabes" },
      icon: "🤝",
      apply() {
        addRivalScore(1);
        gameState.player.experience = (gameState.player.experience ?? 0) + 10;
        return { en: "Kestrel nods, almost surprised. \"Careless of you. I'll remember it.\" +10 XP", es: "Kestrel asiente, casi sorprendido. \"Descuidado de tu parte. Lo voy a recordar.\" +10 XP" };
      }
    },
    {
      label: { en: "Keep your information", es: "Guardarte la información" },
      icon: "🤐",
      apply() {
        addRivalScore(-1);
        gameState.player.gold = (gameState.player.gold ?? 0) + 15;
        return { en: "Kestrel shrugs and pawns a lead of their own for quick coin. +15 gold", es: "Kestrel se encoge de hombros y vende una pista propia por monedas rápidas. +15 de oro" };
      }
    }
  ]
};

export const RIVAL_ENCOUNTER_2 = {
  id: "rival_encounter_2",
  icon: "🧚",
  title: { en: "Kestrel in Trouble", es: "Kestrel en apuros" },
  text: {
    en: "You find Kestrel tangled in a fairy ward, cursing under their breath. They spot you and stop struggling, waiting to see what you'll do.",
    es: "Encuentras a Kestrel enredado en una salvaguarda de hadas, maldiciendo por lo bajo. Te ve y deja de forcejear, esperando a ver qué hacés."
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

export function rivalResolutionEvent() {
  const score = rivalScore();
  if (score >= 1) {
    return {
      id: "rival_resolution_ally",
      icon: "🤝",
      title: { en: "An Unlikely Ally", es: "Un aliado inesperado" },
      text: { en: "Kestrel steps out of the shadows at the threshold. \"Figures I'd end up owing you. Don't die in there — I'm not done being annoyed at you.\"", es: "Kestrel sale de las sombras en el umbral. \"Tenía que terminar debiéndote una. No te mueras ahí adentro — todavía no termino de estar molesto con vos.\"" },
      biomes: null,
      choices: [{
        label: { en: "Accept the help", es: "Aceptar la ayuda" },
        icon: "✨",
        apply() {
          setFlag("rival_resolved_ally");
          const p = gameState.player;
          p.hp = p.maxHp;
          if (!gameState.activeBuffs) gameState.activeBuffs = {};
          gameState.activeBuffs.warcry = 5;
          return { en: "Kestrel's cover fire steadies your nerves. Full HP restored, +30% attack for this fight.", es: "El fuego de cobertura de Kestrel calma tus nervios. HP restaurado por completo, +30% de ataque en este combate." };
        }
      }]
    };
  }
  if (score <= -1) {
    return {
      id: "rival_resolution_traitor",
      icon: "🔪",
      title: { en: "A Familiar Betrayal", es: "Una traición conocida" },
      text: { en: "Kestrel corners you at the threshold, all pretense gone. \"Nothing personal. I just don't share.\"", es: "Kestrel te acorrala en el umbral, sin fingir ya. \"Nada personal. Solo que no comparto.\"" },
      biomes: null,
      choices: [{
        label: { en: "...", es: "..." },
        icon: "😠",
        apply() {
          setFlag("rival_resolved_traitor");
          const p = gameState.player;
          const stolen = Math.max(1, Math.floor((p.gold || 0) * 0.20));
          p.gold = Math.max(0, (p.gold || 0) - stolen);
          return { en: `Kestrel lifts ${stolen} gold from your pack and vanishes before you can react.`, es: `Kestrel te saca ${stolen} de oro de la mochila y desaparece antes de que reacciones.` };
        }
      }]
    };
  }
  return {
    id: "rival_resolution_competitor",
    icon: "⚔️",
    title: { en: "One Last Contest", es: "Un último desafío" },
    text: { en: "Kestrel blocks the threshold, drawing steel. \"Neither of us trusted the other enough. Let's settle it the simple way — whoever's still standing goes in first.\"", es: "Kestrel bloquea el umbral, desenvainando. \"Ninguno de los dos confió lo suficiente en el otro. Resolvámoslo simple — el que quede en pie entra primero.\"" },
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

/** Llamar al llegar a una zona. true = un encuentro con Kestrel arranca y
 *  movement no debe tirar encuentros/eventos normales este movimiento. */
export function maybeStartRivalEncounter(locationId) {
  if (locationId === "town" && getQuestStatus("mq_01_la_cancion") === "completed" && !hasFlag("rival_encounter_1_seen")) {
    setFlag("rival_encounter_1_seen");
    setTimeout(() => showTravelEvent(RIVAL_ENCOUNTER_1), 700);
    return true;
  }
  if (locationId === "garden_1" && getQuestStatus("mq_03_ecos") === "completed" && !hasFlag("rival_encounter_2_seen")) {
    setFlag("rival_encounter_2_seen");
    setTimeout(() => showTravelEvent(RIVAL_ENCOUNTER_2), 700);
    return true;
  }
  if (locationId === "inferno_1" && getQuestStatus("mq_04_la_verdad") === "completed" && !hasFlag("rival_encounter_3_seen")) {
    setFlag("rival_encounter_3_seen");
    setTimeout(() => showTravelEvent(rivalResolutionEvent()), 700);
    return true;
  }
  return false;
}
