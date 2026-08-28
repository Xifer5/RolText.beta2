// SPEC-1206 — Pruebas del Eco: gauntlet repetible post-victoria (roadmap
// "siguiente nivel" ítem #4, diferido en la auditoría de jugabilidad
// 2026-08-27 a favor de un New Game+ liviano primero). Reusa el 100% de la
// infraestructura de combate/boss ya existente — CERO IA/mecánica nueva:
// cada "prueba" es simplemente re-pelear uno de los 7 jefes de zona vía el
// mismo `pixel:startCombat` que ya usan Kestrel/mini-boss/echoIntro. El único
// código nuevo es "cuál jefe toca" y "qué pasa cuando lo tumbás".
//
// Decisión de diseño: NO se inventó un sistema de "muerte segura". Morir en
// una Prueba es una derrota como cualquier otra (mismo flujo de Game Over de
// siempre) — se avisa explícitamente y se auto-guarda antes de empezar, para
// no necesitar tocar el código de muerte en combat.js/bossMechanics.js.
import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";
import { saveGame } from "./saveSystem.js";
import { showToast } from "./toast.js";
import { earnTrialFragments } from "./metaProgress.js";
import { t, formatText } from "./i18n.js";

export const TRIAL_BOSSES = [
  "forest_titan", "cave_devourer", "mountain_colossus",
  "ancient_construct", "swamp_abomination", "inferno_dragon", "frost_wyrm"
];

function currentTrialBoss() {
  const level = gameState.echoTrials?.level ?? 0;
  return TRIAL_BOSSES[level % TRIAL_BOSSES.length];
}

export function renderEchoTrials() {
  const trials = gameState.echoTrials ?? { level: 0, best: 0 };
  const bossId = currentTrialBoss();
  const bossName = enemyData[bossId]?.type ?? bossId;
  return `
    <div class="echo-trials-panel">
      <p>${t('echoTrialsIntro')}</p>
      <div class="ending-stats-grid">
        <div><div class="es-label">${t('echoTrialsCurrentLabel')}</div><div class="es-val">${trials.level}</div></div>
        <div><div class="es-label">${t('echoTrialsBestLabel')}</div><div class="es-val gold-accent">${trials.best ?? 0}</div></div>
      </div>
      <p class="echo-trials-next">${formatText(t('echoTrialsNextLabel'), { n: trials.level + 1, boss: bossName })}</p>
      <p class="echo-trials-warning">⚠️ ${t('echoTrialsWarning')}</p>
      <button type="button" id="startEchoTrialBtn" class="btn-action">${t('echoTrialsStartButton')}</button>
    </div>`;
}

export function wireEchoTrialsPanel() {
  document.getElementById("startEchoTrialBtn")?.addEventListener("click", startNextTrial);
}

function startNextTrial() {
  const p = gameState.player;
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  saveGame(); // red de seguridad ANTES de marcar la prueba activa (ver nota de diseño arriba)
  gameState.echoTrialActive = true;
  document.getElementById("panelModal")?.classList.add("hidden");
  window.dispatchEvent(new CustomEvent("pixel:startCombat", { detail: { enemyId: currentTrialBoss(), isBoss: true } }));
}

// combatRewards.js dispatca "pixel:bossDefeated" en TODO kill de boss (zona,
// mini-boss, dragon_king, kestrel_rival...). Solo actuamos si coincide
// exactamente con el jefe que ESTA prueba pidió — cualquier otro boss kill
// (exploración normal, Kestrel) pasa de largo sin efecto.
window.addEventListener("pixel:bossDefeated", (e) => {
  if (!gameState.echoTrialActive || e.detail?.enemyId !== currentTrialBoss()) return;
  gameState.echoTrialActive = false;
  const trials = (gameState.echoTrials ??= { level: 0, best: 0 });
  trials.level += 1;
  trials.best = Math.max(trials.best ?? 0, trials.level);
  const bonus = earnTrialFragments(trials.level);
  setTimeout(() => showToast(formatText(t('echoTrialClearedToast'), { n: trials.level, bonus }), "boss"), 2000);
});
