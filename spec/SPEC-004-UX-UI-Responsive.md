# SPEC-004: UX/UI y Responsive Design (Material Design 3)

## 1. Sistema de Diseño

### 1.1 Tokens MD3 Implementados
```css
/* Estructura de tokens (inferida de index.html y clases CSS) */
:root {
  /* Colores primarios */
  --md-primary: #d0bcff;
  --md-on-primary: #381e72;
  --md-primary-container: #4f378b;
  --md-on-primary-container: #eaddff;

  /* Superficies */
  --md-surface: #1c1b1f;
  --md-surface-variant: #49454f;
  --md-on-surface: #e6e1e5;
  --md-on-surface-variant: #cac4d0;

  /* Estados */
  --md-outline: #938f99;
  --md-outline-variant: #49454f;

  /* Semánticos de juego */
  --c-heal: #4ade80;
  --c-damage: #ef4444;
  --c-magic: #818cf8;
  --c-gold: #fbbf24;
  --c-xp: #fbbf24;
  --c-poison: #4ade80;
  --c-burn: #fb923c;
}
```

### 1.2 Tipografía
| Uso | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Títulos | Cinzel Decorative | 1.5-2rem | 700 |
| Subtítulos | Cinzel | 1.1-1.3rem | 600 |
| Body | EB Garamond | 0.9-1rem | 400/500 |
| UI/Stats | Press Start 2P | 0.75-0.85rem | 400 |
| Pixel art | Press Start 2P | Variable | 400 |

## 2. Layout Principal

### 2.1 Grid System (Desktop > 960px)
```
┌─────────────────────────────────────────────────────────────┐
│                      TOPBAR (header)                         │
│  [Brand] [Nav Tabs]                    [Lang] [Theme] [Menu]│
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│  LEFT    │         CENTER               │     RIGHT         │
│  SIDEBAR │         SCREEN               │     SIDEBAR       │
│          │                              │                   │
│  Portrait│  Location Hero               │  Quick Actions    │
│  Vitals  │  Enemy Panel                 │  Combat/Nav       │
│  Stats   │  Buff Bar                    │  Local Minimap    │
│          │  Story Log (scroll inverted) │                   │
│          │                              │                   │
├──────────┴──────────────────────────────┴───────────────────┤
│              MOBILE BOTTOM NAV (≤960px)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Breakpoints
| Breakpoint | Layout | Sidebar |
|------------|--------|---------|
| > 1200px | 3-column | Left + Right visibles |
| 960-1200px | 3-column compact | Left + Right visibles |
| 768-960px | 2-column | Right colapsado → Bottom nav |
| < 768px | 1-column | Left colapsado → Mobile header |
| < 480px | 1-column minimal | Todo en modales/sheets |

## 3. Componentes UI

### 3.1 Modales (Modal System)
| Modal | ID | Contenido | Max Width |
|-------|-----|-----------|-----------|
| Panel genérico | `panelModal` | Atributos/Equip/Spellbook/Journal/Bestiary/Map/Craft | 640px |
| Inventario | `inventoryModal` | Grid de items + detalle | 720px |
| Stats | `statsModal` | Distribución de puntos | 440px |
| Tienda | `shopModal` | Compra/Venta | 600px |
| Menú principal | `mainMenuModal` | Save/Load/Audio | 480px |
| NPC | `npcModal` | Diálogo + Quest | 520px |
| Quest Log | `questLogModal` | Tabs de misiones | 560px |
| Game Over | `gameOverModal` | Restart | 380px |
| Ending | `endingModal` | Stats finales | 440px |
| Travel Event | `travelEventModal` | Eventos aleatorios | 480px |

### 3.2 Mobile Sheets
```
┌─────────────────────────┐
│    ━━━ (drag handle)    │
│  [Close]  Título        │
│  ┌─────────────────┐    │
│  │ Grid de botones │    │
│  │ (movimientos/   │    │
│  │  paneles)        │    │
│  └─────────────────┘    │
└─────────────────────────┘
```
- **Trigger**: Swipe up desde bottom nav
- **Backdrop**: Cierre al tocar fuera
- **Panels**: Movimientos, Acciones, Paneles (tabs internos)

### 3.3 Barras de Vitalidad
```html
<!-- Desktop -->
<div class="vital-row">
  <span class="vital-label">HP</span>
  <div class="vital-bar-wrap">
    <div class="vital-bar hp-bar" id="hp-bar"></div>
  </div>
  <span class="vital-num" id="hp-text">0/0</span>
</div>

<!-- Mobile (compacto) -->
<div class="compact-vital">
  <div class="compact-vital-bar hp-bar" id="mobile-hp-bar"></div>
  <span class="compact-vital-text" id="mobile-hp-text">0/0</span>
</div>
```

## 4. Sistema de Navegación

### 4.1 Desktop
- **Topbar tabs**: Attributes, Equipment, Spellbook, Journal, Bestiary, Map, Achievements, Crafting
- **Right sidebar**: Quick Actions + Combat/Nav toggle + Minimap
- **Keyboard**: WASD movimiento, 1234 combate, ESC cerrar modal, M menú

### 4.2 Mobile
- **Bottom nav**: 
  - Modo combate: Atacar, Magia, Ítem, Huir
  - Modo navegación: Direcciones + Menús
- **Swipe gestures**: 
  - Swipe up: Abrir mobile sheet
  - Swipe left/right: Cambiar tab en modales
- **Tap hold**: Tooltips en items

### 4.3 Accesibilidad
```html
<!-- Atributos ARIA implementados -->
<header id="topbar" role="banner">
<main id="game" role="application">
<aside id="left-panel"> <!-- Vitals -->
<section id="screen" role="main">
  <div id="story" role="log" aria-live="polite">
  <div id="enemy-panel" role="region" aria-live="assertive">
  <div id="buff-bar" aria-live="polite">
<aside id="right-panel"> <!-- Actions -->
<nav id="mobile-bottom-nav" aria-label="Controles de juego">
```

## 5. Feedback Visual

### 5.1 Estados de Carga
| Estado | Indicador | Ubicación |
|--------|-----------|-----------|
| `isProcessingMove` | Spinner sutil | Centro de pantalla |
| Guardando | Toast "💾 Partida guardada" | Bottom-right |
| Cargando | Fade in de modal | Centro |

### 5.2 Notificaciones (Toast System)
```javascript
// Tipos de toast
showToast(msg)           // Info general
showAchievementToast(ach) // Logro desbloqueado (con icono y rareza)
showFloatingText(text, x, y, color, size, anim) // Daño/curación flotante
```

### 5.3 Efectos Comentados (Pendientes de Activar)
```javascript
// En combat.js, múltiples efectos están comentados:
// - showFloatingText(): Números flotantes de daño
// - shakeScreen(): Vibración de pantalla al impacto
// - Animaciones de crítico (scale + color)
```

## 6. Internacionalización (i18n)

### 6.1 Arquitectura
```javascript
// Diccionarios por locale
const dictionaries = {
  en: { /* ~200 strings */ },
  es: { /* ~200 strings */ }
};

// Funciones
setLocale(locale)      // Cambia idioma y persiste en localStorage
t(key)                 // Traducción simple
formatText(key, vars)  // Traducción con interpolación {{var}}
localizeText(source)   // Soporte para objetos {en, es}
translatePage(root)    // Traduce DOM por data-i18n
```

### 6.2 Strings Hardcodeados (Deuda Técnica)
- `journal.js`: Textos en español sin traducción
- `bestiary.js`: "Criaturas descubiertas", lore en español
- `crafting.js`: "Materiales necesarios", "Fabricar"
- `ENEMY_LORE` en `bestiary.js`: Todo en español

## 7. Temas

### 7.1 Implementación Actual
```javascript
// Toggle dark/light
const stored = localStorage.getItem('pqe-theme') || 'dark';
document.documentElement.dataset.theme = stored;
// CSS responde a [data-theme="light"]
```

### 7.2 Tokens por Tema
| Token | Dark | Light |
|-------|------|-------|
| --md-surface | #1c1b1f | #fffbfe |
| --md-on-surface | #e6e1e5 | #1c1b1f |
| --md-primary | #d0bcff | #6750a4 |

## 8. Problemas UX/UI Identificados

### 8.1 Críticos
1. **Scroll invertido**: Confuso para usuarios nuevos (nuevos mensajes arriba)
2. **Modales apilados**: Sin z-index management, pueden superponerse mal
3. **Falta de tutorial**: No hay onboarding para nuevos jugadores
4. **Tooltips ausentes**: Enemigos, buffs, y stats sin explicación hover

### 8.2 Mayores
1. **Inventario**: Sin categorización ni búsqueda (300+ items)
2. **Crafting**: Sin preview de resultado ni comparativa con equipo actual
3. **Mapa**: Sin pathfinding ni indicación de zonas peligrosas
4. **Diálogo NPC**: Sin historial de conversación

### 8.3 Menores
1. **Animaciones**: CSS transitions mínimas, sin micro-interacciones
2. **Sonido**: Sin indicador visual de volumen actual
3. **Font loading**: FOUT potencial con Google Fonts
4. **Focus states**: Inconsistentes en botones MD3

## 9. Mejoras Propuestas

### 9.1 UX Inmediatas
- [ ] **Tutorial interactivo**: Primeros 5 minutos guiados
- [ ] **Tooltips everywhere**: Hover/long-press en todos los elementos interactivos
- [ ] **Quick actions**: Atajos de teclado visibles (badges en botones)
- [ ] **Undo**: Deshacer última acción de combate (1 vez/encuentro)

### 9.2 UI de Alto Impacto
- [ ] **Character sheet redesign**: Vista unificada de stats + equipo + skills
- [ ] **Combat log**: Panel dedicado con timeline de turnos
- [ ] **Inventory grid**: Vista de iconos + filtros por tipo/rareza
- [ ] **World map interactivo**: Zoom, pan, marcadores de objetivo

### 9.3 Responsive Avanzado
- [ ] **PWA**: Service worker para offline play
- [ ] **Touch gestures**: Pinch para zoom en mapa, swipe para navegación
- [ ] **Vibration API**: Haptic feedback en combate (móvil)
- [ ] **Orientation**: Layout alternativo en landscape móvil
