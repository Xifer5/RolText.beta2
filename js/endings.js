// SPEC-1001 — finales según decisiones: el epílogo refleja cómo jugaste, no solo que ganaste.
import { gameState } from "./state.js";
import { t } from "./i18n.js";

// Decisiones morales que el mundo recuerda (worldFlags → línea de recap + peso moral)
export const MORAL_DECISIONS = [
  { flag: "echo_freed",       weight: +1, recapKey: "recapEchoFreed" },
  { flag: "echo_absorbed",    weight: -1, recapKey: "recapEchoAbsorbed" },
  { flag: "traveler_helped",  weight: +1, recapKey: "recapTravelerHelped" },
  { flag: "traveler_ignored", weight: -1, recapKey: "recapTravelerIgnored" },
  { flag: "purse_left",       weight: +1, recapKey: "recapPurseLeft" },
  { flag: "purse_taken",      weight: -1, recapKey: "recapPurseTaken" },
  { flag: "shrine_prayed",    weight: +1, recapKey: "recapShrinePrayed" },
  // SPEC-1107: evento "Un enemigo herido" — mismo par luz/oscuridad que los anteriores
  { flag: "wounded_enemy_spared", weight: +1, recapKey: "recapWoundedEnemySpared" },
  { flag: "wounded_enemy_killed",  weight: -1, recapKey: "recapWoundedEnemyKilled" }
];

/** Tono del final a partir de las decisiones: light (≥2), dark (≤−2), gray en medio. */
export function computeEndingTone(flags = {}) {
  const score = MORAL_DECISIONS.reduce((s, d) => s + (flags[d.flag] ? d.weight : 0), 0);
  const tone = score >= 2 ? "light" : score <= -2 ? "dark" : "gray";
  return { score, tone };
}

/** Contenido del final: claves de título/texto por tono + recap de decisiones tomadas. */
export function getEndingContent(flags = {}) {
  const { score, tone } = computeEndingTone(flags);
  const cap = tone.charAt(0).toUpperCase() + tone.slice(1);
  return {
    score,
    tone,
    titleKey: `endingTitle${cap}`,
    textKey: `endingText${cap}`,
    recapKeys: MORAL_DECISIONS.filter(d => flags[d.flag]).map(d => d.recapKey)
  };
}

/** Abre el modal de final con stats, epílogo según tono y recap de decisiones. */
export function showEnding() {
  const modal = document.getElementById("endingModal");
  if (!modal) return;
  const p = gameState.player;
  const content = getEndingContent(gameState.worldFlags ?? {});

  const title = document.getElementById("ending-title");
  const msg   = document.getElementById("endingMessage");
  if (title) title.textContent = t(content.titleKey);
  if (msg)   msg.textContent   = t(content.textKey);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("ending-level", p.level ?? 1);
  set("ending-gold",  p.gold ?? 0);
  set("ending-xp",    p.experience ?? 0);

  const list = document.getElementById("ending-decisions");
  if (list) {
    list.innerHTML = content.recapKeys.length
      ? content.recapKeys.map(k => `<li>${t(k)}</li>`).join("")
      : `<li>${t("recapNone")}</li>`;
  }

  modal.classList.remove("hidden");
}
