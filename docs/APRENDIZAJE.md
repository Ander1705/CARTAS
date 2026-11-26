# Cuaderno de aprendizaje — Contador Hi-Lo

Este archivo es tu cuaderno. Se actualiza al cerrar cada fase y tiene tres partes: el glosario, las decisiones con su porqué y los errores que cometimos, con lo que aprendimos de cada uno.

---

## 1. Glosario

### Blackjack y conteo
| Término | Qué es | Ejemplo |
|---|---|---|
| **Hi-Lo** | Sistema de conteo: 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = −1 | Salen 5, K, 3 → +1 −1 +1 = **+1** |
| **Conteo corrido** | Suma de los valores Hi-Lo de todas las cartas vistas desde que se barajó | Va subiendo y bajando carta a carta |
| **Conteo real** | Conteo corrido ÷ mazos que quedan. Permite comparar zapatos de distinto tamaño | Corrido +6 con 3 mazos restantes → real **+2** |
| **Conteo balanceado** | El zapato completo suma 0 | 1 mazo: +20 (2-6) + 0 (7-9) −20 (10s y A) = 0 |
| **Zapato** | Caja con varios mazos barajados juntos (en tu mesa, unos 8) | 8 mazos = 416 cartas |
| **Penetración** | Porcentaje del zapato repartido antes de barajar | Corte al 75 % → se reparten ~312 de 416 cartas |
| **S17** | El crupier se planta con cualquier 17, también con el 17 suave (A+6) | Confirmado en tu mesa |
| **DAS** | Se puede doblar después de dividir (*Double After Split*) | Por confirmar |
| **Peek** | Con un A o un 10 visible, el crupier mira la tapada para ver si tiene blackjack | Por confirmar |
| **EV** (valor esperado) | Lo que ganas o pierdes **en promedio** por unidad apostada con una jugada | EV −0,12 = pierdes 12 centavos por cada peso, en promedio |
| **Estrategia básica** | La mejor jugada para cada mano según las reglas, sin contar cartas | 16 contra un 10 visible → pedir |
| **Desviación por conteo** | Cambiar la jugada básica cuando el conteo real pasa de un índice | Illustrious 18: 16 contra 10 → plantarse si el conteo real ≥ 0 |
| **Desviación por composición** | Cambiar la jugada porque el EV calculado con las cartas reales que quedan así lo indica | Se explica en la Fase 3 |

### Programación
| Término | Qué es |
|---|---|
| **Expo** | Herramienta sobre React Native para tener una sola base de código para Android, iOS y web |
| **expo-router** | Navegación por archivos: cada archivo en `src/app/` es una pantalla con su URL |
| **TypeScript** | JavaScript con tipos; detecta errores antes de ejecutar el código |
| **Jest** | Corre las pruebas automáticas (`npm.cmd test`) |
| **ESLint** | Revisa el código buscando errores y malas prácticas (`npm.cmd run lint`) |
| **SQLite** | Base de datos que vive dentro del dispositivo, sin servidor |
| **Upsert** | "Inserta, y si ya existe, actualiza": `INSERT … ON CONFLICT … DO UPDATE` |
| **Inyección SQL** | Ataque en el que un texto se ejecuta como código SQL. Se evita con parámetros `?` |
| **WebAssembly (wasm)** | Código compilado que el navegador ejecuta rápido; así corre SQLite en la web |
| **COOP/COEP** | Dos cabeceras HTTP que permiten la memoria compartida; SQLite en la web las necesita |
| **Sandbox** | Entorno aislado donde corre Codex, con permisos limitados de red y de escritura |
| **Commit / push** | Guardar una foto de los cambios en git y subirla a GitHub |
| **Inmutabilidad** | No se modifica un estado: cada cambio crea uno nuevo. `dealSeen(zapato, '5')` devuelve otro zapato y el original queda igual. Es la base del deshacer y rehacer |
| **Valor derivado** | Se calcula a partir de otros datos en lugar de guardarse. El conteo corrido se deriva de las cartas vistas, así que nunca puede desincronizarse |
| **−0 (cero negativo)** | `Math.trunc(-0.4)` da −0 en JavaScript. Se ve como 0, pero `Object.is(-0, 0)` es falso. Se normaliza a 0 |
| **Sin reposición** | Cada carta que sale ya no puede volver a salir: las probabilidades cambian después de cada carta. Con un zapato fresco P(10) = 128/416; si sale un 10, la siguiente es P(10) = 127/415 |
| **Probabilidad condicionada** | Recalcular sabiendo algo nuevo. Con peek y un A visible sin blackjack, se descartan los 10 como tapada: P(A) = 31/287 en lugar de 31/415 |
| **Memoización** | Guardar el resultado de un cálculo para no repetirlo. El crupier llega al mismo estado (las mismas cartas restantes y el mismo total) por muchos caminos; se calcula una sola vez |
| **Oráculo** | Una implementación o tabla de referencia independiente contra la que se compara el código. El arquitecto escribe su propio cálculo del crupier y lo compara con el de Codex |
| **Prueba aleatoria (property test)** | Generar miles de casos al azar y comprobar que una propiedad se cumple siempre, por ejemplo que el conteo es igual a la suma de las cartas vistas |

---

## 2. Decisiones y su porqué

| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2026-11-25 | React Native + Expo + TypeScript | Una sola base de código para celular, tablet y PC; ya conoces React Native | Angular + Ionic: sin una ventaja clara para este caso |
| 2026-11-25 | La lógica en `src/core`, sin React ni Expo, **vigilado por ESLint** | Se prueba aislada y miles de veces sin abrir la app. La máquina hace cumplir la regla | Mezclar lógica y pantallas: errores difíciles de encontrar |
| 2026-11-25 | expo-router | Pantallas por archivo y URLs en la web | Navegación manual: más trabajo en la Fase 4 |
| 2026-11-25 | Jest (jest-expo) | Una sola herramienta de pruebas para el core y la interfaz | Vitest: más rápido, pero serían dos herramientas |
| 2026-11-25 | **SQLite local** con SQL compatible con PostgreSQL | Funciona sin internet en la mesa y respeta "sin backend". Lo que aprendes de SQL te sirve para PostgreSQL | PostgreSQL directo: exige servidor e internet |
| 2026-11-25 | La web en modo `static` | Se publica gratis como archivos sueltos, sin servidor | Modo `server`: necesita un servidor encendido |
| 2026-11-25 | Hosting futuro: Cloudflare Pages, Netlify o Vercel | SQLite en la web exige cabeceras COOP/COEP | GitHub Pages: no permite cabeceras propias |
| 2026-11-25 | J, Q y K se guardan como un solo rango `'T'` | Para el conteo y la estrategia solo importa que valen 10. Probabilidades directas: P(10) = 16/52 | 13 rangos internos: más casos sin ningún beneficio |
| 2026-11-25 | `parseRank` rechaza entradas raras (`'1O'`, `'11'`, `'00'`) | Una carta mal tecleada tiene que fallar de forma visible, no contar mal en silencio | Aceptar y adivinar |
| 2026-11-25 | Mazos restantes **exactos** por defecto (cartas restantes ÷ 52), configurable a medio mazo o mazo entero | "Conteo real de lo que se ha descubierto, nada de corazonadas": la app sabe la cifra exacta. Las opciones aproximadas quedan para el modo práctica | Estimar al medio mazo como un humano |
| 2026-11-25 | Para los índices, el conteo real se **trunca hacia cero**, configurable a piso o redondeo. En pantalla se muestra con un decimal | Es la convención habitual. Pendiente en la Fase 3: confirmar con qué convención se calcularon los índices publicados | Piso (cambia las decisiones con conteos negativos) |
| 2026-11-25 | La carta quemada queda dentro de "no vistas" por rango, pero resta de las cartas que quedan en el zapato | Su rango es desconocido: para las probabilidades equivale a una carta no vista. Físicamente ya salió, así que suma a la penetración | Restarla de algún rango (sería inventar) |
| 2026-11-25 | Reglas por confirmar con valores por defecto marcados (DAS sí, rendición no, peek sí, 4 manos al dividir, sin resplit de ases, sin pedir sobre ases divididos, doblar con cualquier mano) | La app funciona desde el día 1 sin asumir nada en silencio: la interfaz mostrará "por confirmar" | Bloquear la app hasta confirmar |
| 2026-11-25 | Las probabilidades usan todas las cartas no vistas (incluidas la quemada y la tapada) | Una carta desconocida es tan aleatoria como cualquier otra no vista: así se calcula la probabilidad exacta | Ignorar la quemada (sesgo) |
| 2026-11-25 | Probabilidades del crupier exactas, por recursión con memoización | Exactitud total con la composición real, en milisegundos | Simular al azar (aproximado y lento) |
| 2026-11-25 | El zapato es inmutable y el conteo se deriva de él | Una sola fuente de verdad, y deshacer y rehacer salen gratis en la Fase 4 | Guardar el conteo aparte (puede desincronizarse) |

---

## 3. Errores que tuvimos y qué aprendimos

| Error | Causa | Solución | Lección |
|---|---|---|---|
| Codex no pudo crear el proyecto (`npm error EACCES`) | Su sandbox no tenía internet | Habilitar la red en `~/.codex/config.toml` (respaldo en `config.toml.bak`) | Las herramientas aisladas necesitan permisos explícitos para descargar |
| La carpeta temporal estaba fuera del proyecto | El sandbox solo deja escribir dentro del proyecto | Crearla en `cartas/.tmp-app` | Revisar **dónde** puede escribir cada herramienta |
| `npm.ps1 … la ejecución de scripts está deshabilitada` | La política de PowerShell de Windows bloquea scripts `.ps1` | Usar `npm.cmd` y `npx.cmd` | En Windows, `npm` es un script de PowerShell; la versión `.cmd` lo esquiva sin tocar la seguridad |
| La plantilla traía la web en modo `server` y el nombre `.tmp-app` | Valores por defecto de la plantilla | Revisar y corregir `app.json` | Nunca aceptar una plantilla sin revisarla: trae supuestos que no son los tuyos |
| Codex dijo "cambié la configuración" sin decir qué | Reporte impreciso | Revisar el diff con `git diff`: no había ningún cambio | **Verificar, no confiar:** el diff dice la verdad, el reporte no siempre |
| Codex "editó las pruebas" tras un primer fallo (Fase 1) | Repartía más de 4 ases en un zapato de 1 mazo | Revisar línea por línea que ningún valor esperado cambió; solo cambió qué cartas se reparten | Cuando alguien cambia una prueba para que pase, se revisa siempre: puede ser legítimo o puede esconder un error |
| La primera versión de `dealer.ts` clasificaba mal el blackjack (Fase 2) | Confundía qué estado representa "2 cartas" | Codex corrigió su código, no las pruebas; el arquitecto lo comparó con su oráculo en 400 zapatos | Las pruebas con valores calculados aparte atrapan errores sutiles que el autor del código no ve |
| Codex dejó una prueba de relleno que no comprobaba nada útil | Exceso de celo por "cubrir" funciones auxiliares | Eliminarla | Una prueba que no puede fallar no prueba nada |

---

## 4. Cómo ejecutar y verificar

```powershell
cd C:\Users\ander\Desktop\cartas
npx.cmd expo start          # servidor; w = navegador, QR o exp://<IP>:8081 = celular
npm.cmd test                # pruebas
npm.cmd run lint            # estilo y reglas (incluida "core sin React")
npm.cmd run typecheck       # tipos
```
