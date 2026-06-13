# SPEC-0301 M3 Inline Style Cleanup

## Objetivo

Mover estilos inline de superficies interactivas a clases CSS para que los controles sigan tokens M3 y sean mas faciles de mantener.

## Contexto

- Archivos relevantes: `index.html`, `styles-m3.css`.
- Estado actual: hay varios `style=""` en HTML y JS. Esta spec empieza por el control movil de navegacion.
- Riesgo principal: intentar limpiar todos los inline styles en una sola pasada y mezclar refactors.

## Flujo Principal

1. Identificar inline styles en una superficie acotada.
2. Crear clases equivalentes en CSS.
3. Reemplazar inline styles por clases.
4. Verificar que no cambia el comportamiento.

## Reglas De Gameplay

- No cambia gameplay.

## UX/UI

- Superficies: bottom nav movil.
- Estados: sin cambios funcionales.
- Accesibilidad: no cambia labels ni roles.

## Material 3

- Usa clases reutilizables.
- Mantiene dimensiones tactiles estables.

## Responsive

- Mobile 390x844: conserva layout vertical norte/sur.
- Desktop 1440x900: sin impacto porque bottom nav esta oculto.

## Datos Y Contratos

- Estado leido: ninguno.
- Estado escrito: ninguno.
- Eventos usados: ninguno.
- Persistencia: no aplica.

## Criterios De Aceptacion

- [x] El stack norte/sur ya no usa inline style.
- [x] El boton norte y sur ya no usan inline `min-height`.
- [x] La sintaxis JS sigue correcta.
- [ ] QA visual movil.

## Gherkin

```gherkin
Feature: Limpieza M3 de estilos inline
  Scenario: Navegacion movil mantiene layout
    Given el jugador esta en movil
    When ve la barra inferior
    Then norte y sur aparecen apilados con altura tactil estable
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Agregar clases CSS.
- [x] Reemplazar inline styles en bottom nav movil.
- [x] Verificar sintaxis JS.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [x] JS syntax check
- [ ] Sin texto solapado/cortado
