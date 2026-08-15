import { QUEST_DATA, getQuestStatus, checkQuestCondition, isQuestLocked } from "./quests.js";
import { NPC_DATA } from "./npcs.js";
import { gameState } from "./state.js";
import { allItems } from "./items.js";
import { enemyData } from "./enemies.js";
import { t, formatText, localizeText } from "./i18n.js";

// NPC inverso: questId → NPC (soporta questId string y questIds array)
const _questNpc = Object.fromEntries(
  Object.values(NPC_DATA).flatMap(n => {
    const ids = n.questIds ?? (n.questId ? [n.questId] : []);
    return ids.map(id => [id, n]);
  })
);

// ── RENDER PRINCIPAL ────────────────────────────────────────────────
export function renderQuestLog(tab = "active") {
  const body = document.getElementById("ql-body");
  if (!body) return;

  const quests = Object.values(QUEST_DATA);
  const filtered = quests.filter(q => {
    const s = getQuestStatus(q.id);
    if (tab === "active")    return s === "active";
    if (tab === "available") return s === "inactive";
    if (tab === "completed") return s === "completed";
    return false;
  });

  if (!filtered.length) {
    body.innerHTML = `<div class="ql-empty">${_emptyMsg(tab)}</div>`;
    return;
  }

  body.innerHTML = filtered.map(q => _questCard(q)).join("");
}

function _emptyMsg(tab) {
  if (tab === "active")    return t("qlEmptyActive");
  if (tab === "available") return t("qlEmptyAvailable");
  if (tab === "completed") return t("qlEmptyCompleted");
  return "";
}

// ── TARJETA DE MISIÓN ───────────────────────────────────────────────
function _questCard(q) {
  const status   = getQuestStatus(q.id);
  const npc      = _questNpc[q.id];
  const loc      = window.worldMap?.[npc?.locationId];
  const locName  = localizeText(loc?.name) || t("unknownLocation");
  const canTurn  = status === "active" && checkQuestCondition(q.id);
  // SPEC-1113: una misión "inactive" con prerequisiteQuest sin completar
  // no está realmente disponible todavía — hablar con el NPC ya mostraba
  // el diálogo `locked`, pero la card seguía diciendo "Disponible".
  const locked   = isQuestLocked(q.id);
  const progress = _progressHtml(q, status, locked);
  const reward   = _rewardHtml(q.reward);

  const badgeClass = locked                ? "locked"
                   : status === "completed" ? "completed"
                   : canTurn              ? "ready"
                   :                        status;
  const badgeLabel = locked                ? t("qlStatusLocked")
                   : status === "completed" ? t("qlStatusCompleted")
                   : canTurn              ? t("qlStatusReady")
                   : status === "active"  ? t("qlStatusActive")
                   :                        t("qlStatusAvailable");

  return `
  <div class="ql-card ${status}">
    <div class="ql-card-header">
      <div class="ql-npc-badge">
        <span class="ql-npc-emoji">${npc?.emoji ?? "❓"}</span>
        <span class="ql-npc-name">${npc?.name ?? t("unknownLocation")}</span>
        ${loc ? `<span class="ql-npc-loc">· ${locName}</span>` : ""}
      </div>
      <span class="npc-quest-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="ql-title">${localizeText(q.title)}</div>
    ${progress}
    <div class="ql-reward">${reward}</div>
  </div>`;
}

// ── PROGRESO ────────────────────────────────────────────────────────
function _progressHtml(q, status, locked) {
  if (status === "completed") {
    return `<div class="ql-progress-text done">${t("qlProgressCompleted")}</div>`;
  }
  if (status === "inactive") {
    if (locked) {
      const prereqTitle = localizeText(QUEST_DATA[q.prerequisiteQuest]?.title) ?? q.prerequisiteQuest;
      return `<div class="ql-progress-text locked">${formatText(t("qlProgressLocked"), { quest: prereqTitle })}</div>`;
    }
    return `<div class="ql-progress-text">${formatText(t("qlProgressInactive"), { npc: _questNpc[q.id]?.name ?? t("unknownLocation") })}</div>`;
  }

  // active
  switch (q.type) {
    case "visit": {
      const visited = !!(gameState.visitedLocations?.[q.target]);
      const locName = localizeText(window.worldMap?.[q.target]?.name) || q.target;
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">${formatText("qlProgressVisit", { target: locName })}</span>
          <span class="ql-check">${visited ? "✅" : "⬜"}</span>
        </div>`;
    }
    case "collect": {
      const have    = gameState.inventory?.[q.item] ?? 0;
      const need    = q.qty;
      const pct     = Math.min(100, Math.round((have / need) * 100));
      const itemName = localizeText(allItems[q.item]?.name) || q.item;
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">${formatText("qlProgressCollect", { item: itemName, have, need })}</span>
          <div class="ql-bar-wrap"><div class="ql-bar" style="width:${pct}%"></div></div>
        </div>`;
    }
    case "kill": {
      const killed  = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      const need    = q.count;
      const pct     = Math.min(100, Math.round((killed / need) * 100));
      // q.enemy es un id interno (ej. "pirate") — localizeText(q.enemy) lo
      // devolvía tal cual (no es un objeto {en,es}), mostrando el id crudo.
      // El nombre real vive en enemyData[id].type (ej. "Pirate").
      const enemyName = localizeText(enemyData[q.enemy]?.type) || q.enemy;
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">${formatText("qlProgressKill", { enemy: enemyName, killed, need })}</span>
          <div class="ql-bar-wrap"><div class="ql-bar" style="width:${pct}%"></div></div>
        </div>`;
    }
    default:
      return "";
  }
}

function _iconHtml(icon) {
  if (!icon) return "📦";
  if (icon.includes("/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(icon))
    return `<img src="${icon}" width="20" height="20" style="vertical-align:middle;border-radius:3px">`;
  return icon;
}

// ── RECOMPENSA ──────────────────────────────────────────────────────
function _rewardHtml(reward) {
  const parts = [];
  if (reward?.item) {
    const item = allItems[reward.item];
    parts.push(`${_iconHtml(item?.icon)} ${localizeText(item?.name) ?? reward.item}`);
  }
  if (reward?.xp)   parts.push(`✨ ${reward.xp} XP`);
  if (reward?.gold) parts.push(`🪙 ${reward.gold} ${t("endingGoldLabel").toLowerCase()}`);
  return parts.length
    ? `<span class="ql-reward-label">${t("qlRewardLabel")}</span> ${parts.join(" · ")}`
    : "";
}

// ── SETUP DE TABS ───────────────────────────────────────────────────
export function setupQuestLogTabs() {
  document.querySelectorAll(".ql-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ql-tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      renderQuestLog(btn.dataset.tab);
    });
  });
}
