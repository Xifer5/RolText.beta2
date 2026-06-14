/**
 * npcs.js — Definiciones de NPCs del mundo de Aethoria
 *
 * Cada NPC habita en una zona fija, tiene un rol narrativo
 * y una misión asociada que el jugador puede aceptar/entregar.
 */

export const NPC_DATA = {

  elara: {
    id: "elara",
    name: "Elara la Vidente",
    emoji: "🔮",
    locationId: "town",
    role: "Guardiana de Oakhaven",
    color: "#818cf8",
    questIds: ["mq_01_la_cancion", "explore_forest"],
    lore: "Una anciana que escucha el eco del mundo cuando todos duermen. Hace mil años vio en sueños al Rey Dragón Asterion dividir su alma en ocho sellos. Lleva décadas esperando a alguien capaz de oírlos."
  },

  valdris: {
    id: "valdris",
    name: "Archimago Valdris",
    emoji: "🧙",
    locationId: "tower",
    role: "Archimago del Castillo Griffon",
    color: "#b09ae0",
    questIds: ["mq_02_los_sellos", "mq_04_la_verdad", "collect_crystal"],
    lore: "Lleva su nombre del bosque que estudió toda su vida. Fue el primero en descubrir que los fragmentos arcanos de Eldrast pertenecían a una sola esencia: Asterion, el guardián del mundo. Nadie le creyó."
  },

  brennan: {
    id: "brennan",
    name: "Capitán Brennan",
    emoji: "⚓",
    locationId: "port",
    role: "Capitán de Saltwind Port",
    color: "#5a8de0",
    questId: "kill_pirates",
    lore: "Veterano marino con treinta años en el mar. Los piratas que bloquean las rutas costeras no buscan oro: buscan reliquias del dragón para venderlas al mejor postor. Brennan lo sabe y no lo tolera."
  },

  eryndel: {
    id: "eryndel",
    name: "Guardiana Eryndel",
    emoji: "🧚",
    locationId: "garden_1",
    role: "Guardiana del Jardín Encantado",
    color: "#52c07a",
    questIds: ["mq_03_ecos", "collect_fairy_dust"],
    lore: "El hada más antigua de Aetheria. Recuerda a Asterion jugando en este jardín cuando el mundo era joven. Con cada boss que despierta, ella pierde un pétalo de su memoria. Teme el día en que no recuerde nada."
  },

  theron: {
    id: "theron",
    name: "Theron el Explorador",
    emoji: "🏔️",
    locationId: "mountain_1",
    role: "Explorador de las Crestas de Hierro",
    color: "#94a3b8",
    questId: "collect_ice_crystal",
    lore: "El único ser conocido que cruzó la Tundra Eterna sin congelarse. Encontró allí un recuerdo congelado: un niño humano prometiendo visitar al dragón. Han pasado mil años. Los cristales de hielo aún guardan ese eco."
  },

  pyrax: {
    id: "pyrax",
    name: "Pyrax, Guardián del Volcán",
    emoji: "🌋",
    locationId: "volcano_4",
    role: "Centinela del Volcán Eterno",
    color: "#f97316",
    questIds: ["mq_05_el_ultimo_sueno", "defeat_dark_lord"],
    lore: "Un elemental de fuego que vigila la Puerta del Dragón desde la primera erupción. Fue el último ser en ver a Asterion antes de que cerrara los ojos. Sabe que el dragón no murió de maldad. Murió de olvido."
  },

  // ── Entrenadores (SPEC-0702) ──────────────────────────────────────
  mentor_aldric: {
    id: "mentor_aldric",
    name: "Maestro Aldric",
    emoji: "📚",
    locationId: "tavern",
    role: "Mentor de la Taberna del Dragón Ebrio",
    color: "#a78bfa",
    lore: "Un aventurero retirado que pasó décadas viajando por Aethoria y recogiendo el conocimiento de cien batallas. Por unas monedas comparte lo que aprendió.",
    trainerSkills: [
      { skillId: "rally",        gold: 150 },
      { skillId: "power_strike", gold: 200 },
      { skillId: "arcane_bolt",  gold: 250 }
    ]
  },

  weaponsmith_garrett: {
    id: "weaponsmith_garrett",
    name: "Herrero Garrett",
    emoji: "⚒️",
    locationId: "armory",
    role: "Maestro del Armario Real",
    color: "#6b7280",
    lore: "Forjó las armas de tres generaciones de caballeros del reino. Conoce cada técnica de combate que existe, y las enseña a los dignos previo pago.",
    trainerSkills: [
      { skillId: "power_strike", gold: 180 },
      { skillId: "rally",        gold: 130 }
    ]
  }

};

/**
 * Devuelve el NPC que habita en la ubicación dada, o null.
 * @param {string} locationId
 * @returns {object|null}
 */
export function getNpcAt(locationId) {
  return Object.values(NPC_DATA).find(n => n.locationId === locationId) ?? null;
}
