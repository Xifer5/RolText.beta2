// ══════════════════════════════════════════════════════
//  BESTIARY — Bestiario con progresión de descubrimiento
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";

const ENEMY_LORE = {
  slime: { lore: "Criatura gelatinosa de origen misterioso. Inofensiva pero persistente. Se reproducen en zonas húmedas.", weakness: "Fuego", reward: "Núcleo ácido" },
  goblin: { lore: "Pequeños humanoides verdes, astutos y cobardes en grupo. Sus trampas son peligrosas para los viajeros despistados.", weakness: "Magia", reward: "Oro y daga goblin" },
  wolf: { lore: "Lobos corrompidos por la oscuridad del Dragon King. Más grandes y agresivos que sus primos salvajes.", weakness: "Fuego", reward: "Piel de lobo" },
  orc: { lore: "Guerreros brutales al servicio del Dragon King. Su resistencia física es legendaria entre los soldados del reino.", weakness: "Magia", reward: "Hacha, mineral de hierro" },
  thief: { lore: "Bandidos que patrullan los caminos. Rápidos y escurridizos, prefieren golpear por la espalda.", weakness: "Físico", reward: "Oro, anillo de agilidad" },
  guard: { lore: "Guardias reales corrompidos. Su entrenamiento los hace formidables, pero han perdido su honor.", weakness: "Magia", reward: "Armadura, equipo militar" },
  skeleton: { lore: "Muertos sin descanso, reanimados por necromancia antigua. No sienten dolor ni miedo.", weakness: "Luz sagrada", reward: "Huesos, reliquias" },
  vampire: { lore: "Non-muertos que roban la vitalidad de sus víctimas. La oscuridad es su hogar eterno.", weakness: "Luz, fuego", reward: "Esencia de vida" },
  dragon_king: { lore: "El gran mal que amenaza estas tierras. Su poder no tiene igual entre los seres vivientes. La batalla final.", weakness: "Desconocida", reward: "Trono del mundo" }
};

export function renderBestiary() {
  const discovered = gameState.stats?.enemiesDefeated || {};
  const allEnemies = Object.entries(enemyData);

  const discovered_ids = Object.keys(discovered);
  const total = allEnemies.length;
  const found = discovered_ids.length;

  const rows = allEnemies.map(([id, enemy]) => {
    const isDiscovered = discovered[id] > 0;
    const kills = discovered[id] || 0;
    const lore = ENEMY_LORE[id] || { lore: "Desconocido.", weakness: "?", reward: "?" };

    return `
      <div class="bestiary-entry ${isDiscovered ? 'discovered' : 'undiscovered'}">
        <div class="bestiary-portrait-wrap">
          ${isDiscovered
            ? `<img class="bestiary-portrait" src="img/enemies/${id}.png" alt="${enemy.type}" onerror="this.style.display='none'">`
            : `<span class="bestiary-portrait-unk">?</span>`}
        </div>
        <div class="bestiary-body">
          <div class="bestiary-name">
            <span class="bestiary-status">${isDiscovered ? "✅" : "❓"}</span>
            <strong>${isDiscovered ? enemy.type : "???"}</strong>
            ${isDiscovered ? `<span class="kill-badge">×${kills}</span>` : ""}
          </div>
          ${isDiscovered ? `
            <div class="bestiary-info">
              <div class="bestiary-stat-row">
                <span>❤️ HP: ${enemy.maxHp}</span>
                <span>⚔️ ATK: ${enemy.attack}</span>
                <span>🛡️ DEF: ${enemy.defense || 0}</span>
              </div>
              <p class="bestiary-lore">${lore.lore}</p>
              <div class="bestiary-meta">
                <span>⚡ Debilidad: <em>${lore.weakness}</em></span>
                <span>🎁 Botín: <em>${lore.reward}</em></span>
              </div>
            </div>
          ` : `<p class="bestiary-unknown">Derrota a esta criatura para desbloquear su entrada.</p>`}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="bestiary-container">
      <div class="bestiary-progress">
        <span>Criaturas descubiertas: <strong>${found}/${total}</strong></span>
        <div class="bestiary-bar">
          <div class="bestiary-fill" style="width:${Math.round(found/total*100)}%"></div>
        </div>
      </div>
      <div class="bestiary-list">${rows}</div>
    </div>
  `;
}

// Registrar una derrota de enemigo en el bestiario
export function recordEnemyKill(enemyId) {
  if (!gameState.stats) gameState.stats = {};
  if (!gameState.stats.enemiesDefeated) gameState.stats.enemiesDefeated = {};
  if (!gameState.stats.kills) gameState.stats.kills = 0;
  if (!gameState.stats.bossKills) gameState.stats.bossKills = 0;
  if (!gameState.stats.locationsVisited) gameState.stats.locationsVisited = 0;
  gameState.stats.enemiesDefeated[enemyId] = (gameState.stats.enemiesDefeated[enemyId] || 0) + 1;
  gameState.stats.kills++;
}

export function recordBossKill() {
  if (!gameState.stats) gameState.stats = {};
  gameState.stats.bossKills = (gameState.stats.bossKills || 0) + 1;
}

export function recordLocationVisit() {
  if (!gameState.stats) gameState.stats = {};
  gameState.stats.locationsVisited = (gameState.stats.locationsVisited || 0) + 1;
}
