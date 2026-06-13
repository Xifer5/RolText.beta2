// ══════════════════════════════════════════════════════
//  JOURNAL — Adventurer journal with localized entries
// ══════════════════════════════════════════════════════
import { gameState } from "./state.js";
import { localizeText } from "./i18n.js";

// Localized journal entries for progress milestones
const JOURNAL_ENTRIES = [
  {
    id: "start",
    title: { en: "The beginning of the adventure", es: "El comienzo de la aventura" },
    icon: "📖",
    alwaysVisible: true,
    text: {
      en: "I chose to leave my hometown and embark on an adventure. Stories of the Dragon King haunting these lands follow me. Perhaps I can make a difference. The road is full of danger, but also opportunity.",
      es: "He decidido abandonar mi pueblo natal y embarcarme en una aventura. Las historias del Dragon King que amenaza estas tierras me persiguen. Quizás yo pueda marcar la diferencia. El camino está lleno de peligros, pero también de oportunidades."
    }
  },
  {
    id: "first_kill",
    title: { en: "First battle", es: "Primera batalla" },
    icon: "⚔️",
    requirement: (gs) => gs.stats?.kills >= 1,
    text: {
      en: "Today I fought my first enemy. The rush of battle is something I will never forget. I must keep training if I want to survive what comes next.",
      es: "Hoy luché contra mi primer enemigo. La adrenalina del combate es algo que nunca olvidaré. Debo seguir entrenando si quiero sobrevivir a lo que viene."
    }
  },
  {
    id: "level_5",
    title: { en: "The path is forged", es: "El camino se forja" },
    icon: "⭐",
    requirement: (gs) => gs.player.level >= 5,
    text: {
      en: "Level 5. I'm starting to understand my own path. My skills grow, but enemies become stronger too. I must press on.",
      es: "Nivel 5. Estoy empezando a entender mi propio camino. Mis habilidades crecen, pero los enemigos también son más fuertes. Debo seguir adelante."
    }
  },
  {
    id: "level_10",
    title: { en: "Halfway there", es: "Mitad del camino" },
    icon: "🌟",
    requirement: (gs) => gs.player.level >= 10,
    text: {
      en: "Level 10. I've traveled many lands and defeated creatures that would have terrified me before. The Dragon King still waits. I must prepare.",
      es: "Nivel 10. He recorrido muchas tierras y derrotado a criaturas que antes me habrían aterrorizado. El Dragon King sigue ahí, esperando. Debo prepararme."
    }
  },
  {
    id: "first_boss",
    title: { en: "The first great challenge", es: "El primer gran reto" },
    icon: "🐉",
    requirement: (gs) => gs.stats?.bossKills >= 1,
    text: {
      en: "I defeated my first area boss. The battle was epic. Its fall echoes in my ears. Every victory brings me closer to my destiny.",
      es: "Derroté a mi primer jefe de área. La batalla fue épica. Sus caídas resuenan en mis oídos. Cada victoria me acerca más a mi destino final."
    }
  },
  {
    id: "discovered_magic",
    title: { en: "Arcane mysteries", es: "Los misterios arcanos" },
    icon: "✨",
    requirement: (gs) => gs.player.intelligence >= 15,
    text: {
      en: "Magic flows through me more easily. I feel arcane power when I close my eyes. Intelligence is the key to hidden power.",
      es: "La magia fluye a través de mí con más facilidad. Siento el poder arcano cuando cierro los ojos. La inteligencia es la llave de este poder oculto."
    }
  },
  {
    id: "warrior_path",
    title: { en: "The warrior's path", es: "El camino del guerrero" },
    icon: "⚔️",
    requirement: (gs) => gs.player.class === "warrior" && gs.player.strength >= 20,
    text: {
      en: "My strength is legendary. Enemies tremble before me. The warrior's path demands sacrifice, but the reward in physical power is unmatched.",
      es: "Mi fuerza es legendaria. Los enemigos tiemblan ante mi presencia. El camino del guerrero exige sacrificio, pero la recompensa en poder físico no tiene igual."
    }
  },
  {
    id: "mage_path",
    title: { en: "The arcane trail", es: "El sendero arcano" },
    icon: "🔮",
    requirement: (gs) => gs.player.class === "mage" && gs.player.intelligence >= 20,
    text: {
      en: "I have unlocked magical secrets few mortals understand. My mind is more powerful than any blade. Knowledge is true power.",
      es: "He desbloqueado secretos mágicos que pocos mortales comprenden. Mi mente es más poderosa que cualquier espada. El conocimiento es el verdadero poder."
    }
  },
  {
    id: "rogue_path",
    title: { en: "Shadows guide me", es: "Las sombras me guían" },
    icon: "🗡️",
    requirement: (gs) => gs.player.class === "rogue" && gs.player.agility >= 20,
    text: {
      en: "I move like the wind and strike like lightning. No enemy can catch me. Agility isn't running away; it is choosing when and how to strike.",
      es: "Me muevo como el viento, golpeo como el rayo. Ningún enemigo puede atraparme. La agilidad no es huir: es elegir cuándo y cómo atacar."
    }
  }
];

export function getAvailableEntries() {
  return JOURNAL_ENTRIES.filter(e => e.alwaysVisible || (e.requirement && e.requirement(gameState)));
}

export function renderJournal() {
  const entries = getAvailableEntries();
  const cls = gameState.player.class;
  const clsName = gameState.player.className || localizeText({ en: "Adventurer", es: "Aventurero" });
  const clsEmoji = gameState.player.classEmoji || "⚔️";

  return `
    <div class="journal-container">
      <div class="journal-header">
        <div class="journal-hero">
          <span style="font-size:2.5rem">${clsEmoji}</span>
          <div>
            <div class="journal-name">${gameState.player.name || localizeText({ en: "Adventurer", es: "Aventurero" })}</div>
            <div class="journal-class">${clsName} · Level ${gameState.player.level}</div>
          </div>
        </div>
        <div class="journal-stats-row">
          <div class="jstat"><span>🏆</span><span>${gameState.stats?.kills || 0}</span><label>${localizeText({ en: "Victories", es: "Victorias" })}</label></div>
          <div class="jstat"><span>💀</span><span>${gameState.stats?.bossKills || 0}</span><label>${localizeText({ en: "Bosses", es: "Jefes" })}</label></div>
          <div class="jstat"><span>🪙</span><span>${gameState.player.gold}</span><label>${localizeText({ en: "Gold", es: "Oro" })}</label></div>
          <div class="jstat"><span>📍</span><span>${gameState.stats?.locationsVisited || 0}</span><label>${localizeText({ en: "Places", es: "Lugares" })}</label></div>
        </div>
      </div>
      <div class="journal-entries">
        ${entries.map(e => `
          <div class="journal-entry">
            <div class="journal-entry-header">
              <span class="journal-icon">${e.icon}</span>
              <strong>${localizeText(e.title)}</strong>
            </div>
            <p class="journal-text">${localizeText(e.text)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
