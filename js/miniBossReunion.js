// SPEC-1104 — Reencuentro con un mini-boss perdonado: reemplaza su propio
// slot en el roll de trySpawnBoss() del mismo bioma (ver movement.js). La
// decisión aliado/traidor es del jugador EN ESE MOMENTO — no reutiliza el
// peso de MORAL_DECISIONS de endings.js (SPEC-0803 decidió "sin karma").
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { showTravelEvent } from "./travelEvents.js";
import { enemyData } from "./enemies.js";
import { t, formatText } from "./i18n.js";

const REUNION_ALLY_GOLD = 50;
const REUNION_ALLY_XP = 30;

export function showMiniBossReunion(enemyId) {
  const enemyName = enemyData[enemyId]?.type ?? enemyId;
  const spareFlag = "spared_" + enemyId;

  const event = {
    id: "mini_boss_reunion_" + enemyId,
    icon: "🕊️",
    title: t("reunionTitle"),
    text: formatText(t("reunionBodyText"), { enemy: enemyName }),
    biomes: null,
    choices: [
      {
        label: t("reunionTrustLabel"),
        icon: "🤝",
        apply() {
          if (!gameState.worldFlags) gameState.worldFlags = {};
          gameState.worldFlags[spareFlag + "_resolved"] = true;
          gameState.player.gold = (gameState.player.gold || 0) + REUNION_ALLY_GOLD;
          gameState.player.experience = (gameState.player.experience || 0) + REUNION_ALLY_XP;
          return formatText(t("reunionAllyMsg"), { enemy: enemyName, gold: REUNION_ALLY_GOLD, xp: REUNION_ALLY_XP });
        }
      },
      {
        label: t("reunionDistrustLabel"),
        icon: "⚔️",
        apply() {
          if (!gameState.worldFlags) gameState.worldFlags = {};
          gameState.worldFlags[spareFlag + "_resolved"] = true;
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId, isBoss: true } }));
          }, 900);
          return formatText(t("reunionTraitorMsg"), { enemy: enemyName });
        }
      }
    ]
  };

  showTravelEvent(event);
}
