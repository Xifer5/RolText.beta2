// SPEC-0805 — modal de ranuras de guardado (modo "save" | "load")
import { listSlots, saveToSlot, loadFromSlot, deleteSlot } from "./saveSystem.js";
import { updateUI, toggleMainMenu } from "./ui.js";
import { showToast } from "./toast.js";
import { t, formatText } from "./i18n.js";

let mode = "save";

function slotLabel(id, idx) {
  return id === "auto" ? t("slotAuto") : formatText("slotManual", { n: idx });
}

function slotMeta(data) {
  const p = data.gameState?.player ?? {};
  const date = new Date(data.timestamp);
  const cls = p.className || t("defaultPlayerName");
  return `${p.classEmoji || "⚔️"} ${cls} · ${t("levelAbbr")} ${p.level ?? 1} · ${p.gold ?? 0} 🪙` +
         `<br><small>${isNaN(date) ? "" : date.toLocaleString()}</small>`;
}

function closeModal() {
  document.getElementById("saveSlotsModal")?.classList.add("hidden");
}

function render() {
  const list = document.getElementById("saveSlotsList");
  const hint = document.getElementById("saveSlotsHint");
  if (!list) return;
  if (hint) hint.textContent = t(mode === "save" ? "saveSlotsSaveHint" : "saveSlotsLoadHint");
  list.innerHTML = "";

  listSlots().forEach(({ id, data }, idx) => {
    const row = document.createElement("div");
    row.className = "save-slot-row" + (data ? "" : " empty");

    const info = document.createElement("div");
    info.className = "save-slot-info";
    info.innerHTML =
      `<div class="save-slot-name">${slotLabel(id, idx)}</div>` +
      `<div class="save-slot-meta">${data ? slotMeta(data) : t("slotEmpty")}</div>`;
    row.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "save-slot-actions";

    const main = document.createElement("button");
    main.className = "btn small";
    if (mode === "save") {
      main.textContent = t("slotSaveAction");
      main.disabled = id === "auto";
      if (id === "auto") main.title = t("slotAutoLocked");
      main.onclick = () => {
        if (data && !confirm(t("confirmOverwriteSlot"))) return;
        if (saveToSlot(id)) { showToast(t("saveGameSaved")); render(); }
      };
    } else {
      main.textContent = t("slotLoadAction");
      main.disabled = !data;
      main.onclick = () => {
        if (loadFromSlot(id)) {
          closeModal();
          toggleMainMenu(false);
          updateUI();
        }
      };
    }
    actions.appendChild(main);

    if (data) {
      const del = document.createElement("button");
      del.className = "btn small outlined";
      del.textContent = "✕";
      del.setAttribute("aria-label", t("slotDeleteAction"));
      del.onclick = () => {
        if (confirm(t("confirmDeleteSlot"))) {
          deleteSlot(id);
          showToast(t("saveGameDeleted"));
          render();
        }
      };
      actions.appendChild(del);
    }

    row.appendChild(actions);
    list.appendChild(row);
  });
}

export function openSaveSlotsModal(m) {
  mode = m === "load" ? "load" : "save";
  render();
  document.getElementById("saveSlotsModal")?.classList.remove("hidden");
}

export function setupSaveSlotsModal() {
  document.getElementById("closeSaveSlotsBtn")?.addEventListener("click", closeModal);
  document.getElementById("saveSlotsModal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });
}
