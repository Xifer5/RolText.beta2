// ══════════════════════════════════════════════════════
//  PANELS — Lógica de los 5 paneles del menú lateral
//  📜 Attributes · 🛡️ Equipment · 📖 Spellbook
//  📝 Journal · 🐉 Bestiary
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { calculateTotalStats, applyDerivedMaxes } from "./stats.js";
import { CLASS_DEFINITIONS, SKILLS_BY_CLASS, LEARNABLE_SKILLS, getAvailableSkills } from "./classes.js";
import { renderJournal } from "./journal.js";
import { renderBestiary } from "./bestiary.js";
import { t, formatText, localizeText } from "./i18n.js";

const CLASS_AVATARS = {
  warrior: "img/avatar_warrior.webp",
  mage:    "img/avatar_mage.webp",
  rogue:   "img/avatar_rogue.webp",
};
import { resolveIconSrc } from "./utils.js";
import { addMessage } from "./story.js";
import { updateUI } from "./ui.js";
import { renderMinimap } from "./minimap.js";
import { renderAchievements, checkAchievements } from "./achievements.js";
import { renderCrafting, wireCraftingPanel } from "./crafting.js";
import { renderEchoTrials, wireEchoTrialsPanel } from "./echoTrials.js";

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
    .map(([lvl, bonus]) => `<div class="level-bonus unlocked">✅ ${t('levelAbbr')}${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  const lockedBonuses = cls ? Object.entries(cls.levelBonuses || {})
    .filter(([lvl]) => p.level < parseInt(lvl))
    .map(([lvl, bonus]) => `<div class="level-bonus locked">🔒 ${t('levelAbbr')}${lvl} — <strong>${bonus.name}</strong>: ${bonus.desc}</div>`)
    .join("") : "";

  openPanel(t('attributesPanelTitle'), `
    <div class="attr-panel">
      <div class="player-avatar-section">
        <div class="player-avatar" style="background: radial-gradient(circle at 30% 30%, ${classColor}40, ${classColor}20); border-color: ${classColor};">
          ${cls && CLASS_AVATARS[p.class] ? `<img src="${CLASS_AVATARS[p.class]}" alt="${cls.name}" class="player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">` : ''}
          <span class="avatar-emoji" ${cls && CLASS_AVATARS[p.class] ? 'style="display:none"' : ''}>${cls ? cls.emoji : '⚔️'}</span>
        </div>
        <div class="player-info">
          <div class="player-name">${p.name || t('defaultPlayerName')}</div>
          <div class="player-level">${t('levelAbbr')} ${p.level} ${cls ? cls.name : t('noClassSelected')}</div>
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
      ` : `<div class="class-badge">⚔️ ${t('noClassSelected')}</div>`}

      <h3 class="attr-section">${t('statPanelVitality')}</h3>
      ${statBar("❤️ HP", p.hp, derived.maxHp || p.maxHp, "#ef4444")}
      ${statBar("💧 MP", p.mp, derived.maxMp || p.maxMp, "#818cf8")}
      ${statBar("⭐ XP", p.experience, p.nextLevelXp, "#fbbf24")}

      <h3 class="attr-section">${t('statPanelBaseAttributes')}</h3>
      <div class="attr-chips">
        ${statChip("💪", "Fuerza", p.strength, strBonus)}
        ${statChip("🏃", "Agilidad", p.agility, agiBonus)}
        ${statChip("🔮", "Inteligencia", p.intelligence, intBonus)}
      </div>

      <h3 class="attr-section">${t('statPanelDerivedStats')}</h3>
      <div class="attr-chips">
        ${statChip("⚔️", "Ataque", derived.attack, 0)}
        ${statChip("🛡️", "Defensa", derived.defense, 0)}
        ${statChip("✨", "Magia", derived.magic, 0)}
      </div>

      ${p.statPoints > 0 ? `
        <div class="attr-points-banner">
          ${formatText('statPanelUnspentPoints', { points: p.statPoints })}
          <button class="btn small" onclick="document.getElementById('statsBtn')?.click();document.getElementById('panelModal')?.classList.add('hidden')">
            ${t('statPanelUpgradeButton')}
          </button>
        </div>
      ` : ""}

      ${(unlockedBonuses || lockedBonuses) ? `
        <h3 class="attr-section">${t('statPanelClassBonuses')}</h3>
        <div class="level-bonuses">
          ${unlockedBonuses}
          ${lockedBonuses}
        </div>
      ` : ""}
    </div>
  `);
}

// ── 🛡️ EQUIPMENT ────────────────────────────────────────
// SPEC-1214 — paper doll de equipamiento (revisión 2026-08-31): reemplaza
// la lista vertical de 8 filas de texto por un retrato central con los 8
// slots como íconos alrededor (mismo patrón visual que el inventario en
// grilla, SPEC-1213) — nombre/stats/desequipar viven en un panel de detalle
// que se abre al hacer clic en un slot, no en la celda misma.
let selectedEquipSlot = null;

const EQUIP_SLOTS = [
  { id: "head",      label: "Cabeza",        emoji: "🪖" },
  { id: "armor",     label: "Armadura",      emoji: "🥋" },
  { id: "rightHand", label: "Mano derecha",  emoji: "⚔️" },
  { id: "arms",      label: "Brazos",        emoji: "🦾" },
  null, // centro: retrato del personaje, no un slot
  { id: "leftHand",  label: "Mano izquierda",emoji: "🛡️" },
  { id: "boots",     label: "Botas",         emoji: "👢" },
  { id: "ring",      label: "Anillo",        emoji: "💍" },
  { id: "accessory", label: "Accesorio",     emoji: "✨" }
];

function equipIconHTML(icon, fallbackEmoji, size) {
  const src = resolveIconSrc(icon);
  if (src) return `<img src="${src}" width="${size}" height="${size}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${fallbackEmoji}'}))">`;
  return `<span style="font-size:${Math.round(size * 0.7)}px">${icon || fallbackEmoji}</span>`;
}

function renderEquipDetail() {
  const box = document.getElementById("equipDollDetail");
  if (!box) return;
  if (!selectedEquipSlot) {
    box.innerHTML = `<p class="muted" style="text-align:center">${t('equipmentEmptyHint')}</p>`;
    return;
  }
  const slotDef = EQUIP_SLOTS.find(s => s?.id === selectedEquipSlot);
  const item = gameState.equipment?.[selectedEquipSlot];
  if (!item) {
    box.innerHTML = `<p class="muted" style="text-align:center">${slotDef.emoji} ${slotDef.label} — ${t('emptySlot')}</p>`;
    return;
  }
  const attrs = [];
  if (item.attack) attrs.push(`ATK +${item.attack}`);
  if (item.defense) attrs.push(`DEF +${item.defense}`);
  if (item.magic) attrs.push(`MAG +${item.magic}`);
  if (item.strength) attrs.push(`STR +${item.strength}`);
  if (item.agility) attrs.push(`AGI +${item.agility}`);
  if (item.intelligence) attrs.push(`INT +${item.intelligence}`);
  if (item.hpBonus) attrs.push(`MaxHP +${item.hpBonus}`);

  box.innerHTML = `
    <div class="equip-detail-row">
      <div class="equip-detail-icon">${equipIconHTML(item.icon, slotDef.emoji, 40)}</div>
      <div class="equip-detail-info">
        <span class="equip-item-name">${localizeText(item.name)}</span>
        ${attrs.length ? `<span class="equip-attrs">${attrs.join(" · ")}</span>` : ""}
      </div>
      <button class="btn small outlined" data-unequip="${selectedEquipSlot}">✕</button>
    </div>
  `;
  box.querySelector("[data-unequip]")?.addEventListener("click", () => {
    const curItem = gameState.equipment[selectedEquipSlot];
    if (!curItem) return;
    if (!gameState.inventory[curItem.id]) gameState.inventory[curItem.id] = 0;
    gameState.inventory[curItem.id]++;
    gameState.equipment[selectedEquipSlot] = null;
    applyDerivedMaxes();
    addMessage(formatText('equipmentUnequipMessage', { item: localizeText(curItem.name) }), "system");
    updateUI();
    renderEquipment(); // re-render completo (stats resumen + doll + detalle)
  });
}

function renderEquipment() {
  const eq = gameState.equipment || {};
  const p = gameState.player;
  const derived = calculateTotalStats(p, eq);
  const cls = CLASS_DEFINITIONS[p.class];

  const dollCells = EQUIP_SLOTS.map(slot => {
    if (!slot) {
      // Centro: mismo patrón img+fallback emoji que el resto de la app (ver
      // renderAttributes) — nunca romper si falta el archivo de avatar.
      return `
        <div class="doll-portrait">
          ${cls && CLASS_AVATARS[p.class] ? `<img src="${CLASS_AVATARS[p.class]}" alt="${cls.name}" class="doll-portrait-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : ''}
          <span class="doll-portrait-emoji" style="${cls && CLASS_AVATARS[p.class] ? 'display:none' : ''}">${cls ? cls.emoji : '⚔️'}</span>
        </div>`;
    }
    const item = eq[slot.id];
    const active = selectedEquipSlot === slot.id;
    return `
      <button type="button" class="doll-slot ${item ? 'filled' : 'empty'} ${active ? 'active' : ''}"
              data-slot="${slot.id}" title="${slot.label}${item ? ': ' + localizeText(item.name) : ''}"
              aria-label="${slot.label}${item ? ': ' + localizeText(item.name) : ''}">
        ${item ? equipIconHTML(item.icon, slot.emoji, 32) : `<span class="doll-slot-emoji">${slot.emoji}</span>`}
      </button>`;
  }).join("");

  openPanel(t('equipmentPanelTitle'), `
    <div class="equip-panel">
      <div class="equip-summary">
        <div class="equip-sum-stat">⚔️ ${derived.attack}<small>ATK</small></div>
        <div class="equip-sum-stat">🛡️ ${derived.defense}<small>DEF</small></div>
        <div class="equip-sum-stat">✨ ${derived.magic}<small>MAG</small></div>
        <div class="equip-sum-stat">❤️ ${derived.maxHp}<small>HP máx</small></div>
      </div>
      <div class="paperdoll-grid">${dollCells}</div>
      <div class="doll-detail" id="equipDollDetail"></div>
    </div>
  `);

  document.querySelectorAll(".doll-slot").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedEquipSlot = btn.dataset.slot;
      document.querySelectorAll(".doll-slot").forEach(b => b.classList.toggle("active", b.dataset.slot === selectedEquipSlot));
      renderEquipDetail();
    });
  });
  renderEquipDetail();
}

// ── 📖 SPELLBOOK ─────────────────────────────────────────
function renderSpellbook() {
  const p = gameState.player;
  const cls = p.class;
  // SPEC-0607: sin el 3er argumento, getAvailableSkills nunca incluía las
  // habilidades universales aprendidas — ni acá ni en el panel de combate
  // (ver ui.js updateSkillPanel). Además, allSkills solo traía las de clase:
  // aunque availIds las reconociera, nunca les tocaba una fila propia.
  const classSkills = SKILLS_BY_CLASS[cls] || [];
  const learnedUniversal = (gameState.learnedSkills || []).map(id => LEARNABLE_SKILLS[id]).filter(Boolean);
  const allSkills = [...classSkills, ...learnedUniversal];
  const available = getAvailableSkills(cls, p.level, gameState.learnedSkills);
  const availIds = new Set(available.map(s => s.id));
  const clsDef = CLASS_DEFINITIONS[cls];
  const classColor = clsDef?.color || "#d0bcff";

  if (!cls) {
    openPanel(t('spellbookTitle'), `<div class="spell-empty"><p>${t('spellbookNoClass')}</p></div>`);
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
          <span class="spell-level-req ${unlocked ? "met" : ""}">${t('levelAbbr')}${skill.levelReq}</span>
        </div>
        <p class="spell-desc">${skill.description}</p>
        ${unlocked ? `
          <button class="btn small ${canCast ? "" : "outlined"} spell-cast-btn"
            data-skill="${skill.id}"
            ${!canCast ? "disabled" : ""}
            ${!gameState.isInCombat ? `title='${t('spellbookOnlyInCombat')}'` : ""}>
            ${gameState.isInCombat ? (canCast ? t('spellbookCastCombat') : t('noMana')) : t('spellbookOnlyInCombat')}
          </button>
        ` : `<p class="spell-locked-msg">${formatText('spellbookLockedSkill', { level: skill.levelReq })}</p>`}
      </div>
    `;
  }).join("");

  openPanel(t('spellbookTitle'), `
    <div class="spellbook-panel">
      <div class="spell-class-header" style="border-color:${classColor}">
        <span style="font-size:1.8rem">${clsDef.emoji}</span>
        <div>
          <strong style="color:${classColor}">${clsDef.name}</strong>
          <p style="font-size:.8rem;color:var(--md-on-surface-var);margin-top:4px">${t('statPanelPrimary') || 'Estadística principal'}: ${{ strength: t('statStrength'), agility: t('statAgility'), intelligence: t('statIntelligence') }[clsDef.primaryStat] || clsDef.primaryStat.toUpperCase()} · MP: ${p.mp}/${calculateTotalStats(p, gameState.equipment).maxMp}</p>
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
        addMessage(t('onlyInCombat'), "system");
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
        <button class="btn outlined" id="closePanelBtn" data-i18n="closeButton" style="margin-top:var(--sp-5)">✕ Cerrar</button>
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
      else if (p === "journal") openPanel(t('journalPanelTitle'), renderJournal());
      else if (p === "bestiary") openPanel(t('bestiaryPanelTitle'), renderBestiary());
      else if (p === "minimap") openPanel(t('mapPanelTitle'), renderMinimap());
      else if (p === "achievements") openPanel(t('achievementsPanelTitle'), renderAchievements());
      else if (p === "crafting") {
        openPanel(t('craftingPanelTitle'), renderCrafting());
        wireCraftingPanel(document.getElementById("panelModalBody"));
      }
      else if (p === "echotrials") {
        openPanel(t('echoTrialsPanelTitle'), renderEchoTrials());
        wireEchoTrialsPanel();
      }
    });
  });

  // inventoryBtn2 is handled in ui.js
}
