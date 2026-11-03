# SPEC 03 — Niveles progresivos de dificultad

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-03
> **Objetivo:** Encadenar 3 niveles con layout de bloques propio y dificultad creciente (velocidad de la pelota, ancho de la paleta y puntos por bloque), con una pantalla intermedia entre niveles y la victoria al superar el último.

## Por qué existe este spec

El SPEC 01 dejó fuera los niveles y los layouts distintos: al vaciar la cuadrícula la partida termina. Este spec convierte la partida en una secuencia de 3 niveles cada vez más difíciles. Mantiene la arquitectura de los specs anteriores: la configuración vive en `config.js`, las dependencias se inyectan desde `main.js` y solo `Renderer` dibuja.

## Alcance

**Entra:**

- 3 niveles definidos en `CONFIG.levels`, cada uno con su layout de bloques, la velocidad inicial de la pelota, el ancho de la paleta y los puntos por bloque.
- Layouts como array de strings de 13 caracteres: `#` es un bloque y `.` es un hueco. El color sale de la fila, como ahora (`colors[row % colors.length]`).
- La partida empieza siempre en el nivel 1. Al vaciar la cuadrícula de los niveles 1 y 2 se pasa al estado nuevo `LEVEL_CLEAR`. Al vaciar la del nivel 3 se pasa a `WON`.
- La pantalla `LEVEL_CLEAR` tiene el título `NIVEL N` (el nivel siguiente), la línea `Puntos: X   Vidas: Y` y la línea `Pulsa ESPACIO para continuar`. Debajo ya se ve la cuadrícula del nivel nuevo, con la pelota parada sobre la paleta.
- Al pasar de nivel se conservan los puntos y las vidas. La pelota vuelve a la velocidad inicial del nivel nuevo y se reinicia el contador de aceleración.
- Las explosiones en curso siguen animándose en `LEVEL_CLEAR` y se descartan al pulsar Espacio para continuar, igual que en `WON` (SPEC 02).
- Al perder todas las vidas en cualquier nivel se pasa a `GAME_OVER`. Espacio reinicia la partida desde el nivel 1.
- La aceleración se mantiene igual en los tres niveles: +5% cada 10 bloques, con un tope de 1.6× la velocidad inicial del nivel.
- Sub-pasos de física en `updatePlaying` para que la pelota no avance más de 8 px por sub-paso. Así se evita el efecto túnel a 960 px/s.
- HUD en 4 columnas: `PUNTOS`, `NIVEL`, `RÉCORD` y `VIDAS`, con fuente de 14px.
- Un único récord global que suma los puntos de todos los niveles, con la misma clave `arkanoid:highscore:v1`.

**Fuera de alcance (para futuros specs):**

- Selector de modo de dificultad (Fácil/Normal/Difícil) y récord por modo.
- Elegir el nivel de arranque.
- Más de 3 niveles o niveles infinitos.
- Vida extra al superar un nivel.
- Color de bloque por carácter en el layout.
- Bloques especiales (varios golpes, indestructibles, `gray`).
- Guardar el progreso de nivel entre sesiones.
- Sonido o animación propios al pasar de nivel.

## Modelo de datos

### Archivos nuevos y modificados

```
src/
  LevelSequence.js  // nuevo: lista de niveles y nivel actual
  config.js         // modificado: sección levels; se quitan paddle.width, ball.initialSpeed, bricks.rows y bricks.points
  BrickGrid.js      // modificado: load(layout) construye la cuadrícula desde un layout; desaparece reset()
  Paddle.js         // modificado: setWidth(width)
  Ball.js           // modificado: setInitialSpeed(speed); el constructor ya no recibe initialSpeed
  ScoreBoard.js     // modificado: setPointsPerBrick(points); el constructor ya no recibe points
  Game.js           // modificado: estado LEVEL_CLEAR, loadLevel(), sub-pasos de física
  Renderer.js       // modificado: HUD de 4 columnas con el nivel
  main.js           // modificado: crea e inyecta LevelSequence y ajusta los constructores
```

### Configuración (`src/config.js`)

```js
paddle: { height: 14, speed: 420, bottomOffset: 40 },      // width pasa a levels
ball: {
  size: 12,                                                 // initialSpeed pasa a levels
  speedStep: 0.05,
  bricksPerStep: 10,
  maxSpeedFactor: 1.6,
  maxBounceAngle: Math.PI / 3,
  launchAngleRange: Math.PI / 6,
},
bricks: {
  cols: 13, width: 32, height: 16, gap: 2,                  // rows sale del layout; points pasa a levels
  offsetTop: 80, offsetLeft: 20,
  colors: [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ],
},
levels: [
  {
    ballSpeed: 400, paddleWidth: 96, points: 10,           // nivel 1: cuadrícula completa, 78 bloques
    layout: [
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
      '#############',
    ],
  },
  {
    ballSpeed: 500, paddleWidth: 76, points: 25,           // nivel 2: pirámide invertida, 48 bloques
    layout: [
      '#############',
      '.###########.',
      '..#########..',
      '...#######...',
      '....#####....',
      '.....###.....',
    ],
  },
  {
    ballSpeed: 600, paddleWidth: 60, points: 50,           // nivel 3: tablero de ajedrez, 39 bloques
    layout: [
      '#.#.#.#.#.#.#',
      '.#.#.#.#.#.#.',
      '#.#.#.#.#.#.#',
      '.#.#.#.#.#.#.',
      '#.#.#.#.#.#.#',
      '.#.#.#.#.#.#.',
    ],
  },
],
```

La puntuación máxima posible es 78 × 10 + 48 × 25 + 39 × 50 = 3930.

### Entidades

```js
// LevelSequence
{ levels, index }               // get current(), get number(), isLast(), advance(), reset()

// BrickGrid
{ bricks: Brick[] }             // load(layout), findHit(rect), aliveCount(), allDestroyed()

// Paddle
{ x, y, width, height, speed }  // + setWidth(width)

// Ball
{ ..., initialSpeed, maxSpeed } // + setInitialSpeed(speed): initialSpeed = speed, maxSpeed = speed * maxSpeedFactor

// ScoreBoard
{ ..., pointsPerBrick }         // + setPointsPerBrick(points)
```

- `LevelSequence.number` es `index + 1`. `reset()` vuelve al índice 0. `advance()` pasa al nivel siguiente y no hace nada si ya está en el último.
- `BrickGrid.load(layout)` sustituye todos los bloques. Lanza un `Error` si una fila no mide `cols` caracteres o contiene algo distinto de `#` o `.`.
- `Ball.setInitialSpeed` no cambia `speed`. La velocidad se aplica con el `resetSpeed()` que ya hace `placeOnPaddle()`.

### Estado del juego (`Game`)

```js
const GameState = Object.freeze( {
  START: 'start',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'levelclear',
  WON: 'won',
  GAME_OVER: 'gameover',
} );
```

Transiciones:

- `START` → Espacio → `newGame()` → `PLAYING` en el nivel 1.
- `PLAYING`, cuadrícula vacía y no es el último nivel: `levels.advance()`, luego `loadLevel()` y se pasa a `LEVEL_CLEAR`.
- `PLAYING`, cuadrícula vacía y es el último nivel: se pasa a `WON`.
- `LEVEL_CLEAR` → Espacio → `explosions.clear()`, luego `startRound()` y se pasa a `PLAYING`.
- `WON` / `GAME_OVER` → Espacio → `newGame()`.

`loadLevel()` aplica `levels.current`: llama a `brickGrid.load(layout)`, `paddle.setWidth(paddleWidth)`, `ball.setInitialSpeed(ballSpeed)` y `scoreBoard.setPointsPerBrick(points)`, y después a `placeOnPaddle()`. El constructor de `Game` llama a `loadLevel()` para que la pantalla de inicio ya muestre el nivel 1.

### Sub-pasos de física

```js
const MAX_STEP_DISTANCE = 8; // px que avanza la pelota como máximo por sub-paso
```

`updatePlaying(dt)` mueve la paleta una vez con el `dt` completo. Luego calcula `steps = Math.max(1, Math.ceil(ball.speed * dt / MAX_STEP_DISTANCE))` y repite `steps` veces con `dt / steps`: mover la pelota, paredes y paleta (con su sonido de rebote), bloques y caída. El bucle se corta en cuanto el estado deja de ser `PLAYING` o se pierde una vida. A 960 px/s con `dt = 1/30` salen 4 sub-pasos.

### Inyección de dependencias

```js
new Game( { renderer, input, scoreBoard, paddle, ball, brickGrid, explosions, sound, levels, config: CONFIG } )
```

`main.js` crea `new LevelSequence(CONFIG.levels)`, `new ScoreBoard(highScoreStore, { lives: CONFIG.lives })` y `new Paddle(CONFIG.paddle, paddleY)`. `Paddle` empieza con `width = 0` hasta que `loadLevel()` le pone el ancho.

### Convenciones

- Hay una sola fuente de verdad por parámetro: lo que cambia por nivel solo existe en `levels`.
- `Renderer.drawHud(scoreBoard, levelNumber)` recibe el número de nivel; `Renderer` no conoce `LevelSequence`.
- Se rompe como máximo un bloque por sub-paso (antes era por frame).

## Plan de implementación

1. Añadir `levels` a `src/config.js` sin quitar todavía ningún campo existente. Crear `src/LevelSequence.js` e inyectarlo en `Game` desde `main.js`. Prueba manual: el juego carga y se juega igual que antes, sin errores en la consola.
2. Sustituir la construcción de la cuadrícula de `BrickGrid` por `load(layout)` y quitar `reset()`. El constructor de `Game` y `newGame()` llaman a `brickGrid.load(levels.current.layout)`. Quitar `bricks.rows`. Prueba manual: el nivel 1 muestra los mismos 78 bloques. Si se cambia temporalmente el índice inicial de `LevelSequence` a 1 y luego a 2, se ven la pirámide y el tablero de ajedrez.
3. Añadir `Paddle.setWidth`, `Ball.setInitialSpeed` y `ScoreBoard.setPointsPerBrick`, y crear `Game.loadLevel()` para que aplique los cuatro parámetros. Quitar `paddle.width`, `ball.initialSpeed` y `bricks.points` de `config.js` y ajustar los constructores y `main.js`. Prueba manual: el nivel 1 se juega igual que antes, con paleta de 96 px, pelota a 400 px/s y 10 puntos por bloque.
4. Implementar los sub-pasos de física en `updatePlaying`. Prueba manual: poner temporalmente `ballSpeed: 960` en el nivel 1 y comprobar que la pelota no atraviesa bloques ni la paleta. Después restaurar el valor.
5. Añadir el estado `LEVEL_CLEAR` con sus transiciones y su pantalla. `WON` queda solo para el último nivel, y Espacio en `LEVEL_CLEAR` descarta las explosiones y relanza la pelota. Prueba manual (con layouts temporales de un solo bloque): al vaciar el nivel 1 aparece `NIVEL 2` sobre la pirámide con la paleta más estrecha. Espacio continúa con los mismos puntos y vidas. Al vaciar el nivel 3 aparece `¡VICTORIA!`. Restaurar los layouts.
6. Pasar el HUD a 4 columnas con `NIVEL N` y fuente de 14px. Prueba manual: el HUD muestra el nivel correcto en los tres niveles y ningún texto se solapa con el récord de 4 cifras.

## Criterios de aceptación

- [ ] El juego carga sin errores en la consola y la pantalla de inicio muestra la cuadrícula completa del nivel 1.
- [ ] El nivel 1 tiene 78 bloques, una paleta de 96 px, la pelota a 400 px/s y 10 puntos por bloque.
- [ ] El nivel 2 tiene 48 bloques en forma de pirámide invertida, una paleta de 76 px, la pelota a 500 px/s y 25 puntos por bloque.
- [ ] El nivel 3 tiene 39 bloques en tablero de ajedrez, una paleta de 60 px, la pelota a 600 px/s y 50 puntos por bloque.
- [ ] Al vaciar el nivel 1 o el 2 aparece la pantalla `NIVEL N`, con N el nivel siguiente, los puntos, las vidas y `Pulsa ESPACIO para continuar`.
- [ ] Bajo la pantalla `NIVEL N` ya se ve el layout del nivel nuevo, con la pelota parada sobre la paleta.
- [ ] Al pulsar Espacio en `LEVEL_CLEAR` la pelota se lanza sola y los puntos y las vidas son los mismos que antes de pasar de nivel.
- [ ] La explosión del último bloque de un nivel se completa bajo la pantalla `NIVEL N` y no queda ninguna al pulsar Espacio.
- [ ] Al vaciar el nivel 3 aparece `¡VICTORIA!`, y no `NIVEL 4`.
- [ ] Al perder la última vida en cualquier nivel aparece `GAME OVER`, y Espacio reinicia en el nivel 1 con 0 puntos y 3 vidas.
- [ ] Al empezar cada nivel la pelota va a la velocidad inicial de ese nivel. Tras 10 bloques en ese nivel va a 1.05× y nunca supera 1.6× esa velocidad.
- [ ] A 960 px/s la pelota no atraviesa bloques ni la paleta.
- [ ] El HUD muestra `PUNTOS`, `NIVEL`, `RÉCORD` y `VIDAS` sin que se solapen, con el número de nivel correcto.
- [ ] El récord suma los puntos de todos los niveles y sobrevive a una recarga con la clave `arkanoid:highscore:v1`.
- [ ] Un layout con una fila de longitud distinta de 13 o con un carácter inválido produce un `Error` claro en la consola.
- [ ] `paddle.width`, `ball.initialSpeed`, `bricks.rows` y `bricks.points` ya no existen en `config.js`.
- [ ] `Game` recibe `levels` por constructor y solo `main.js` crea `LevelSequence` con `new`.
- [ ] Ningún archivo de `src/` salvo `Renderer.js` llama a `drawSprite` ni a `drawFrame`, ni usa el contexto del canvas.
- [ ] `assets/` no ha cambiado.

## Decisiones

- **Sí:** niveles progresivos. Lo eligió el usuario.
- **No:** un selector de modo Fácil/Normal/Difícil ni un récord por modo. Se plantearon y se descartaron para este spec, y se dejan para otro.
- **Sí:** 3 niveles y la victoria al terminar el último. Es finito y fácil de probar.
- **No:** niveles infinitos.
- **Sí:** un layout distinto por nivel. Lo eligió el usuario; los 3 layouts los propuso el agente y se revisan en el spec.
- **Sí:** layouts como array de strings con `#` y `.`. Son legibles y se editan a ojo en `config.js`.
- **No:** color por carácter ni matrices de 0/1. El primero es menos legible y las segundas más verbosas.
- **Sí:** escalado agresivo: 400/500/600 px/s, paleta de 96/76/60 px y 10/25/50 puntos. Lo eligió el usuario.
- **Sí:** sub-pasos de física de 8 px como máximo. Con el escalado agresivo la pelota llega a 960 px/s (32 px por frame con `dt = 1/30`), que supera la ventana de choque de 28 px que garantizaba el SPEC 01. Los sub-pasos sirven para cualquier velocidad futura sin tocar los valores elegidos.
- **No:** un tope de velocidad por nivel, porque anularía casi toda la aceleración en el nivel 3.
- **No:** bajar `MAX_DT` a 1/60, que sigue al límite y ralentiza el juego en pantallas de 30 Hz.
- **Sí:** un estado nuevo `LEVEL_CLEAR` con Espacio para continuar. Da un respiro al jugador y reutiliza `drawMessage`.
- **Sí:** el nivel nuevo se carga al entrar en `LEVEL_CLEAR`, así que se ve debajo del mensaje.
- **Sí:** se conservan los puntos y las vidas entre niveles, sin vida extra.
- **Sí:** la velocidad y el contador de aceleración se reinician en cada nivel, por coherencia con el reinicio al perder una vida del SPEC 01.
- **Sí:** las explosiones se descartan al pulsar Espacio en `LEVEL_CLEAR` y no al entrar. Así la última explosión se ve completa, como en `WON` (SPEC 02).
- **Sí:** una sola fuente de verdad. Los parámetros por nivel se quitan de `paddle`, `ball` y `bricks` para que no haya dos valores contradictorios.
- **Sí:** `LevelSequence` como clase propia inyectada. `Game` no indexa arrays de config y la secuencia se puede sustituir en tests futuros.
- **Sí:** un único récord global con la clave `v1`. Los récords antiguos (máximo 780) siguen siendo comparables, porque la partida sigue empezando por el mismo nivel 1.
- **Sí:** HUD de 4 columnas con fuente de 14px, para que quepan las cuatro etiquetas en 480 px.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Efecto túnel a 960 px/s | Sub-pasos de 8 px como máximo. Es bastante menos que la ventana de choque de un bloque (28 px) y de la paleta (26 px). |
| El bucle de sub-pasos sigue tras ganar, pasar de nivel o perder una vida | Se corta en cuanto el estado deja de ser `PLAYING` o se pierde una vida. |
| `Paddle`, `Ball` o `ScoreBoard` se usan antes de `loadLevel()` con ancho, velocidad o puntos a 0 | El constructor de `Game` llama a `loadLevel()` antes del primer frame. |
| Una errata en un layout de `config.js` | `BrickGrid.load` valida la longitud y los caracteres y lanza un `Error` explícito. |
| La pelota se queda atrapada rebotando dentro de los huecos del tablero de ajedrez | Aceptado: el hueco (34 px) es mayor que la pelota (12 px) y la colisión sigue siendo de un bloque por sub-paso. Si molesta en la práctica, se ajusta el layout. |
| Una paleta de 60 px dibujada con el sprite de 162 px se ve demasiado comprimida | Aceptado: ya se dibuja escalada a 96 px. Si se ve mal, se cambia el valor en `levels`. |
| El texto del HUD se solapa con puntuaciones de 4 cifras | Columnas de 120 px y fuente de 14px; `RÉCORD 3930` mide unos 95 px. |

## Lo que **no** entra en este spec

- Modos de dificultad elegibles y récord por modo.
- Elegir el nivel inicial.
- Más de 3 niveles o niveles infinitos.
- Vida extra por nivel.
- Bloques especiales y color por carácter en el layout.
- Persistir el progreso de nivel.
- Efectos de sonido o animación al pasar de nivel.

Si alguna de estas cosas llega a hacerse, irá en su propio spec.
