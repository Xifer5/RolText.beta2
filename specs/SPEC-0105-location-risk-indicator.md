---
tags: [spec, pendiente]
serie: "01"
estado: pendiente
---

# SPEC-0105 Location Risk Indicator

## Objetivo

Mostrar el riesgo aproximado de la ubicacion actual comparando el nivel de zona con el nivel del jugador.

## Contexto

- Archivos relevantes: `js/ui.js`, `index.html`, `styles-m3.css`, `js/worldMap.js`.
- Estado actual: muchas ubicaciones tienen `level`, pero la UI no lo convierte en decision visible.
- Riesgo principal: que el indicador parezca una regla exacta de dificultad cuando solo es orientativo.

## Flujo Principal

1. El jugador llega a una ubicacion.
2. La UI lee `loc.level` y `player.level`.
3. El hero y HUD movil muestran un chip de riesgo.
4. El jugador decide explorar, volver, descansar o comprar equipo.

## Reglas De Gameplay

- No cambia encuentros, loot ni balance.
- Si una ubicacion no tiene nivel, se muestra zona normal.
- Safe zones se marcan como seguras.

## UX/UI

- Superficies: subtitulo de ubicacion y HUD movil.
- Estados: segura, baja, normal, peligrosa, mortal.
- Copy visible: corto y escaneable.
- Accesibilidad: el texto incluye nivel de zona.

## Material 3

- Usa chips tonales con colores semanticamente distintos.
- No agrega animacion.

## Responsive

- Mobile 390x844: chip compacto en HUD.
- Desktop 1440x900: chip en hero junto a bioma/salidas.

## Datos Y Contratos

- Estado leido: `gameState.player.level`, `loc.level`, `loc.safeZone`.
- Estado escrito: ninguno.
- Eventos usados: ninguno.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] El hero muestra riesgo/nivel de zona.
- [x] El HUD movil muestra riesgo compacto.
- [x] Safe zones se muestran como seguras.
- [x] JS syntax check pasa.
- [ ] QA visual en navegador.

## Gherkin

```gherkin
Feature: Riesgo de ubicacion
  Scenario: Zona superior al nivel del jugador
    Given el jugador es nivel 1
    And la ubicacion es nivel 3
    When la UI se actualiza
    Then ve una indicacion de zona peligrosa
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar helper de riesgo.
- [x] Renderizar chip en hero.
- [x] Renderizar chip en HUD movil.
- [x] Estilizar variantes.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
