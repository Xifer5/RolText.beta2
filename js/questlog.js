import { QUEST_DATA, getQuestStatus, checkQuestCondition } from "./quests.js";
import { NPC_DATA } from "./npcs.js";
import { gameState } from "./state.js";
import { allItems } from "./items.js";

// NPC inverso: questId → NPC
const _questNpc = Object.fromEntries(
  Object.values(NPC_DATA).map(n => [n.questId, n])
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
  if (tab === "active")    return "No tienes misiones activas. Habla con los NPCs del mundo.";
  if (tab === "available") return "¡Has hablado con todos los NPCs disponibles!";
  if (tab === "completed") return "Aún no has completado ninguna misión.";
  return "";
}

// ── TARJETA DE MISIÓN ───────────────────────────────────────────────
function _questCard(q) {
  const status   = getQuestStatus(q.id);
  const npc      = _questNpc[q.id];
  const loc      = window.worldMap?.[npc?.locationId];
  const canTurn  = status === "active" && checkQuestCondition(q.id);
  const progress = _progressHtml(q, status);
  const reward   = _rewardHtml(q.reward);

  const badgeClass = status === "completed" ? "completed"
                   : canTurn              ? "ready"
                   :                        status;
  const badgeLabel = status === "completed" ? "Completada ✓"
                   : canTurn              ? "¡Lista para entregar!"
                   : status === "active"  ? "En progreso"
                   :                        "Disponible";

  return `
  <div class="ql-card ${status}">
    <div class="ql-card-header">
      <div class="ql-npc-badge">
        <span class="ql-npc-emoji">${npc?.emoji ?? "❓"}</span>
        <span class="ql-npc-name">${npc?.name ?? "Desconocido"}</span>
        ${loc ? `<span class="ql-npc-loc">· ${loc.name}</span>` : ""}
      </div>
      <span class="npc-quest-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="ql-title">${q.title}</div>
    ${progress}
    <div class="ql-reward">${reward}</div>
  </div>`;
}

// ── PROGRESO ────────────────────────────────────────────────────────
function _progressHtml(q, status) {
  if (status === "completed") {
    return `<div class="ql-progress-text done">✅ Misión completada.</div>`;
  }
  if (status === "inactive") {
    return `<div class="ql-progress-text">Habla con ${_questNpc[q.id]?.name ?? "el NPC"} para aceptar esta misión.</div>`;
  }

  // active
  switch (q.type) {
    case "visit": {
      const visited = !!(gameState.visitedLocations?.[q.target]);
      const locName = window.worldMap?.[q.target]?.name ?? q.target;
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">Visitar: <b>${locName}</b></span>
          <span class="ql-check">${visited ? "✅" : "⬜"}</span>
        </div>`;
    }
    case "collect": {
      const have    = gameState.inventory?.[q.item] ?? 0;
      const need    = q.qty;
      const pct     = Math.min(100, Math.round((have / need) * 100));
      const itemName = allItems[q.item]?.name ?? q.item;
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">Recolectar: <b>${itemName}</b> ${have}/${need}</span>
          <div class="ql-bar-wrap"><div class="ql-bar" style="width:${pct}%"></div></div>
        </div>`;
    }
    case "kill": {
      const killed  = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      const need    = q.count;
      const pct     = Math.min(100, Math.round((killed / need) * 100));
      return `
        <div class="ql-progress">
          <span class="ql-progress-text">Derrotar: <b>${q.enemy}</b> ${killed}/${need}</span>
          <div class="ql-bar-wrap"><div class="ql-bar" style="width:${pct}%"></div></div>
        </div>`;
    }
    default:
      return "";
  }
}

// ── RECOMPENSA ──────────────────────────────────────────────────────
function _rewardHtml(reward) {
  const parts = [];
  if (reward?.item) {
    const item = allItems[reward.item];
    parts.push(`${item?.icon ?? "📦"} ${item?.name ?? reward.item}`);
  }
  if (reward?.xp)   parts.push(`✨ ${reward.xp} XP`);
  if (reward?.gold) parts.push(`🪙 ${reward.gold} oro`);
  return parts.length
    ? `<span class="ql-reward-label">Recompensa:</span> ${parts.join(" · ")}`
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
