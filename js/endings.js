// SPEC-1001 — finales según decisiones: el epílogo refleja cómo jugaste, no solo que ganaste.
import { gameState } from "./state.js";
import { t } from "./i18n.js";
import { getLastRunFragments } from "./metaProgress.js";

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

// SPEC-1202 — el arco de Kestrel (rivalArc.js) resuelve su propio worldFlag
// (rival_resolved_ally/traitor/competitor) totalmente separado de
// MORAL_DECISIONS a propósito (ver rivalArc.js) — no cambia el tono del
// final, pero SÍ necesita aparecer en el recap: era el sistema de personaje
// recurrente más grande del juego y el epílogo nunca lo mencionaba.
const RIVAL_RECAP = {
  rival_resolved_ally:       { icon: "🤝", key: "recapRivalAlly" },
  rival_resolved_traitor:    { icon: "🔪", key: "recapRivalTraitor" },
  rival_resolved_competitor: { icon: "⚔️", key: "recapRivalCompetitor" }
};

function getRivalRecap(flags = {}) {
  const [, entry] = Object.entries(RIVAL_RECAP).find(([flag]) => flags[flag]) ?? [];
  return entry ?? null;
}

// SPEC-1202 — coda de 1 frase por clase×tono (9 combinaciones), anexada al
// texto base del tono. Multiplica la variedad real de epílogo de 3 a 9
// textos distintos sin tocar el cálculo de tono (que sigue siendo el mismo
// rango ±5 de MORAL_DECISIONS — solo se le agrega voz, no más buckets).
const CLASS_BEAT_KEYS = {
  warrior: { light: "endingBeatWarriorLight", gray: "endingBeatWarriorGray", dark: "endingBeatWarriorDark" },
  mage:    { light: "endingBeatMageLight",    gray: "endingBeatMageGray",    dark: "endingBeatMageDark" },
  rogue:   { light: "endingBeatRogueLight",   gray: "endingBeatRogueGray",   dark: "endingBeatRogueDark" }
};

/** Contenido del final: claves de título/texto por tono + recap de decisiones tomadas. */
export function getEndingContent(flags = {}) {
  const { score, tone } = computeEndingTone(flags);
  const cap = tone.charAt(0).toUpperCase() + tone.slice(1);
  return {
    score,
    tone,
    titleKey: `endingTitle${cap}`,
    textKey: `endingText${cap}`,
    classBeatKey: CLASS_BEAT_KEYS[gameState.player?.class]?.[tone] ?? null,
    recapKeys: MORAL_DECISIONS.filter(d => flags[d.flag]).map(d => d.recapKey),
    rivalRecap: getRivalRecap(flags)
  };
}

// SPEC-1208 — recap de decisiones compartido entre el modal de victoria y el
// de derrota: mismo contenido (el mundo recuerda lo mismo, ganes o pierdas).
function decisionRecapHtml(content) {
  const items = content.recapKeys.map(k => `<li>${t(k)}</li>`);
  if (content.rivalRecap) items.push(`<li>${content.rivalRecap.icon} ${t(content.rivalRecap.key)}</li>`);
  return items.length ? items.join("") : `<li>${t("recapNone")}</li>`;
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
  if (msg)   msg.textContent   = content.classBeatKey
    ? `${t(content.textKey)} ${t(content.classBeatKey)}`
    : t(content.textKey);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("ending-level",     p.level ?? 1);
  set("ending-gold",      p.gold ?? 0);
  set("ending-xp",        p.experience ?? 0);
  set("ending-fragments", `✨ ${getLastRunFragments()}`);

  const list = document.getElementById("ending-decisions");
  if (list) list.innerHTML = decisionRecapHtml(content);

  modal.classList.remove("hidden");
}

// SPEC-1208 — resumen post-run también en derrota (antes gameOverModal era
// "GAME OVER" + botón, sin nada más): mismo recap de decisiones + fragmentos
// ganados que ya tenía la victoria. NO reusa título/texto de tono (serían
// narrativamente incoherentes en una derrota — "Guardián de Aetheria" al
// morir no tiene sentido), solo las partes tono-neutrales: stats y recap.
export function showGameOver() {
  const modal = document.getElementById("gameOverModal");
  if (!modal) return;
  const p = gameState.player;
  const content = getEndingContent(gameState.worldFlags ?? {});

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("go-level",     p.level ?? 1);
  set("go-gold",      p.gold ?? 0);
  set("go-fragments", `✨ ${getLastRunFragments()}`);

  const list = document.getElementById("go-decisions");
  if (list) list.innerHTML = decisionRecapHtml(content);

  modal.classList.remove("hidden");
}
