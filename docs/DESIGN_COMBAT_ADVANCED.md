# Pixel Quest Echoes — Documento de Diseño: Sistema de Combate Avanzado

Versión target: post-6.1  
Estado: En implementación incremental via specs SPEC-0601+

---

## 1. Tipos de Daño

El combate utiliza tipos de daño específicos en lugar de un valor genérico de "ataque".

### Físico
| Tipo | Clave | Armas típicas |
|------|-------|---------------|
| Cortante | `slash` | Espadas, hachas, katanas |
| Perforante | `pierce` | Dagas, lanzas, tridentes |
| Contundente | `blunt` | Mazos, martillos, garrotes |

### Elemental
| Tipo | Clave | Fuente típica |
|------|-------|---------------|
| Fuego | `fire` | Flame Staff, Dragon Breath |
| Hielo | `ice` | Ice magic, Frost spells |
| Electricidad | `lightning` | Elemental Wand |
| Veneno | `poison_dmg` | Serpiente, dagas envenenadas |
| Oscuridad | `dark` | Demon Blade, Warlock |
| Luz | `light` | Spirit Staff, Bless Staff |
| Tierra | `earth` | Stone Golem |
| Aire | `air` | Tornado spells |
| Agua | `water` | Water/Ocean Staff, Kraken |

### Especial
| Tipo | Clave | Fuente típica |
|------|-------|---------------|
| Sagrado | `holy` | Divine Sword, Excalibur |
| Maldito | `cursed` | Cultist, objetos malditos |
| Psíquico | `psychic` | Beholder, Medusa |
| Sangrado | `bleed` | Slash en herida abierta |

---

## 2. Sistema de Resistencias

Cada personaje y enemigo tiene un objeto `resistances` con porcentajes por tipo.

```
resistances: {
  fire: 50,      // 50% reducción de daño de fuego
  ice: -20,      // 20% vulnerabilidad al hielo (daño amplificado)
  lightning: 0   // sin modificador
}
```

Fórmula: `daño_final = daño_base * (1 - resistencia / 100)`

Valores negativos = vulnerabilidad. El daño mínimo siempre es 1.

### Ejemplos de enemigos

**Gólem de Piedra**
- Contundente: +80%, Cortante: +50%, Cortante: +30%
- Electricidad: -50%, Tierra: +80%

**Vampiro**
- Perforante: +70%, Cortante: +30%, Oscuridad: +50%
- Fuego: -50%, Luz: -30%, Sagrado: -50%

**Esqueleto**
- Cortante: +20%, Oscuridad: +50%
- Perforante: -30%, Contundente: -50%, Luz: -30%, Sagrado: -40%

**Lava Gólem**
- Fuego: inmune (100%), Tierra: +50%, Físico: +30%
- Hielo: -80%, Agua: -60%

---

## 3. Estados Alterados

### Efectos en el jugador
| Estado | Clave | Efecto | Cura |
|--------|-------|--------|------|
| Veneno | `poison` | Daño físico/turno | Antídoto, Panacea |
| Quemadura | `burn` | Daño fuego/turno | Remedio, Panacea |
| Aturdimiento | `stun` | Pierde turno | Panacea, esperar |
| Congelamiento | `frozen` | Ralentiza | Remedio caliente |
| Sangrado | `bleed` | Daño cortante/turno | Venda, Panacea |
| Debilidad | `weakness` | +25% daño recibido | Panacea, esperar |
| Ceguera | `blind` | -30% precisión | Colirio, Panacea |
| Miedo | `fear` | -20% ATK y DEF | Esperar, habilidades |
| Maldición | `curse` | Reduce stats base | Bendición |

### Efectos en el enemigo (debuffs del jugador)
| Estado | Efecto |
|--------|--------|
| `poison` | Daño veneno/turno |
| `burn` | Daño fuego/turno |
| `frozen` | Velocidad reducida |
| `weakness` | +25% daño recibido |
| `blind` | -30% precisión |

---

## 4. Sistema de Armaduras

Las armaduras pueden otorgar resistencias específicas además de defensa física.

```javascript
dragon_scale_armor: {
  defense: 45,
  resistances: {
    fire: 20,
    ice: -10
  }
}
```

El jugador acumula resistencias de todas las piezas equipadas.

---

## 5. Especialización

El jugador no puede dominar todo. Al subir de nivel puede especializarse.

### Guerrero
- Maestro de Espadas: +15% daño cortante, skills exclusivas
- Maestro de Mazos: +20% daño contundente, rompe defensa
- Maestro de Escudos: +25% reducción de daño físico

### Mago
- Escuela de Fuego: -15% costo MP fuego, +20% daño fuego
- Escuela de Hielo: controles más duraderos, +15% daño hielo
- Escuela de Rayo: críticos más frecuentes, +20% daño rayo

### Pícaro
- Asesino: +25% daño perforante, veneno en ataques
- Duelista: esquiva mejorada, contraataque
- Explorador: eventos de viaje mejorados, +10% oro

---

## 6. Sistema de Maestría de Armas

Cada tipo de arma tiene experiencia independiente.

| Nivel | XP requerido | Título | Bonus |
|-------|-------------|--------|-------|
| 1 | 0 | Novato | — |
| 25 | 500 | Adepto | +5% daño |
| 50 | 2000 | Experto | +10% daño, habilidad nueva |
| 75 | 5000 | Maestro | +15% daño, 2 habilidades nuevas |
| 100 | 10000 | Legendario | +20% daño, título único |

---

## 7. Sistema de Aprendizaje

Las habilidades avanzadas se obtienen fuera del nivel.

### Fuentes
- Libros y pergaminos (loot, tiendas)
- Entrenadores NPC en ubicaciones específicas
- Completar misiones específicas
- Descubrimiento (exploración + condición especial)

### Ejemplo
> **Libro: Técnicas Avanzadas de Espada**  
> Requisitos: Espadas nivel 10, Fuerza 20  
> Desbloquea: Golpe Circular, Estocada Precisa

---

## 8. Inteligencia de Enemigos

Los enemigos tienen patrones de comportamiento (`behavior`).

| Patrón | Descripción |
|--------|-------------|
| `standard` | Ataque básico cada turno |
| `aggressive` | Prioriza daño, ignora defensa |
| `defensive` | Cambia a modo defensa con HP bajo |
| `mage` | Prefiere ataques mágicos |
| `regenerate` | Se cura un % del HP máximo cada turno |
| `status` | Prioriza aplicar estados alterados |
| `berserker` | Más fuerte con menos HP |
| `boss` | Comportamiento complejo multi-fase |

---

## 9. Sistema de Alcance

| Arma | Alcance | Nota |
|------|---------|------|
| Daga | 1 | Solo cuerpo a cuerpo |
| Espada/Hacha | 2 | Cuerpo a cuerpo estándar |
| Lanza/Tridente | 3 | Ventaja de iniciativa |
| Arco | 5 | A distancia |
| Ballesta | 6 | Máximo alcance físico |
| Magia | Variable | Según hechizo |

Enemigos con mayor alcance atacan primero en el inicio del combate.

---

## 10. Filosofía de Diseño

La victoria no depende únicamente del nivel, sino de:

1. La construcción del personaje y especialización elegida
2. El conocimiento de resistencias y debilidades del enemigo
3. El equipamiento y tipo de daño del arma
4. El uso estratégico de estados alterados
5. La gestión de recursos (HP, MP, consumibles)

Esto permite cientos de configuraciones distintas y alta rejugabilidad.

---

## Roadmap de Implementación

| Spec | Sistema | Estado |
|------|---------|--------|
| SPEC-0601 | Motor de tipos de daño + resistencias | ✅ Implementado |
| SPEC-0602 | Estados alterados expandidos (bleed, weakness, blind) | ✅ Implementado |
| SPEC-0603 | Resistencias en armaduras | ✅ Implementado |
| SPEC-0604 | Inteligencia de enemigos (behavior patterns) | ✅ Implementado |
| SPEC-0605 | Maestría de armas | ✅ Implementado |
| SPEC-0606 | Especializaciones de clase | ✅ Implementado |
| SPEC-0607 | Sistema de aprendizaje (libros/maestros) | ✅ Implementado |
| SPEC-0608 | Sistema de alcance | ✅ Implementado |
