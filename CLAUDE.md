ROL, EQUIPO Y FORMA DE TRABAJAR
Vamos a construir, entre tú y yo, una app multiplataforma (Android, iOS y web/PC) para practicar y analizar blackjack con conteo Hi-Lo. Responde siempre en español.

Roles:
- Tú (Claude Code) eres el ARQUITECTO, el responsable de la LÓGICA, el DISEÑO, el REVISOR y mi PROFESOR. Defines la arquitectura, los algoritmos, los casos de prueba y el diseño UX/UI.
- CODEX (plugin de OpenAI ya instalado) SOLO ESCRIBE CÓDIGO. No toma decisiones de arquitectura, de lógica ni de diseño, y no modifica pruebas para hacerlas pasar.
- Yo soy desarrollador junior (conozco React Native) y quiero ENTENDER cada parte del proyecto, no solo recibirlo terminado.

Ciclo de trabajo en cada paso (sin saltarte ninguno):
1. Explícame en simple qué vamos a hacer y por qué.
2. Escribe un brief para Codex: archivos a crear o tocar, interfaces y firmas, algoritmo exacto, casos de prueba con valores esperados y criterios de aceptación. Tú calculas los valores esperados de las pruebas críticas, no Codex.
3. Delega la escritura del código a Codex mediante su plugin. Si no responde o falla, corre su setup, dime qué pasó y propón una alternativa. No escribas tú el código de producción salvo que Codex no esté disponible y yo lo apruebe.
4. Revisa lo que entregó: corre las pruebas, el linter y el tipado, y usa code-review, simplify y security-review cuando apliquen. Si hay errores o incidencias, devuélvele a Codex correcciones precisas y repite hasta que quede bien.
5. Explícame cómo funciona lo que quedó, con un ejemplo con números, y cómo ejecutarlo y verificarlo.
6. Espera mi OK antes de pasar al siguiente paso.

Si hay una forma mejor que lo que pido, propónla con pros y contras y deja que yo elija. Antes de usar un concepto nuevo (conteo real, EV, hooks, estado, etc.) explícalo. Mantén docs/APRENDIZAJE.md con glosario, decisiones, el porqué de cada una y los errores que cometimos.

PLUGINS Y SKILLS (úsalos para hacer la mejor app posible)
Tengo instalado lo siguiente. Úsalo cuando aporte valor y dime en una línea qué skill usas y para qué. Si una skill no aplica a este stack, dímelo en vez de forzarla.
- graphify: úsalo SIEMPRE, es parte del aprendizaje del proyecto. Genera o actualiza el grafo de conocimiento al terminar cada fase y cada vez que cambie mucho la estructura, y explícame el grafo (módulos, dependencias, flujo de datos) para que yo entienda cómo encaja todo.
- Diseño y calidad de interfaz: frontend-design, ui-ux-pro-max (estilos, paletas, tipografías), accessibility (WCAG 2.2), web-design-guidelines, shadcn y vercel-react-best-practices (estas dos solo en la versión web, si aplican) y review-animations.
- Plugins: ponytail (audit, debt, review, gain), codex (rescue, setup) y claude-mem (mem-search, make-plan, do, handoff, learn-codebase, timeline-report y otras).
- De Claude Code: code-review, simplify, security-review, init, run, loop, schedule, claude-api (solo para la fase opcional), dataviz (gráficos de la sesión), claude-in-chrome y built-in-browser (para ver y probar la versión web) y computer-use si hace falta.
- Comandos que solo yo puedo lanzar escribiéndolos: /ship, /steward y /review-animations. Cuando creas que toca usarlos, dime el momento, qué hace cada uno y qué esperar, y yo los ejecuto.
- Usa claude-mem (make-plan para planear cada fase y handoff al cerrar la sesión) para no perder contexto entre sesiones. Guarda las decisiones clave también en CLAUDE.md.

STACK
- React Native + Expo + TypeScript: una sola base de código para Android, iOS y web. Para PC, primero la versión web instalable (PWA) y más adelante, si queremos, envolverla con Tauri o Electron.
- Toda la lógica va en src/core, TypeScript puro y SIN imports de React ni Expo, para probarla aislada. Estado con Zustand (o lo más simple que justifiques). Guardado local con expo-sqlite o AsyncStorage. Sin backend ni servidores.
- Pruebas con Jest o Vitest. Evalúa si conviene una librería de componentes y de animación y justifícalo.
- Si ves una razón fuerte para otro stack (por ejemplo Angular con Ionic y Capacitor), dímelo ANTES de empezar. Por defecto, React Native con Expo.

ESTRUCTURA SUGERIDA
blackjack-app/
  CLAUDE.md
  docs/APRENDIZAJE.md
  src/core/        (cards, shoe, hilo, rules, composition, dealer, ev, strategy, betting, simulator + pruebas)
  src/app/         (pantallas)
  src/components/  (teclado de cartas, puestos, panel de conteo, semáforo)
  src/state/

MESA REAL A REPLICAR (Pragmatic Play en Stake, crupier humano en vivo)
- Confirmado en el tapete: el blackjack paga 3:2, el seguro paga 2:1, el crupier pide hasta 16 y se planta en TODOS los 17 (S17).
- Hasta 7 puestos. Zapato de unos 8 mazos (por confirmar). Lo baraja una persona a mano, con carta de corte a ~75% o un poco más. Hay dos zapatos que se alternan.
- Orden de reparto CONFIRMADO: desde mi vista de la mesa, de DERECHA a IZQUIERDA (desde el crupier, de izquierda a derecha).
- Límites: hay mesas de 5.000 y de 25.000 COP de mínimo. Apuestas laterales (Perfect Pairs, 21+3): no se modelan.
- Los palos no importan para el conteo: solo el rango (A, 2-9, 10/J/Q/K).
- No me dejan estar muchas manos seguidas sin apostar (creo que 3 o 4; lo confirmaré).
- Por confirmar, como interruptores de configuración: doblar después de dividir (DAS), rendición, máximo de divisiones, resplit de ases, peek del crupier con A o 10, doblar en cualquier mano, cartas quemadas al barajar y si el reparto es en una o dos vueltas.
- NO supongas ninguna regla por confirmar: déjala como configuración o pregúntame.

FUNCIONES
1. CONFIGURACIÓN DE MESA: mazos, penetración, reglas anteriores, mínimo y máximo de apuesta, máximo de manos sin apostar. Perfiles de mesa guardables. Estimador de mazos: registra cuántas cartas se repartieron hasta la carta de corte y calcula los mazos aproximados del zapato.

2. PUESTOS Y MI ASIENTO
- Pantalla "Mesa" con los 7 puestos dibujados como en la mesa real (semicírculo visto desde mi lado), numerados del 1 al 7.
- Al iniciar el zapato elijo en qué puesto me siento. Ese puesto se marca como "yo" y puedo cambiarlo si me muevo de silla.
- Cada puesto se activa o desactiva por ronda (hay gente sentada que no juega esa ronda). Un puesto inactivo no recibe cartas y el reparto lo salta.
- Orden de reparto CONFIRMADO: desde mi vista, de DERECHA a IZQUIERDA (desde el crupier, de izquierda a derecha). El puesto 1 es el de más a la derecha desde mi vista y recibe carta y juega primero; el puesto 7 es el de más a la izquierda y juega último. Numera los puestos en ese orden y dibuja la mesa así. Deja el sentido como configuración por si cambia en otra mesa.
- Pregúntame si el reparto es en dos vueltas (una carta a cada puesto, luego la carta visible del crupier, luego la segunda a cada puesto) y si el crupier saca primero su carta visible o la tapada. No lo supongas.
- Para mi decisión, el motor usa SOLO las cartas de los puestos que ya recibieron o jugaron antes que yo, más la carta visible del crupier. Si cambio de puesto, el cálculo se ajusta solo.
- Soportar divisiones (varias manos por puesto).
- Las cartas de cada puesto las ingreso tocando el puesto y luego el teclado de 13 rangos. Si un puesto no juega, no pongo nada y paso al siguiente.

3. MODO "MANO COMPARTIDA" (una sola mano de jugador para todos, tipo ONE Blackjack, por confirmar): un solo puesto más el crupier. Si las decisiones se toman por mayoría, el motor muestra la jugada óptima y el EV de cada alternativa, pero no asume que se ejecutará la que yo elija.

4. INGRESO DE CARTAS: teclado de 13 rangos siempre visible. Un toque asigna la carta al objetivo actual (puesto, mano o crupier) y avanza en el orden real de reparto. Puedo tocar otro puesto para cambiar el objetivo, corregir una carta mal asignada y deshacer o rehacer sin límite. La carta tapada del crupier se cuenta solo al voltearla, pero mientras tanto se trata como incógnita en las probabilidades.

5. FLUJO DEL ZAPATO (máquina de estados)
Estados: ESPERANDO_ZAPATO -> CONTANDO -> ULTIMA_RONDA -> ESPERANDO_ZAPATO, y OBSERVANDO si abro la app a mitad de zapato.
- Botón grande "Inicio de zapato": reinicia conteo corrido a 0, composición a los mazos completos, penetración a 0, contador de rondas y contador de manos sin apostar. Me pide mi puesto.
- En CONTANDO cuenta cada carta que ingreso desde el primer reparto (incluida la tapada del crupier, cuando se voltea).
- Mazos restantes = mazos configurados menos (cartas vistas y quemadas / 52). Barra de penetración con la marca del corte (75 % por defecto, configurable).
- Al pasar el corte avisa "Última ronda: después se baraja" y, al terminar, pasa a ESPERANDO_ZAPATO.
- Si abro la app a mitad de zapato entra en OBSERVANDO: sin recomendaciones de apuesta fiables, esperando el próximo zapato.
- Guardar el zapato en curso en almacenamiento local para no perderlo si se cierra la app.
- La app NO decide cuántas cartas contar: cuenta todas las que ingreso desde el primer reparto y estima cuántas faltan y cuándo llega el corte.

6. CONTEO HI-LO (2-6 = +1, 7-9 = 0, 10 y A = -1): conteo corrido, mazos restantes estimados, conteo real, penetración e indicador del zapato. Opcional: conteo lateral de ases.

7. COMPOSICIÓN DEL ZAPATO: cuántas cartas de cada rango quedan, probabilidad de la próxima carta (A, 10, pequeñas) y probabilidad de que el crupier se pase según su carta visible. Ninguna app predice la próxima carta: se calculan probabilidades exactas con las cartas que faltan, y así debe presentarse.

8. MOTOR DE DECISIÓN, SIN IA EXTERNA
- Estrategia básica GENERADA desde las reglas configuradas, no tablas escritas a mano.
- EV exacto de plantarse, pedir, doblar, dividir y rendirse usando las cartas realmente restantes. Mostrar la acción óptima, el EV de cada una y una explicación corta.
- Desviaciones por conteo (Illustrious 18 y Fab 4, y seguro desde conteo real +3) como comparación. Cada índice se documenta con el conjunto de reglas para el que vale. Si no estás seguro de un índice, dilo, no lo inventes.
- Para divisiones se permite aproximar el EV, indicándolo.

9. APUESTAS Y SEÑAL DE ENTRADA
- Antes de cada ronda, un semáforo grande según el conteo real: gris (+1 o menos) apuesta mínima; amarillo (+2) subir de forma moderada; verde (+3 o más) "ENTRA" con apuesta alta.
- Umbrales, rampa de unidades y apuesta máxima configurables. La apuesta sugerida siempre se limita por mi capital configurado y por el máximo de la mesa. Mostrar conteo real, ventaja estimada (aproximación, marcada como tal) y apuesta sugerida en COP.
- Si el conteo real es muy negativo (-2 o menos, configurable), recomendar la apuesta mínima y valorar cambiar de mesa al terminar el zapato.
- Dimensionamiento alternativo: apuesta Kelly fraccionada (por defecto 1/4 o menos) según la ventaja estimada, limitada por mi capital y por el máximo de la mesa. Mostrar la ganancia esperada por hora y la desviación estándar, con aviso claro de que son estimaciones.
- Calculadora de capital y riesgo de ruina.
- Como no me dejan estar sin apostar, "entrar" significa subir la apuesta, no sentarse.

10. REGLA DE MANOS SIN APOSTAR
- Configuración "máximo de manos seguidas sin apostar", por defecto 3 (lo confirmaré en la mesa).
- Contador de manos sin apostar seguidas: sube cuando no apuesto en una ronda y vuelve a 0 cuando apuesto.
- Cuando falte 1 para el límite: aviso persistente "La próxima ronda DEBES apostar (mínimo)". Al llegar al límite: aviso rojo.
- Con ese aviso activo, la sugerencia es la apuesta mínima de la mesa salvo que el conteo diga otra cosa.
- Es solo un recordatorio: no automatiza nada en la mesa.

11. SESIÓN: historial de rondas, ganancia o pérdida, y mis errores frente a la jugada óptima. Todo local, con exportar a CSV. Gráficos con dataviz si ayudan.

12. MODO PRÁCTICA: simulador de zapatos con penetración configurable, ejercicios de conteo con cronómetro y test de jugadas.

13. OPCIONAL, AL FINAL: botón "Explícame esto" con la API de Claude, solo bajo demanda. La clave NUNCA va embebida en la app. Todo el cálculo lo hace el código, no el modelo.

LÓGICA Y EXACTITUD (lo más importante)
- Cero tolerancia a errores en conteo, probabilidades y tabla. Cada módulo de src/core lleva pruebas ANTES de pasar a la interfaz.
- La estrategia generada debe coincidir con las tablas publicadas para 8 mazos, S17 y las mismas reglas. Verifica contra una fuente confiable y dime cualquier diferencia.
- Simulación Monte Carlo de millones de manos: la ventaja de la casa con estrategia básica debe ser coherente con lo publicado para esas reglas (cerca de 0,4-0,5 %). Informa la desviación.
- Pruebas obligatorias: conteo y conteo real, deshacer o rehacer, puestos activos o inactivos, divisiones, carta tapada del crupier, máquina de estados del zapato, reinicio al iniciar zapato, contador de manos sin apostar, orden de reparto con puestos inactivos, y que el EV use solo cartas visibles al momento de mi decisión.
- Orden de reparto derecha a izquierda: los puestos reciben y juegan en el orden correcto, y el motor de decisión no usa cartas de puestos que juegan después de mí.
- Tú, como revisor, verificas de forma independiente (no solo confías en las pruebas que escribió Codex).

DETALLES DE LÓGICA ADICIONALES (obligatorios)
- Peek: si la regla "peek del crupier" está activa y el crupier ya miró sin tener blackjack, el EV y las probabilidades de la carta tapada deben condicionarse a que NO forma blackjack (con A visible, la tapada no es 10; con 10 visible, la tapada no es A). Prueba con valores calculados a mano.
- Carta quemada: configuración "cartas quemadas al barajar" (por defecto 1). Son cartas que salieron del zapato sin ser vistas: no suman al conteo, pero sí cuentan en las cartas usadas y en la penetración.
- Momento del conteo para apostar: la sugerencia de apuesta usa el conteo real al cierre de la ronda anterior (antes de repartir). Durante la ronda, el conteo en pantalla se actualiza carta a carta solo para la decisión de jugada.
- Redondeo del conteo real: define y documenta la convención (por ejemplo, dividir entre mazos restantes con resolución de medio mazo, y redondear hacia cero para los índices de desviación). Debe ser configurable y estar probada.
- La ventaja estimada por punto de conteo real es una aproximación. Márcala como tal y no la presentes como garantía.

DISEÑO UX/UI
- Prioridad: rapidez. Una carta = un toque. La pantalla principal muestra siempre conteo corrido, conteo real, mazos restantes, semáforo y la acción recomendada en grande.
- Lo que describí es un punto de partida, no un límite. Antes de construir cada pantalla, propón 2 o 3 opciones de diseño (bocetos en ASCII o mockups), con pros y contras, y yo elijo. Sugiere mejoras que hagan la app más intuitiva, rápida y agradable (gestos, atajos, vibración, retroalimentación visual, modo mesa rápida, lo que se te ocurra).
- Móvil: pensado para el pulgar, vertical y horizontal. Escritorio: atajos de teclado (A, 2-9, 0 = 10, J/Q/K = 10, espacio = siguiente, retroceso = deshacer, N = zapato nuevo) y layout en columnas.
- Tema oscuro por defecto, alto contraste, objetivos táctiles de 48 px o más, accesibilidad (WCAG 2.2) y textos listos para i18n. Revisa animaciones y accesibilidad con las skills correspondientes.

CÓMO EJECUTARLO EN LOCAL
En el README y en el chat explícame, comando por comando y qué hace cada uno: requisitos (Node LTS, Git, VS Code), crear el proyecto Expo, correrlo en el navegador, probarlo en mi celular con Expo Go por QR (misma red Wi-Fi), correr las pruebas y resolver errores comunes. Sacarlo a producción lo dejamos para después (quiero opciones gratuitas, sin servidor propio).

FUERA DE ALCANCE
No leer ni automatizar la pantalla del casino, no apostar automáticamente, no prometer ganancias. Es una herramienta de práctica y análisis personal. Incluye un aviso de juego responsable y recuerda que la ventaja del conteo es de ~1 % con mucha varianza.

FASES
0. Entorno: verificar Node, Git y VS Code; probar que el plugin de Codex responde con una tarea mínima; verificar skills y plugins; crear el proyecto base y la estructura; primer "hola mundo"; primer grafo con graphify.
1. Motor en src/core: cartas, zapato, Hi-Lo y conteo real, con pruebas.
2. Reglas, composición del zapato, peek, cartas quemadas y probabilidades del crupier, con pruebas.
3. EV, estrategia básica generada y desviaciones, con pruebas y simulación Monte Carlo.
4. Interfaz de mesa: 7 puestos, elección de asiento, orden de reparto derecha a izquierda, ingreso de cartas, deshacer y flujo del zapato.
5. Semáforo de entrada, recomendaciones, apuestas (rampa y Kelly fraccionado), regla de manos sin apostar y sesiones.
6. Modo práctica, pulido de diseño y animaciones, accesibilidad, PWA y empaquetado.
7. Opcional: integración con la API de Claude.
Al cerrar cada fase: actualizar graphify, docs/APRENDIZAJE.md y CLAUDE.md, y decirme qué comando (/ship, /steward u otro) conviene correr.

EMPIEZA ASÍ
Confirma que entendiste los roles y el ciclo de trabajo, explícame en simple la estructura de carpetas, pregúntame qué tengo instalado (Node, Git, VS Code) y propón el plan de la Fase 0. No escribas ni delegues código hasta que yo diga OK.
DECISIONES TOMADAS (registro)
- 2026-11-25 Raíz del proyecto: esta misma carpeta (cartas/), no una subcarpeta blackjack-app/.
- 2026-11-25 Plataformas: celular, tablet y PC (web/PWA) con el mismo código; layouts responsivos para los tres tamaños.
- 2026-11-25 Guardado: SQLite local (expo-sqlite), que funciona sin internet en la mesa. Esquema en SQL compatible con PostgreSQL para poder sincronizar más adelante con PostgreSQL (p. ej. Supabase) como fase OPCIONAL. Se descartó PostgreSQL directo porque exige servidor e internet y rompe "sin backend". Pendiente en Fase 0: verificar expo-sqlite en web; si falla, plan B solo para web.
- 2026-11-25 Pruebas: Jest (jest-expo), una sola herramienta para core e interfaz.

NUEVA FUNCIONALIDAD: ESTRATEGIA BÁSICA CON TABLA DE REFERENCIA

Contexto: ya tenemos el prompt maestro del proyecto. Esto es una ADICIÓN. Antes de tocar nada, revisa el estado actual del código y del plan, dime en qué fase estamos y dónde encaja esto (Fase 3). No reescribas lo que ya funciona. Sigue el mismo ciclo de trabajo de siempre: tú diseñas y revisas, Codex solo escribe el código, y esperas mi OK entre pasos.

OBJETIVO
El juego no es solo contar: se decide con (1) la estrategia básica, que es la base, y (2) las desviaciones por conteo, que la modifican en casos puntuales. El conteo cambia sobre todo la apuesta y unas pocas jugadas; el resto lo manda la tabla.

CÓMO DEBE FUNCIONAR
1. El motor GENERA la estrategia desde las reglas configuradas (EV exacto), no con tablas escritas a mano.
2. La tabla de abajo es el ORÁCULO DE PRUEBAS: con el zapato completo, la salida del motor debe coincidir celda por celda. Cualquier diferencia es un bug o debe justificarse.
3. Con la composición real del zapato, el EV puede diferir de la tabla en jugadas marginales. Esas diferencias se muestran como "desviación por composición" y se distinguen de las "desviaciones por conteo" (Illustrious 18, Fab 4).
4. Pantalla "Estrategia": la tabla completa con colores por acción, la celda de mi mano actual resaltada, y si la jugada óptima real difiere de la tabla, un aviso con el motivo.

REGLAS DE ESTA TABLA
8 mazos, el crupier se planta en todos los 17 (S17), doblar después de dividir permitido (DAS), sin rendición, el crupier mira la carta tapada (peek) con A o 10.
Sigue por confirmar en mi mesa: DAS, rendición y peek. NO los asumas: déjalos como interruptores. Cuando cambie alguno, regenera la tabla y dime exactamente qué celdas cambian.

LEYENDA
H pedir, S plantarse, D doblar (si no se puede, pedir), Ds doblar (si no se puede, plantarse), P dividir.

DUROS          2  3  4  5  6  7  8  9  10 A
5 a 8          H  H  H  H  H  H  H  H  H  H
9              H  D  D  D  D  H  H  H  H  H
10             D  D  D  D  D  D  D  D  H  H
11             D  D  D  D  D  D  D  D  D  H
12             H  H  S  S  S  H  H  H  H  H
13 a 16        S  S  S  S  S  H  H  H  H  H
17 o más       S  S  S  S  S  S  S  S  S  S

SUAVES         2  3  4  5  6  7  8  9  10 A
A,2            H  H  H  D  D  H  H  H  H  H
A,3            H  H  H  D  D  H  H  H  H  H
A,4            H  H  D  D  D  H  H  H  H  H
A,5            H  H  D  D  D  H  H  H  H  H
A,6            H  D  D  D  D  H  H  H  H  H
A,7            S  Ds Ds Ds Ds S  S  H  H  H
A,8 y A,9      S  S  S  S  S  S  S  S  S  S

PAREJAS        2  3  4  5  6  7  8  9  10 A
A,A            P  P  P  P  P  P  P  P  P  P
10,10          S  S  S  S  S  S  S  S  S  S
9,9            P  P  P  P  P  S  P  P  S  S
8,8            P  P  P  P  P  P  P  P  P  P
7,7            P  P  P  P  P  P  H  H  H  H
6,6            P  P  P  P  P  H  H  H  H  H
5,5            D  D  D  D  D  D  D  D  H  H   (se juega como duro 10, nunca se divide)
4,4            H  H  H  P  P  H  H  H  H  H
3,3            P  P  P  P  P  P  H  H  H  H
2,2            P  P  P  P  P  P  H  H  H  H

Seguro: no tomarlo, salvo que el conteo real sea +3 o más.
Rendición: solo si la mesa la ofrece; genérala desde el EV.

IMPORTANTE: ESTA TABLA SE ESCRIBIÓ DE MEMORIA
Antes de usarla como oráculo, verifícala contra una fuente publicada confiable para 8 mazos, S17, DAS, sin rendición y con peek, y dime cualquier discrepancia. Si hay una, la fuente publicada manda y me explicas la diferencia.

PRUEBAS OBLIGATORIAS
- Una prueba por fila de la tabla (duros, suaves y parejas) contra la salida del motor con el zapato completo.
- Pruebas de regeneración: al cambiar DAS, peek o rendición, las celdas que cambian son exactamente las esperadas.
- Simulación Monte Carlo (millones de manos) jugando la estrategia básica: la ventaja de la casa debe ser coherente con lo publicado para esas reglas (cerca de 0,4-0,5 %). Informa la desviación.
- Tú verificas de forma independiente, no solo confías en las pruebas que escriba Codex.

AL TERMINAR
Actualiza graphify, docs/APRENDIZAJE.md y CLAUDE.md. Explícame en simple la diferencia entre estrategia básica, desviación por conteo y desviación por composición, con un ejemplo con números. Dime si conviene correr /ship u otro comando.

EMPIEZA ASÍ
Dime en qué fase estamos, qué existe ya en src/core y propón el plan de esta adición. No delegues código hasta que yo diga OK.
- 2026-11-25 SQLite verificado en web (PC) y celular (Expo Go): persiste al recargar y al cerrar/abrir. En web exige cabeceras COOP/COEP (metro.config.js en desarrollo). Para publicar la web, el hosting debe permitir cabeceras propias: Cloudflare Pages, Netlify o Vercel (GitHub Pages NO sirve).
- 2026-11-25 En esta máquina PowerShell bloquea npm.ps1: usar npm.cmd / npx.cmd. Codex tiene red habilitada en ~/.codex/config.toml (respaldo en config.toml.bak).
- 2026-11-25 Conteo real: mazos restantes EXACTOS (cartas restantes / 52) por defecto, configurable a medio mazo o mazo entero (modo práctica). Para los índices se trunca hacia cero (configurable a piso o redondeo); en pantalla, un decimal. "Solo lo descubierto, nada de corazonadas."
- 2026-11-25 Las cartas quemadas quedan en "no vistas" por rango (rango desconocido), pero restan de las cartas del zapato y suman a la penetración. El conteo corrido se DERIVA de las cartas vistas (nunca se guarda aparte). El zapato es inmutable.
- 2026-11-25 Fase 1 cerrada: src/core/cards.ts, shoe.ts, hilo.ts (53 pruebas + verificación aleatoria de 2000 zapatos).
