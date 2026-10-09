# SPEC-1301 — Ramas tácticas de héroes y arquetipos de enemigos

## Estado

Propuesta de diseño. No implementada. Requiere prototipo y balance antes de extenderla a todo el bestiario.

## Promesa de experiencia

En dificultad Aventura y Difícil, cada turno invita a leer una señal y escoger una respuesta; cada clase resuelve los mismos peligros con herramientas distintas y ningún enemigo exige una clase, arma o botín específico para ser vencido.

## Pilares y límites

1. **Lectura antes que azar:** los ataques peligrosos tienen señal, ventana de respuesta y consecuencia entendible. El azar complementa la decisión; no la reemplaza.
2. **Identidad por verbos:** una rama altera cómo se ataca, defiende, esquiva, prepara o castiga; no es solo un porcentaje pasivo.
3. **Contrajuego universal:** todo patrón enemigo admite al menos una respuesta básica (defensa, esquiva, interrumpir si está cargando, o atacar una apertura). Las ramas mejoran esa respuesta, pero no son requisito.
4. **Dificultad por comportamiento:** Fácil conserva el ritmo actual. Aventura enseña el bucle táctico. Difícil combina patrones y exige preparación; los multiplicadores numéricos no deben ser el principal aumento de dificultad.
5. **Poca carga de interfaz:** el turno normal mantiene acciones principales; técnicas situacionales aparecen donde ya vive el panel de habilidades, no como una fila permanente de botones.

### Fuera de alcance de la primera entrega

- Añadir decenas de tipos elementales o una condición nueva por cada hechizo.
- Reescribir el combate fácil, los finales, la economía, los guardados o todos los enemigos en un mismo cambio.
- Árboles con puntos irreversibles en cada nivel sin posibilidad de reespecializarse.
- Esquiva de acción en tiempo real: el combate sigue siendo por turnos y debe funcionar con ratón, teclado y móvil.

## Auditoría de sistemas que se reutilizan

- `js/damageTypes.js`: daño cortante/perforante/contundente y elemental, tabla de resistencias, tipo de arma y resistencias efectivas.
- `js/enemyAI.js` y `js/combat.js`: intención telegrafiada, comportamientos base, acciones cargadas y resolución del turno.
- `js/bossMechanics.js`: mecánicas y contadores de jefes.
- `js/playerCombatActions.js`: atacar, magia, defender, interrumpir, habilidades y huida.
- `js/classes.js`: habilidades por clase y requisitos de nivel.
- `js/specializations.js`: nueve especializaciones existentes (Tanque, Berserker, Caballero Sagrado; Elementalista, Nigromante, Cronomante; Asesino, Trampero, Duelista), elegibles a nivel 10.
- `js/difficulty.js`: Fácil, Aventura, Difícil e Imposible.

Decisión de diseño: conservar estas especializaciones y evolucionarlas hacia ramas de técnicas. No duplicar una segunda selección que compita con la elección de nivel 10. La primera versión puede ofrecer un nodo activo y uno pasivo por rama; los nodos posteriores se abren en niveles ya usados por el juego (10, 15 y 20), sujetos a verificar requisitos reales.

## Modelo de turno

1. **Intención:** acción y categoría de daño del enemigo; ataque cargado indica su objetivo y respuesta sugerida con icono + texto. Los jefes pueden ocultar identidad según las reglas existentes, pero no ocultar una señal que vuelva inevitable un daño letal.
2. **Elección:** acciones base — Atacar, Defender, Esquivar, Magia/Objeto y Huir. Interrumpir y habilidades aparecen cuando corresponden. En móvil se priorizan tres acciones y el resto queda en la bandeja contextual.
3. **Resolución:** orden fijo: validar recurso/estado → aplicar postura defensiva o evasión → resolver golpe/estado → contraataque/apertura → reducir duraciones y actualizar intención.
4. **Aprendizaje:** el log resume el resultado en una línea (“Esquivaste el tajo; el ogro quedó expuesto”) y muestra daño/estado sin duplicar mensajes.

### Acciones universales — parámetros iniciales para prototipo

Son valores de partida, no balance final. Las pruebas deben medir daño esperado por turno y tasa de victoria.

| Acción | Efecto propuesto | Coste / riesgo | Respuesta eficaz contra |
|---|---|---|---|
| Atacar | Ataque normal con tipo del arma y maestría actual | Sin coste; recibe la intención activa | Enemigo cargando, expuesto o vulnerable |
| Defender | Reduce 50% un golpe directo; no evita estados automáticamente | Cede daño potencial; dura un ataque | Golpe pesado, contundente, ataque que rastrea |
| Esquivar | Evita un ataque esquivable; éxito base de prototipo 70%, modificable por AGI/equipo/rama | Fallo recibe el golpe; no esquiva área persistente o agarres | Cortante/perforante anunciado, proyectil o barrido |
| Interrumpir | Cancela ataque cargado si la técnica/tipo lo permite | Recurso; fallo ejecuta el ataque cargado | Canalización, carga larga, hechizo anunciado |
| Objeto / Magia | Usa herramienta, cura, explota resistencia/vulnerabilidad | MP/carga/turno según objeto actual | Enemigo resistente a arma o con estado tratable |

Regla: no sumar indefinidamente tiradas de evasión de equipo, clase, rama y especialización. Resolver con una sola probabilidad final, con límites iniciales 10–85%; no permitir inmunidad permanente a ataques comunes.

## Ramas de héroe

Las nueve ramas parten de `SPECIALIZATIONS`; el nombre de la rama conserva el fantasy actual. Cada nodo debe tener una decisión de uso y una respuesta enemiga. Los valores listados son dirección de diseño, no contratos numéricos definitivos.

| Clase / rama | Ataque característico | Defensa / esquiva | Habilidad táctica central | Límite para balance |
|---|---|---|---|---|
| Guerrero — Tanque | Golpe de escudo: daño bajo, interrumpe carga física ligera | Bloqueo reforzado; reduce daño y protege contra estados físicos con inversión de nodo | Provocar/aguantar un golpe y contraatacar | No bloquear daño mágico completo; no encadenar aturdimientos |
| Guerrero — Berserker | Hender: golpe pesado que rompe guardia y armadura temporal | Guardia agresiva: mitiga menos, gana furia al recibir daño | Convertir riesgo/HP bajo en ventana de daño | El bono de daño no debe hacer óptimo recibir daño a propósito |
| Guerrero — Caballero Sagrado | Golpe consagrado, especialmente eficaz contra maldición/no-muertos | Guardia sagrada: reduce daño oscuro y evita una aplicación de estado | Purificar un estado o protegerse antes de una carga | Curación limitada por encuentro/MP; no sustituir pociones |
| Mago — Elementalista | Cambia elemento para explotar debilidad; fuego quema, hielo ralentiza | Barrera elemental preparada ante intención mágica | Reacción elemental que mejora el siguiente hechizo | Evitar que un único elemento sea superior contra todo |
| Mago — Nigromante | Maldición que reduce ataque o drenaje moderado | Velo oscuro reduce daño mágico; vulnerable a luz/sagrado | Convertir daño/estado aplicado en curación limitada | El drenaje no debe superar el daño recibido ni trivializar jefes |
| Mago — Cronomante | Pulso temporal, daño moderado y altera iniciativa | Rewind/anticipación reduce un golpe anunciado, una vez por ventana | Retrasar o cancelar acción cargada | Evitar turnos extra repetibles; jefe gana resistencia a control tras aplicación |
| Pícaro — Asesino | Estocada perforante y ejecución contra enemigo bajo de vida | Paso lateral: evade un ataque directo, no el área | Preparar marca y cobrarla en apertura | Ejecución nunca elimina de golpe un jefe sano |
| Pícaro — Trampero | Hemorragia/trampa que castiga movimiento o repetición | Humo reduce precisión de próximo ataque; no inmuniza | Preparar trampa y elegir cuándo detonarla | Límite de una trampa activa; jefes con duración reducida, no inmunes |
| Pícaro — Duelista | Réplica veloz después de una esquiva/defensa correcta | Esquiva fiable y contraataque, menos reducción pasiva de daño | Leer ataque y transformar defensa en turno ofensivo | Si falla esquiva no obtiene réplica; mantener límite de evasión global |

### Cadencia de progresión propuesta

- **Inicio (niveles 1–5):** acciones base comunes, aprender intención; habilidades iniciales existentes continúan funcionando.
- **Elección de rama (nivel 10):** elegir una de las tres especializaciones actuales de clase. Mostrar claramente qué verbos y riesgos cambia.
- **Dominio I (nivel 10):** un nodo activo distintivo más el pasivo identidad existente, al validar solapamientos.
- **Dominio II (nivel 15):** mejora que crea una sinergia o nueva respuesta, no solo más daño.
- **Dominio III (nivel 20):** remate de fantasía con límite de uso/condición de activación.
- La rama elegida puede restablecerse en entrenador/menú de preparación con un coste moderado en oro, al menos durante prototipo; nunca perder habilidades base por probar.

Los niveles son tentativos: antes de implementar, cruzar cada habilidad de `classes.js`, hitos de clase y especialización para no desbloquear dos veces la misma capacidad.

## Tipos de ataque, defensas y estados

### Taxonomía

- **Daño** responde “qué resistencia se consulta”: slash, pierce, blunt, fire, ice, lightning, earth, air, water, dark/cursed, light/holy, psychic. Usar los identificadores ya existentes; no crear un id para “magia sangrienta” si el efecto es daño oscuro + coste/estado.
- **Forma de ataque** responde “qué puede contrarrestarlo”: directo, pesado/cargado, proyectil, área, canalizado/estado, agarre.
- **Estado** responde “qué cambia después”: daño en el tiempo (veneno, quemadura, sangrado), control breve (aturdimiento, congelación), precisión (ceguera) o debilidad (daño/ataque reducido).
- Un ataque combina como máximo un tipo principal, una forma y un estado principal. Excepción de jefe solo si su señal explica la combinación.

### Respuestas

| Categoría enemiga | Ejemplos | Defensa recomendada | Lo que no debe ocurrir |
|---|---|---|---|
| Físico directo | tajo, mordida, estocada | Esquivar o bloquear según señal | Fallo de evasión + crítico letal desde HP lleno |
| Pesado/cargado | golpe de ogro, embestida | Esquivar, bloquear con rama/equipo, o interrumpir si cargable | Interrupción probabilística sin aviso ni plan alternativo |
| Proyectil mágico | fuego, hielo, rayo | Barrera/resistencia, interrumpir canalización o esquiva si el patrón lo admite | Esquiva universal evita todo hechizo sin coste |
| Área / persistente | explosión, suelo en llamas | Salir/evitar en turno previo, resistencia o reducción de área | Defender una vez niega todo el daño de zona |
| Estado | veneno, ceguera, maldición | Resistencia, prevención, cura/limpieza y respuesta de clase | Cadena de estados que quite varias acciones consecutivas |
| Agarre / devorar | jefe telegrafiado | Romper agarre, interrumpir si aplica o defensa especial anunciada | Estado inevitable que salte la acción de respuesta |

### Presupuesto de estados

Reutilizar `poison`, `burn`, `bleed`, `stun`, `frozen`, `blind`, `weakness`, `arcaneFreeze` existentes. No introducir todavía piedra/encanto/silencio como estados independientes. Si luego se necesita “petrificar”, prototipar como control de 1 turno con inmunidad temporal posterior; jamás como bloqueo indefinido.

Reglas de duración propuestas: control duro dura 1 turno como máximo en enemigos normales, duración de control en jefes se reduce o se transforma en “vulnerable”; aplicar un control da resistencia temporal al mismo control; estados dañinos muestran ticks restantes, acumulan solo donde el sistema lo soporta y tienen antídoto/prevención identificable.

## Ramas de enemigo: arquetipos de encuentro

“Rama de enemigo” significa paquete de comportamiento y contrajuego aplicado a criaturas existentes; no un árbol de progresión para cada criatura. Cada enemigo común recibe un arquetipo principal y como máximo un rasgo secundario. Bosses mantienen sus mecánicas únicas en `bossMechanics.js`.

| Arquetipo | Firma ofensiva / señal | Defensa / comportamiento | Contrajuego claro | Candidatos existentes |
|---|---|---|---|---|
| Asaltante | Ataque rápido cortante/perforante; puede encadenar un golpe débil | Baja defensa, sin carga larga | Defender o esquivar primer golpe; castigar tras combo | goblin, thief, wolf, jungle_tiger |
| Rompeguardia | Ataque contundente cargado | Alta defensa física, poca movilidad | Esquivar carga o interrumpir; contundente contra armadura | orc, cave_troll, stone_charger |
| Guardián | Golpe lento y visible; postura defensiva | Bloquea y contraataca al ataque frontal repetido | Magia/vulnerabilidad, atacar tras su guardia, romper guardia | guard, dwarf_warrior, stone_golem |
| Canalizador | Elemento anunciado en preparación | Frágil, barrera o reposicionamiento entre hechizos | Interrumpir canalización, usar resistencia/debilidad elemental | goblin_shaman, warlock, genie |
| Hostigador | Proyectil/veneno/ceguera anunciados | Se protege o se aleja mientras prepara estado | Presión ofensiva, antídoto, bloquear/evadir según forma | giant_spider, beholder, drider |
| Regenerador | Golpe simple y lento | Recupera HP si no recibe fuego/daño concreto; no debe curarse cada turno | Aplicar el counter que muestra bestiario, mantener presión | hydra, cave_troll, lava_golem |
| Depredador | Marca/presa seguida de emboscada física | Esquiva o se oculta un ciclo, vulnerable al revelar posición | Defender la embestida, usar acción de revelar/control | vampire, medusa (adaptar firma a su kit actual) |
| Jefe | Ciclo único, fases y ataques cargados explícitos | Mecánica propia y ventanas de apertura | Aprender el ciclo; más de una respuesta viable por fase | Los jefes actuales; no normalizar sus mecánicas |

No reasignar automáticamente todos los candidatos: confirmar identidad y narrativa de cada criatura y respetar sus resistencias/drops actuales. Los nombres son agrupación de prototipo, no cambio de canon.

## Dificultades

| Modo actual | Conducta objetivo | Números / ayudas |
|---|---|---|
| Fácil | Mantener el combate accesible y rápido; intención/consejo existente opcional | Conservar reglas y multiplicadores actuales inicialmente. No forzar árbol táctico. |
| Aventura (medio) | Intención clara en enemigos normales; una señal nueva por enemigo; estados moderados | Tutorial contextual; esquiva/defensa disponibles; mantener enemigos vencibles sin equipo específico. Revaluar hp 1.4/atk 1.3/def 1.2 actuales durante playtest. |
| Difícil | Enemigos combinan acciones aprendidas, aprovechan guardia/estados y rasgos con intención legible | Más castigo a decisión repetida y menos ayudas de texto, pero mantener telegraph. Revisar hp 2.0/atk 1.7/def 1.5, que pueden alargar peleas excesivamente. |
| Imposible | Desafío de dominio para quien ya conoce patrones | Ocultar consejo, no ocultar reglas fundamentales. Picos y rasgos adicionales optativos en la prueba de balance. |

No poner `atk`, `hp` y `def` altos todos a la vez como sustituto de diseño: más vida y defensa aumentan duración; ataque alto reduce margen de aprender. Ajustar una variable causal por iteración.

## Modelo de balance y criterios de justicia

### Métricas por encuentro

- Turnos promedio y percentil 90 para vencer (separar normal, élite y jefe).
- Daño recibido como fracción del HP máximo y consumibles usados.
- Porcentaje de turnos en que el jugador elige una respuesta informada por la intención.
- Frecuencia y éxito de atacar, defender, esquivar, interrumpir, usar debilidad y aplicar estado.
- Victoria por clase, rama, dificultad y nivel/equipo comparables.
- Muertes explicables por señal ignorada vs. muertes por daño/estado no anunciado.

### Guardrails iniciales para pruebas, no metas de lanzamiento

- Encuentro común Aventura: mediana de 3–6 turnos; evitar que resistencias eleven sostenidamente a 10+ turnos.
- Ataque telegrafiado fuerte: defender/esquivar de forma correcta debe reducir el daño esperado al menos 40% frente a atacar, sin generar siempre una réplica gratuita.
- Esquiva fallida: daño equivalente a ataque normal; el daño cargado completo solo se admite si se anunció con anticipación suficiente y hay defensa alternativa.
- Ninguna clase/rama queda por debajo de 70% de victorias en encuentros de prueba del mismo nivel y equipo base; si queda, ajustar opciones/encuentros, no tapar con drops raros.
- El estado duro no puede retirar más de una acción del jugador por aplicación; las aplicaciones repetidas reciben resistencia temporal.
- El jugador puede identificar antes de comprometer turno: forma de ataque, elemento aproximado y si la acción se puede interrumpir.

## Arquitectura sugerida para una futura implementación

Mantener la lógica pura separada de UI:

- `combatActions.js` (o módulo puro equivalente): validar/normalizar acciones, categorías y costos.
- `combatResolution.js`: resolver tipo/forma, ataque, defensa, esquiva, estado y apertura con RNG inyectable.
- `combatArchetypes.js`: definiciones de arquetipo/datos del enemigo; reusar IDs y `ENEMY_COMBAT_DATA` gradualmente.
- `combatProgression.js`: nodos de ramas y elegibilidad; persistir solo elecciones/desbloqueos necesarios.
- `combat.js`: orquestar estado/eventos y delegar resolución; evitar ampliar más el módulo circular existente.
- `ui.js` / `index.html` / `styles-m3.css`: mostrar intención, categoría, opciones contextuales y feedback accesible. Los iconos siempre llevan texto; color no es la única señal.
- i18n EN/ES para todo nombre, estado, consejo y descripción.

No migrar saves al prototipo de combate hasta definir qué sucede con personajes nivel 10+ que ya tienen especialización. Compatibilidad recomendada: mapear especialización existente a la misma rama, conservar progreso/niveles y conceder nodos que correspondan.

## Plan de validación por fases

1. **Prototipo vertical:** tres clases, tres ramas elegidas, tres armas (espada, martillo, daga), cuatro enemigos (asaltante, rompeguardia, canalizador, guardián), dificultad Aventura. Reusar resistencias y estados actuales.
2. **Balance determinista:** pruebas de funciones puras con RNG inyectado para daño, defensa, esquiva, interrupción, inmunidad temporal y estados.
3. **Prueba de legibilidad:** jugador nuevo debe poder contestar qué va a hacer el enemigo y elegir una respuesta plausible después de 2–3 encuentros, sin leer documentación externa.
4. **Prueba de viabilidad:** recorrer mismo grupo de encuentros con todas las clases y equipo inicial; registrar turnos, HP perdido, usos defensivos y victorias.
5. **Expandir bestiario:** asignar un arquetipo por lote pequeño, verificar y luego añadir a más enemigos/jefes.

## Criterios de aceptación para aprobar el diseño

- [ ] Cada clase explica su identidad en ataque, defensa, esquiva y control.
- [ ] Las nueve ramas actuales se mapean una a una, sin segunda selección conflictiva.
- [ ] Cada arquetipo enemigo especifica señal, forma de ataque, elemento/estado, defensa, apertura y al menos dos respuestas viables.
- [ ] Ningún enemigo común exige una rama o elemento específico para vencer.
- [ ] Fácil mantiene experiencia actual en el primer prototipo.
- [ ] Aventura enseña señales y contrajuego; Difícil aumenta lectura/ejecución sin convertir HP/DEF en esponja.
- [ ] No se incorporan estados duplicados ni control duro encadenable.
- [ ] Los estados tienen duración visible, mitigación y feedback de aplicación/expiración.
- [ ] La intención puede leerse en desktop y móvil, con teclado y sin depender solo del color.
- [ ] Los guardados de héroes ya especializados se pueden migrar sin pérdida.
- [ ] TDD cubre la matemática y tests de integración cubren selección → intención → respuesta → feedback.
- [ ] Pruebas de juego confirman duración razonable, variedad real de acciones y viabilidad de las tres clases.

## Escenarios Gherkin de alto valor

```gherkin
Feature: Responder a intenciones enemigas en Aventura
  Scenario: El jugador esquiva una embestida anunciada
    Given que un rompeguardia anuncia una embestida física cargada
    And el héroe conserva su acción de este turno
    When el jugador elige esquivar
    Then el sistema resuelve la esquiva según la probabilidad final limitada
    And si tiene éxito evita el daño y muestra la apertura del enemigo
    And si falla recibe daño no mayor al presupuesto definido para esa señal

  Scenario: Una rama mejora una respuesta sin volverla obligatoria
    Given que un canalizador anuncia fuego
    When un héroe Elementalista prepara una barrera de fuego
    Then recibe la mejora propia de su rama
    But un héroe sin esa rama todavía puede defenderse, interrumpir o usar resistencia

  Scenario: Un jefe gana resistencia temporal tras un control
    Given que el jugador aturde al jefe
    When intenta aplicar otro aturdimiento antes de expirar la resistencia temporal
    Then el segundo control no elimina otra acción completa
    And el juego explica que el jefe se está adaptando
```

## Decisiones pendientes antes de programar

- Elegir nombre visible del tercer modo: “Aventura” se usa hoy como dificultad media.
- Definir costes exactos y fórmula de esquiva con una función de balance compartida.
- Confirmar si la rama abre técnicas automáticamente por nivel o si el jugador elige nodos.
- Definir UX de respecialización y compatibilidad de saves.
- Validar si arma define solo tipo de daño o también el set de técnicas activas.

## Decisiones del usuario (2026-10-09)

- **Esquiva:** convive la pasiva actual (AGI/clase/rama) y un botón nuevo "Esquivar"; se combinan y el resultado depende de la suerte (una sola probabilidad final con tope). Se especifica en SPEC-1302.
- **Arma:** define tipo de daño **y** técnicas. Guerrero: cortante vs aplastante. Mago: varita vs bastón. Asesino: ataques rápidos vs ataques con efecto (veneno, etc.).
- **Compatibilidad:** todo lo nuevo solo se activa en dificultad Aventura y Difícil; Fácil queda intacto.
- **Ramas:** mezcla de técnicas pasivas por tipo de héroe y técnicas que el jugador elige (rejugabilidad). Esto responde la pregunta "¿automáticas o elegidas?": ambas.
- **Orden de implementación:** SPEC-1302 (Esquivar) → arquetipos enemigos → técnicas por arma → ramas de héroe.
