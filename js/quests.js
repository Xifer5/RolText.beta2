/**
 * quests.js — Sistema de misiones de Pixel Quest Echoes
 *
 * Tipos de condición:
 *   "visit"   — el jugador ha estado en cierta locationId
 *   "collect" — el jugador tiene ≥ qty de un ítem en inventario
 *   "kill"    — el jugador ha matado ≥ count de cierto enemigo
 */
import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { allItems } from "./items.js";
import { playSound } from "./sounds.js";
import { checkAchievements } from "./achievements.js";
import { t, formatText, localizeText } from "./i18n.js";

// ── DEFINICIONES ───────────────────────────────────────────────────
export const QUEST_DATA = {

  explore_forest: {
    id: "explore_forest",
    title: { en: "The Valdris Forest", es: "El Bosque de Valdris" },
    type: "visit",
    target: "forest_3",
    reward: { item: "world_map", xp: 50, gold: 30 },
    dialogues: {
      inactive: [
        { en: "Traveler, the Valdris Forest hides something that should not exist.", es: "Viajero, el Bosque de Valdris oculta algo que no debería existir." },
        { en: "Would you dare to venture to its heart and return with what you discover?", es: "¿Tendrías el valor de adentrarte hasta su corazón y regresar con lo que descubras?" }
      ],
      active: [
        { en: "The forest's heart still waits for you.", es: "El corazón del bosque aún te espera." },
        { en: "Head north from here. Valdris Forest is the third zone.", es: "Sigue hacia el norte desde aquí. El Bosque de Valdris es la tercera zona." }
      ],
      completed: [
        { en: "You have seen it with your own eyes. Darkness grows.", es: "Lo has visto con tus propios ojos. La oscuridad crece." },
        { en: "Take this World Map — it will reveal paths you don't yet know.", es: "Toma este Mapa del Mundo — te mostrará caminos que aún no conoces." }
      ]
    }
  },

  collect_crystal: {
    id: "collect_crystal",
    title: { en: "The Arcane Shard", es: "El Fragmento Arcano" },
    type: "collect",
    item: "crystal_shard",
    qty: 1,
    consumeItem: false,
    reward: { item: "arcane_key", xp: 120, gold: 80 },
    dialogues: {
      inactive: [
        { en: "The Eldrast Ruins are sealed by ancient magic. Only an Arcane Key can open them.", es: "Las Ruinas de Eldrast están selladas con magia antigua. Solo una Llave Arcana puede abrirlas." },
        { en: "I can forge it, but I need a Crystal Shard from the deep caverns. Will you fetch it?", es: "Yo puedo forjarla, pero necesito un Crystal Shard de las cavernas profundas. ¿Lo conseguirás?" }
      ],
      active: [
        { en: "You still don't have the Crystal Shard.", es: "Todavía no tienes el Crystal Shard." },
        { en: "Search the Echo Caves and Ironcroft Dungeons.", es: "Búscalo en las Cavernas del Eco y las Mazmorras de Ironcroft." }
      ],
      completed: [
        { en: "Excellent. With this I forge the Arcane Key.", es: "Excelente. Con esto forjo la Llave Arcana." },
        { en: "The Eldrast Ruins await you — be careful. What sleeps there has not been disturbed for centuries.", es: "Las Ruinas de Eldrast te esperan — pero ten cuidado. Lo que duerme allí lleva siglos sin ser perturbado." }
      ]
    }
  },

  kill_pirates: {
    id: "kill_pirates",
    title: { en: "Pirate Coast", es: "La Costa de los Piratas" },
    type: "kill",
    enemy: "pirate",
    count: 3,
    reward: { item: "navigation_chart", xp: 100, gold: 120 },
    dialogues: {
      inactive: [
        { en: "Damned pirates. They have blocked all underground access to the Areth Catacombs.", es: "Malditos piratas. Han bloqueado todos los accesos subterráneos a las Catacumbas de Areth." },
        { en: "Defeat three of them on the Siren Coast and I will give you the Navigation Chart.", es: "Derrota a tres de ellos en la Costa de las Sirenas y te daré la Carta de Navegación." }
      ],
      active_template: { en: "Keep fighting. You need to defeat {remaining} more pirate(s) on the Siren Coast.", es: "Sigue luchando. Necesitas derrotar a {remaining} pirata(s) más en la Costa de las Sirenas." },
      completed: [
        { en: "The pirates are retreating!", es: "¡Los piratas están en retirada!" },
        { en: "Take the Navigation Chart — it will open your way to the Areth Catacombs.", es: "Toma la Carta de Navegación — te abrirá paso a las Catacumbas de Areth." }
      ]
    }
  },

  collect_fairy_dust: {
    id: "collect_fairy_dust",
    title: { en: "Fairy Dust", es: "El Polvo de las Hadas" },
    type: "collect",
    item: "fairy_dust",
    qty: 1,
    consumeItem: false,
    reward: { item: "garden_key", xp: 80, gold: 50 },
    dialogues: {
      inactive: [
        { en: "The Forgotten Vault can only be opened with the essence of this garden.", es: "La Bóveda Olvidada solo puede abrirse con la esencia de este jardín." },
        { en: "A little Fairy Dust will be enough. It blooms here if you dare to seek it among the creatures guarding it.", es: "Un poco de Fairy Dust sería suficiente. Florece aquí mismo, si te atreves a buscarlo entre las criaturas que lo custodian." }
      ],
      active: [
        { en: "Fairy Dust blooms in this garden.", es: "El Fairy Dust florece en este jardín." },
        { en: "Defeat the creatures guarding it and return to me.", es: "Derrota a las criaturas que lo guardan y regresa conmigo." }
      ],
      completed: [
        { en: "Beautiful. The garden's essence hums with primal magic.", es: "Precioso. La esencia del jardín vibra con magia primordial." },
        { en: "Take this Garden Key — it will open the Forgotten Vault.", es: "Toma esta Llave del Jardín — abrirá La Bóveda Olvidada." }
      ]
    }
  },

  collect_ice_crystal: {
    id: "collect_ice_crystal",
    title: { en: "Frozen Crystal", es: "El Cristal Helado" },
    type: "collect",
    item: "ice_crystal",
    qty: 1,
    consumeItem: false,
    reward: { item: "mountain_pass", xp: 150, gold: 100 },
    dialogues: {
      inactive: [
        { en: "Beyond the Eternal Summit lies the Endless Tundra — but the cold kills the reckless.", es: "Más allá de la Cumbre Eterna está la Tundra Eterna — pero el frío mata a los imprudentes." },
        { en: "Bring me an Ice Crystal and I will forge a Mountain Pass. Giants and golems on those peaks carry it.", es: "Dame un Ice Crystal y forjaré un Pase de Montaña. Los gigantes y golems de estas cimas lo portan." }
      ],
      active: [
        { en: "Without the Ice Crystal I cannot forge the pass.", es: "Sin el Ice Crystal no puedo forjar el pase." },
        { en: "Keep exploring the Iron Ridges. The crystal is carried by giants and golems there.", es: "Sigue explorando las Crestas de Hierro. El cristal lo portan los gigantes y golems del lugar." }
      ],
      completed: [
        { en: "Perfect. Take the Mountain Pass.", es: "Perfecto. Toma el Pase de Montaña." },
        { en: "The Endless Tundra is brutal, adventurer — but I trust you are ready for what comes.", es: "La Tundra Eterna es brutal, aventurero — pero confío en que estás listo para lo que viene." }
      ]
    }
  },

  defeat_dark_lord: {
    id: "defeat_dark_lord",
    title: { en: "The Dark Lord", es: "El Señor Oscuro" },
    type: "visit",
    target: "dungeon_7",
    reward: { item: "dragon_key", xp: 300, gold: 200 },
    dialogues: {
      inactive: [
        { en: "The Dragon King can only be defeated by someone who has already stared into the Dark Lord's eyes.", es: "El Rey Dragón solo puede ser vencido por alguien que ya haya mirado a los ojos al Señor Oscuro." },
        { en: "Have you reached the Dark Lord's Chamber in the Ironcroft Dungeons?", es: "¿Has llegado a la Cámara del Señor Oscuro en las Mazmorras de Ironcroft?" }
      ],
      active: [
        { en: "You must reach the Dark Lord's Chamber, deep within Ironcroft.", es: "Debes llegar a la Cámara del Señor Oscuro, en las profundidades de Ironcroft." },
        { en: "Only then will I give you the Dragon Key and you can open the Dragon Gate.", es: "Solo entonces te daré la Llave del Dragón y podrás abrir la Puerta del Dragón." }
      ],
      completed: [
        { en: "Impressive. Few souls survive Ironcroft's dungeons.", es: "Impresionante. Pocas almas sobreviven a las Mazmorras de Ironcroft." },
        { en: "Take the Dragon Key. The Dragon King's Throne awaits you.", es: "Toma la Llave del Dragón. El Trono del Rey Dragón te espera." },
        { en: "The fate of Aethoria is in your hands.", es: "El destino de Aethoria está en tus manos." }
      ]
    }
  }

};

// ── FUNCIONES DE ESTADO ────────────────────────────────────────────

/** @returns {"inactive"|"active"|"completed"} */
export function getQuestStatus(questId) {
  return gameState.quests?.[questId] ?? "inactive";
}

/** Activa una misión (inactive → active) */
export function activateQuest(questId) {
  if (!gameState.quests) gameState.quests = {};
  if (!gameState.quests[questId] || gameState.quests[questId] === "inactive") {
    gameState.quests[questId] = "active";
  }
}

/** ¿Se cumple la condición de entrega? */
export function checkQuestCondition(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return false;
  if (getQuestStatus(questId) !== "active") return false;

  switch (q.type) {
    case "visit":
      return !!(gameState.visitedLocations?.[q.target]);
    case "collect":
      return (gameState.inventory?.[q.item] ?? 0) >= q.qty;
    case "kill": {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      return killed >= q.count;
    }
    default:
      return false;
  }
}

/**
 * Entrega la misión, da recompensas y la marca como completada.
 * @returns {boolean} true si se completó correctamente
 */
export function completeQuest(questId) {
  const q = QUEST_DATA[questId];
  if (!q || !checkQuestCondition(questId)) return false;

  gameState.quests[questId] = "completed";
  playSound("quest_done");
  checkAchievements();

  // Consumir ítem de la misión si así se configuró
  if (q.consumeItem && q.item) {
    const current = gameState.inventory[q.item] ?? 0;
    const remaining = Math.max(0, current - q.qty);
    if (remaining === 0) delete gameState.inventory[q.item];
    else gameState.inventory[q.item] = remaining;
  }

  // Dar recompensas
  const { item, xp, gold } = q.reward;
  if (item) {
    gameState.inventory[item] = (gameState.inventory[item] ?? 0) + 1;
    addMessage(formatText(t("questRewardItems"), {
      items: localizeText(allItems[item]?.name) || item
    }), "loot");
  }
  if (xp) {
    gameState.player.experience = (gameState.player.experience ?? 0) + xp;
    addMessage(formatText(t("questRewardXp"), {
      xp,
      title: localizeText(q.title)
    }), "stat");
  }
  if (gold) {
    gameState.player.gold = (gameState.player.gold ?? 0) + gold;
    addMessage(formatText(t("questRewardGold"), { gold }), "loot");
  }

  return true;
}

// ── HELPERS PARA UI ────────────────────────────────────────────────

/** Líneas de diálogo según estado actual de la misión */
export function getQuestDialogue(questId) {
  const q = QUEST_DATA[questId];
  if (!q) return [t("qlProgressInactive", { npc: t("unknownLocation") })];
  const status = getQuestStatus(questId);

  if (status === "completed") {
    return q.dialogues.completed.map(localizeText);
  }

  if (status === "active") {
    if (q.type === "kill" && q.dialogues.active_template) {
      const killed = gameState.stats?.enemiesDefeated?.[q.enemy] ?? 0;
      const remaining = Math.max(0, q.count - killed);
      return [localizeText(q.dialogues.active_template).replace("{remaining}", remaining)];
    }
    return q.dialogues.active.map(localizeText);
  }

  return q.dialogues.inactive.map(localizeText);
}

/**
 * Etiqueta del botón de acción en el modal del NPC.
 * null = no mostrar botón.
 */
export function getQuestActionLabel(questId) {
  const status = getQuestStatus(questId);
  if (status === "completed") return null;
  if (status === "active" && checkQuestCondition(questId)) return t("qlActionTurnInQuest");
  if (status === "inactive") return t("qlActionAcceptQuest");
  return null; // activa pero condición no cumplida
}
