// SPEC-1201 — Fragmentos de Eco: meta-progresión persistente ENTRE partidas,
// fuera del save (mismo patrón que runLog.js: localStorage propio, sobrevive
// a "Nuevo juego" y a los slots). Nace de la auditoría de jugabilidad
// 2026-08-27: el juego no dejaba nada de una partida a la siguiente.
//
// Decisión de diseño clave: los perks que se compran son cosméticos/QoL de
// inicio (oro, ítem, rumor extra) — NUNCA tocan HP/ATK/DEF ni multiplicadores
// de combate. Si dieran poder de combate, acumularían con el tiempo y
// erosionarían el reto ya calibrado de Difícil/Imposible (el mismo problema
// que la auditoría marcó en la escala de dificultad). Ver [[project_uiux_audit_2026-08]].
import { addMessage } from "./story.js";
import { t, formatText, localizeText } from "./i18n.js";

const META_KEY = "pqe.meta.v1";

export function readMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
    return { fragments: Number(m.fragments) || 0, unlocked: m.unlocked ?? {}, victories: Number(m.victories) || 0 };
  } catch { return { fragments: 0, unlocked: {}, victories: 0 }; }
}

// SPEC-1204 — New Game+ liviano: no hay contenido nuevo post-victoria (eso
// queda diferido a propósito, ver auditoría), pero cada victoria SÍ queda
// contada para siempre y se muestra como badge "NG+N" en el perfil y la
// Crónica — la partida ya no es 100% aislada de las anteriores.
export function recordVictory() {
  const meta = readMeta();
  meta.victories += 1;
  writeMeta(meta);
  return meta.victories;
}

export function getVictories() {
  return readMeta().victories;
}

function writeMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* storage lleno: no bloquea la partida */ }
}

function addFragments(amount) {
  const meta = readMeta();
  meta.fragments += amount;
  writeMeta(meta);
  return amount;
}

/** Fragmentos ganados al cerrar una partida (victoria O derrota — un intento
 *  siempre suma algo al legado, no solo ganar). Llamado desde runLog.recordRun(). */
export function earnFragments(rec) {
  const amount = 2 + (rec.bossKills || 0) * 2 + Math.floor((rec.level || 1) / 5) + (rec.outcome === "victory" ? 5 : 0);
  addFragments(amount);
  addMessage(formatText(t("fragmentsEarnedMsg"), { amount }), "system");
  return amount;
}

// SPEC-1206 — Pruebas del Eco: bonus por cada jefe repetible superado,
// independiente de earnFragments() (esto no cierra la partida, solo una
// prueba dentro de ella). Escala levemente con la profundidad alcanzada.
export function earnTrialFragments(trialLevel) {
  return addFragments(5 + trialLevel * 2);
}

export const LEGACY_PERKS = [
  {
    id: "legacy_gold",
    icon: "🪙",
    cost: 15,
    name: { en: "Full Pockets", es: "Bolsillos Llenos" },
    desc: { en: "Start every run with +30 gold.", es: "Empieza cada partida con +30 de oro." },
    apply(state) { state.player.gold = (state.player.gold || 0) + 30; }
  },
  {
    id: "legacy_potion",
    icon: "🧪",
    cost: 15,
    name: { en: "Old Reserves", es: "Reservas Antiguas" },
    desc: { en: "Start every run with +1 Health Potion, no matter the class.", es: "Empieza cada partida con +1 Poción de Salud, sin importar la clase." },
    apply(state) { state.inventory["health_potion"] = (state.inventory["health_potion"] || 0) + 1; }
  },
  {
    id: "legacy_rumor",
    icon: "🗞️",
    cost: 25,
    name: { en: "Ear to the Road", es: "Oído en el Camino" },
    desc: { en: "Start every run with 1 extra rumor (secondary objective).", es: "Empieza cada partida con 1 rumor extra (objetivo secundario)." },
    // Sin apply(): rollRumors(rng, count) recibe el +1 directo desde charselect.js
    // porque necesita pasar por RUMOR_POOL, no por gameState — ver esa llamada.
  }
];

export function isPerkUnlocked(id) {
  return !!readMeta().unlocked[id];
}

export function unlockPerk(id) {
  const perk = LEGACY_PERKS.find(p => p.id === id);
  if (!perk) return false;
  const meta = readMeta();
  if (meta.unlocked[id] || meta.fragments < perk.cost) return false;
  meta.fragments -= perk.cost;
  meta.unlocked[id] = true;
  writeMeta(meta);
  return true;
}

export function applyLegacyPerk(state, id) {
  LEGACY_PERKS.find(p => p.id === id)?.apply?.(state);
}

// ── UI: tienda de legado, vive dentro del modal de la Crónica ──────────
export function renderLegacyShop() {
  const container = document.getElementById("legacyShopSection");
  if (!container) return;
  const meta = readMeta();

  const cards = LEGACY_PERKS.map(p => {
    const unlocked = !!meta.unlocked[p.id];
    const canAfford = meta.fragments >= p.cost;
    return `
      <div class="legacy-perk-card ${unlocked ? "unlocked" : ""}">
        <div class="legacy-perk-icon">${p.icon}</div>
        <div class="legacy-perk-body">
          <div class="legacy-perk-name">${localizeText(p.name)}</div>
          <div class="legacy-perk-desc">${localizeText(p.desc)}</div>
        </div>
        ${unlocked
          ? `<span class="legacy-perk-owned">${t("legacyOwnedLabel")}</span>`
          : `<button type="button" class="btn-action small legacy-buy-btn" data-perk="${p.id}" ${canAfford ? "" : "disabled"}>${p.cost} ✨</button>`}
      </div>`;
  }).join("");

  container.innerHTML = `
    <div class="legacy-shop-header">
      <span>${t("legacyShopTitle")}</span>
      <span class="legacy-fragments-total">✨ ${meta.fragments}</span>
    </div>
    <div class="legacy-shop-grid">${cards}</div>
  `;

  container.querySelectorAll(".legacy-buy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (unlockPerk(btn.dataset.perk)) renderLegacyShop();
    });
  });
}
