// SPEC-1219 (Fase 5 del plan docs/PLAN-HISTORIA-FASE4.md) — la elección
// real del jugador al final del clímax: qué hacer con el Corazón del
// Dragón. Reusa el modal de travelEvents.js, mismo patrón que
// echoIntro.js/valdrisArc.js/pyraxArc.js. Guarda
// gameState.worldFlags.finalChoiceId, que getEndingContent() en endings.js
// lee para elegir entre los 3 finales estructurales del documento en vez
// del cómputo por tono (que sigue existiendo, para la frase de sabor por
// clase que se agrega debajo).
//
// Decisión de alcance confirmada con el usuario: el LOG de combate no
// branchea por esta elección (todos ven el mismo "el Corazón asciende en
// miles de estrellas" en combatRewards.js) — solo el modal de victoria
// (título + texto principal) cambia. Ver docs/PLAN-HISTORIA-FASE4.md.
import { gameState } from "./state.js";

export const FINAL_CHOICE_EVENT = {
  id: "final_choice",
  icon: "💎",
  title: { en: "The Dragon Heart", es: "El Corazón del Dragón" },
  text: {
    en: "The Heart rests before you, still beating with everything Asterion ever was. It isn't a trophy. It's a decision. What do you do with it?",
    es: "El Corazón descansa ante vos, todavía latiendo con todo lo que Asterion alguna vez fue. No es un trofeo. Es una decisión. ¿Qué hacés con él?"
  },
  biomes: null,
  choices: [
    {
      label: { en: "Return every memory to it", es: "Devolverle cada recuerdo" },
      icon: "🌌",
      apply() {
        (gameState.worldFlags ??= {}).finalChoiceId = "return_memories";
        return {
          en: "You give the Heart back everything you gathered — the guardian and the almost-tyrant, together. It rises.",
          es: "Le devolvés al Corazón todo lo que reuniste — el guardián y el casi-tirano, juntos. Se eleva."
        };
      }
    },
    {
      label: { en: "Take the crown and absorb it", es: "Tomar la corona y absorberlo" },
      icon: "👑",
      apply() {
        (gameState.worldFlags ??= {}).finalChoiceId = "take_crown";
        return {
          en: "You place the crown on your own head. Power floods into you — and with it, a weight that will never fully lift.",
          es: "Te ponés la corona vos mismo. El poder te inunda — y con él, un peso que nunca va a terminar de levantarse."
        };
      }
    },
    {
      label: { en: "Destroy it", es: "Destruirlo" },
      icon: "🔥",
      apply() {
        (gameState.worldFlags ??= {}).finalChoiceId = "destroy_heart";
        return {
          en: "You crush the Heart in your hands. Something ancient goes silent forever — and the world, quieter, is finally only its own.",
          es: "Destruís el Corazón entre tus manos. Algo antiguo se queda en silencio para siempre — y el mundo, más callado, por fin es solo suyo."
        };
      }
    }
  ]
};
