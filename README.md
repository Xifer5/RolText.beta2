# Pixel Quest Echoes

RPG de texto por turnos hecho en JS/HTML/CSS puro (sin frameworks ni bundler), con UI Material Design 3. Explorá el mundo de Aetheria, combatí con mecánicas tácticas (defender, romper guardia, interrumpir, perdonar), elegí una de 3 clases + especialización, y seguí la historia principal de "El Último Sueño del Dragón" o simplemente juntá rumores y loot por el camino.

## Cómo correrlo

```bash
npm run serve   # levanta un servidor estático en http://localhost:8123
```

Abrí `http://localhost:8123` en el navegador. No hace falta build ni instalar dependencias — es HTML/CSS/JS servido tal cual.

## Cómo testear

```bash
npm test        # node --test tests/*.test.mjs
```

Suite de tests puros (sin DOM real) sobre la lógica del juego: dificultad, tipos de daño, maestría, especializaciones, quests, eventos de viaje, el arco de Kestrel, etc.

## Estructura del proyecto

- `index.html` — estructura principal, todos los modales, nav desktop/móvil.
- `styles-m3.css` — tokens de Material Design 3, layouts responsive, componentes.
- `js/` — ~50 módulos ES (`state.js`, `ui.js`, `combat.js` + sus módulos de combate, `movement.js`, `quests.js`, `enemies.js`, `worldMap.js`, etc.). Cada módulo tiene una responsabilidad acotada; ver los comentarios de cabecera de cada archivo para el detalle.
- `tests/` — suite `node --test`.
- `specs/` — una spec por mejora incremental (spec-driven workflow); `SPEC_WORKFLOW.md` documenta el proceso.
- `errores/registro_de_errores.md` — bugs reales encontrados durante el desarrollo, su causa raíz y cómo se evitan a futuro.
- `HISTORIA.md` / `STORY_CONTEXT.md` — canon narrativo de la historia principal.

## Assets

- **Imágenes**: `.webp` en `img/` (`img/enemies/`, `img/locations/`, `img/intro/`). Si un archivo no existe, el elemento se oculta automáticamente en vez de mostrar un ícono roto.
- **Audio**: `.ogg` en `music/` (ambiente por bioma) y para efectos de sonido.
- Evitar introducir PNG/JPG/GIF/SVG/MP3/WAV nuevos — el proyecto estandarizó en `.webp`/`.ogg` (más liviano, buena compresión). `tests/assets.test.mjs` no impone el formato, pero sí valida que toda ruta de asset referenciada en el código exista en disco con el **case exacto** (Windows es case-insensitive; Netlify/Linux no — un desajuste ahí es un 404 en producción que no se ve en local).
- Los íconos de items (`js/utils.js`, `resolveIconSrc`) aceptan un nombre de archivo, una URL completa, o `{ type: 'img', src: '...' }`. Un nombre de archivo se resuelve contra `window.ASSET_BASE` (default `./img/items/`) — configurable antes de cargar `js/main.js` si se sirve desde otra ruta base:

  ```html
  <script>window.ASSET_BASE = '/img/items/';</script>
  <script type="module" src="js/main.js"></script>
  ```

## Deploy

GitHub (`Xifer5/RolText.beta2`) → Netlify (`pixelquesbeta1`), configurado vía `netlify.toml` en la raíz.
