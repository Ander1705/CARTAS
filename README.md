# Cartas: contador Hi-Lo para blackjack

Aplicación multiplataforma (Android, iOS y web/PC) para practicar y analizar blackjack con conteo de cartas Hi-Lo. Replica una mesa real de crupier en vivo de 7 puestos: el usuario registra las cartas que ve y la aplicación mantiene el conteo, calcula probabilidades exactas, recomienda la jugada y sugiere la apuesta.

Es una herramienta de práctica y análisis personal. No lee la pantalla del casino, no apuesta de forma automática y no promete ganancias.

## Objetivo del proyecto

Tomar decisiones en la mesa con información exacta, no con intuición:

1. **Contar.** Llevar el conteo Hi-Lo de todas las cartas vistas desde el inicio del zapato.
2. **Apostar.** Convertir el conteo real en una apuesta sugerida, limitada por el capital y por el máximo de la mesa.
3. **Jugar.** Recomendar la jugada óptima de cada mano con la estrategia básica, las desviaciones por conteo y el valor esperado (EV) calculado con las cartas que realmente quedan.
4. **Medir.** Registrar sesiones y resultados para evaluar el desempeño con el tiempo.

## Funcionalidades

| Área | Qué hace |
|---|---|
| Mesa | 7 puestos en semicírculo, numerados de derecha a izquierda desde la vista del jugador (el puesto 1 recibe y juega primero). Elección de asiento y cambio de asiento en cualquier momento. |
| Ingreso de cartas | Teclado de rangos (A, 2-9, 10). Un toque asigna la carta al objetivo actual y avanza en el orden real de reparto. Deshacer y rehacer sin límite, corrección de cartas mal asignadas y división de parejas. |
| Flujo de ronda | Reparto en dos vueltas. Los puestos que no apostaron se saltan solo en esa ronda. Las manos con 21 o blackjack se saltan automáticamente. La ronda termina sola cuando el crupier llega a su total final. |
| Conteo | Conteo corrido, mazos restantes, conteo real, penetración y aviso de última ronda al pasar la carta de corte. |
| Decisión | Estrategia básica generada desde las reglas configuradas, desviaciones por conteo (Illustrious 18, Fab 4, seguro) y desviaciones por composición del zapato. |
| Apuestas | Semáforo de entrada, apuesta sugerida en COP por rampa de unidades o Kelly fraccionado, ventaja estimada, ganancia esperada por hora y riesgo de ruina. |
| Manos sin apostar | Contador de manos seguidas sin apostar con aviso antes de llegar al límite de la mesa. |
| Sesiones | Totales de la sesión, cierre con capital final e historial de resultados. |
| Configuración | Reglas de la mesa, límites de apuesta, capital, perfiles de mesa guardables y estimador de mazos. |

## Manual de teclado (PC)

En la versión web, la mesa se puede operar por completo con el teclado. Funcionan tanto la fila de números como el teclado numérico.

| Tecla | Acción |
|---|---|
| `A` o `1` | As |
| `2` a `9` | Carta de ese valor |
| `0` (también `T`, `J`, `Q`, `K`) | Carta de valor 10 |
| `Espacio` o `Flecha derecha` | Siguiente mano o saltar el puesto que no apostó |
| `Shift` o `Retroceso` | Deshacer la última acción |
| `R` | Rehacer |
| `D` | Dividir la pareja actual |
| `N` | Abrir ajustes |

Notas:

- Mantener una tecla presionada registra una sola carta.
- Los atajos se desactivan mientras se escribe en un campo de texto (por ejemplo, el monto apostado) y dentro de la pantalla de ajustes.
- "Nueva ronda" no tiene atajo a propósito: antes de cerrar la ronda conviene revisar el monto apostado.
- Para doblar no hace falta una acción especial: se registra la carta recibida y se pulsa `Espacio`.

## Uso en la mesa

1. **Zapato nuevo.** Al barajar, elegir el asiento propio en la pantalla "Zapato nuevo". El conteo vuelve a cero.
2. **Primer reparto.** Registrar una carta por puesto activo, la carta visible del crupier y la segunda carta de cada puesto. Si un puesto no apostó, pulsar `Espacio` (o "Saltar puesto") cuando la aplicación lo señale.
3. **Juego de los puestos.** Registrar las cartas pedidas por cada puesto y pulsar `Espacio` al terminar cada mano. En la mano propia, la aplicación muestra la jugada recomendada.
4. **Turno del crupier.** Registrar la carta tapada y las que pida. La ronda se cierra sola.
5. **Cierre de ronda.** Confirmar el monto apostado (viene prellenado con la sugerencia; 0 si no se apostó) y pulsar "Nueva ronda".
6. **Carta de corte.** Al salir, marcarla en ajustes. La aplicación avisa la última ronda y vuelve a esperar un zapato nuevo.

Si la aplicación se abre a mitad de zapato, entra en modo observación: no da recomendaciones de apuesta fiables hasta el siguiente zapato.

## Lógica

### Conteo Hi-Lo

| Cartas | Valor |
|---|---|
| 2, 3, 4, 5, 6 | +1 |
| 7, 8, 9 | 0 |
| 10, J, Q, K, A | -1 |

- **Conteo corrido:** suma de los valores de todas las cartas vistas. Se deriva siempre de las cartas registradas; nunca se guarda aparte.
- **Mazos restantes:** cartas no vistas dividido entre 52. Las cartas quemadas restan del zapato y suman a la penetración, pero no al conteo porque nadie las vio.
- **Conteo real:** conteo corrido dividido entre mazos restantes. Para los índices de desviación se trunca hacia cero (configurable).
- **Momento de la apuesta:** la apuesta sugerida usa el conteo real al inicio de la ronda, antes de repartir.

### Decisión de juego

- **Estrategia básica generada.** La tabla se calcula por EV exacto a partir de las reglas configuradas, no se escribe a mano. Con zapato completo coincide en las 280 celdas con la tabla publicada para 8 mazos, S17, DAS, sin rendición y con peek.
- **Desviaciones por conteo.** Illustrious 18, Fab 4 (solo con rendición) y seguro con conteo real de +3 o más. Fuente: Schlesinger, índices para 6 mazos S17 DAS; para 8 mazos pueden variar en un punto.
- **Desviaciones por composición.** Cuando el EV calculado con las cartas que realmente quedan difiere de la tabla, se muestra como un caso aparte.
- **Información disponible.** Para la decisión propia, el motor usa solo las cartas de los puestos que jugaron antes, más la carta visible del crupier.
- **Verificación.** Una simulación Monte Carlo jugando estrategia básica da una ventaja de la casa de 0,478 % ± 0,052 % con las reglas de referencia, coherente con lo publicado.

### Apuestas

| Semáforo | Conteo real | Sugerencia |
|---|---|---|
| Gris | +1 o menos | Apuesta mínima |
| Amarillo | +2 | Subir de forma moderada |
| Verde | +3 o más | Entrar: subir la apuesta |

- **Ventaja estimada:** -0,34 % + 0,5 % por cada punto de conteo real. Es una aproximación, no una garantía.
- **Rampa de unidades:** múltiplos de la apuesta mínima según el conteo real (por defecto 1, 2, 4, 6 y 8 unidades).
- **Kelly fraccionado:** fracción × ventaja ÷ varianza × capital (por defecto 1/4 de Kelly).
- **Límites:** toda sugerencia se redondea a 1.000 COP y se limita por el máximo de la mesa y por el capital disponible.
- **Riesgo de ruina:** exp(-2 · μ · capital / σ²).

La ventaja del conteo es de alrededor del 1 % con mucha varianza: incluso jugando bien, las rachas perdedoras largas son normales.

## Mesa de referencia

Mesa de crupier en vivo con estas reglas, todas configurables:

| Regla | Valor | Estado |
|---|---|---|
| Pago del blackjack | 3:2 | Confirmado |
| Seguro | 2:1 | Confirmado |
| Crupier | Se planta en todos los 17 (S17) | Confirmado |
| Orden de reparto | De derecha a izquierda desde la vista del jugador | Confirmado |
| Reparto | Dos vueltas; la segunda carta del crupier llega después de jugar los puestos | Confirmado |
| Doblar después de dividir | Permitido | Confirmado |
| Pedir sobre ases divididos | Permitido | Confirmado |
| Mazos | 8 | Por confirmar |
| Carta de corte | Alrededor del 75 % | Por confirmar |
| Rendición, peek, re-dividir ases, cartas quemadas | Configurables | Por confirmar |

## Instalación y ejecución local

### Requisitos

- [Node.js](https://nodejs.org/) LTS
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado)
- [Expo Go](https://expo.dev/go) en el celular, para probar en el dispositivo

### Pasos

```bash
git clone https://github.com/Ander1705/CARTAS.git
cd CARTAS
npm install
npx expo start
```

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias del proyecto. |
| `npx expo start` | Inicia el servidor de desarrollo. |
| Tecla `w` en la terminal | Abre la aplicación en el navegador (`http://localhost:8081`). |
| Código QR con Expo Go | Abre la aplicación en el celular. El celular y el PC deben estar en la misma red Wi-Fi. |

En el celular también se puede abrir `http://<IP-del-PC>:8081` desde el navegador.

En Windows, si PowerShell bloquea `npm` o `npx`, usar `npm.cmd` y `npx.cmd`.

### Verificación

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta las pruebas unitarias (Jest). |
| `npm run typecheck` | Verifica los tipos de TypeScript. |
| `npm run lint` | Revisa el estilo del código. |
| `npm run sim` | Ejecuta la simulación Monte Carlo de la ventaja de la casa. |

### Problemas comunes

| Síntoma | Solución |
|---|---|
| El celular no abre la aplicación | Confirmar que está en la misma red Wi-Fi y que el firewall de Windows permite el puerto 8081. |
| Error de SQLite en el navegador | La web necesita las cabeceras COOP/COEP; en desarrollo ya las configura `metro.config.js`. |
| Cambios que no aparecen | Recargar la página o pulsar `r` en la terminal de Expo. |

## Arquitectura

```
src/
  core/        Lógica pura en TypeScript, sin React ni Expo, con pruebas
               cards, shoe, hilo, rules, composition, dealer, ev,
               strategy, deviations, simulator, table, session, betting
  state/       Estado de la aplicación, reducer con deshacer/rehacer y guardado local
  components/  Mesa, teclado de cartas, panel de conteo, recomendación, ajustes
  app/         Pantallas (expo-router)
  ui/          Tema visual
tools/oraculos/  Verificadores independientes usados para validar el motor
scripts/         Simulación Monte Carlo
docs/            APRENDIZAJE.md: glosario, decisiones y errores del proyecto
```

| Componente | Tecnología |
|---|---|
| Aplicación | React Native, Expo y TypeScript |
| Navegación | expo-router |
| Guardado | expo-sqlite, local y sin servidor |
| Pruebas | Jest (jest-expo) |

Toda la lógica de cálculo vive en `src/core` y se prueba de forma aislada. La interfaz solo muestra resultados y envía acciones.

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Entorno y proyecto base | Completa |
| 1 | Cartas, zapato, conteo Hi-Lo y conteo real | Completa |
| 2 | Reglas, composición del zapato, peek y probabilidades del crupier | Completa |
| 3 | EV, estrategia básica generada, desviaciones y simulación | Completa |
| 4 | Interfaz de mesa, ingreso de cartas y flujo del zapato | Completa |
| 5 | Semáforo, apuestas, manos sin apostar y sesiones | En revisión |
| 6 | Modo práctica, accesibilidad, PWA y empaquetado | Pendiente |
| 7 | Explicaciones con la API de Claude (opcional) | Pendiente |

## Juego responsable

Esta aplicación es una herramienta de estudio. El conteo de cartas da una ventaja pequeña con mucha varianza y no garantiza ganancias. Apuesta solo lo que puedas permitirte perder. Si el juego deja de ser entretenimiento, busca ayuda profesional.
