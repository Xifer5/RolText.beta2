# SPEC-002: Sistema de Combate por Turnos

## 1. Resumen Ejecutivo

Sistema de combate por turnos basado en estadísticas derivadas, con soporte para:
- 3 clases con 6 habilidades cada una (18 skills total)
- Buffs/debuffs con duración por turnos
- Evasión y críticos basados en agilidad
- Daño elemental (fuego, veneno, hielo)
- Fuga con probabilidad modificada por AGI

## 2. Flujo de Combate

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   INICIO    │────→│  JUGADOR    │────→│   ENEMIGO   │
│  startCombat│     │   TURNO     │     │   TURNO     │
└─────────────┘     └─────────────┘     └─────────────┘
       ↑                                    │
       └────────────────────────────────────┘
                    (loop hasta victoria/derrota/fuga)
```

### 2.1 Estados del Combate
```javascript
const COMBAT_STATES = {
  IDLE: 'idle',           // Fuera de combate
  PLAYER_TURN: 'player',  // Esperando input del jugador
  ENEMY_TURN: 'enemy',    // Ejecutando IA del enemigo
  RESOLVING: 'resolving', // Animación/efecto en progreso
  ENDED: 'ended'          // Combate terminado
};
```

## 3. Fórmulas de Daño

### 3.1 Daño Físico del Jugador
```
damage = max(1, floor((attack * atkMult * variance * critMult) - enemyDefense))

Donde:
- attack = derived.attack (base + equipo + STR)
- atkMult = 1.3 si warcry activo, 1.0 base
- variance = random(0.9, 1.1)  // ±10%
- critMult = 1.75 si crítico, 1.0 base
- critChance = 0.10 + (AGI * 0.005) + (rogue ? 0.10 : 0)
```

### 3.2 Daño Mágico del Jugador
```
damage = max(1, floor(magicAttack * mult * variance))

Donde:
- magicAttack = derived.magic * 1.5 (calculateMagicAttack)
- mult = 2.0 si mage nivel 20+, 1.0 base
- cost = 7 MP si mage nivel 10+, 10 MP base
```

### 3.3 Daño del Enemigo
```
damage = max(1, floor((enemyAttack * frozenMult * variance * defenseMult * shieldMult) - playerDefense))

Donde:
- frozenMult = 0.75 si enemigo congelado, 1.0 base
- defenseMult = 0.5 si defend_stance activo, 1.0 base
- shieldMult = 0.6 si arcane_shield activo, 1.0 base
- variance = random(0.85, 1.15)  // ±15%
```

### 3.4 Evasión
```
evasionChance = (AGI * 0.01) + (rogue ? 0.10 : 0) + (rogue nivel 5+ ? 0.25 : 0)
// Cap implícito: ~50% máximo para rogue nivel 20
```

## 4. Sistema de Buffs/Debuffs

### 4.1 Buffs del Jugador (activeBuffs)
| Buff | Efecto | Duración | Origen |
|------|--------|----------|--------|
| `warcry` | ATK +30% | 3-4 turnos | Skill Warrior |
| `defend_stance` | Daño recibido ×0.5 | 1 turno | Skill Warrior |
| `arcane_shield` | Absorbe 40% daño | 1 golpe | Skill Mage |

### 4.2 Debuffs del Enemigo (activeDebuffs)
| Debuff | Efecto | Duración | Origen |
|--------|--------|----------|--------|
| `poison` | Daño/turno | 2-4 turnos | Skill Rogue, enemigos |
| `burn` | Daño/turno | 2-3 turnos | Skill Mage, enemigos de fuego |
| `frozen` | ATK enemigo ×0.75 | 2 turnos | Skill Mage |

### 4.3 Debuffs del Jugador (playerDebuffs)
| Debuff | Efecto | Duración | Aplicado por |
|--------|--------|----------|--------------|
| `poison` | 3-15 daño/turno | 2-3 turnos | Slime, Funged Beast, etc. |
| `burn` | 5-15 daño/turno | 2-3 turnos | Goblin Shaman, Warlock, etc. |
| `stun` | Pierde 1 turno | 1 turno | Vampire, Medusa |

### 4.4 Tick de Efectos
```javascript
function tickBuffs() {
  // Decrementar contadores
  // Eliminar si turns <= 0
  // Aplicar daño DOT antes del turno del enemigo
}
```

## 5. Habilidades por Clase

### 5.1 Warrior (⚔️)
| ID | Nombre | MP | Nivel | Efecto |
|----|--------|-----|-------|--------|
| `bash` | Golpe Brutal | 8 | 1 | Daño ×1.4, ignora 30% DEF |
| `defend` | Postura Defensiva | 5 | 3 | Cura 15% HP, mitiga 50% daño |
| `warcry` | Grito de Guerra | 12 | 6 | ATK +30% por 3 turnos |
| `whirlwind` | Torbellino | 20 | 10 | 2-3 ataques aleatorios |
| `berserker_rage` | Frenesí Bersérker | 15 | 15 | Pierde 15% HP, daño ×3 |
| `avatar_of_war` | Avatar de la Guerra | 30 | 20 | Cura 30% HP + warcry 4 turnos |

### 5.2 Mage (🔮)
| ID | Nombre | MP | Nivel | Efecto |
|----|--------|-----|-------|--------|
| `fireball` | Bola de Fuego | 12 | 1 | Daño + quemadura 2 turnos |
| `icebolt` | Rayo de Hielo | 10 | 3 | Daño + congelación (ATK -25%) |
| `arcane_shield` | Escudo Arcano | 15 | 6 | Absorbe 40% próximo daño |
| `meteor` | Meteoro | 35 | 10 | Daño ×3, ignora DEF |
| `arcane_storm` | Tormenta Arcana | 28 | 15 | 3 rayos, ignora DEF |
| `singularity` | Singularidad | 50 | 20 | Daño ×4.5 + drena 25% HP enemigo |

### 5.3 Rogue (🗡️)
| ID | Nombre | MP | Nivel | Efecto |
|----|--------|-----|-------|--------|
| `backstab` | Golpe Furtivo | 8 | 1 | Crítico garantizado ×2.5 |
| `poison` | Veneno | 6 | 3 | Veneno 4 turnos |
| `smoke_bomb` | Bomba de Humo | 10 | 6 | 70% escape inmediato |
| `double_strike` | Golpe Doble | 15 | 10 | 2 ataques con chance de crítico |
| `shadow_strike` | Golpe de Sombra | 18 | 15 | Crítico ×4, ignora DEF |
| `death_dance` | Danza de la Muerte | 28 | 20 | 5 ataques con 40% crítico |

## 6. Escala de Enemigos

### 6.1 Fórmula de Escalado
```javascript
// Enemigo normal
lvlMult = 1 + (playerLevel - 1) * 0.05
scaledHp  = base.maxHp * lvlMult
scaledAtk = base.attack * lvlMult

// Boss
bossMult = 1.6 + (playerLevel - 1) * 0.08
bossAtkMult = 1.4 + (playerLevel - 1) * 0.04
```

### 6.2 Tabla de Enemigos Base
Ver `enemies.js` para datos completos. Estructura:
```javascript
{
  id: string,
  type: string,           // Nombre visible
  levelRequirement: number,
  hp: number,             // Vida base
  maxHp: number,          // Vida máxima (redundante con hp)
  attack: number,         // ATK físico
  defense: number,
  magicAttack: number,    // ATK mágico (opcional)
  experience: number,
  gold: number,
  drops: string[],        // IDs de items
  img: string,            // Ruta de imagen
  isBoss: boolean         // Si es jefe de área
}
```

## 7. IA del Enemigo

### 7.1 Comportamiento
```javascript
function enemyTurn() {
  // 1. Aplicar DOTs al enemigo (veneno/quemadura)
  // 2. Reducir duración de debuffs
  // 3. Decidir ataque: 30% mágico si tiene magicAttack
  // 4. Aplicar daño al jugador
  // 5. Chance de aplicar status effect (definido en ENEMY_STATUS_EFFECTS)
}
```

### 7.2 Tabla de Status Effects de Enemigos
Ver `ENEMY_STATUS_EFFECTS` en `combat.js`:
- `slime`: 30% poison, 3 daño, 2 turnos
- `vampire`: 25% stun, 1 turno
- `dragon_king`: 45% burn, 15 daño, 3 turnos

## 8. Interfaz de Combate

### 8.1 Estados Visuales
- **Fuera de combate**: Panel de navegación visible, combate oculto
- **En combate**: Panel de combate visible, navegación oculta
- **Sincronización**: Desktop (`combat-menu`/`navigation-menu`) y Mobile (`mob-combat`/`mob-nav`)

### 8.2 Atajos de Teclado
| Tecla | Acción | Condición |
|-------|--------|-----------|
| `1` | Atacar | En combate |
| `2` | Magia | En combate |
| `3` | Ítems | En combate (abre inventario) |
| `4` | Huir | En combate |

### 8.3 Accesibilidad
- `aria-live="assertive"` en panel de enemigo
- `aria-keyshortcuts` en botones de combate
- Indicadores visuales de debuffs en barra del enemigo

## 9. Balance y Curva de Dificultad

### 9.1 Progresión Esperada
| Nivel | Zona Sugerida | Enemigos | Boss |
|-------|--------------|----------|------|
| 1-3 | Forest, Garden | Slime, Goblin, Wolf | — |
| 4-6 | Cave, Swamp | Cave Bat, Zombie, Orc | — |
| 7-9 | Mountain, Beach | Wyvern, Pirate, Giant | Forest Titan |
| 10-12 | Ruins, Dungeon | Stone Golem, Warlock | Cave Devourer |
| 13-15 | Volcano, Jungle | Inferno Elemental, Diablo | Inferno Dragon |
| 16-20 | Tundra, Inferno | Frost Wyrm, Dragon King | Dragon King |

### 9.2 Problemas de Balance Actuales
1. **Excalibur**: Requiere 10 de cada material (imposible sin grind excesivo)
2. **Dragon King**: 3000 HP vs ~200 HP jugador nivel 15 (desequilibrado)
3. **Mage nivel 20**: Daño ×2 hace que el juego sea trivial
4. **Rogue evasión**: 50% evasión a nivel 20 rompe el combate

## 10. Mejoras Propuestas

### 10.1 Mecánicas
- [ ] **Sistema de combos**: Bonus por alternar tipos de ataque
- [ ] **Contrataques**: Chance de contraatacar al bloquear
- [ ] **Morale**: El enemigo puede huir si HP < 20%
- [ ] **Cover system**: Posicionamiento táctico (front/back row)

### 10.2 UX
- [ ] **Timeline visual**: Mostrar orden de turnos
- [ ] **Damage numbers**: Animación de daño flotante (descomentar)
- [ ] **Screen shake**: Feedback de impacto (descomentar)
- [ ] **Battle log**: Historial de acciones del combate actual

### 10.3 Técnicas
- [ ] **State machine formal**: Reemplar flags booleanos con máquina de estados
- [ ] **Action queue**: Cola de acciones para evitar race conditions
- [ ] **Combat snapshot**: Guardar estado del combate para reconexión
