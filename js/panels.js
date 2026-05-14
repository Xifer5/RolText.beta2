// ══════════════════════════════════════════════════════
//  PANELS — Lógica de los 5 paneles del menú lateral
//  📜 Attributes · 🛡️ Equipment · 📖 Spellbook
//  📝 Journal · 🐉 Bestiary
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { calculateTotalStats } from "./stats.js";
import { CLASS_DEFINITIONS, SKILLS_BY_CLASS, getAvailableSkills } from "./classes.js";
import { renderJournal } from "./journal.js";
import { renderBestiary } from "./bestiary.js";

const CLASS_AVATARS = {
  warrior: "img/avatar_warrior.png",
  mage:    "img/avatar_mage.png",
  rogue:   "img/avatar_rogue.png",
};
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { renderMinimap } from "./minimap.js";
import { renderAchievements, checkAchievements } from "./achievements.js";
import { renderCrafting, wireCraftingPanel } from "./crafting.js";

// ── MODAL GENÉRICO ──────────────────────────────────────
function openPanel(title, html) {
  const modal = document.getElementById("panelModal");
  const titleEl = document.getElementById("panelModalTitle");
  const bodyEl = document.getElementById("panelModalBody");
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = html;
  modal.classList.remove("hidden");
  // Post-render hooks
  wireSpellbookButtons(bodyEl);
}

function closePanel() {
  document.getElementById("panelModal")?.classList.add("hidden");
}

// ── 📜 ATTRIBUTES ───────────────────────────────────────
function renderAttributes() {
  const p = gameState.player;
  const derived = calculateTotalStats(p, gameState.equipment);
  const cls = CLASS_DEFINITIONS[p.class] || null;
  const classColor = cls?.color || "#d0bcff";

  const statBar = (label, val, max, color) => `
    <div class="attr-row">
      <span class="attr-label">${label}</span>
      <div class="attr-bar-wrap">
        <div class="attr-bar" style="width:${Math.min(100, Math.round(val/max*100))}%;background:${color}"></div>
      </div>
      <span class="attr-val">${val}<small>/${max}</small></span>
    </div>
  `;

  const statChip = (emoji, label, val, bonus) => `
    <div class="attr-chip-card">
      <span class="attr-chip-emoji">${emoji}</span>
      <div class="attr-chip-info">
        <span class="attr-chip-label">${label}</span>
        <span class="attr-chip-val">${val}${bonus > 0 ? ` <em style="color:var(--c-heal)">+${bonus}</em>` : ""}</span>
      </div>
    </div>
  `;

  const strBonus = (derived.strength || 0) - (p.strength || 0);
  const agiBonus = (derived.agility || 0) - (p.agility || 0);
  const intBonus = (derived.intelligence || 0) - (p.intelligence || 0);

  // Level bonuses unlocked
  const unlockedBonuses = cls ? Object.entries(cls.levelBonuses || {})
    .filter(([lvl]) => p.level >= parseInt(lvl))
    .map(([lvl, bonus]) => `<div class="level-bonus unlocked">✅ Nv.${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  const lockedBonuses = cls ? Object.entries(cls.levelBonuses || {})
    .filter(([lvl]) => p.level < parseInt(lvl))
    .map(([lvl, bonus]) => `<div class="level-bonus locked">🔒 Nv.${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  openPanel("📜 Atributos del Personaje", `
    <div class="attr-panel">
      <div class="player-avatar-section">
        <div class="player-avatar" style="background: radial-gradient(circle at 30% 30%, ${classColor}40, ${classColor}20); border-color: ${classColor};">
          ${cls && CLASS_AVATARS[p.class] ? `<img src="${CLASS_AVATARS[p.class]}" alt="${cls.name}" class="player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">` : ''}
          <span class="avatar-emoji" ${cls && CLASS_AVATARS[p.class] ? 'style="display:none"' : ''}>${cls ? cls.emoji : '⚔️'}</span>
        </div>
        <div class="player-info">
          <div class="player-name">${p.name || 'Aventurero'}</div>
          <div class="player-level">Nv. ${p.level} ${cls ? cls.name : 'Sin Clase'}</div>
        </div>
      </div>
      ${cls ? `
        <div class="class-badge" style="border-color:${classColor};background:${classColor}18">
          <span style="font-size:2rem">${cls.emoji}</span>
          <div>
            <div class="class-badge-name" style="color:${classColor}">${cls.name}</div>
            <div class="class-badge-desc">${cls.description_long}</div>
          </div>
        </div>
      ` : `<div class="class-badge">⚔️ Sin clase — inicia un nuevo juego para elegir</div>`}

      <h3 class="attr-section">Vitalidad</h3>
      ${statBar("❤️ HP", p.hp, derived.maxHp || p.maxHp, "#ef4444")}
      ${statBar("💧 MP", p.mp, derived.maxMp || p.maxMp, "#818cf8")}
      ${statBar("⭐ XP", p.experience, p.nextLevelXp, "#fbbf24")}

      <h3 class="attr-section">Atributos Base</h3>
      <div class="attr-chips">
        ${statChip("💪", "Fuerza", p.strength, strBonus)}
        ${statChip("🏃", "Agilidad", p.agility, agiBonus)}
        ${statChip("🔮", "Inteligencia", p.intelligence, intBonus)}
      </div>

      <h3 class="attr-section">Estadísticas Derivadas</h3>
      <div class="attr-chips">
        ${statChip("⚔️", "Ataque", derived.attack, 0)}
        ${statChip("🛡️", "Defensa", derived.defense, 0)}
        ${statChip("✨", "Magia", derived.magic, 0)}
      </div>

      ${p.statPoints > 0 ? `
        <div class="attr-points-banner">
          ⚡ Tienes <strong>${p.statPoints}</strong> puntos de estadística sin gastar
          <button class="btn small" onclick="document.getElementById('statsBtn')?.click();document.getElementById('panelModal')?.classList.add('hidden')">
            Mejorar stats →
          </button>
        </div>
      ` : ""}

      ${(unlockedBonuses || lockedBonuses) ? `
        <h3 class="attr-section">Bonificaciones de Clase</h3>
        <div class="level-bonuses">
          ${unlockedBonuses}
          ${lockedBonuses}
        </div>
      ` : ""}
    </div>
  `);
}

// ── 🛡️ EQUIPMENT ────────────────────────────────────────
function renderEquipment() {
  const eq = gameState.equipment || {};
  const p = gameState.player;
  const derived = calculateTotalStats(p, eq);

  const SLOTS = [
    { id: "head",      label: "Cabeza",       emoji: "🪖" },
    { id: "rightHand", label: "Mano derecha", emoji: "⚔️" },
    { id: "leftHand",  label: "Mano izquierda",emoji: "🛡️" },
    { id: "armor",     label: "Armadura",     emoji: "🥋" },
    { id: "arms",      label: "Brazos",       emoji: "🦾" },
    { id: "boots",     label: "Botas",        emoji: "👢" },
    { id: "ring",      label: "Anillo",       emoji: "💍" },
    { id: "accessory", label: "Accesorio",    emoji: "✨" }
  ];

  const slotRows = SLOTS.map(slot => {
    const item = eq[slot.id];
    const attrs = [];
    if (item) {
      if (item.attack) attrs.push(`ATK +${item.attack}`);
      if (item.defense) attrs.push(`DEF +${item.defense}`);
      if (item.magic) attrs.push(`MAG +${item.magic}`);
      if (item.strength) attrs.push(`STR +${item.strength}`);
      if (item.agility) attrs.push(`AGI +${item.agility}`);
      if (item.intelligence) attrs.push(`INT +${item.intelligence}`);
      if (item.hpBonus) attrs.push(`MaxHP +${item.hpBonus}`);
    }
    return `
      <div class="equip-slot ${item ? 'filled' : 'empty'}">
        <span class="equip-emoji">${slot.emoji}</span>
        <div class="equip-info">
          <span class="equip-slot-label">${slot.label}</span>
          <span class="equip-item-name">${item ? item.name : "— Vacío —"}</span>
          ${attrs.length ? `<span class="equip-attrs">${attrs.join(" · ")}</span>` : ""}
        </div>
        ${item ? `<button class="btn small outlined" data-unequip="${slot.id}">✕</button>` : ""}
      </div>
    `;
  }).join("");

  openPanel("🛡️ Equipamiento", `
    <div class="equip-panel">
      <div class="equip-summary">
        <div class="equip-sum-stat">⚔️ ${derived.attack}<small>ATK</small></div>
        <div class="equip-sum-stat">🛡️ ${derived.defense}<small>DEF</small></div>
        <div class="equip-sum-stat">✨ ${derived.magic}<small>MAG</small></div>
        <div class="equip-sum-stat">❤️ ${derived.maxHp}<small>HP máx</small></div>
      </div>
      <div class="equip-slots">${slotRows}</div>
      <p class="muted" style="text-align:center;margin-top:var(--sp-4)">Para equipar objetos, ve al Inventario y usa el botón Equipar.</p>
    </div>
  `);

  // Wire unequip buttons
  document.querySelectorAll("[data-unequip]").forEach(btn => {
    btn.addEventListener("click", () => {
      const slot = btn.dataset.unequip;
      if (gameState.equipment[slot]) {
        const item = gameState.equipment[slot];
        // return to inventory
        if (!gameState.inventory[item.id]) gameState.inventory[item.id] = 0;
        gameState.inventory[item.id]++;
        gameState.equipment[slot] = null;
        addMessage(`Desequipaste: ${item.name}`, "system");
        updateUI();
        renderEquipment(); // re-render
      }
    });
  });
}

// ── 📖 SPELLBOOK ─────────────────────────────────────────
function renderSpellbook() {
  const p = gameState.player;
  const cls = p.class;
  const allSkills = SKILLS_BY_CLASS[cls] || [];
  const available = getAvailableSkills(cls, p.level);
  const availIds = new Set(available.map(s => s.id));
  const clsDef = CLASS_DEFINITIONS[cls];
  const classColor = clsDef?.color || "#d0bcff";

  if (!cls) {
    openPanel("📖 Grimorio", `<div class="spell-empty"><p>Selecciona una clase al iniciar el juego para desbloquear habilidades.</p></div>`);
    return;
  }

  const rows = allSkills.map(skill => {
    const unlocked = availIds.has(skill.id);
    const canCast = unlocked && (p.mp >= skill.mpCost);
    return `
      <div class="spell-card ${unlocked ? "unlocked" : "locked"}">
        <div class="spell-header">
          <span class="spell-emoji">${skill.emoji}</span>
          <div class="spell-title">
            <strong>${skill.name}</strong>
            <span class="spell-cost">💧 ${skill.mpCost} MP</span>
          </div>
          <span class="spell-level-req ${unlocked ? "met" : ""}">Nv.${skill.levelReq}</span>
        </div>
        <p class="spell-desc">${skill.description}</p>
        ${unlocked ? `
          <button class="btn small ${canCast ? "" : "outlined"} spell-cast-btn"
            data-skill="${skill.id}"
            ${!canCast ? "disabled" : ""}
            ${!gameState.isInCombat ? "title='Solo en combate'" : ""}>
            ${gameState.isInCombat ? (canCast ? "⚡ Lanzar en combate" : "Sin maná") : "⚡ (solo en combate)"}
          </button>
        ` : `<p class="spell-locked-msg">🔒 Se desbloquea en nivel ${skill.levelReq}</p>`}
      </div>
    `;
  }).join("");

  openPanel("📖 Grimorio de Habilidades", `
    <div class="spellbook-panel">
      <div class="spell-class-header" style="border-color:${classColor}">
        <span style="font-size:1.8rem">${clsDef.emoji}</span>
        <div>
          <strong style="color:${classColor}">${clsDef.name}</strong>
          <p style="font-size:.8rem;color:var(--md-on-surface-var);margin-top:4px">Estadística principal: ${clsDef.primaryStat.toUpperCase()} · MP actual: ${p.mp}/${calculateTotalStats(p, gameState.equipment).maxMp}</p>
        </div>
      </div>
      <div class="spell-grid">${rows}</div>
    </div>
  `);
}

// Wire spellbook cast buttons after render
function wireSpellbookButtons(container) {
  container.querySelectorAll(".spell-cast-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const skillId = btn.dataset.skill;
      if (!gameState.isInCombat) {
        addMessage("Solo puedes usar habilidades en combate.", "system");
        return;
      }
      window.dispatchEvent(new CustomEvent("pixel:useSkill", { detail: { skillId } }));
      closePanel();
    });
  });
}

// ── SETUP: conectar botones del menú lateral ─────────────
export function setupPanelListeners() {
  // Crear modal del panel si no existe
  if (!document.getElementById("panelModal")) {
    const modal = document.createElement("div");
    modal.id = "panelModal";
    modal.className = "modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "panelModalTitle");
    modal.innerHTML = `
      <div class="modal-content" style="max-width:640px">
        <h2 id="panelModalTitle"></h2>
        <div id="panelModalBody"></div>
        <button class="btn outlined" id="closePanelBtn" style="margin-top:var(--sp-5)">✕ Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const closeBtn = document.getElementById("closePanelBtn");
  const panelModal = document.getElementById("panelModal");
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (panelModal) panelModal.addEventListener("click", (e) => { if (e.target === panelModal) closePanel(); });

  // Wire ALL elements with data-panel (topbar tabs + any other buttons)
  document.querySelectorAll("[data-panel]").forEach(el => {
    el.addEventListener("click", () => {
      const p = el.dataset.panel;
      // Update active tab in topbar
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.toggle("active", t.dataset.panel === p));
      if (p === "attributes") renderAttributes();
      else if (p === "equipment") renderEquipment();
      else if (p === "spellbook") renderSpellbook();
      else if (p === "journal") openPanel("📝 Diario del Aventurero", renderJournal());
      else if (p === "bestiary") openPanel("🐉 Bestiario", renderBestiary());
      else if (p === "minimap") openPanel("🗺️ Mapa del Mundo", renderMinimap());
      else if (p === "achievements") openPanel("🏆 Logros", renderAchievements());
      else if (p === "crafting") {
        openPanel("⚒️ Taller de Fabricación", renderCrafting());
        wireCraftingPanel(document.getElementById("panelModalBody"));
      }
    });
  });

  // inventoryBtn2 is handled in ui.js
}
