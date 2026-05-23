# Registro de Errores Cometidos y Lecciones Aprendidas
## Prevención de Fallos en Pixel Quest Echoes

Este archivo actúa como el "diario de aprendizaje" de la Inteligencia Artificial. Aquí se registrarán los errores cometidos durante el desarrollo, los fallos recurrentes que debemos evitar y las directrices técnicas para asegurar que no se vuelvan a cometer en futuras implementaciones.

---

## 🚫 1. Errores de Arquitectura y Lógica (JS)

### A. Fuga de Event Listeners (Event Listener Leaks)
*   **Error:** Añadir `addEventListener` a elementos del DOM dentro de funciones de renderizado continuo (como la actualización de botones de acción en combate o en el log de historia) sin remover los listeners anteriores. Esto causa ejecuciones múltiples de una misma acción ante un solo clic.
*   **Prevención:**
    *   Usar delegación de eventos en un contenedor padre estático siempre que sea posible.
    *   Limpiar el elemento del DOM sustituyéndolo con `.cloneNode(true)` o llamando a `removeEventListener` antes de asignar nuevos comportamientos.
    *   Hacer uso de la opción `{ once: true }` si el evento solo debe ocurrir una vez.

### B. Contaminación del Ámbito Global (Global Scope Pollution)
*   **Error:** Declarar variables de estado del juego sin especificar `let`, `const`, o sin estar encapsuladas en un módulo u objeto contenedor. Esto puede sobrescribir variables de otros módulos JS.
*   **Prevención:**
    *   Mantener el código dentro de módulos ES6 (`import`/`export`) o en IIFEs (Immediately Invoked Function Expressions).
    *   Usar un objeto de estado unificado (ej. `const GameState = { ... }`).
    *   Utilizar `'use strict';` al inicio de cada archivo.

### C. Corrupción del Guardado (Save Game Corruption)
*   **Error:** Modificar las claves del objeto de estado sin dar soporte de retrocompatibilidad o valores por defecto en la carga. El juego intentará leer una propiedad inexistente de una partida guardada antigua en `localStorage` y lanzará un error que bloqueará toda la interfaz.
*   **Prevención:**
    *   Implementar un sistema de verificación y migración de datos al cargar partidas.
    *   Usar fusión de objetos (`Object.assign` o el operador de propagación `{ ...defaultState, ...loadedState }`) para asegurar que cualquier nueva propiedad de estado tenga un valor por defecto válido.

---

## 🎨 2. Errores de UI/UX y Material Design 3 (CSS)

### A. Colores Hardcodeados e Inconsistencias de Tema
*   **Error:** Utilizar valores directos en hexadecimal o rgb (ej: `color: #ff0000;`) en lugar de las variables de token semántico de M3. Esto causa que al cambiar entre Tema Claro y Tema Oscuro, ciertos textos o bordes queden invisibles o con mal contraste.
*   **Prevención:**
    *   Usar exclusivamente las variables de color definidas en `styles-m3.css` (ej: `color: var(--md-on-surface);`).
    *   Verificar cada cambio visual en ambos temas (Claro y Oscuro) antes de considerar terminada una tarea.

### B. Pérdida de Interactividad por Zonas de Clic Pequeñas
*   **Error:** Diseñar botones de acción o enlaces pequeños que no alcancen los estándares móviles (`< 48px`), dificultando enormemente la jugabilidad táctil.
*   **Prevención:**
    *   Establecer alturas mínimas y áreas de clic de al menos `48px` reales en elementos interactivos mediante padding o `min-height`/`min-width`.

### C. Sombras Planas y Falta de Profundidad M3
*   **Error:** Utilizar sombras oscuras tradicionales tipo `box-shadow: 0 4px 10px rgba(0,0,0,0.5)` en todos los elementos, lo cual rompe el principio de elevación cromática de Material Design 3.
*   **Prevención:**
    *   Utilizar las variables de elevación basadas en tonos y opacidades dinámicas provistas por la guía de M3 (que combinan color de fondo con niveles sutiles de sombreado).

---

## 📂 3. Historial de Errores Detectados y Solucionados en este Proyecto

*(Esta sección se irá completando a medida que encontremos, identifiquemos y corrijamos problemas específicos en Pixel Quest Echoes durante nuestras sesiones de desarrollo).*

| ID | Descripción del Error | Causa Raíz | Solución Aplicada | Fecha |
| :--- | :--- | :--- | :--- | :--- |
| **ERR-001** | *(Ejemplo de plantilla)* | *Descripción detallada* | *Cómo se solucionó y cómo evitar que vuelva a ocurrir* | *Fecha* |

---

## 📈 Instrucciones de Mantenimiento de este Registro
Cuando ocurra un fallo en ejecución o se detecte un problema de diseño durante el desarrollo de Pixel Quest Echoes, es **obligatorio**:
1. Parar y diagnosticar la causa raíz.
2. Resolver el problema con una solución limpia y modular.
3. Registrar el error en la tabla del apartado 3 con detalles técnicos precisos para evitar su repetición.
