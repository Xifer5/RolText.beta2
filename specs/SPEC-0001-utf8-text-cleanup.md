# SPEC-0001 UTF-8 Text Cleanup

## Objetivo

Verificar codificacion real antes de tocar texto. La primera inspeccion por terminal mostro mojibake, pero la verificacion por codepoints confirmo que los archivos principales estan en UTF-8 correcto.

## Contexto

- Archivos relevantes: `index.html`, `js/*.js`, `README.md`, `SPEC_WORKFLOW.md`.
- Estado actual: el canal de salida de PowerShell/Codex puede renderizar mal caracteres no ASCII.
- Riesgo principal: aplicar una conversion global sobre archivos sanos puede corromperlos.

## Flujo Principal

1. Detectar si el navegador o los codepoints reales muestran texto corrupto.
2. Si solo la terminal se ve corrupta, no convertir.
3. Si el archivo real esta corrupto, reparar solo el archivo afectado.
4. Verificar que la app carga sin errores basicos.

## Reglas De Gameplay

- No cambia reglas de juego.
- No cambia estado guardado.
- No cambia balance ni economia.

## UX/UI

- Superficies: topbar, modales, botones, logs, seleccion de personaje, combate.
- Estados: todos los textos visibles deben quedar legibles.
- Copy visible: mantener contenido existente, solo reparar codificacion.
- Accesibilidad: reparar `aria-label`, `title`, `meta description` y labels de controles.

## Material 3

- No cambia tokens.
- No cambia componentes.
- Mantiene iconografia actual si el emoji se recupera correctamente.

## Responsive

- No cambia layout.
- Se revisara que texto reparado no genere desbordes nuevos en mobile/desktop.

## Datos Y Contratos

- Estado leido: ninguno.
- Estado escrito: ninguno.
- Eventos usados: ninguno.
- Persistencia: no afecta `localStorage`.

## Criterios De Aceptacion

- [x] `index.html` contiene codepoints correctos para `Español` y el guion largo de la descripcion.
- [x] No se aplico conversion mecanica.
- [ ] Si navegador muestra corrupcion, documentar evidencia antes de reparar.
- [ ] El sistema mantiene las keys `data-i18n` y contratos JS existentes.

## Gherkin

```gherkin
Feature: Texto legible
  Scenario: Abrir el juego
    Given el jugador abre la pantalla principal
    When la UI se renderiza
    Then los labels principales se leen sin mojibake
    And los iconos aparecen como simbolos o emoji validos
```

## Plan De Implementacion

- [x] Crear spec.
- [x] Verificar muestras por codepoint.
- [x] Decidir no convertir archivos sanos.
- [ ] Verificar visualmente en navegador cuando se levante servidor.

## Verificacion

- [ ] Smoke manual desktop
- [ ] Smoke manual movil
- [ ] Sin errores en consola
- [ ] Sin texto solapado/cortado
- [ ] No se rompio guardado/carga si aplica
