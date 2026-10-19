/**
 * branchUI.js — SPEC-1306: sección "Ramas" del panel de personaje.
 *
 * Muestra los 3 nodos de la especialización (nivel 10/15/20), deja elegir la
 * pasiva de nivel 15 y reiniciar elecciones / cambiar de rama con oro (solo
 * fuera de combate). La lógica vive en branchNodes.js; esto solo pinta y cablea.
 */
import { gameState } from "./state.js";
import {
  BRANCH_NODES, nodeState, pickNode, respecPicks, changeBranch, respecCost, nodeNameKey, nodeDescKey, NODE_LEVELS,
} from "./branchNodes.js";
import { SPECIALIZATIONS, getClassSpecializations } from "./specializations.js";
import { isTacticalDifficulty } from "./dodge.js";
import { addMessage } from "./story.js";
import { showToast } from "./toast.js";
import { playSound } from "./sounds.js";
import { saveGame } from "./saveSystem.js";
import { t, formatText } from "./i18n.js";

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function nodeRow(level, emoji, name, desc, stateLabel) {
  return `<div class="branch-node"><span class="branch-node-level">${t("brLevelShort")}${level}</span>
    <span class="branch-node-body"><strong>${emoji} ${esc(name)}</strong><span class="branch-node-desc">${esc(desc)}</span></span>
    <span class="branch-node-state">${esc(stateLabel)}</span></div>`;
}

/** HTML de la sección. "" si el héroe no tiene rama. */
export function branchSectionHTML() {
  const p = gameState.player;
  const st = nodeState(p);
  if (!st) return "";
  const spec = st.spec;
  const nodes = BRANCH_NODES[spec];
  const tactical = isTacticalDifficulty(gameState.difficulty);
  const inCombat = !!gameState.isInCombat;
  const rows = [];

  // Nivel 10 y 20: activas fijas
  for (const level of [10, 20]) {
    const slot = String(level);
    rows.push(nodeRow(level, nodes[level].emoji, t(nodeNameKey(spec, slot)), t(nodeDescKey(spec, slot)),
      st[level].unlocked ? t("brUnlocked") : formatText(t("brLevelLocked"), { level })));
    if (level === 10) rows.push(slot15HTML(spec, st, nodes));
  }

  const picks = st[15].pick;
  const goldNeeded = respecCost(p, "picks");
  const branchCost = respecCost(p, "branch");
  const disabled = inCombat ? "disabled" : "";
  const respecBtn = picks
    ? `<button class="btn outlined small" data-br-respec ${disabled || ((p.gold || 0) < goldNeeded ? "disabled" : "")}>${formatText(t("brRespecPicks"), { cost: goldNeeded })}</button>` : "";
  const changeBtns = getClassSpecializations(p.class).filter(s => s.id !== spec).map(s =>
    `<button class="btn outlined small" data-br-change="${s.id}" ${disabled || ((p.gold || 0) < branchCost ? "disabled" : "")}>${formatText(t("brChangeTo"), { name: s.name, emoji: s.emoji, cost: branchCost })}</button>`).join("");

  return `
    <h3 class="mastery-section-title">${t("brSectionTitle")}</h3>
    ${tactical ? "" : `<p class="muted">${t("brEasyNote")}</p>`}
    <div class="branch-nodes">${rows.join("")}</div>
    <div class="branch-actions">${respecBtn}${changeBtns}</div>
    ${inCombat ? `<p class="muted">${t("brInCombat")}</p>` : ""}
  `;
}

function slot15HTML(spec, st, nodes) {
  const n15 = st[15];
  if (!n15.unlocked) {
    return nodeRow(15, "🔒", t("brChoiceTitle"), t("brChoiceHint"), formatText(t("brLevelLocked"), { level: 15 }));
  }
  if (n15.pick) {
    const slot = `15${n15.pick}`;
    return nodeRow(15, nodes[15][n15.pick].emoji, t(nodeNameKey(spec, slot)), t(nodeDescKey(spec, slot)), t("brChosen"));
  }
  const options = ["a", "b"].map(choice => {
    const slot = `15${choice}`;
    return `<button class="spec-card branch-choice" data-br-pick="${choice}">
      <span class="spec-card-emoji">${nodes[15][choice].emoji}</span>
      <span class="spec-card-name">${esc(t(nodeNameKey(spec, slot)))}</span>
      <span class="spec-card-desc">${esc(t(nodeDescKey(spec, slot)))}</span></button>`;
  }).join("");
  return `<div class="branch-node branch-pending"><span class="branch-node-level">${t("brLevelShort")}15</span>
    <span class="branch-node-body"><strong>${t("brPickPending")}</strong><span class="branch-pick-grid">${options}</span></span></div>`;
}

/** Cablea los botones de la sección; `onChange` re-pinta el panel. */
export function wireBranchSection(root, onChange) {
  const done = (msg, toast) => {
    playSound("level_up");
    addMessage(msg, "milestone");
    if (toast) showToast(toast);
    onChange?.();
    setTimeout(() => saveGame(), 400);
  };

  root.querySelectorAll("[data-br-pick]").forEach(btn => btn.addEventListener("click", () => {
    const choice = btn.dataset.brPick;
    if (!pickNode(gameState.player, 15, choice)) return;
    const slot = `15${choice}`;
    done(formatText(t("brPickDone"), { name: t(nodeNameKey(gameState.player.specialization, slot)) }));
  }));

  root.querySelector("[data-br-respec]")?.addEventListener("click", () => {
    const r = respecPicks(gameState.player, !!gameState.isInCombat);
    if (!r.ok) return addMessage(t(r.reason === "gold" ? "brNeedGold" : "brInCombat"), "system");
    done(formatText(t("brRespecDone"), { cost: r.cost }));
  });

  root.querySelectorAll("[data-br-change]").forEach(btn => btn.addEventListener("click", () => {
    const r = changeBranch(gameState.player, btn.dataset.brChange, !!gameState.isInCombat);
    if (!r.ok) return addMessage(t(r.reason === "gold" ? "brNeedGold" : "brInCombat"), "system");
    const spec = SPECIALIZATIONS[btn.dataset.brChange];
    done(formatText(t("brBranchChanged"), { name: spec.name, cost: r.cost }), `${spec.emoji} ${spec.name}`);
  }));
}

export { NODE_LEVELS };
