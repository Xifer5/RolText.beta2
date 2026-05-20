# SPEC-001: Arquitectura General de Pixel Quest Echoes

## 1. Visión del Sistema

Pixel Quest Echoes es un RPG de texto basado en navegador con las siguientes características técnicas:
- **Frontend**: Vanilla JavaScript ES6+ modular, sin framework
- **UI/UX**: Material Design 3 (MD3) con theming dinámico (dark/light)
- **Estado**: Patrón Singleton centralizado (`gameState`)
- **Comunicación**: Event-driven architecture via `CustomEvent`
- **Persistencia**: localStorage con versionado de save files
- **Responsive**: Mobile-first con navegación adaptativa

## 2. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  index.html │ │  styles-m3   │ │  MD3 Components     │   │
│  │  (Estructura)│ │  (Tokens CSS)│ │  (Modales, Sheets)  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      INTERACTION LAYER                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  keyboard.js│ │  events.js  │ │  ui.js              │   │
│  │  (Input)     │ │  (Handlers)  │ │  (Render/Update)    │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       CORE LAYER                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  state.js   │ │  main.js    │ │  i18n.js            │   │
│  │  (Store)     │ │  (Bootstrap) │ │  (Localization)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      GAME SYSTEMS LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ combat.js│ │movement.js│ │crafting.js│ │quests.js │       │
│  │inventory.js│ │shop.js  │ │journal.js│ │bestiary.js│       │
│  │panels.js │ │mapgen.js │ │npcs.js   │ │achievements│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │items.js  │ │enemies.js│ │biomes.js │ │locations.js│       │
│  │lootTables│ │classes.js│ │worldMap  │ │craftingRecipes│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │saveSystem│ │sounds.js │ │scrollMgr │ │localMinimap│       │
│  │utils.js  │ │toast.js  │ │travelEvts│ │minimap.js │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 3. Patrones de Diseño Implementados

| Patrón | Implementación | Uso |
|--------|---------------|-----|
| **Singleton** | `gameState` exportado desde `state.js` | Estado global único |
| **Observer** | `CustomEvent` con namespace `pixel:*` | Desacoplamiento entre sistemas |
| **Module** | ES6 `import/export` | Encapsulamiento por feature |
| **Factory** | `generateZone()` en `mapgen.js` | Generación procedural de contenido |
| **Strategy** | `SKILLS_BY_CLASS` en `classes.js` | Habilidades por clase |
| **State Machine** | `isInCombat`, `isGameOver`, `isProcessingMove` | Estados del juego |
| **Component** | Modales reutilizables en HTML | UI dinámica |

## 4. Flujo de Datos

```
Usuario Input → keyboard.js/events.js → Action Handler → gameState Mutation → 
CustomEvent Dispatch → UI Update (ui.js/panels.js) → DOM Render → localStorage (opcional)
```

## 5. Convenciones de Código

### 5.1 Estructura de Módulos
```javascript
// 1. Imports externos
import { gameState } from "./state.js";

// 2. Imports internos
import { addMessage } from "./story.js";

// 3. Constantes del módulo
const MODULE_CONSTANT = value;

// 4. Funciones exportadas
export function mainFunction() { }

// 5. Funciones privadas
function _helper() { }
```

### 5.2 Naming Conventions
- **PascalCase**: Clases/Constructores (no hay en este proyecto)
- **camelCase**: Variables, funciones, métodos
- **SCREAMING_SNAKE_CASE**: Constantes globales
- **Prefijo `_`**: Funciones privadas del módulo

### 5.3 Event Namespace
Todos los eventos custom usan el prefijo `pixel:`:
- `pixel:move` — Movimiento del jugador
- `pixel:attack`, `pixel:magic`, `pixel:flee` — Acciones de combate
- `pixel:startCombat` — Inicio de combate
- `pixel:useSkill` — Uso de habilidad
- `pixel:openMenu` — Abrir menú principal
- `pixel:newGame` — Nueva partida
- `pixel:localeChanged` — Cambio de idioma
- `pixel:locationChanged` — Cambio de ubicación
- `pixel:saveChanged`, `pixel:stateUpdated` — Persistencia

## 6. Dependencias entre Módulos

### 6.1 Grafo de Dependencias Críticas
```
state.js (raíz)
  ├── combat.js → enemies.js, stats.js, lootTables.js, classes.js
  ├── movement.js → combat.js, biomes.js, travelEvents.js
  ├── inventory.js → items.js, stats.js, i18n.js
  ├── panels.js → journal.js, bestiary.js, minimap.js, crafting.js
  ├── questlog.js → quests.js, npcs.js
  └── main.js → TODOS los módulos (bootstrap)
```

### 6.2 Reglas de Dependencia
1. **Nunca** importar ciclicamente (A → B → A)
2. **Nunca** importar `main.js` desde otros módulos
3. **Siempre** usar `gameState` como única fuente de verdad
4. **Preferir** eventos sobre imports directos para desacoplamiento

## 7. Gestión de Estado

### 7.1 Estructura de gameState
```javascript
{
  player: {
    name, class, className, classEmoji,
    level, experience, nextLevelXp, statPoints,
    hp, maxHp, mp, maxMp,
    strength, agility, intelligence,
    gold
  },
  currentLocationId: string,
  currentEnemy: Enemy | null,
  isInCombat: boolean,
  isGameOver: boolean,
  isProcessingMove: boolean,
  inventory: { [itemId]: quantity },
  equipment: { [slot]: Item | null },
  equipmentStats: { attack, defense, magic, maxHp, maxMp },
  activeBuffs: { [buffId]: turnsRemaining },
  activeDebuffs: { [debuffId]: { turns, damage } },
  playerDebuffs: { [debuffId]: { turns, damage } },
  visitedLocations: { [locationId]: boolean },
  quests: { [questId]: "inactive" | "active" | "completed" },
  achievements: { [achievementId]: boolean },
  stats: {
    kills, bossKills, enemiesDefeated: { [enemyId]: count },
    locationsVisited: number
  }
}
```

### 7.2 Inmutabilidad
- **NO mutar** objetos anidados directamente
- **USAR** `calculateTotalStats()` para derivados
- **CLONAR** con `deepClone()` para saves

## 8. Rendimiento

### 8.1 Optimizaciones Actuales
- Lazy loading de imágenes (`onerror="this.style.display='none'"`)
- Event delegation para listas dinámicas
- CSS containment en modales (`contain: layout style paint`)

### 8.2 Cuellos de Botella Identificados
- Re-render completo de inventario en cada cambio
- Cálculo de stats en cada frame de combate
- Generación de HTML string en memoria para modales grandes

## 9. Seguridad

### 9.1 Vectores de Ataque
- **XSS**: HTML injection via nombres de jugador (mitigado: `textContent` en mayoría)
- **Save Tampering**: localStorage editable por usuario (aceptable para SP)
- **Cheat Engine**: Valores en memoria modificables (aceptable para SP)

## 10. Versionado

Formato de save actual: `version: "3.0"`
Estrategia de migración: Merge con defaults (`Object.assign(initial, saved)`)
