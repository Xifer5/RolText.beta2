# INTRO.md — Pixel Quest Echoes: El Último Sueño del Dragón
## Guión cinematográfico de introducción (15 paneles)

---

### Propósito
Introducir el mundo de Aetheria y la historia antes de que el jugador elija su personaje.
Tono: poético, melancólico, esperanzador. Música dinámica que cambia en el acto II.

### Regla de Asterion
**Nunca mostrar a Asterion completo.** Solo:
- Sus ojos — dos brasas doradas en la oscuridad
- Fragmentos: una garra, una escama, una sombra
- Una silueta difuminada contra luz intensa
- Nunca cara, cuerpo completo ni expresión clara

Esta regla aplica en la intro, en el combate final y en cualquier arte generado.

---

## ACTO I — El Mundo que Fue (Paneles 1–5)

### Panel 1 — EL ALBA DE AETHERIA
**Visual:** Cielo nocturno estrellado. Lenta panorámica descendiente.  
**Música:** `theme_main` (ambiental, suave)  
**Texto:**
> *En el principio, Aetheria era un mundo de magia y luz.*  
> *Sus bosques cantaban, sus ríos brillaban, sus montañas tocaban las estrellas.*

---

### Panel 2 — EL REY QUE CUIDABA
**Visual:** Silueta inmensa de dragón sobre una montaña, alas extendidas, con pueblos pequeños a sus pies.  
**Música:** `theme_main` (continúa)  
**Texto:**
> *Un dragón antiguo velaba por todo ello.*  
> *No como conquistador. Como guardián.*  
> *Los humanos lo llamaban: el Rey Dragón.*

---

### Panel 3 — EL NOMBRE OLVIDADO
**Visual:** Pantalla oscura. Aparece lentamente el nombre: **ASTERION** en letras doradas.  
**Música:** `theme_main` (fade muy suave)  
**Texto:**
> *Su nombre era Asterion.*  
> *Hoy, nadie lo recuerda.*

---

### Panel 4 — EL SILENCIO QUE CAYÓ
**Visual:** Un reloj de arena casi vacío. Arena cayendo en cámara lenta.  
**Música:** silencio casi total, solo viento  
**Texto:**
> *Hace mil años, Asterion murió.*  
> *O eso creían todos.*

---

### Panel 5 — EL SUEÑO QUE SANGRA
**Visual:** Grietas de luz dorada en suelo oscuro. Como heridas que brillan.  
**Música:** primera nota de `theme_danger` (solo un acorde)  
**Texto:**
> *Pero los sueños de un dragón no mueren fácilmente.*  
> *Y los sueños que sangran... se convierten en pesadillas.*

---

## ACTO II — El Mundo que Es (Paneles 6–10)

### Panel 6 — EL BOSQUE SE RETUERECE
**Visual:** Árboles retorcidos, raíces como garras, luz verde enfermiza.  
**Música:** `theme_danger` (entra suave)  
**Texto:**
> *Los bosques de Aetheria empezaron a enfermar.*  
> *Sus criaturas, a volverse salvajes.*

---

### Panel 7 — LA MONTAÑA TIEMBLA
**Visual:** Montaña con grietas ígneas. Magma visible. Cielo rojo.  
**Música:** `theme_danger` (sube)  
**Texto:**
> *Las montañas vomitaron fuego.*  
> *Las tormentas no cedían.*

---

### Panel 8 — LOS OJOS EN LA OSCURIDAD
**Visual:** Oscuridad total. Solo dos brasas doradas brillando. (Los ojos de Asterion — NUNCA mostrar más)  
**Música:** `theme_danger` pausa + silencio dramático  
**Texto:**
> *Y en el fondo de todo...*  
> *algo antiguo comenzó a despertar.*

---

### Panel 9 — LA CORRUPCIÓN SE EXTIENDE
**Visual:** Mapa de Aetheria con una mancha oscura expandiéndose desde el centro.  
**Música:** `theme_danger` (climax)  
**Texto:**
> *El dolor de Asterion se derramó por todo el mundo.*  
> *Como veneno en el agua.*  
> *Como duda en el corazón.*

---

### Panel 10 — NADIE SABE LA VERDAD
**Visual:** Aldeanos mirando el cielo con miedo. Soldados en muros caídos.  
**Música:** transición a `theme_main` (regresa suave)  
**Texto:**
> *Nadie sabía qué causaba la corrupción.*  
> *Solo sabían que Aetheria estaba muriendo.*

---

## ACTO III — La Esperanza (Paneles 11–15)

### Panel 11 — UNA VOZ EN EL VIENTO
**Visual:** Una vela solitaria en la oscuridad. Llama que no se apaga.  
**Música:** `theme_main` (suave, íntimo)  
**Texto:**
> *Pero una anciana en Oakhaven escuchó algo.*  
> *Un susurro entre las ruinas.*  
> *Un nombre casi olvidado.*

---

### Panel 12 — EL SUSURRO DE ASTERION
**Visual:** Texto manuscrito antiguo con el nombre "Asterion" apenas legible.  
**Música:** `theme_main`  
**Texto:**
> *"No busques al dragón para matarlo,"* susurraba.  
> *"Búscalo para recordarlo."*

---

### Panel 13 — EL HÉROE SIN NOMBRE
**Visual:** Silueta de un viajero de espaldas, mirando al horizonte. Sin identidad, sin clase.  
**Música:** `theme_main` (crece levemente)  
**Texto:**
> *Y así llega alguien.*  
> *Sin leyendas a sus espaldas.*  
> *Sin destino escrito.*  
> *Solo la voluntad de escuchar.*

---

### Panel 14 — EL TÍTULO
**Visual:** Logo del juego: **PIXEL QUEST ECHOES** en grande. Subtítulo: *El Último Sueño del Dragón*.  
**Música:** `theme_main` (volumen completo, épico)  
**Texto:** *(solo el logo, sin narración)*

---

### Panel 15 — EL LLAMADO
**Visual:** Fundido a negro. Texto centrado, blanco puro.  
**Música:** fade out suave  
**Texto:**
> *Aetheria te llama.*  
> *¿Quién serás tú?*

Botón: **[ Comenzar Aventura ]**

---

## Notas de producción

| Aspecto | Decisión |
|---|---|
| Duración estimada | ~60–90 segundos en lectura normal |
| Velocidad typewriter | 28ms por carácter |
| Transición entre paneles | Fade 300ms |
| Skip | Botón siempre visible; saltar marca `introSeen` y va directo a char select |
| Reaparición | Solo si `!sessionStorage.getItem('introSeen')` (una vez por sesión) |
| Asterion | Nunca completo — solo ojos, sombras, fragmentos |

---

## Archivos de implementación

- `js/intro.js` — Controlador completo (paneles, typewriter, música, callbacks)
- `index.html` — `<div id="introScreen">` con capa visual + área de texto + controles
- `styles-m3.css` — Estilos de cada panel (fondos, efectos, animaciones)
- `js/main.js` — `showIntro(() => showCharacterSelect(...))` en ambos puntos de entrada
