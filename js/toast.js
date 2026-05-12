const RARITY_COLORS = {
  common:    { bg: "rgba(148,163,184,.12)", border: "rgba(148,163,184,.4)", accent: "#94a3b8" },
  uncommon:  { bg: "rgba(74,222,128,.10)",  border: "rgba(74,222,128,.45)",  accent: "#4ade80" },
  rare:      { bg: "rgba(59,130,246,.10)",  border: "rgba(59,130,246,.45)",  accent: "#60a5fa" },
  epic:      { bg: "rgba(168,85,247,.10)",  border: "rgba(168,85,247,.45)",  accent: "#c084fc" },
  legendary: { bg: "rgba(245,158,11,.10)",  border: "rgba(212,175,85,.55)",  accent: "#f59e0b" }
};

const RARITY_LABEL = {
  common:"Común", uncommon:"Poco común", rare:"Raro",
  epic:"Épico", legendary:"Legendario"
};

let _queue   = [];
let _showing = false;

// ── Achievement toast ────────────────────────────────────────────────
export function showAchievementToast(ach) {
  _queue.push({ kind: "achievement", ach });
  if (!_showing) _processQueue();
}

// ── Simple info toast ────────────────────────────────────────────────
export function showToast(msg, type = "info") {
  _queue.push({ kind: "simple", msg, type });
  if (!_showing) _processQueue();
}

// ── Queue processor ──────────────────────────────────────────────────
function _processQueue() {
  if (!_queue.length) { _showing = false; return; }
  _showing = true;
  const item = _queue.shift();
  if (item.kind === "achievement") _showAch(item.ach);
  else _showSimple(item.msg, item.type);
  setTimeout(_processQueue, 4400);
}

function _container() {
  let c = document.getElementById("toastContainer");
  if (!c) {
    c = document.createElement("div");
    c.id = "toastContainer";
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

function _mount(el, duration = 3600) {
  _container().appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("visible")));
  setTimeout(() => {
    el.classList.remove("visible");
    el.classList.add("hiding");
    setTimeout(() => el.remove(), 420);
  }, duration);
}

function _showAch(ach) {
  const c = RARITY_COLORS[ach.rarity] ?? RARITY_COLORS.common;
  const el = document.createElement("div");
  el.className = `ach-toast ach-toast-rarity-${ach.rarity}`;
  el.style.cssText = `background:${c.bg};border-color:${c.border}`;
  el.innerHTML = `
    <div class="ach-toast-header">🏆 ¡Logro Desbloqueado!</div>
    <div class="ach-toast-body">
      <span class="ach-toast-icon">${ach.icon}</span>
      <div class="ach-toast-info">
        <div class="ach-toast-title" style="color:${c.accent}">${ach.title}</div>
        <div class="ach-toast-desc">${ach.desc}</div>
      </div>
    </div>
    <div class="ach-toast-rarity" style="color:${c.accent}">
      ${RARITY_LABEL[ach.rarity] ?? ach.rarity}
    </div>`;
  _mount(el, 3600);
}

function _showSimple(msg, type) {
  const el = document.createElement("div");
  el.className = `simple-toast simple-toast-${type}`;
  el.textContent = msg;
  _mount(el, 2600);
}
