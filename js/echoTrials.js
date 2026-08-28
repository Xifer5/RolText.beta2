// SPEC-1206 — Pruebas del Eco: gauntlet repetible post-victoria (roadmap
// "siguiente nivel" ítem #4, diferido en la auditoría de jugabilidad
// 2026-08-27 a favor de un New Game+ liviano primero). Reusa el 100% de la
// infraestructura de combate/boss ya existente — CERO IA/mecánica nueva:
// cada "prueba" es simplemente re-pelear uno de los 7 jefes de zona vía el
// mismo `pixel:startCombat` que ya usan Kestrel/mini-boss/echoIntro. El único
// código nuevo es "cuál jefe toca", "cuánto escala" y "qué pasa cuando lo
// tumbás".
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

// SPEC-1207 — escalada real y visible (feedback de review 2026-08-28: la
// dificultad antes solo subía de forma implícita porque el jugador ganaba
// niveles al jugar, nunca se garantizaba ni se mostraba). Nivel 1 = jefe
// base; cada nivel extra suma +10% HP / +5% daño. Cada vuelta completa a los
// 7 jefes (un "ciclo") suma otro +10%/+5% acumulado, para que seguir
// grindeando más allá de la primera vuelta siga sintiéndose más duro.
const PER_LEVEL_HP  = 0.10;
const PER_LEVEL_ATK = 0.05;
const PER_CYCLE_HP  = 0.10;
const PER_CYCLE_ATK = 0.05;

export function trialMultiplier(level) {
  const cycles = Math.floor((level - 1) / TRIAL_BOSSES.length);
  return {
    hp:  1 + (level - 1) * PER_LEVEL_HP  + cycles * PER_CYCLE_HP,
    atk: 1 + (level - 1) * PER_LEVEL_ATK + cycles * PER_CYCLE_ATK
  };
}

function currentTrialBoss() {
  const level = gameState.echoTrials?.level ?? 0;
  return TRIAL_BOSSES[level % TRIAL_BOSSES.length];
}

export function renderEchoTrials() {
  const trials = gameState.echoTrials ?? { level: 0, best: 0 };
  const bossId = currentTrialBoss();
  const bossName = enemyData[bossId]?.type ?? bossId;
  const nextLevel = trials.level + 1;
  const mult = trialMultiplier(nextLevel);
  const scaleLine = mult.hp > 1
    ? formatText(t('echoTrialsScaleLine'), { hp: Math.round((mult.hp - 1) * 100), atk: Math.round((mult.atk - 1) * 100) })
    : t('echoTrialsScaleBaseLine');
  return `
    <div class="echo-trials-panel">
      <p>${t('echoTrialsIntro')}</p>
      <div class="ending-stats-grid">
        <div><div class="es-label">${t('echoTrialsCurrentLabel')}</div><div class="es-val">${trials.level}</div></div>
        <div><div class="es-label">${t('echoTrialsBestLabel')}</div><div class="es-val gold-accent">${trials.best ?? 0}</div></div>
      </div>
      <p class="echo-trials-next">${formatText(t('echoTrialsNextLabel'), { n: nextLevel, boss: bossName })}</p>
      <p class="echo-trials-scale">${scaleLine}</p>
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
  const nextLevel = (gameState.echoTrials?.level ?? 0) + 1;
  window.dispatchEvent(new CustomEvent("pixel:startCombat", {
    detail: { enemyId: currentTrialBoss(), isBoss: true, extraMult: trialMultiplier(nextLevel) }
  }));
}

// Lógica pura (sin efectos de UI) para poder testearla directo — el stub de
// DOM de los tests no implementa un EventTarget real en window/document, y
// programar el toast acá adentro dejaba un setTimeout vivo disparando
// después de terminado el test (requestAnimationFrame no definido en el
// stub). El toast se programa en el listener de abajo, no acá.
export function handleBossDefeated(enemyId) {
  if (!gameState.echoTrialActive || enemyId !== currentTrialBoss()) return null;
  gameState.echoTrialActive = false;
  const trials = (gameState.echoTrials ??= { level: 0, best: 0 });
  trials.level += 1;
  trials.best = Math.max(trials.best ?? 0, trials.level);
  const bonus = earnTrialFragments(trials.level);
  return { level: trials.level, bonus };
}

// combatRewards.js dispatca "pixel:bossDefeated" en TODO kill de boss (zona,
// mini-boss, dragon_king, kestrel_rival...). handleBossDefeated() ya filtra
// por coincidencia exacta con el jefe que ESTA prueba pidió — cualquier otro
// boss kill (exploración normal, Kestrel) pasa de largo sin efecto.
window.addEventListener("pixel:bossDefeated", (e) => {
  const result = handleBossDefeated(e.detail?.enemyId);
  if (!result) return;
  setTimeout(() => showToast(formatText(t('echoTrialClearedToast'), { n: result.level, bonus: result.bonus }), "boss"), 2000);
});
