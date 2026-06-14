# Pixel Quest Echoes — Contexto completo para diseño de historia principal

> Este documento es para una IA colaboradora. Contiene todo el contenido existente del juego  
> para que puedas proponer y escribir una historia principal coherente con lo que ya existe.

---

## ¿Qué es el juego?

RPG de navegador en JavaScript puro (sin framework). El jugador elige una clase, explora un mapa de zonas conectadas, combate enemigos por turnos, completa misiones secundarias y equipa ítems. Tiene sistema de niveles (1–20+), tipos de daño, resistencias, debuffs y habilidades de clase.

**Lo que el jugador puede hacer:**
- Explorar zonas moviéndose entre locaciones conectadas (N/S/E/O/arriba/abajo/entrar/salir)
- Combatir por turnos: atacar, usar magia, usar ítems, huir
- Equipar armas, armaduras, anillos y accesorios
- Subir de nivel y distribuir puntos de estadística
- Hablar con NPCs para activar y entregar misiones
- Comprar y vender en tiendas
- Aprender habilidades de maestros o pergaminos
- Descansar en zonas seguras para recuperar HP/MP

---

## Las tres clases jugables

| Clase | Emoji | Arquetipo | Fortaleza |
|-------|-------|-----------|-----------|
| Guerrero | ⚔️ | Tanque melee | STR alto, +30 HP extra, habilidades de furia |
| Mago | 🔮 | Caster de área | INT alto, +40 MP extra, magia elemental |
| Pícaro | 🗡️ | DPS ágil | AGI muy alta, veneno, golpes furtivos |

Cada clase tiene 6 habilidades únicas que se desbloquean por nivel. También existen 3 habilidades universales aprendibles comprando pergaminos o pagando a maestros: **Reagruparse** (curación + cura debuff), **Golpe Potente** (ignora defensa, 50% crit), **Descarga Arcana** (daño mágico puro).

---

## El mundo — Zonas y locaciones

El mundo está dividido en **14 zonas temáticas**, cada una con 4–8 locaciones conectadas linealmente. Las zonas seguras (ciudades/castillos) permiten descansar y comprar.

### Zonas seguras (ciudades)
| ID | Nombre | Descripción |
|----|--------|-------------|
| `town` | **Oakhaven** | Ciudad inicial. Taverna "El Dragón Borracho", tienda de aventureros. |
| `castle` | **Griffon Keep** | Castillo al norte. Cuartelmaestre militar, armería. |
| `port` | **Saltwind Port** | Puerto costero. Acceso al mar. |

### Zonas de combate (14 biomas)
| Zona | Locaciones destacadas | Nivel aprox. |
|------|-----------------------|--------------|
| **Bosque de Valdris** | Senda de los Robles → El Corazón del Bosque → Límite de la Oscuridad | 1–5 |
| **Mazmorras de Ironcroft** | Entrada de Ironcroft → Cámara del Señor Oscuro | 3–8 |
| **Iron Crests (montaña)** | Paso del Desfiladero → Cumbre Eterna | 4–8 |
| **Catacumbas de Areth** | Entrada → Salida de las Catacumbas | 4–8 |
| **Pantano de Thornmoor** | Orillas del Fango → Estanque Corrupto | 3–7 |
| **Jungla de Umbar** | Umbral de la Jungla → Jungla de Umbar | 5–9 |
| **Desierto de Khal** | Dunas del Sur → Cañón del Sol Ardiente | 5–9 |
| **Costa de las Sirenas** | Playa del Dragón Marino → Costa de las Sirenas | 4–8 |
| **Echo Caverns** | Bóveda de la Taberna → Cueva Marina | 3–7 |
| **Ruinas de Eldrast** | Vestigios del Templo → Torre en Ruinas | 6–10 |
| **Tundra Eterna** | Llanura Congelada → Precipicio del Norte | 7–10 |
| **Volcán Eterno** | Faldas del Volcán → Puerta del Dragón | 8–10 |
| **Jardín de Eryndel** | Jardín Encantado → Jardín de Eryndel | 5–8 |
| **La Bóveda Olvidada** | Treasure Keep (zona especial) | 9–10 |
| **Trono del Rey Dragón** | Inferno (zona final) | 10 |

---

## Enemigos comunes por zona

| Bioma | Enemigos representativos |
|-------|--------------------------|
| Bosque | Slime, Goblin, Wolf, Elf, Thief |
| Mazmorra | Goblin Shaman, Orc, Royal Guard, Dark Knight, Warlock |
| Montaña | Cave Bear, Mountain Giant, Wyvern, Stone Golem |
| Cueva | Cave Bat, Giant Spider, Cave Troll, Ancient Guardian |
| Pantano | Funged Beast, Linchorn, Hydra, Zombie |
| Jungla | Gorilla Warrior, Jungle Tiger, Vine Serpent, Jungle Spirit, Centaurus |
| Desierto | Genie, Sand Worm, Gremlin, Dwarf Warrior |
| Costa/Mar | Mermaid, Pirate, Pirate Captain, Kraken, Sea Serpent |
| Catacumbas | Zombie, Vampire, Squeletor, Imp, Drider, Necromancer |
| Ruinas | Medusa, Cultist, Beholder, Ancient Guardian |
| Tundra | Frost elemental implícito, Wyvern, Pegasus |
| Volcán | Lava Golem, Pyro Elemental, Inferno Elemental, Inferno Dragon |
| Inferno | Dragon, Diablo, Inferno Dragon |

---

## Los ocho jefes finales (bosses)

Cada zona de combate tiene un boss al final. Requieren nivel ~8–10 para desafiarlos.

| Boss | Zona | Descripción |
|------|------|-------------|
| **Forest Titan** | Bosque de Valdris | Titán arbóreo, guardián del corazón del bosque |
| **Cave Devourer** | Echo Caverns | Criatura abismal de las cavernas profundas |
| **Mountain Colossus** | Iron Crests | Gólem de piedra viva de las cimas eternas |
| **Ancient Construct** | Ruinas de Eldrast | Autómata arcano de la civilización perdida |
| **Swamp Abomination** | Pantano de Thornmoor | Horror corrupto nacido del fango muerto |
| **Frost Wyrm** | Tundra Eterna | Wyrm de hielo que hiberna bajo el glaciar |
| **Dragon King** | Trono del Rey Dragón | El Rey Dragón en su trono de inferno — boss final |
| **Inferno Dragon** | Volcán Eterno | Dragón de lava, guardián de la Puerta del Dragón |

---

## Misiones secundarias actuales (6 quests)

Todas las activa un NPC específico. No hay historia que las conecte entre sí aún.

| Quest | NPC activador | Objetivo | Recompensa clave |
|-------|---------------|----------|-----------------|
| **El Bosque de Valdris** | Elara la Vidente 🔮 (Oakhaven) | Visitar forest_3 | Mapa del mundo |
| **El Fragmento Arcano** | Archimago Valdris 🧙 (Griffon Keep) | Recoger crystal_shard | Arcane Key |
| **La Costa de los Piratas** | Capitán Brennan ⚓ (Saltwind Port) | Matar 3 piratas | Navigation Chart |
| **El Polvo de las Hadas** | Guardiana Eryndel 🧚 (Jardín) | Recoger fairy_dust | Garden Key |
| **El Cristal Helado** | Theron el Explorador 🏔️ (Montaña) | Recoger ice_crystal | Mountain Pass |
| **El Señor Oscuro** | Pyrax, Guardián del Volcán 🌋 (Volcán) | Visitar dungeon_7 | Dragon Key |

---

## Ítems narrativamente relevantes

Estos ítems ya existen en el juego y sugieren una historia:

- **Dragon King Sword** — La espada definitiva. Nombre implica que pertenecía al Rey Dragón.
- **Dragon King Armor** — Armadura del mismo origen.
- **Dragon King Crown** — Accesorio de coronación del Rey Dragón.
- **Dragon Heart** — Material de boss final. Corazón literal del Rey Dragón.
- **Inferno Gem** — Gema del volcán/infierno.
- **Dragon Key** — Llave que se obtiene al completar la quest del Señor Oscuro. ¿Abre la Puerta del Dragón?
- **Arcane Key** — Llave arcana. ¿Abre las ruinas de Eldrast?
- **Garden Key** — Llave del jardín de Eryndel.
- **Ancient Core / Ancient Relic / Arcane Relic** — Materiales de zonas antiguas.
- **Saint Grail** — Accesorio poderoso, connotación sagrada.
- **Runestone** — Piedra rúnica, magia antigua.
- **Excalibur** — La espada legendaria existe como ítem.

---

## NPCs existentes

| NPC | Tipo | Ubicación | Rol actual |
|-----|------|-----------|------------|
| **Elara la Vidente** 🔮 | Quest giver | Oakhaven | Envía al bosque |
| **Archimago Valdris** 🧙 | Quest giver | Griffon Keep | Investiga el fragmento arcano |
| **Capitán Brennan** ⚓ | Quest giver | Saltwind Port | Problema con piratas |
| **Guardiana Eryndel** 🧚 | Quest giver | Jardín de Eryndel | Protege el jardín |
| **Theron el Explorador** 🏔️ | Quest giver | Iron Crests | Busca cristales de hielo |
| **Pyrax, Guardián del Volcán** 🌋 | Quest giver | Volcán Eterno | Conoce la Puerta del Dragón |
| **Maestro Aldric** 📚 | Trainer | El Dragón Borracho | Enseña habilidades (150–250 oro) |
| **Herrero Garrett** ⚒️ | Trainer | Armería de Griffon Keep | Enseña habilidades (130–180 oro) |

---

## Lo que NO existe todavía (el hueco a llenar)

El juego tiene un mundo completo, mecánicas sólidas, ítems, enemigos y misiones secundarias, pero **carece de:**

1. Una **razón** para que el héroe salga de Oakhaven
2. Un **villano principal** o amenaza central que conecte todas las zonas
3. Una **misión principal** con actos/capítulos progresivos
4. **Diálogo narrativo** de los NPCs que hable del conflicto mayor
5. Una **conclusión** satisfactoria al derrotar al Dragon King

---

## Semillas narrativas del juego (lo que sugiere el contenido existente)

- El **Dragon King** vive en el **Trono del Dragón** (zona de inferno al final del mundo)
- Hay una **Puerta del Dragón** al final del Volcán Eterno — se abre con la **Dragon Key**
- La **Dragon Key** se obtiene completando la quest del "Señor Oscuro" en las mazmorras de Ironcroft
- El **Archimago Valdris** investiga fragmentos arcanos — sugiere magia antigua o una profecía
- **Elara la Vidente** ve el futuro — podría ser quien advierte sobre el peligro
- El **Ancient Construct** en Eldrast Ruins guarda secretos de una civilización perdida
- El **Swamp Abomination** y el Warlock/Cultist en distintas zonas sugieren una corrupción que se expande
- La armadura, espada y corona del Rey Dragón son ítems obtenibles — el héroe puede literalmente portar su legado

---

## Restricciones técnicas para la historia

- Las quests son simples: **visitar una locación** o **recoger/tener un ítem** o **matar N enemigos de tipo X**
- Cada quest tiene exactamente **1 NPC activador** y **1 NPC para entregar** (puede ser el mismo)
- Las recompensas son: XP, oro, y/o un ítem específico
- Los 8 bosses ya existen — la historia debería **justificar por qué el héroe los enfrenta** en orden
- Los NPCs existentes tienen nombres y ubicaciones fijas — la historia debería usarlos, no reemplazarlos
- El juego es en **español**

---

## Pedido para la IA colaboradora

Con todo este contexto, por favor ayúdame a diseñar:

1. **El conflicto principal** — ¿Qué amenaza al mundo? ¿Quién o qué es el verdadero antagonista?
2. **El arco del héroe** — ¿Por qué sale de Oakhaven? ¿Qué descubre en cada zona?
3. **3–5 misiones principales** con título, NPC involucrado, objetivo concreto (dentro de las posibilidades técnicas), y texto de diálogo de introducción (2–4 líneas)
4. **Conexión de las quests secundarias** con la historia principal — que no se sientan aisladas
5. **El clímax y final** — ¿Qué pasa al derrotar al Dragon King? ¿Hay revelación, sacrificio, redención?

Criterios de estilo: fantasía épica pero con calidez, no grimdark. El héroe es un aventurero anónimo que crece. El tono es clásico JRPG (Final Fantasy / Dragon Quest), no ironía moderna.
