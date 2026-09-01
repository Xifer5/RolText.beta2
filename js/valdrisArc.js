// SPEC-1219 — Valdris, antagonista real (Fase 1 del plan
// docs/PLAN-HISTORIA-FASE4.md). Mismo patrón arquitectónico que
// echoIntro.js: evento guionizado por llegada a una zona, usando
// showTravelEvent()/pixel:travelEventClosed para encadenar el combate (así
// gameState.isProcessingMove queda gestionado por travelEvents.js, no por un
// setTimeout suelto — ver ui.js:1113 el bug histórico que ese patrón evita).
//
// Dispara en CADA llegada a inferno_1 hasta que Valdris sea derrotado (no se
// gatea con un flag "_seen" aparte: si el jugador huye o pierde el combate,
// debe poder reintentarlo la próxima vez que entre, no quedar softlockeado).
// inferno_1 ya está protegido por dragon_key (ZONE_GATES en movement.js) y
// mapgen.js fuerza ahí un encuentro con dragon_king al 100% de probabilidad
// (bossOverrides.inferno) — este hook, con early-return en movement.js,
// intercepta esa visita ANTES de que ese sorteo se ejecute. El Rey Dragón ya
// no se alcanza por el sorteo: se encadena a mano, desde combatRewards.js,
// inmediatamente después de la victoria sobre Valdris.
import { gameState } from "./state.js";
import { showTravelEvent } from "./travelEvents.js";

export const VALDRIS_CONFRONT_EVENT = {
  id: "valdris_confront",
  icon: "🧙",
  title: { en: "The Archmage's Last Argument", es: "El último argumento del archimago" },
  text: {
    en: "Valdris stands before the Dragon Gate, seals and echoes scattered at his feet like broken glass. Cracks of dark light spread beneath his skin — the very magic he swore to only study. He does not look surprised to see you.\n\n\"You still think this is about a monster,\" he says. \"It was never about the dragon. It was about who gets to hold power like this when he's gone. I only wanted it to be someone careful.\"",
    es: "Valdris está de pie ante la Puerta del Dragón, con sellos y ecos desparramados a sus pies como vidrio roto. Grietas de luz oscura se extienden bajo su piel — la misma magia que juró solo estudiar. No parece sorprendido de verte.\n\n—Todavía creés que esto es sobre un monstruo —dice—. Nunca fue sobre el dragón. Fue sobre quién se queda con un poder así cuando él ya no esté. Yo solo quería que fuera alguien cuidadoso."
  },
  biomes: null,
  choices: [
    {
      label: { en: "Face him", es: "Enfrentarlo" },
      icon: "⚔️",
      apply() {
        (gameState.worldFlags ??= {}).valdris_combat_pending = true;
        return {
          en: "There is no reasoning left in his eyes — only the hunger of everything he absorbed. You draw your weapon.",
          es: "Ya no queda razón en sus ojos — solo el hambre de todo lo que absorbió. Desenvainás tu arma."
        };
      }
    }
  ]
};

/** Llamar al llegar a una zona. true = la escena arranca y movement no debe tirar el encuentro normal. */
export function maybeStartValdrisEncounter(locationId) {
  if (locationId !== "inferno_1") return false;
  if (gameState.worldFlags?.valdris_defeated) return false;
  setTimeout(() => showTravelEvent(VALDRIS_CONFRONT_EVENT), 700);
  return true;
}

/** Al cerrarse el modal de la confrontación: dispara el combate si corresponde. */
export function startValdrisCombatIfPending() {
  const f = gameState.worldFlags ?? {};
  if (!f.valdris_combat_pending) return false;
  f.valdris_combat_pending = false;
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: "valdris_corrupted", isBoss: true } }));
  }, 900);
  return true;
}

export function setupValdrisArc() {
  window.addEventListener("pixel:travelEventClosed", () => startValdrisCombatIfPending());
}
