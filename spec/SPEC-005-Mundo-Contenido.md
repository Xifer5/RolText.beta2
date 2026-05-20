# SPEC-005: Mundo y Contenido Procedural

## 1. Arquitectura del Mundo

### 1.1 Grafo de Localizaciones
```javascript
// worldMap es un grafo dirigido con pesos implícitos
worldMap = {
  [locationId]: {
    id, name, description, biome,
    exits: { [direction]: targetId },
    enemies: string[],      // IDs de enemigos posibles
    encounterRate: number,  // 0.0 - 1.0
    canRest: boolean,
    safeZone: boolean,
    level: number          // Nivel sugerido
  }
}
```

### 1.2 Direcciones Soportadas
```javascript
const DIRECTIONS = {
  cardinal: ['north', 'south', 'east', 'west'],
  vertical: ['up', 'down'],
  portal:   ['enter', 'out'],
  special:  ['summit']  // Caso especial: mountain → dragon_lair
};
```

## 2. Biomas

### 2.1 Definición
```javascript
biomes = {
  [biomeId]: {
    name, minLevel, encounterRate,
    enemies: string[],        // Pool de enemigos
    description: string[],     // Array de descripciones random
    modifiers: {
      visibility: number,     // Modificador de encounterRate
      magicBonus: number,     // Bonus a daño mágico
      defenseBonus: number,   // Bonus a DEF
      poisonChance?: number,  // Chance de veneno ambiental
      fireDamage?: number,    // Daño de fuego por turno
      coldDamage?: number     // Daño de frío por turno
    }
  }
}
```

### 2.2 Biomas Implementados (14)
| ID | Nombre | Nivel | Encounter | Enemigos | Modificadores |
|----|--------|-------|-----------|----------|---------------|
| forest | Forest | 1 | 0.35 | Slime, Wolf, Goblin, Funged Beast | vis:-1.5, mag:+1, def:+1 |
| garden | Garden | 1 | 0.40 | Thief, Orc, Imp, Elf, Pegasus | vis:-1.0, mag:+2, def:-1 |
| cave | Cave | 3 | 0.45 | Cave Bat, Cave Bear, Goblin Shaman | vis:0.7, mag:+2, def:+1 |
| mountain | Mountain | 6 | 0.40 | Wyvern, Mountain Giant, Drider | vis:1.2, mag:-2, def:+3 |
| ruin | Ancient Ruins | 5 | 0.50 | Stone Golem, Ancient Guardian, Hydra | vis:0.9, mag:+4, def:0 |
| swamp | Poison Swamp | 4 | 0.55 | Zombie, Skeleton, Imp | vis:0.6, mag:+1, def:-1, poison:0.1 |
| volcano | Volcanic Region | 10 | 0.50 | Diablo, Dragon, Inferno Elemental | vis:1.0, mag:+3, def:-2, fire:1 |
| tundra | Frozen Tundra | 7 | 0.30 | Wolf, Mountain Giant, Wyvern, Beholder | vis:1.1, mag:-1, def:+2, cold:1 |
| beach | Sunny Beach | 7 | 0.30 | Centaurus, Kraken, Sea Serpent, Mermaid | vis:1.1, mag:-1, def:+2, water:2 |
| jungle | The Canopy | 8 | 0.30 | Gorilla Warrior, Jungle Tiger, Vine Serpent | vis:-2, mag:+3, def:+2, water:2 |
| dungeon | Dungeon | 5 | 0.50 | Stone Golem, Warlock, Linchorn | vis:0.5, mag:+4, def:-2 |
| catacomb | Catacomb | 5 | 0.50 | Stone Golem, Warlock, Linchorn | vis:0.5, mag:+4, def:-2 |
| treasure_keep | Treasure Keep | 5 | 0.40 | Ancient Guardian, Treasure Guardian | vis:-1.0, mag:+3, def:-2 |
| inferno | Inferno | 10 | 1.0 | Dragon King | vis:-2, mag:+3, def:-2, fire:2 |

### 2.3 Descripciones Procedurales
Cada bioma tiene 4-8 descripciones alternativas. Se selecciona una al azar al entrar:
```javascript
const desc = Array.isArray(loc.description) 
  ? loc.description[Math.floor(Math.random() * loc.description.length)]
  : loc.description;
```

## 3. Generación Procedural de Zonas

### 3.1 Parámetros
```javascript
generateZone({
  biome: "forest",      // Bioma base
  idPrefix: "forest",   // Prefijo de IDs
  rooms: 4,             // Número de salas
  level: undefined      // Nivel (default: biome.minLevel)
});
```

### 3.2 Algoritmo
1. Crear N rooms con IDs secuenciales (`forest_1`, `forest_2`, ...)
2. Asignar bioma, descripción random, encounterRate base
3. Seleccionar enemigos del pool del bioma filtrados por levelRequirement
4. Conectar rooms linealmente (este-oeste por defecto)

### 3.3 Conexión de Zonas
```javascript
connectZones(world, fromId, toId, direction, reverseDirection);
// Ejemplo:
connectZones(world, 'town', 'forest_1', 'north', 'south');
```

## 4. Sistema de Jefes por Bioma

### 4.1 Definición
```javascript
biomeBosses = {
  forest: {
    boss: "forest_titan",
    miniBosses: ["alpha_wolf", "shaman_goblin"],
    spawnChance: 0.10
  },
  // ... 7 biomas con jefes
};
```

### 4.2 Lógica de Aparición
```javascript
// trySpawnBoss(biomeId)
if (Math.random() > biome.spawnChance) return null;
const isBoss = Math.random() < 0.3;  // 30% boss, 70% mini-boss
return isBoss ? biome.boss : random(miniBosses);
```

### 4.3 Cooldown
```javascript
const BOSS_COOLDOWN = 8;  // Mínimo 8 movimientos entre apariciones
_movesSinceLastBoss++;    // Incrementa en cada movimiento
```

## 5. NPCs y Questlines

### 5.1 Estructura de NPC
```javascript
NPC_DATA = {
  [npcId]: {
    id, name, emoji, locationId, role, color, questId,
    lore: string  // Descripción narrativa
  }
};
```

### 5.2 NPCs Implementados (6)
| ID | Nombre | Ubicación | Quest | Rol |
|----|--------|-----------|-------|-----|
| elara | Elara la Vidente | town | explore_forest | Guardiana de Oakhaven |
| valdris | Archimago Valdris | tower | collect_crystal | Archimago del Castillo |
| brennan | Capitán Brennan | port | kill_pirates | Capitán de Saltwind Port |
| eryndel | Guardiana Eryndel | garden_1 | collect_fairy_dust | Guardiana del Jardín |
| theron | Theron el Explorador | mountain_1 | collect_ice_crystal | Explorador de Crestas |
| pyrax | Pyrax, Guardián del Volcán | volcano_4 | defeat_dark_lord | Centinela del Volcán |

### 5.3 Tipos de Misión
```javascript
QUEST_DATA = {
  [questId]: {
    title: { en, es },
    type: "visit" | "collect" | "kill",
    // visit: target (locationId)
    // collect: item, qty, consumeItem
    // kill: enemy, count
    reward: { item?, xp?, gold? },
    dialogues: {
      inactive: [{en, es}, ...],  // Antes de aceptar
      active: [{en, es}, ...],    // Durante
      completed: [{en, es}, ...]  // Al completar
    }
  }
};
```

### 5.4 Cadena de Misiones (Questline Principal)
```
town (Elara) ──► forest_3 ──► tower (Valdris) ──► ruins_4 ──► 
port (Brennan) ──► kill 3 pirates ──► catacombs_1 ──► 
garden_1 (Eryndel) ──► collect fairy_dust ──► treasure_keep_1 ──►
mountain_1 (Theron) ──► collect ice_crystal ──► tundra_1 ──►
volcano_4 (Pyrax) ──► dungeon_7 ──► inferno_1 (Dragon King)
```

### 5.5 Sistema de Bloqueo de Zonas
```javascript
ZONE_GATES = {
  ruin_4:       { item: "arcane_key",       msg: "..." },
  catacomb_1:   { item: "navigation_chart", msg: "..." },
  treasure_keep_1: { item: "garden_key",    msg: "..." },
  tundra_1:     { item: "mountain_pass",    msg: "..." },
  inferno_1:    { item: "dragon_key",       msg: "..." }
};
```

## 6. Eventos de Viaje

### 6.1 Sistema
```javascript
// getTravelEvent(biome) → event object | null
// showTravelEvent(event) → Modal con elección
```

### 6.2 Tipos de Eventos (Implementados)
- **Ambientales**: Descripciones especiales del bioma
- **Encuentros**: NPCs viajeros, comerciantes
- **Descubrimientos**: Tesoros escondidos, landmarks
- **Peligros**: Trampas, clima severo, emboscadas

## 7. Contenido Actual

### 7.1 Métricas
| Categoría | Cantidad |
|-----------|----------|
| Localizaciones (estáticas) | 20+ |
| Localizaciones (generadas) | Ilimitadas (procedural) |
| Enemigos base | 45+ |
| Jefes de bioma | 7 principales + 14 mini |
| Items | 300+ |
| Recetas craft | 50+ |
| Misiones | 6 principales |
| NPCs | 6 |
| Biomas | 14 |
| Logros | 16 |
| Entradas de journal | 9 |

### 7.2 Progresión de Contenido
| Horas | Contenido Desbloqueado |
|-------|----------------------|
| 0-1 | Town, Forest, Garden, primeros combates |
| 1-3 | Cave, Swamp, primer jefe, crafting básico |
| 3-6 | Mountain, Beach, Ruins, misiones intermedias |
| 6-10 | Dungeon, Jungle, Volcano, jefes de área |
| 10-15 | Tundra, Catacombs, Treasure Keep |
| 15+ | Inferno, Dragon King, endgame |

## 8. Problemas de Contenido

### 8.1 Identificados
1. **Misiones insuficientes**: Solo 6 para ~20 horas de juego
2. **Endgame vacío**: Tras Dragon King no hay contenido
3. **Procedural repetitivo**: generateZone() crea rooms idénticas
4. **Lore disperso**: ENEMY_LORE, JOURNAL_ENTRIES, NPC lore no conectados
5. **Falta de branching**: Questline es completamente lineal

### 8.2 Soluciones Propuestas
- [ ] **Side quests**: 20+ misiones secundarias por zona
- [ ] **Procedural quests**: Generadas con templates
- [ ] **Endless mode**: Dungeon infinito con dificultad escalante
- [ ] **New Game+**: Reinicio con items/levels preservados
- [ ] **Factions**: Sistema de reputación con NPCs
- [ ] **Housing**: Base personalizable (decoración, storage)
- [ ] **Pet system**: Compañeros con habilidades
- [ ] **Seasonal events**: Contenido temporal
