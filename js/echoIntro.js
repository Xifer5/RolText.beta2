// SPEC-0902 — "El eco del bosque": mini-aventura guionizada de los primeros 5 minutos.
// Primera llegada a forest_1 (objetivo de mq_01): decisión moral persistente →
// combate guionizado que enseña el intent enemigo → recompensa con elección de build.
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { showTravelEvent } from "./travelEvents.js";
import { maybeShowHint } from "./onboarding.js";
import { t } from "./i18n.js";

const flags = () => (gameState.worldFlags ??= {});

// ── Acto 1: decisión moral ─────────────────────────────────────────
export const ECHO_MORAL_EVENT = {
  id: "echo_moral",
  icon: "🌫️",
  title: { en: "A Fading Echo", es: "Un eco que se apaga" },
  text: {
    en: "At the forest's edge, a creature of soft light lies tangled in black brambles — a living fragment of the dragon's dream, flickering like a dying candle. Deep claw marks surround it. Whatever hunted it is still close.",
    es: "A la entrada del bosque, una criatura de luz tenue yace enredada en zarzas negras: un fragmento vivo del sueño del dragón, parpadeando como una vela a punto de apagarse. Hay marcas de zarpas alrededor. Lo que la cazaba sigue cerca."
  },
  biomes: null,
  choices: [
    {
      label: { en: "Free it", es: "Liberarlo" },
      icon: "🕊️",
      apply() {
        const f = flags();
        f.echo_intro_done = true;
        f.echo_freed = true;
        f.echo_combat_pending = true;
        return {
          en: "You tear the brambles apart with bare hands. The echo rises, brushes your forehead — a warmth without words — and scatters between the trees. The forest seems to take note of you.",
          es: "Arrancas las zarzas con las manos desnudas. El eco se eleva, roza tu frente — una calidez sin palabras — y se dispersa entre los árboles. El bosque parece tomar nota de ti."
        };
      }
    },
    {
      label: { en: "Absorb its energy", es: "Absorber su energía" },
      icon: "🌀",
      apply() {
        const f = flags();
        f.echo_intro_done = true;
        f.echo_absorbed = true;
        f.echo_combat_pending = true;
        gameState.player.experience = (gameState.player.experience ?? 0) + 30;
        return {
          en: "You close your hand around the light. It doesn't resist. Power floods your veins — and the forest goes cold around you. +30 XP",
          es: "Cierras la mano en torno a la luz. No opone resistencia. El poder inunda tus venas — y el bosque se enfría a tu alrededor. +30 XP"
        };
      }
    }
  ]
};

// ── Acto 3: recompensa con elección de build ───────────────────────
function grantItem(itemId) {
  gameState.inventory[itemId] = (gameState.inventory[itemId] ?? 0) + 1;
}

export const ECHO_REWARD_EVENT = {
  id: "echo_reward",
  icon: "✨",
  title: { en: "The Dream Takes Shape", es: "El sueño toma forma" },
  text: {
    en: "Where the wolf fell, a shard of the dream still hums in the air. It shivers, waiting: it can become whatever you need it to be. Choose one form — the others will fade.",
    es: "Donde cayó el lobo, una esquirla del sueño aún vibra en el aire. Tiembla, esperando: puede convertirse en lo que necesites. Elige una forma — las demás se desvanecerán."
  },
  biomes: null,
  choices: [
    {
      label: { en: "A blade (favors Strength)", es: "Un filo (favorece la Fuerza)" },
      icon: "⚔️",
      apply() {
        flags().echo_reward_taken = "iron_sword";
        grantItem("iron_sword");
        return { en: "The light hardens into cold iron. +1 Iron Sword — equip it from your inventory.", es: "La luz se endurece en hierro frío. +1 Espada de Hierro — equípala desde el inventario." };
      }
    },
    {
      label: { en: "A focus (favors Magic)", es: "Un foco (favorece la Magia)" },
      icon: "🔮",
      apply() {
        flags().echo_reward_taken = "staff";
        grantItem("staff");
        return { en: "The light coils around a branch of living wood. +1 Magic Staff — equip it from your inventory.", es: "La luz se enrosca en una rama de madera viva. +1 Báculo Mágico — equípalo desde el inventario." };
      }
    },
    {
      label: { en: "A ring (favors Agility)", es: "Un anillo (favorece la Agilidad)" },
      icon: "💍",
      apply() {
        flags().echo_reward_taken = "ring_agility";
        grantItem("ring_agility");
        return { en: "The light closes into a slender ring. +1 Agility Ring — equip it from your inventory.", es: "La luz se cierra en un anillo esbelto. +1 Anillo de Agilidad — equípalo desde el inventario." };
      }
    }
  ]
};

// ── Orquestación ───────────────────────────────────────────────────

/** Llamar al llegar a una zona. true = la escena arranca y movement no debe tirar encuentros/eventos. */
export function maybeStartEchoIntro(locationId) {
  if (locationId !== "forest_1" || flags().echo_intro_done) return false;
  setTimeout(() => showTravelEvent(ECHO_MORAL_EVENT), 700);
  return true;
}

/** Al cerrarse el modal de la decisión moral: el lobo que hería al eco vuelve. */
export function startEchoCombatIfPending() {
  const f = flags();
  if (!f.echo_combat_pending) return false;
  f.echo_combat_pending = false;
  f.echo_reward_pending = true;
  addMessage(t("echoWolfHowl"), "narrative");
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: "wolf", isBoss: false } }));
    setTimeout(() => {
      addMessage(t("echoIntentTip"), "system");
      maybeShowHint("enemy_intent");
    }, 1400);
  }, 900);
  return true;
}

/** Hook de victoria (combat.js): true si la recompensa del eco quedó programada. */
export function consumeEchoReward() {
  const f = flags();
  if (!f.echo_reward_pending) return false;
  f.echo_reward_pending = false;
  setTimeout(() => showTravelEvent(ECHO_REWARD_EVENT), 1600);
  return true;
}

export function setupEchoIntro() {
  window.addEventListener("pixel:travelEventClosed", () => startEchoCombatIfPending());
}
