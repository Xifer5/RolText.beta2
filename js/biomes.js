// biomes.js
// Sistema de biomas para Pixel Quest Echoes
// Cada bioma define:
// - Nivel mínimo sugerido
// - Enemigos disponibles
// - Probabilidad de encuentro
// - Frases para descripciones dinámicas
// - Modificadores opcionales (clima, visión, penalidades)
//
// SPEC-1221 — algunas entradas de `description` llevan un `when(gameState)`
// opcional: son callbacks sutiles a la historia (jefe de zona ya vencido,
// decisión tomada, trial resuelto), invisibles hasta que la condición se
// cumple. movement.js filtra por `when` antes de elegir al azar — ver
// pickLocationDescription(). Sin esto, el texto ambiental (lo que el
// jugador más ve en todo el juego, en cada movimiento) nunca reflejaba nada
// de lo que ya construimos en la historia mejorada.
import { gameState } from "./state.js";
import { zoneBossesDefeatedCount } from "./eryndelArc.js";

export const biomes = {
  forest: {
    id: "forest",
    name: "Forest",
    minLevel: 1,
    encounterRate: 0.35,
    enemies: ["slime", "wolf", "goblin", "fungedBeast"],
    description: [
      { en: "The trees loom tall above you.", es: "Los árboles se alzan imponentes sobre ti." },
      { en: "You hear rustling in the bushes.", es: "Escuchas un crujido entre los arbustos." },
      { en: "Birds scatter as you pass between the trees.", es: "Los pájaros huyen al pasar entre los árboles." },
      { en: "Faint sunlight breaks through the forest canopy.", es: "Tenues rayos de sol se filtran por el dosel del bosque." },
      { en: "In this part of the deep forest the trees look scary.", es: "En esta parte del bosque profundo, los árboles parecen amenazantes." },
      { en: "The animals and plants are really wild. What is happening in the forest?", es: "Los animales y plantas son muy salvajes. ¿Qué está pasando en el bosque?" },
      { en: "The air is filled with the scent of pine and earth.", es: "El aire está impregnado con el aroma de pino y tierra húmeda." },
      { en: "All the nature here is beautiful and wild.", es: "Toda la naturaleza aquí es hermosa y salvaje." },
      {
        en: "The forest breathes differently now that the Titan has fallen, as if it could finally sleep.",
        es: "El bosque respira distinto desde que el Titán cayó, como si por fin pudiera dormir.",
        when: () => gameState.stats?.enemiesDefeated?.forest_titan > 0
      },
      {
        en: "A flicker of light brushes past you between the trees — or maybe it was only the wind.",
        es: "Un eco de luz roza tus pasos entre los árboles — o quizás fue solo el viento.",
        when: () => !!gameState.worldFlags?.echo_freed
      },
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
    enemies: ["thief", "orc", "imp", "fungedBeast", "elf", "pegasus"],
    description: [
      { en: "You can feel the magic in these gardens.", es: "Puedes sentir la magia en estos jardines." },
      { en: "So many flowers, it's hypnotic.", es: "Tantas flores, es hipnótico." },
      { en: "How could such beauty be so dangerous?", es: "¿Cómo puede tanta belleza ser tan peligrosa?" },
      { en: "Are the flowers whispering? Maybe there's something inside the garden.", es: "¿Están susurrando las flores? Quizás hay algo dentro del jardín." },
      { en: "There is a beautiful waterfall. Something is shining inside it.", es: "Hay una hermosa cascada. Algo brilla dentro de ella." },
      {
        en: "Eryndel once said the dragon made stars bloom here. It's hard to picture — and yet the garden seems to remember it.",
        es: "Eryndel dijo una vez que el dragón hacía florecer las estrellas aquí. Cuesta imaginarlo, y sin embargo el jardín parece recordarlo.",
        when: () => zoneBossesDefeatedCount(gameState) > 0
      },
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
      { en: "This place is full of gold and jewels.", es: "Este lugar está lleno de oro y joyas." },
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
      { en: "A vast, endless expanse of blood-red sand. The heat is oppressive, a tangible force draining your will to move.", es: "Una vasta extensión de arena color sangre. El calor es opresivo, una fuerza tangible que drena tu voluntad de moverte." },
      { en: "The ground glints with obsidian and jade shards—remnants of a cataclysmic magical explosion.", es: "El suelo brilla con fragmentos de obsidiana y jade: vestigios de una explosión mágica catastrófica." },
      { en: "Iron-rich dust fills the air with a metallic scent. Thunderstorms fuse the ground into glassy ribbons.", es: "El polvo rico en hierro llena el aire con un olor metálico. Las tormentas fusionan el suelo en cintas vítridas." },
      { en: "A forest turned to stone. Hundreds of fossilized trees jut from the cracked, dry earth.", es: "Un bosque convertido en piedra. Cientos de árboles fosilizados emergen de la tierra agrietada y seca." },
      { en: "A haze-laden valley in dim orange twilight. Massive tracks pass through the gloom toward an unseen destination.", es: "Un valle cubierto de neblina en un crepúsculo anaranjado. Enormes huellas atraviesan la penumbra hacia un destino desconocido." },
      { en: "Cracked earth stretches to the horizon with steam venting from the depths. The air smells of sulfur.", es: "La tierra agrietada se extiende hasta el horizonte con vapor emergiendo de las profundidades. El aire huele a azufre." },
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
      { en: "The cave walls feel cold and damp.", es: "Las paredes de la cueva se sienten frías y húmedas." },
      { en: "Water dripping echoes endlessly.", es: "El goteo de agua resuena sin fin." },
      { en: "Shadows dance along the rocky surfaces.", es: "Las sombras danzan sobre las superficies rocosas." },
      { en: "A distant growl makes you tense up.", es: "Un gruñido lejano te pone en alerta." },
      {
        en: "The caverns no longer twist your own words back at you. Something, at last, stopped being afraid to listen.",
        es: "Las cavernas ya no te devuelven tus propias palabras deformadas. Algo, por fin, dejó de tener miedo de escuchar.",
        when: () => gameState.stats?.enemiesDefeated?.cave_devourer > 0
      },
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
      { en: "Freezing winds whip across your face.", es: "Vientos helados te azotan el rostro." },
      { en: "The air is thin and heavy.", es: "El aire es escaso y pesado." },
      { en: "Loose gravel slides under your boots.", es: "La gravilla suelta se desliza bajo tus botas." },
      { en: "You see massive figures moving in the distance.", es: "Ves figuras masivas moviéndose a lo lejos." },
      { en: "The air is filled with the scent of sulfur and brimstone.", es: "El aire está impregnado de azufre y piedra caliza." },
      { en: "The ground is covered in loose, unstable rock.", es: "El suelo está cubierto de roca suelta e inestable." },
      {
        en: "The clans of the Peaks still tell the story of whoever brought down the Colossus without betraying anyone.",
        es: "Los clanes de las Cumbres cuentan, todavía, la historia de quien hizo caer al Coloso sin traicionar a nadie.",
        when: () => gameState.stats?.enemiesDefeated?.mountain_colossus > 0
      },
    ],
    modifiers: {
      visibility: 1.2,
      magicBonus: -2,
      defenseBonus: +3,
    }
  },

  ruin: {
    id: "ruin",
    name: "Ancient Ruins",
    minLevel: 5,
    encounterRate: 0.50,
    enemies: ["stone_golem", "ancient_guardian", "hydra", "chimera"],
    description: [
      { en: "Ancient pillars crumble upon your touch.", es: "Los pilares antiguos se desmoronan al tocarlos." },
      { en: "Blue runes glow faintly on broken walls.", es: "Runas azules brillan tenuemente en las paredes rotas." },
      { en: "The air feels charged with forgotten magic.", es: "El aire parece cargado de magia olvidada." },
      { en: "Whispers echo from nowhere.", es: "Susurros resuenan de la nada." },
      {
        en: "Eldrast's faceless statues seem, for a moment, a little less empty.",
        es: "Las estatuas sin rostro de Eldrast parecen, por un instante, menos vacías.",
        when: () => gameState.stats?.enemiesDefeated?.ancient_construct > 0
      },
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
      { en: "Thick fog makes it hard to see ahead.", es: "La espesa niebla dificulta ver hacia adelante." },
      { en: "Your boots sink into the muddy ground.", es: "Tus botas se hunden en el suelo fangoso." },
      { en: "A foul smell fills the humid air.", es: "Un olor nauseabundo llena el aire húmedo." },
      { en: "Something splashes nearby… too large to be a frog.", es: "Algo salpica cerca... demasiado grande para ser una rana." },
      { en: "The smell is so strong it makes you feel sick.", es: "El olor es tan intenso que te revuelve el estómago." },
      {
        en: "The swamp no longer whispers with a thousand borrowed voices. Only the silence of what was finally heard remains.",
        es: "El pantano ya no susurra con miles de voces prestadas. Solo queda el silencio de lo que por fin fue escuchado.",
        when: () => gameState.stats?.enemiesDefeated?.swamp_abomination > 0
      },
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
      { en: "Heat waves distort the air.", es: "Las ondas de calor distorsionan el aire." },
      { en: "Streams of lava crackle nearby.", es: "Torrentes de lava crepitan cerca." },
      { en: "Ash falls like snow around you.", es: "La ceniza cae como nieve a tu alrededor." },
      { en: "The ground trembles with volcanic activity.", es: "El suelo tiembla con la actividad volcánica." },
      { en: "Fire — you are walking over fire!", es: "¡Fuego! ¡Estás caminando sobre fuego!" },
      {
        en: "Pyrax no longer blocks the way. He only watches, like someone who's already made peace with whatever waits beyond.",
        es: "Pyrax ya no bloquea el paso. Solo observa, como quien ya hizo las paces con lo que sea que espera más allá.",
        when: () => !!gameState.worldFlags?.pyrax_trial_resolved
      },
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
      { en: "The cold bites at your skin.", es: "El frío muerde tu piel." },
      { en: "Snow crunches with every step.", es: "La nieve cruje con cada paso." },
      { en: "Your breath freezes in the air.", es: "Tu aliento se congela en el aire." },
      { en: "Icy winds carry distant howls.", es: "Los vientos helados traen aullidos lejanos." },
      { en: "Ice and cold is all you can feel.", es: "Hielo y frío es todo lo que puedes sentir." },
      {
        en: "The dawn you freed still feels new here, as if the tundra didn't quite know what to do with the light.",
        es: "El amanecer que liberaste todavía se siente nuevo aquí, como si la tundra no supiera qué hacer con la luz.",
        when: () => gameState.stats?.enemiesDefeated?.frost_wyrm > 0
      },
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
      { en: "Dark volcanic stones replace the sand. The deep sapphire water crashes against crumbling sea stacks.", es: "Piedras volcánicas oscuras reemplazan la arena. El agua de color zafiro choca contra los arrecifes erosionados." },
      { en: "Ivory-white sand fringed by tall palms. Sea caves in the cliffs produce a melodic, mournful sound when the wind blows.", es: "Arena blanco marfil rodeada de altas palmeras. Las cuevas marinas en los acantilados producen un sonido melodioso cuando sopla el viento." },
      { en: "The beach is strewn with the skeletal remains of massive sea creatures. Phosphorescent algae glows faintly at night.", es: "La playa está sembrada con los restos esqueléticos de enormes criaturas marinas. Algas fosforescentes brillan tenuemente de noche." },
      { en: "Amber stones mixed with the sand glitter with golden fire when the sun hits them.", es: "Piedras de ámbar mezcladas con la arena brillan como fuego dorado cuando les da el sol." },
      { en: "A rugged beach below sheer cliffs, littered with shipwrecks. Waves crash with a violence that shakes the ground.", es: "Una playa escarpada bajo acantilados verticales, plagada de naufragios. Las olas chocan con una violencia que sacude el suelo." },
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
      { en: "The air is a thick, hot soup saturated with wet earth and decaying wood. True darkness reigns even at noon.", es: "El aire es una sopa espesa y caliente, saturada de tierra húmeda y madera en descomposición. La oscuridad reina incluso al mediodía." },
      { en: "Sentient-looking vines drape the trees like the beards of ancient giants. When the wind blows through them, it sounds like hundreds of voices exchanging secrets.", es: "Las enredaderas que cubren los árboles parecen tener vida propia, como barbas de gigantes antiguos. Cuando el viento las agita, suenan como cientos de voces intercambiando secretos." },
      { en: "Cool mist rolls in from the mountain peaks. Luminous fungi glow with blue light, illuminating the rocky ground.", es: "Una bruma fresca llega desde los picos montañosos. Los hongos luminosos brillan con luz azul, iluminando el suelo rocoso." },
      { en: "A low-lying jungle near a great river. Massive trees dip their branches into the slow, brown water. The rasp of scales on wet ground follows you.", es: "Una jungla baja cerca de un gran río. Los árboles masivos sumergen sus ramas en el agua marrón y lenta. El arrastre de escamas sobre el suelo húmedo te sigue." },
      { en: "A jungle atop a flat mesa. Gnarled trees resist the high winds. From the edge, you look down over the clouds.", es: "Una jungla sobre una meseta plana. Árboles retorcidos resisten los fuertes vientos. Desde el borde, miras hacia abajo sobre las nubes." },
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
      { en: "Ancient pillars crumble upon your touch.", es: "Los pilares antiguos se desmoronan al tocarlos." },
      { en: "Blue runes glow faintly on broken walls.", es: "Runas azules brillan tenuemente en las paredes rotas." },
      { en: "The air feels charged with forgotten magic.", es: "El aire parece cargado de magia olvidada." },
      { en: "Whispers echo from nowhere.", es: "Susurros resuenan de la nada." },
      { en: "There should be a secret chamber somewhere in these dungeons.", es: "Debe haber una cámara secreta en algún lugar de estas mazmorras." },
    ],
    modifiers: {
      visibility: 0.5,
      magicBonus: +4,
      defenseBonus: -2,
    }
  },

  catacomb: {
    id: "catacomb",
    name: "Catacomb",
    minLevel: 5,
    encounterRate: 0.50,
    enemies: ["stone_golem", "warlock", "linchorn"],
    description: [
      { en: "Ancient pillars crumble upon your touch.", es: "Los pilares antiguos se desmoronan al tocarlos." },
      { en: "Blue runes glow faintly on broken walls.", es: "Runas azules brillan tenuemente en las paredes rotas." },
      { en: "The air feels charged with forgotten magic.", es: "El aire parece cargado de magia olvidada." },
      { en: "Whispers echo from nowhere.", es: "Susurros resuenan de la nada." },
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
      { en: "This is the Inferno — the final test for the worthy.", es: "Este es el Infierno: la prueba final para los dignos." },
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
