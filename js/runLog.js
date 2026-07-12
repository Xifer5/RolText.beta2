// SPEC-1003 — Crónica de partidas: registro persistente FUERA del save.
// Cada victoria final o muerte deja una entrada; sobrevive a "Nuevo juego" y a los slots.
import { gameState } from "./state.js";
import { getEndingContent } from "./endings.js";
import { ORIGINS } from "./origins.js";
import { DIFFICULTY_CONFIG } from "./difficulty.js";
import { t, localizeText } from "./i18n.js";

const LOG_KEY = "pqe.runlog.v1";
export const RUN_LOG_LIMIT = 20;

/** Instantánea de la partida actual para la crónica. */
export function buildRunRecord(state, outcome) {
  const p = state.player ?? {};
  const content = getEndingContent(state.worldFlags ?? {});
  return {
    outcome,                                   // "victory" | "defeat"
    name: p.name || "Aventurero",
    class: p.class ?? null,
    className: p.className ?? null,
    classEmoji: p.classEmoji ?? "⚔️",
    origin: p.origin ?? null,
    difficulty: state.difficulty ?? "easy",
    level: p.level ?? 1,
    gold: p.gold ?? 0,
    kills: state.stats?.kills ?? 0,
    bossKills: state.stats?.bossKills ?? 0,
    endingTitleKey: outcome === "victory" ? content.titleKey : null,
    tone: outcome === "victory" ? content.tone : null,
    decisions: content.recapKeys.length,
    timestamp: new Date().toISOString()
  };
}

export function readRunLog() {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** Añade la partida actual a la crónica (la más reciente primero, tope RUN_LOG_LIMIT). */
export function recordRun(outcome) {
  const rec = buildRunRecord(gameState, outcome);
  const log = [rec, ...readRunLog()].slice(0, RUN_LOG_LIMIT);
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch { /* storage lleno: la partida sigue */ }
  return rec;
}

// ── UI ───────────────────────────────────────────────────────────

function runRow(rec) {
  const icon = rec.outcome === "victory" ? "🏆" : "💀";
  const origin = ORIGINS[rec.origin];
  const diff = DIFFICULTY_CONFIG[rec.difficulty];
  const date = new Date(rec.timestamp);
  const headline = rec.outcome === "victory"
    ? t(rec.endingTitleKey || "endingTitle")
    : t("runDefeatLabel");
  const bits = [
    `${diff?.emoji ?? ""} ${localizeText(diff?.name) || rec.difficulty}`,
    origin ? `${origin.emoji} ${localizeText(origin.name)}` : null,
    `${t("levelAbbr")} ${rec.level}`,
    `⚔️ ${rec.kills}`,
    isNaN(date) ? null : date.toLocaleDateString()
  ].filter(Boolean).join(" · ");
  return `
    <div class="save-slot-row run-row">
      <div class="save-slot-info">
        <div class="save-slot-name">${icon} ${rec.classEmoji} ${rec.name} — ${headline}</div>
        <div class="save-slot-meta">${bits}<br><small>${t("runDecisionsLabel")}: ${rec.decisions}</small></div>
      </div>
    </div>`;
}

export function renderRunLog() {
  const list = document.getElementById("runLogList");
  if (!list) return;
  const log = readRunLog();
  list.innerHTML = log.length
    ? log.map(runRow).join("")
    : `<p class="muted">${t("runLogEmpty")}</p>`;
}

export function setupRunLog() {
  const modal = document.getElementById("runLogModal");
  document.getElementById("runLogBtn")?.addEventListener("click", () => {
    renderRunLog();
    modal?.classList.remove("hidden");
  });
  document.getElementById("closeRunLogBtn")?.addEventListener("click", () => modal?.classList.add("hidden"));
  modal?.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}
