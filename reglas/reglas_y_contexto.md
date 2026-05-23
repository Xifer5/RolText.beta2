# Reglas del Proyecto y Contexto Operacional
## Directrices de Desarrollo y Diseño para Pixel Quest Echoes

Este archivo contiene el conjunto de reglas inquebrantables, especificaciones técnicas y contexto operativo del proyecto. Estas reglas deben revisarse y respetarse en cada paso del proceso de refactorización y adición de mecánicas.

---

## 🧭 1. Contexto del Proyecto

*   **Nombre:** Pixel Quest Echoes (RolText)
*   **Tecnologías:** HTML5 semántico, CSS3 Vanilla (especializado en Material Design 3), JavaScript moderno nativo (ES6+), audio web nativo.
*   **Enfoque de Diseño:** Material Design 3 (M3) de Google adaptado a una estética de fantasía, misticismo y RPG de texto.
*   **Objetivo Principal:** Crear un juego inmersivo de rol de texto con una interfaz de tipo *Dashboard* responsiva, visualmente impactante, rápida de cargar, y con mecánicas de juego enriquecidas (combate dinámico, exploración con narrativa emergente, inventario interactivo, etc.).

---

## 📐 2. Reglas de Diseño (Material Design 3 & UX)

### A. Paleta de Colores y Temas (Light / Dark)
1.  **Variables HSL/RGB:** Todos los colores deben definirse en `styles-m3.css` utilizando variables CSS estructuradas. No se permiten valores de color quemados (*hardcoded*) en el CSS o en el JavaScript.
2.  **Soporte de Temas:** El cambio de tema se gestiona mediante el atributo `data-theme="dark"` o `data-theme="light"` en la etiqueta `<html>`. Los estilos deben reaccionar dinámicamente a este atributo.
3.  **Contraste y Legibilidad:** Mantener un ratio de contraste de al menos `4.5:1` para texto estándar y `3:1` para texto grande, en cumplimiento con WCAG AA. El color de texto sobre cualquier superficie debe utilizar su variable `--md-on-*` correspondiente.

### B. Componentes e Interfaz
1.  **Tarjetas (Cards):** Utilizar contenedores elevados o con bordes suaves (`--md-surface`, `--md-surface-variant`, `--md-outline`) para separar áreas lógicas (estadísticas del jugador, log de combate, mapa, inventario).
2.  **Botones (Buttons):**
    *   **Elevated/Filled:** Acciones críticas de guardado, compra de items legendarios o confirmaciones.
    *   **Tonal/Outlined:** Acciones del juego normales (viajar, atacar, examinar).
    *   **Text Buttons:** Acciones de navegación secundaria, configuraciones o toggles sencillos.
3.  **Zonas de Toque (Touch Friendly):** Todos los botones e iconos interactivos deben tener un tamaño de click de mínimo `48px` en dispositivos móviles y un padding adecuado para evitar solapamientos.

### C. Tipografía y Estilo de Texto
1.  **Jerarquía de Texto:** Usar fuentes de visualización o temáticas para los títulos del juego (`h1`, `h2`) y fuentes Serif o Sans-Serif de alta legibilidad para los textos narrativos y diálogos.
2.  **Densidad de Texto:** Limitar la anchura máxima de los bloques de lectura de texto narrativo a aproximadamente `65-75 caracteres` por línea (`ch`) para evitar la fatiga ocular del jugador.

---

## 💻 3. Reglas de Codificación (JavaScript & Frontend)

### A. Arquitectura y Modularidad
1.  **Código Limpio e Indestructible:** Toda lógica nueva debe estar modularizada en ficheros dentro de `js/` o bien extendiendo los módulos existentes de manera limpia.
2.  **Ciclo de Vida de Eventos:** Utilizar `addEventListener` de forma controlada. Evitar duplicar listeners de eventos al renderizar o actualizar elementos dinámicos (limpiar listeners previos o usar delegación de eventos si es necesario).
3.  **Encapsulación de Estado:** El estado del juego (`gameState` o similar) debe mantenerse centralizado, y cualquier modificación debe hacerse a través de funciones puras o métodos del módulo de estado correspondientes para evitar estados corruptos.

### B. Conservación de Datos y Guardado
1.  **Persistencia Robusta:** El sistema de guardado en `localStorage` debe ser inmune a fallos. Al modificar la estructura del estado, se deben prever migraciones de datos o valores por defecto para evitar que partidas guardadas antiguas rompan la ejecución del juego.
2.  **Integridad de Variables:** No sobrescribir funciones existentes que otros módulos o scripts requieran. Siempre realizar un análisis de dependencias antes de realizar cambios drásticos en la lógica JavaScript.

---

## ⚡ 4. Reglas de Proceso y Flujo de Trabajo

1.  **Investigar Antes de Codificar:** Analizar los scripts en `js/` e `index.html` minuciosamente antes de proponer cambios estructurales.
2.  **No Romper Funcionalidades:** La prioridad número uno es mantener el juego 100% funcional en cada iteración. No se permiten cambios "a medias" que dejen la interfaz rota o inoperable.
3.  **Mantener Comentarios y Documentación:** Preservar los comentarios explicativos de código ya existentes que aporten valor. Escribir comentarios claros en español en cualquier nueva adición o modificación compleja.
4.  **Generación de Assets:** Si se requieren imágenes para complementar la inmersión visual del juego, se usará la herramienta `generate_image` para crear diseños web, mockups o recursos in-game de calidad premium sin usar marcadores de posición (*placeholders*).
