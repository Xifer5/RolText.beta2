// ══════════════════════════════════════════════════════
//  BESTIARY — Bestiario con progresión de descubrimiento
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { enemyData } from "./enemies.js";

const ENEMY_LORE = {
  slime: {
    lore: {
      en: "A gelatinous creature of mysterious origin. Harmless but persistent. They reproduce in damp areas.",
      es: "Criatura gelatinosa de origen misterioso. Inofensiva pero persistente. Se reproducen en zonas húmedas."
    },
    weakness: { en: "Fire", es: "Fuego" },
    reward: { en: "Acid core", es: "Núcleo ácido" }
  },
  goblin: {
    lore: {
      en: "Small green humanoids, clever and cowardly in groups. Their traps are dangerous for careless travelers.",
      es: "Pequeños humanoides verdes, astutos y cobardes en grupo. Sus trampas son peligrosas para los viajeros despistados."
    },
    weakness: { en: "Magic", es: "Magia" },
    reward: { en: "Gold and goblin dagger", es: "Oro y daga goblin" }
  },
  wolf: {
    lore: {
      en: "Wolves corrupted by the darkness of the Dragon King. Larger and more aggressive than their wild kin.",
      es: "Lobos corrompidos por la oscuridad del Dragon King. Más grandes y agresivos que sus primos salvajes."
    },
    weakness: { en: "Fire", es: "Fuego" },
    reward: { en: "Wolf pelt", es: "Piel de lobo" }
  },
  orc: {
    lore: {
      en: "Brutal warriors in service to the Dragon King. Their physical resilience is legendary among the realm's soldiers.",
      es: "Guerreros brutales al servicio del Dragon King. Su resistencia física es legendaria entre los soldados del reino."
    },
    weakness: { en: "Magic", es: "Magia" },
    reward: { en: "Axe and iron ore", es: "Hacha, mineral de hierro" }
  },
  thief: {
    lore: {
      en: "Bandits patrolling the roads. Fast and slippery, they prefer striking from the shadows.",
      es: "Bandidos que patrullan los caminos. Rápidos y escurridizos, prefieren golpear por la espalda."
    },
    weakness: { en: "Physical", es: "Físico" },
    reward: { en: "Gold, agility ring", es: "Oro, anillo de agilidad" }
  },
  guard: {
    lore: {
      en: "Corrupted royal guards. Their training makes them formidable, but they have lost their honor.",
      es: "Guardias reales corrompidos. Su entrenamiento los hace formidables, pero han perdido su honor."
    },
    weakness: { en: "Magic", es: "Magia" },
    reward: { en: "Armor, military gear", es: "Armadura, equipo militar" }
  },
  skeleton: {
    lore: {
      en: "The restless dead, reanimated by ancient necromancy. They feel no pain or fear.",
      es: "Muertos sin descanso, reanimados por necromancia antigua. No sienten dolor ni miedo."
    },
    weakness: { en: "Holy light", es: "Luz sagrada" },
    reward: { en: "Bones, relics", es: "Huesos, reliquias" }
  },
  vampire: {
    lore: {
      en: "Undead that steal the life force of their victims. Darkness is their eternal home.",
      es: "Non-muertos que roban la vitalidad de sus víctimas. La oscuridad es su hogar eterno."
    },
    weakness: { en: "Light, fire", es: "Luz, fuego" },
    reward: { en: "Essence of life", es: "Esencia de vida" }
  },
  dragon_king: {
    lore: {
      en: "The great evil threatening these lands. Its power rivals no living being. The final battle.",
      es: "El gran mal que amenaza estas tierras. Su poder no tiene igual entre los seres vivientes. La batalla final."
    },
    weakness: { en: "Unknown", es: "Desconocida" },
    reward: { en: "Throne of the world", es: "Trono del mundo" }
  }
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
    const lore = ENEMY_LORE[id] || {
      lore: { en: "Unknown.", es: "Desconocido." },
      weakness: { en: "?", es: "?" },
      reward: { en: "?", es: "?" }
    };

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
              <p class="bestiary-lore">${localizeText(lore.lore)}</p>
              <div class="bestiary-meta">
                <span>⚡ ${t('bestiaryWeaknessLabel')} <em>${localizeText(lore.weakness)}</em></span>
                <span>🎁 ${t('bestiaryRewardLabel')} <em>${localizeText(lore.reward)}</em></span>
              </div>
            </div>
          ` : `<p class="bestiary-unknown">${t('bestiaryUnknownEntry')}</p>`}
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
