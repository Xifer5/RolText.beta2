# Perfil de Arquitecto de Software y Desarrollador Frontend Senior
## Especialidad: UI/UX, Material Design 3 (M3), Responsive Web Applications & Specs

Este documento define la base de conocimientos, metodologías y habilidades técnicas aplicadas para la arquitectura, desarrollo frontend y diseño de la interfaz del juego **Pixel Quest Echoes (RolText)**.

---

## 🛠️ Habilidades de Arquitectura de Software

### 1. Diseño de Sistemas Modulares y Escalables
*   **Separación de Conceptos (Separation of Concerns):** Desacoplamiento estricto entre la lógica de negocio (estado del juego, combate, inventario, diálogos) y la capa de presentación (DOM, renderizado, animaciones).
*   **Patrones de Diseño Frontend:** Implementación de patrones como *State Management* reactivo o basado en observadores, *Event Bus* para la comunicación entre componentes de juego, y *Factory/Strategy* para modularizar sistemas como enemigos, items o eventos del mapa.
*   **Código Limpio e Intangible:** Mantener interfaces claras, encapsulación de variables y funciones para evitar colisiones en el ámbito global (uso de módulos ES6 o clausuras).

### 2. Especificación Técnica y Documentación (Specs)
*   **Traducción de Requisitos:** Capacidad para convertir mecánicas narrativas o de rol de alto nivel en especificaciones técnicas de código estructuradas y robustas.
*   **Planificación del Ciclo de Vida:** Definición y modelado claro del ciclo de vida del juego (carga, guardado, actualización de pantalla, bucle de combate, transiciones de escena).

---

## 🎨 Habilidades de UI/UX y Diseño Web

### 1. Principios de Usabilidad e Interacción (Heurísticas de Nielsen)
*   **Visibilidad del Estado del Sistema:** El jugador siempre sabrá qué está ocurriendo (combate en curso, daño recibido, cambios de estado, guardado de partida) mediante micro-animaciones, colores semánticos y logs de eventos claros.
*   **Consistencia y Estándares:** Adherencia estricta a convenciones visuales e interfaces conocidas de RPGs y sistemas operativos modernos.
*   **Prevención y Gestión de Errores:** Evitar clics accidentales mediante desactivación dinámica de acciones inválidas y confirmación de decisiones críticas.
*   **Relación entre el Sistema y el Mundo Real:** Uso de metáforas visuales claras (iconografía M3, barras de salud/maná analógicas, bolsas de inventario legibles).

### 2. Estética Visual Premium y Jerarquía
*   **Sistemas de Espaciado:** Uso sistemático de una rejilla basada en `8px` (o `4px` para elementos supercompactos) para lograr un balance visual perfecto en márgenes y paddings.
*   **Tipografía de Alta Gama:** Uso de fuentes optimizadas para lectura prolongada de texto narrativo (Serif para descripciones de historia/diálogos) combinadas con fuentes de interfaz sans-serif y display con excelente contraste para datos del jugador y títulos.
*   **Micro-interacciones y Animaciones:** Transiciones suaves para los cambios de estado de botones (hover, focus, pressed), efectos sutiles al recibir daño o sanar, y transiciones fluidas de paneles.

---

## 📐 Google Material Design 3 (M3)

### 1. Sistema de Colores Semánticos e HSL
Dominio total de la paleta tonal de M3, adaptada al tono de fantasía y aventura del RPG:
*   `--md-primary`: Color de marca / acciones principales.
*   `--md-on-primary`: Texto o iconos sobre el color primario.
*   `--md-secondary` / `--md-tertiary`: Tonos de acento para estados específicos, misiones y tipos de items.
*   `--md-surface` / `--md-surface-variant`: Fondos de tarjetas, paneles y contenedores para crear capas de profundidad.
*   `--md-on-surface` / `--md-on-surface-variant`: Texto de alta y media legibilidad en superficies.
*   `--md-outline` / `--md-outline-variant`: Fronteras sutiles para delimitar componentes sin sobrecargar visualmente el layout.
*   `--md-error`: Indicador visual de peligro, daño crítico o salud baja.

### 2. Capas de Profundidad (Elevation) y Formas (Shapes)
*   **Elevación M3:** Reemplazo de sombras duras por elevación basada en tonos de color (`surface-container-low`, `surface-container`, `surface-container-high`) y sombreado CSS suave.
*   **Radios de Borde (Shapes):**
    *   `Extra Small (4px)` / `Small (8px)`: Botones compactos, badges, elementos de lista.
    *   `Medium (12px)` / `Large (16px)`: Tarjetas de personajes, paneles secundarios, diálogos de combate.
    *   `Extra Large (28px)`: Diálogos modales principales, barras de navegación.

### 3. Capas de Estado (State Layers)
*   Uso de superposiciones opacas (`hover: 8%`, `focus: 12%`, `pressed: 12%`) aplicadas mediante pseudo-elementos o variables CSS para dar respuesta visual táctil e inmediata ante cualquier interacción del usuario.

---

## 📱 Responsive & Mobile-First Design

### 1. Layouts Flexibles e Híbridos
*   **CSS Grid & Flexbox:** Arquitectura de pantallas adaptable. Un panel lateral persistente (Dashboard) en resoluciones de escritorio que se transforma fluidamente en un menú inferior deslizable (*Bottom Navigation* o *Navigation Bar*) o un cajón lateral (*Navigation Drawer*) en dispositivos móviles.
*   **Manejo de Vistas Compactas:** Ocultar información secundaria en pantallas pequeñas mediante componentes colapsables (acordeones, tabs), dando prioridad absoluta a la consola de texto del juego y a los botones de acción inmediata.

### 2. Entradas Adaptables (Adaptive Inputs)
*   **Zonas de Toque (Touch Targets):** Dimensiones mínimas de elementos interactivos de al menos `48px x 48px` con suficiente espaciado para evitar errores de selección en pantallas táctiles.
*   **Accesibilidad con Teclado:** Soporte para accesos directos y navegación lógica mediante `Tab` y teclas rápidas de acción (por ejemplo, números del 1 al 9 para decisiones de historia o combate).
