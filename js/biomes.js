// biomes.js
// Sistema de biomas para Pixel Quest Echoes
// Cada bioma define:
// - Nivel mínimo sugerido
// - Enemigos disponibles
// - Probabilidad de encuentro
// - Frases para descripciones dinámicas
// - Modificadores opcionales (clima, visión, penalidades)

export const biomes = {
  forest: {
    id: "forest",
    name: "Forest",
    minLevel: 1,
    encounterRate: 0.35,
    enemies: ["slime", "wolf", "goblin", "fungedBeast"],
    description: [
      "The trees loom tall above you.",
      "You hear rustling in the bushes.",
      "Birds scatter as you pass between the trees.",
      "Faint sunlight breaks through the forest canopy.",
      "In this part of the deep forest the Trees looks scary.",
      "The animals and plants are really wild. What is happening in the forest?",
    ],
    modifiers: {
      visibility: -1.5,
      magicBonus: 1,
      defenseBonus: 1,
    }
  },

  garden: {
    id: "garden",
    name: "Garden",
    minLevel: 1,
    encounterRate: 0.40,
    enemies: ["thief", "orc", "imp", "fungedBeast"],
    description: [
      "You can feel the magic in these gardens.",
      "So many flower is hipnotic.",
      "How this beauty could be so dangerous?",
      "There is a beautiful waterfall. Something is shining, maybe is something inside the waterfall.",
    ],
    modifiers: {
      visibility: -1.0,
      magicBonus: 2,
      defenseBonus: -1,
    }
  },

  treasure_keep: {
    id: "treasure_keep",
    name: "Treasure Keep",
    minLevel: 5,
    encounterRate: 0.40,
    enemies: ["ancient_guardian", "treasure_guardian"],
    description: [
      "This place is full of gold and jewels.",
    ],
    modifiers: {
      visibility: -1.0,
      magicBonus: 3,
      defenseBonus: -2,
    }
  },

  desert: {
    name: "Desert",
    minLevel: 5,
    encounterRate: 0.35,
    enemies: ["beholder", "warlock", "linchorn", "chimera"],
    description: [
      "A vast, endless expanse of blood-red sand. The heat here is oppressive, a tangible force that seems to drain the will to move. The defining feature is the wind—it constantly shifts the dunes, creating high, sculpted crests, and carries a sound like a thousand mournful voices. This is the Sea of Whispering Sands, where ancient travelers are said to be buried just beneath the surface, their final words carried on the breeze.",
      "This desert is composed not of sand, but of millions of tiny, weathered shards of obsidian and jade. It is the remnants of a cataclysmic magical explosion. The ground glints with a painful brilliance under the relentless sun. In the center, a sunken crater holds a pool of water that shimmers with an unnatural, oily sheen, surrounded by bizarre, thorny cacti that pulse with faint, purple light.",
      "The soil here is a rust-colored powder, so rich in iron that the entire area gives off a faint magnetic pull. Thunderstorms are frequent, and the flashes of lightning often strike the ground, fusing the dust into sharp, glassy ribbons. The air tastes of ozone and metallic decay. Strange, heavy-bodied creatures with thick, scaled hides are the only life that thrive in this mineral-rich wasteland.",
      "A landscape dominated by the ghostly remains of a forest turned to stone. Hundreds of fossilized trees, gray and skeletal, jut from the cracked, dry earth. They offer no shade, only eerie, fixed shadows that stretch and warp as the sun crosses the sky. The silence is profound and heavy, a testament to the sudden, terrible event that once froze life in this desolate place.",
      "This long, winding valley is perpetually shrouded in a thick, dust-laden haze. The sun never seems to fully rise or set, leaving the land in a state of dim, orange-tinged twilight. Navigation is difficult as landmarks are obscured. The only sign of life is the occasional, deep track of something massive and slow-moving that passes through the gloom, heading toward a destination you cannot see.",
      "An expanse of cracked, parched earth that stretches to the horizon. The ground is a mosaic of deep fissures and jagged plates, with occasional geysers of steam venting from the depths below. The air is dry and hot, carrying the scent of sulfur and minerals. In the distance, mirages create illusions of water and greenery that vanish as you approach."
    ],
    modifiers: {
      visibility: 1.0,
      magicBonus: -1.0,
      defenseBonus: -1.0,
    }
  },

  cave: {
    id: "cave",
    name: "Cave",
    minLevel: 3,
    encounterRate: 0.45,
    enemies: ["cave_bat", "cave_bear", "goblin_shaman"],
    description: [
      "The cave walls feel cold and damp.",
      "Water dripping echoes endlessly.",
      "Shadows dance along the rocky surfaces.",
      "A distant growl makes you tense up."
    ],
    modifiers: {
      visibility: 0.7,
      magicBonus: +2,
      defenseBonus: +1,
    }
  },

  mountain: {
    id: "mountain",
    name: "Mountain",
    minLevel: 6,
    encounterRate: 0.40,
    enemies: ["wyvern", "mountain_giant", "drider", "centaurus"],
    description: [
      "Freezing winds whip across your face.",
      "The air is thin and heavy.",
      "Loose gravel slides under your boots.",
      "You see massive figures moving in the distance."
    ],
    modifiers: {
      visibility: 1.2,
      magicBonus: -2,
      defenseBonus: +3,
    }
  },

  ruins: {
    id: "ruins",
    name: "Ancient Ruins",
    minLevel: 5,
    encounterRate: 0.50,
    enemies: ["stone_golem", "ancient_guardian", "hydra", "chimera"],
    description: [
      "Ancient pillars crumble upon your touch.",
      "Blue runes glow faintly on broken walls.",
      "The air feels charged with forgotten magic.",
      "Whispers echo from nowhere."
    ],
    modifiers: {
      visibility: 0.9,
      magicBonus: +4,
      defenseBonus: 0,
    }
  },

  swamp: {
    id: "swamp",
    name: "Poison Swamp",
    minLevel: 4,
    encounterRate: 0.55,
    enemies: ["zombie", "squeletor", "imp"],
    description: [
      "Thick fog makes it hard to see ahead.",
      "Your boots sink into the muddy ground.",
      "A foul smell fills the humid air.",
      "Something splashes nearby… too large to be a frog."
    ],
    modifiers: {
      visibility: 0.6,
      magicBonus: +1,
      defenseBonus: -1,
      poisonChance: 0.1
    }
  },

  volcano: {
    id: "volcano",
    name: "Volcanic Region",
    minLevel: 10,
    encounterRate: 0.50,
    enemies: ["diablo", "dragon", "vine_serpent", "inferno_elemental"],
    description: [
      "Heat waves distort the air.",
      "Streams of lava crackle nearby.",
      "Ash falls like snow around you.",
      "The ground trembles with volcanic activity."
    ],
    modifiers: {
      visibility: 1.0,
      magicBonus: +3,
      defenseBonus: -2,
      fireDamage: 1
    }
  },

  tundra: {
    id: "tundra",
    name: "Frozen Tundra",
    minLevel: 7,
    encounterRate: 0.30,
    enemies: ["wolf", "mountain_giant", "wyvern", "beholder"],
    description: [
      "The cold bites at your skin.",
      "Snow crunches with every step.",
      "Your breath freezes on the air.",
      "Icy winds carry distant howls."
    ],
    modifiers: {
      visibility: 1.1,
      magicBonus: -1,
      defenseBonus: +2,
      coldDamage: 1
    }
  },

  
  beach: {
    id: "beach",
    name: "Sunny Beach",
    minLevel: 7,
    encounterRate: 0.30,
    enemies: ["centaurus", "kraken", "sea_serpent", "mermaid", "medusa", "pirate", "pirate_captain"],
    description: [
      "The sand here is replaced by millions of smooth, dark, volcanic shingle stones. When the tide recedes, they create a cacophony of sound—the deep, rattling, withdrawing clatter of stone on stone. The water itself is a chilling, deep sapphire, and the sea stacks rising offshore are crowned with the crumbling ruins of ancient, forgotten shrines. The air is crisp and carries the potent scent of salt and iodine.",
      "A secluded stretch of ivory-white sand fringed by tall, swaying palms. The water is turquoise and warm, shallow for hundreds of feet before it drops off. What makes this beach unique are the sea caves carved into the limestone cliffs. When the wind blows into them, it creates a melodic, mournful sound, like a choir singing softly across the water.",
      "This beach is strewn with the skeletal remains of massive sea creatures: colossal ribs, cracked skulls the size of carriages, and pieces of polished driftwood that look like petrified bone. The sand is a dark, gritty brown, stained by years of tidal decomposition. The tide line is marked by a layer of strange, phosphorescent algae that glows faintly at night. The atmosphere is one of brooding, lonely majesty.",
      "An idyllic beach where the sand is mixed with tiny, perfectly rounded amber stones. When the sun hits them, the entire shoreline glitters with a warm, golden fire. The waves are gentle, but the water tastes curiously sweet. A single, enormous, moss-covered archway of coral stands at the edge of the water, a natural gateway to the restless sea.",
      "This is a rugged, wild beach where the land ends in sheer, jagged cliffs. The beach below is narrow and dangerous, littered with the wreckage of a hundred ships—splintered masts, barnacled figureheads, and rotted chests. The waves crash against the rocks with a violence that shakes the ground, and the cry of gulls is harsh and incessant. It is a place of scavengers and dark secrets.",

    ],
    modifiers: {
      visibility: 1.1,
      magicBonus: -1,
      defenseBonus: +2,
      WaterDamage: 2,
    }
  },

    jungle: {
    id: "jungle",
    name: "The Canopy of Eternal Rain Jungle",
    minLevel: 8,
    encounterRate: 0.30,
    enemies: ["gorilla_warrior", "jungle_tiger", "vine_serpent", "jungle_spirit"],
    description: [
      "The air is a thick, hot soup, saturated with the smell of wet earth and decaying wood. The foliage is so dense that true darkness reigns even at noon. A constant, gentle rain falls, not from the sky, but from the condensed water dripping from the leaves of the towering, emerald trees. The ground is a treacherous swamp of tangled roots and slick, moss-covered logs, and the sounds of unseen, chittering life are deafening.",
      "An unsettling, quiet jungle. The trees are draped in thick, gray-green, sentient-looking vines that hang like the beards of ancient giants. These vines seem to shift slightly when you look away, and the wind passing through them creates a low, sibilant sound, like hundreds of voices exchanging secrets. Flowers here are rare, but when found, they are unnaturally large and vibrant, attracting huge, iridescent insects.",
      "This jungle is constantly enveloped in a cool, white mist that rolls in from the mountain peaks. The ground is rocky and uneven, dotted with strange, luminous fungi that glow with a cool blue light. Every few hours, the mist clears dramatically, revealing a vast, open valley that disappears again moments later. Navigating here is a challenge of memory and trust.",
      "A low-lying, humid jungle near a great river. The banks are mud-choked and lined with massive, bulbous trees whose lower branches dip into the slow-moving, brown water. This place is defined by the incredible density of its undergrowth and the constant, subtle movement of reptiles. The sounds are dominated by the croaking of frogs and the unsettling, dry rasp of scales dragging across the wet ground.",
      "This jungle sits atop a massive, flat mesa, accessible only by a crumbling, ancient stone staircase. The trees are shorter and gnarled, adapted to the high winds. The ground is surprisingly clear, a carpet of short, wiry grass. From the edge of the plateau, you can look down over the clouds, and the silence is broken only by the shriek of the giant, colorful birds that make their nests in the sheer cliff face.",

    ],
    modifiers: {
      visibility: -2,
      magicBonus: +3,
      defenseBonus: +2,
      WaterDamage: 2,
    }
  },
  dungeon: {
    id: "dungeon",
    name: "Dungeon",
    minLevel: 5,
    encounterRate: 0.50,
    enemies: ["stone_golem", "warlock", "linchorn"],
    description: [
      "Ancient pillars crumble upon your touch.",
      "Blue runes glow faintly on broken walls.",
      "The air feels charged with forgotten magic.",
      "Whispers echo from nowhere."
    ],
    modifiers: {
      visibility: 0.5,
      magicBonus: +4,
      defenseBonus: -2,
    }
  },

  inferno: {
    id: "inferno",
    name: "Inferno",
    minLevel: 10,
    encounterRate: 1.0,
    enemies: ["dragon_king"],
    description: [
      "This is the Inferno, this is the final test for the worthy adventurers.",
    ],
    modifiers: {
      visibility: -2,
      magicBonus: +3,
      defenseBonus: -2,
      fireDamage: 2,
    }
  },

};

// Función utilitaria usada por el generador de zonas
export function getBiome(id) {
  return biomes[id] || null;
}