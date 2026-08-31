---
tags: [spec, inventario, equipo, ux, m3]
serie: "12"
estado: done
---

# SPEC-1217 Ventana visual de equipo del personaje

## Objetivo

Permitir que el jugador comprenda su build actual y compare un objeto antes de
equiparlo, dentro de una ventana de fantasía medieval construida con HTML, CSS y
JavaScript y reutilizando los assets existentes.

## Flujo principal

1. El jugador abre Inventario.
2. Ve su avatar, clase, nivel, recursos, estadísticas derivadas y ocho ranuras.
3. Examina la mochila mediante búsqueda, filtros y cuadrícula de objetos.
4. Selecciona un objeto para ver descripción y cambios estimados.
5. Equipa el objeto o vuelve al resumen sin perder el contexto.

## No objetivos

- No cambia fórmulas, compatibilidad de slots ni persistencia.
- No compone el avatar por capas ni crea arte nuevo.
- No copia la imagen de referencia como fondo no interactivo.

## Estados

- Ranura equipada y vacía.
- Objeto seleccionado, mejora, pérdida y cambio neutro.
- Inventario vacío o sin resultados.
- Escritorio en tres zonas; móvil apilado con mochila antes del detalle.
- Foco visible, hover, pressed y reducción de movimiento.

## Datos y contratos

- Lee `gameState.player`, `gameState.equipment` y `gameState.inventory`.
- Usa `calculateTotalStats` como única fuente de estadísticas derivadas.
- Resuelve el avatar por clase con fallback al emoji del personaje.
- Conserva los IDs de equipamiento y los eventos existentes.

## Criterios de aceptación

- [x] El resumen muestra nombre, nivel, clase, avatar, HP, MP, ATK, DEF y MAG.
- [x] Cada ranura muestra el icono real del objeto equipado o un estado vacío.
- [x] Seleccionar un objeto conserva la comparación antes de equipar.
- [x] La ventana funciona a 1440x900 y se apila por debajo de 760px.
- [x] Los controles tienen foco visible y objetivos táctiles de al menos 44px.
- [x] La presentación de clase, recursos y slots tiene pruebas automatizadas.

## Gherkin

```gherkin
Feature: Comprender y modificar el equipo
  Scenario: Revisar el build actual
    Given que el jugador abre el inventario
    When observa el resumen de equipamiento
    Then ve su identidad, recursos, estadísticas y ocho ranuras

  Scenario: Comparar antes de equipar
    Given que el jugador selecciona un objeto equipable de la mochila
    When se abre el detalle
    Then ve el cambio estimado de sus estadísticas
    And el equipo no cambia hasta que pulsa Equipar
```

