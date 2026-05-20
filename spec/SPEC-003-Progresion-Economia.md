# SPEC-003: Sistema de Progresión y Economía

## 1. Progresión del Jugador

### 1.1 Curva de Experiencia
```javascript
nextLevelXp = floor(previousXp * 1.5)
// Nivel 1: 100 XP
// Nivel 2: 150 XP
// Nivel 3: 225 XP
// Nivel 5: 506 XP
// Nivel 10: 3,844 XP
// Nivel 20: 221,684 XP
```

### 1.2 Ganancia de Atributos por Nivel
| Clase | HP/level | MP/level | Stat Points |
|-------|----------|----------|-------------|
| Warrior | +15 | +3 | +5 |
| Mage | +6 | +12 | +5 |
| Rogue | +10 | +5 | +5 |

### 1.3 Bonificaciones de Clase por Nivel
Ver `CLASS_DEFINITIONS` en `classes.js`. Desbloqueos cada 5 niveles:
- **Nivel 5**: Bonificación pasiva permanente
- **Nivel 10**: Mecánica nueva (coste reducido, ignore DEF)
- **Nivel 15**: Proc chance (doble golpe, evasión aumentada)
- **Nivel 20**: Multiplicador de daño ×2 o evasión 50%

## 2. Sistema de Atributos

### 2.1 Derivación de Stats
```javascript
attack      = strength + equipment.attack + buffs
 defense     = floor(agility / 2) + equipment.defense + buffs
magic       = intelligence + equipment.magic + buffs
maxHp       = 80 + (strength * 2) + equipment.hpBonus + classBonusHp
maxMp       = 20 + (intelligence * 4) + classBonusMp
```

### 2.2 Eficiencia de Atributos
| Stat | Efecto por punto | Clase óptima |
|------|-----------------|--------------|
| STR | +1 ATK, +2 HP | Warrior |
| AGI | +0.5 DEF, +0.5% evasión, +0.5% crit | Rogue |
| INT | +1 MAG, +4 MP, +0.5% magic pen | Mage |

### 2.3 Soft Caps y Diminishing Returns
- **Evasión**: Cap suave al 50% (rogue nivel 20 alcanza ~55%)
- **Crítico**: Cap suave al 40% (base 10% + AGI*0.5% + rogue 10%)
- **Magic Pen**: No implementado actualmente

## 3. Economía

### 3.1 Fuentes de Oro
| Fuente | Cantidad | Frecuencia |
|--------|----------|------------|
| Enemigos normales | 5-35g | Por combate |
| Jefes | 100-800g | Por derrota |
| Venta de items | 50% precio | Bajo demanda |
| Misiones | 30-200g | Por entrega |
| Logros | — | One-time |

### 3.2 Sumideros de Oro
| Uso | Precio típico |
|-----|--------------|
| Poción HP | 10g |
| Poción MP | 12g |
| Arma básica | 30-65g |
| Armadura | 40-300g |
| Recetas craft | Materiales |

### 3.3 Inflación Control
- **Problema**: Jugador nivel 10+ acumula miles de oro sin gasto
- **Solución propuesta**: 
  - Reparación de equipo (durabilidad)
  - Servicios de entrenamiento (pagar por XP)
  - Apuestas/Gambling en taverna
  - Banco con interés negativo (storage fee)

## 4. Sistema de Crafting

### 4.1 Categorías
| Tab | Tipo | Recetas | Focus |
|-----|------|---------|-------|
| Forja | Armas, Armaduras, Accesorios | 25+ | STR/DEF |
| Alquimia | Pociones, Elixires, Antídotos | 8+ | Restauración |
| Arcano | Anillos, Emblemas, Encantamientos | 12+ | MAG/INT |

### 4.2 Fórmula de Éxito
```javascript
// Actual: 100% éxito si tienes materiales
// Propuesto:
successChance = baseChance + (playerLevel - recipeLevel) * 0.05
qualityBonus = random(1, 3) si successChance > 1.2
```

### 4.3 Materiales por Bioma
Ver `lootTables.js` para distribución completa. Key materials:
- **Forest**: herb, wolf_pelt, fungus_core
- **Cave**: iron_ore, bat_wing, crystal_shard
- **Mountain**: ice_crystal, wyvern_scale, giant_bone
- **Ruins**: enchanted_dust, runestone, ancient_core
- **Volcano**: magma_fragment, dragon_scale, heart_of_inferno

## 5. Tiendas

### 5.1 Tipos de Tienda
| ID | Ubicación | Especialización | Nivel |
|----|-----------|----------------|-------|
| `shop` | Town | General | 1+ |
| `castle_shop` | Castle | Equipo avanzado | 5+ |
| `port` | Port | Marítimo/exploración | 7+ |

### 5.2 Stock Dinámico
```javascript
// Actual: Inventario fijo
// Propuesto:
shopStock = baseInventory + (playerLevel * 2) items random
restockTimer = 10 minutos real o 1 descanso
```

## 6. Recompensas de Misiones

### 6.1 Tabla de Recompensas
| Misión | XP | Oro | Item especial |
|--------|-----|-----|--------------|
| explore_forest | 50 | 30 | world_map |
| collect_crystal | 120 | 80 | arcane_key |
| kill_pirates | 100 | 120 | navigation_chart |
| collect_fairy_dust | 80 | 50 | garden_key |
| collect_ice_crystal | 150 | 100 | mountain_pass |
| defeat_dark_lord | 300 | 200 | dragon_key |

### 6.2 Progresión de Misiones (Questline)
```
Elara (Town) → Valdris (Tower) → Brennan (Port) → Eryndel (Garden) → Theron (Mountain) → Pyrax (Volcano)
     ↓              ↓                ↓                  ↓                  ↓                ↓
 world_map      arcane_key      navigation_chart    garden_key        mountain_pass      dragon_key
     ↓              ↓                ↓                  ↓                  ↓                ↓
 Forest 3      Ruins 4          Catacombs 1        Treasure Keep 1   Tundra 1          Inferno 1
```

## 7. Sistema de Logros

### 7.1 Categorías
| Categoría | Cantidad | Ejemplos |
|-----------|----------|----------|
| Combate | 5 | first_kill, hunter_50, veteran_200, first_boss, boss_slayer |
| Exploración | 4 | explorer_10, explorer_30, cartographer |
| Progresión | 3 | level_5, level_15, level_25 |
| Economía | 1 | rich (500g) |
| Misiones | 2 | first_quest, all_quests |
| Bestiario | 2 | bestiary_5, bestiary_all |

### 7.2 Rareza de Logros
| Rarity | Color | Cantidad |
|--------|-------|----------|
| Common | Gris | 5 |
| Uncommon | Verde | 5 |
| Rare | Azul | 3 |
| Epic | Púrpura | 2 |
| Legendary | Dorado | 1 |

## 8. Problemas de Balance

### 8.1 Identificados
1. **Excalibur**: Requiere 10 de cada material (grind excesivo)
2. **Economía estancada**: Sin gastos recurrentes, oro pierde valor
3. **Progresión lineal**: Sin ramificaciones de build
4. **Respec ausente**: No se pueden redistribuir puntos

### 8.2 Soluciones Propuestas
- [ ] **Transmutación**: Convertir materiales comunes en raros (ratio 5:1)
- [ ] **Enchanting**: Mejorar equipo existente con materiales
- [ ] **Durabilidad**: Equipo se desgasta, requiere reparación
- [ ] **Respec**: Poción de olvido (costosa) para redistribuir stats
- [ ] **Prestige**: Reset a nivel 1 con bonus permanente al completar juego

## 9. Persistencia

### 9.1 Formato de Guardado
```javascript
{
  version: "3.0",
  timestamp: ISOString,
  gameState: { /* estado completo */ }
}
```

### 9.2 Estrategia de Merge
```javascript
// Al cargar:
loaded = JSON.parse(localStorage.getItem(SAVE_KEY));
merged = { ...deepClone(initialGameState), ...deepClone(loaded.gameState) };
// Garantiza que campos nuevos tengan valores por defecto
```

### 9.3 Auto-save Triggers
- Subir de nivel
- Derrotar jefe
- Completar misión
- Manual (botón Save)
