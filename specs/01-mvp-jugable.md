# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-22
> **Objetivo:** Construir una partida completa de Arkanoid en el navegador con paleta controlada por teclado, pelota, cuadrícula de bloques, puntos, vidas y récord persistente.

## Por qué existe este spec

Es el primer código del proyecto. Además de hacer el juego jugable, fija la arquitectura sobre la que se apoyarán los specs siguientes. El usuario pidió explícitamente seguir principios SOLID y buenas prácticas. Por eso cada responsabilidad vive en su propia clase y su propio archivo, y las dependencias se inyectan en lugar de crearse dentro de las clases.

## Alcance

**Entra:**

- `index.html` con un `<canvas>` de 480×640 que carga `assets/spritesheet.js` como script clásico y `src/main.js` como ES module.
- Paleta controlada solo con teclado (flechas izquierda/derecha y A/D), limitada a los bordes del canvas.
- Pelota con lanzamiento automático al empezar la partida y tras perder una vida.
- Rebote en paredes laterales y techo.
- Rebote en la paleta con ángulo según el punto de impacto.
- Cuadrícula de 6 filas × 13 columnas de bloques; cada bloque se rompe de un golpe.
- 10 puntos por bloque roto.
- 3 vidas; se pierde una cuando la pelota sale por el borde inferior.
- Aceleración de la pelota: +5% cada 10 bloques rotos, con tope de 1.6× la velocidad inicial; se reinicia al perder una vida.
- Estados de juego: inicio → jugando → victoria / game over, con Espacio para empezar y reiniciar.
- HUD en canvas con puntos, vidas y récord.
- Mejor puntuación persistida en `localStorage`.

**Fuera de alcance (para futuros specs):**

- Sonidos (`assets/sounds/*`).
- Animaciones de explosión (`EXPLOSION_FRAMES`).
- Control con ratón o táctil.
- Pausa.
- Varios niveles o layouts distintos.
- Bloques con varios golpes o indestructibles.
- Power-ups.
- Tests automatizados, `package.json` o build.

## Modelo de datos

### Estructura de archivos

```
index.html
src/
  main.js            // arranque: loadSpritesheet -> composición de dependencias -> game.start()
  config.js          // constantes del juego (export const CONFIG)
  Game.js            // game loop (requestAnimationFrame + delta time) y máquina de estados
  InputHandler.js    // estado del teclado
  Paddle.js
  Ball.js
  Brick.js
  BrickGrid.js       // crea y consulta la cuadrícula 6×13
  Collision.js       // funciones puras de colisión (sin estado ni canvas)
  ScoreBoard.js      // puntos, vidas, récord y bloques rotos
  HighScoreStore.js  // lectura/escritura en localStorage
  Renderer.js        // único módulo que dibuja en el canvas y usa drawSprite
```

### Configuración (`src/config.js`)

```js
export const CONFIG = {
  canvas: { width: 480, height: 640 },
  hud: { height: 40 },
  paddle: { width: 96, height: 14, speed: 420, bottomOffset: 40 },   // speed en px/s
  ball: {
    size: 12,
    initialSpeed: 400,          // px/s
    speedStep: 0.05,            // +5%
    bricksPerStep: 10,
    maxSpeedFactor: 1.6,
    maxBounceAngle: Math.PI / 3, // 60° respecto a la vertical
    launchAngleRange: Math.PI / 6, // saque: ±30° respecto a la vertical, hacia arriba
  },
  bricks: {
    rows: 6, cols: 13, width: 32, height: 16, gap: 2,
    offsetTop: 80, offsetLeft: 20,
    colors: ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'], // una por fila
    points: 10,
  },
  lives: 3,
  storageKey: 'arkanoid:highscore:v1',
};
```

13 columnas × 32 px + 12 huecos × 2 px = 440 px, centrados con 20 px de margen a cada lado.

### Entidades

```js
// Paddle
{ x, y, width, height, speed }          // moveLeft(dt), moveRight(dt), clamp(minX, maxX)

// Ball
{ x, y, size, vx, vy, speed }           // update(dt), launch(angle), resetOn(paddle)

// Brick
{ x, y, width, height, color, alive }   // color ∈ CONFIG.bricks.colors

// BrickGrid
{ bricks: Brick[] }                     // aliveCount(), allDestroyed()

// ScoreBoard
{ score, lives, highScore, bricksBroken }
```

### Estado del juego (`Game`)

```js
const GameState = Object.freeze({
  START: 'start',
  PLAYING: 'playing',
  WON: 'won',
  GAME_OVER: 'gameover',
});
```

### Inyección de dependencias

`main.js` es el único sitio que hace `new` de las dependencias y las pasa a `Game`:

```js
new Game({ renderer, input, scoreBoard, paddle, ball, brickGrid, config: CONFIG })
```

`ScoreBoard` recibe un `HighScoreStore` en su constructor. `HighScoreStore` expone `load(): number` y `save(score: number): void`.

### Convenciones

- Coordenadas con origen arriba a la izquierda.
- Velocidades en píxeles por segundo, multiplicadas por `dt` en segundos.
- `dt` se limita a un máximo de 1/30 s para evitar túneles tras cambiar de pestaña.
- Solo `Renderer` usa los globales `drawSprite` y `ctx`. El resto de clases no conoce el canvas.

## Plan de implementación

**Prerrequisito:** el directorio no es un repositorio git. Ejecuta `git init` y haz un commit inicial antes de lanzar `/spec-impl`.

1. Crear `index.html`, `src/config.js` y `src/main.js`. `main.js` llama a `loadSpritesheet` y, en su callback, pinta el canvas de negro. Prueba manual: servir con `npx serve .`, abrir la página y ver el canvas negro de 480×640 sin errores en la consola.
2. Crear `src/Renderer.js` y `src/Game.js` con el loop basado en `requestAnimationFrame` y `dt` limitado. Prueba manual: el loop corre y limpia el canvas en cada frame.
3. Crear `src/InputHandler.js` y `src/Paddle.js` y conectarlos a `Game` y `Renderer`. Prueba manual: la paleta se dibuja con el sprite `paddle`, se mueve con flechas y A/D, y no sale del canvas.
4. Crear `src/Ball.js` y `src/Collision.js` con el rebote en paredes, techo y paleta según el punto de impacto. Añadir el lanzamiento automático con un ángulo aleatorio dentro de `launchAngleRange`. Prueba manual: la pelota sale sola, rebota y cambia de ángulo según dónde toque la paleta. Si cae, se recoloca sobre la paleta y vuelve a lanzarse.
5. Crear `src/Brick.js` y `src/BrickGrid.js`, y añadir a `Collision.js` la colisión pelota–bloque. La pelota invierte el eje de menor penetración y rompe como máximo un bloque por frame. Prueba manual: se ven 6 filas de colores y los bloques desaparecen al golpearlos.
6. Crear `src/ScoreBoard.js` con un `HighScoreStore` en memoria temporal, que suma puntos y gestiona las vidas. Dibujar el HUD en `Renderer`. Prueba manual: cada bloque suma 10 puntos y perder la pelota resta una vida.
7. Implementar en `Game` la máquina de estados `START → PLAYING → WON | GAME_OVER` y las pantallas de texto. Espacio empieza y reinicia la partida. Prueba manual: se recorre el flujo completo de inicio, partida, derrota y reinicio.
8. Implementar la aceleración de la pelota en `Ball` y `Game`: +5% cada 10 bloques, tope 1.6× y vuelta a la velocidad inicial al perder una vida. Prueba manual: la pelota se nota más rápida tras romper bloques.
9. Crear `src/HighScoreStore.js` con `localStorage`, la clave `arkanoid:highscore:v1`, `try/catch` y respaldo en memoria. Inyectarlo en `ScoreBoard` desde `main.js`. Prueba manual: el récord sobrevive a una recarga de la página.

## Criterios de aceptación

- [ ] Al servir la raíz por HTTP y abrir `index.html`, el juego carga sin errores en la consola.
- [ ] El canvas mide 480×640 y muestra la pantalla de inicio con el texto para pulsar Espacio.
- [ ] Pulsar Espacio en la pantalla de inicio empieza la partida y la pelota se lanza sola hacia arriba.
- [ ] Las flechas izquierda/derecha y las teclas A/D mueven la paleta.
- [ ] La paleta nunca sale de los bordes del canvas.
- [ ] La pelota rebota en las paredes laterales, en el techo y en la paleta.
- [ ] Golpear la paleta cerca de un extremo desvía la pelota hacia ese lado más que golpearla en el centro.
- [ ] Se dibujan 6 filas × 13 columnas de bloques, cada fila de un color.
- [ ] Un bloque desaparece al primer golpe y suma exactamente 10 puntos.
- [ ] Cuando la pelota sale por abajo se resta una vida y la pelota se relanza sola desde la paleta.
- [ ] Al perder la tercera vida aparece la pantalla de game over con la puntuación y el récord.
- [ ] Al romper los 78 bloques aparece la pantalla de victoria con la puntuación y el récord.
- [ ] En game over y en victoria, pulsar Espacio reinicia la partida con 0 puntos, 3 vidas y todos los bloques.
- [ ] Tras romper 10 bloques la velocidad de la pelota es 1.05× la inicial.
- [ ] La velocidad de la pelota nunca supera 1.6× la inicial.
- [ ] Tras perder una vida, la pelota vuelve a la velocidad inicial.
- [ ] El HUD muestra puntos, vidas y récord durante la partida.
- [ ] Al superar el récord y recargar la página, el HUD muestra el nuevo récord.
- [ ] Con `localStorage` bloqueado el juego se puede jugar igual, aunque el récord no persista.
- [ ] Ningún archivo de `src/` salvo `Renderer.js` llama a `drawSprite` ni usa el contexto del canvas.
- [ ] Ninguna clase salvo `main.js` crea con `new` las dependencias de otra; todas se reciben por constructor.

## Decisiones

- **Sí:** ES modules con una clase por archivo. Responden al pedido de SOLID (responsabilidad única) y dejan las dependencias explícitas con `import`.
- **No:** scripts clásicos con globales. Son coherentes con `spritesheet.js`, pero dependen del orden de carga y esconden las dependencias.
- **Sí:** `spritesheet.js` se carga como script clásico y solo `Renderer` usa sus globales. Así el asset no cambia y el acoplamiento queda aislado en un único punto.
- **Sí:** inyección de dependencias desde `main.js` y `HighScoreStore` inyectable. `ScoreBoard` no depende de `localStorage` y se puede probar en el futuro con un store falso.
- **Sí:** `Collision.js` con funciones puras. No tiene estado ni conoce el canvas, así que es el primer candidato a tests unitarios.
- **Sí:** solo teclado. Lo eligió el usuario.
- **No:** ratón ni táctil, que se dejan para otro spec.
- **Sí:** lanzamiento automático de la pelota. Lo eligió el usuario. Espacio solo sirve para salir de las pantallas de inicio y de fin.
- **No:** pelota pegada a la paleta con lanzamiento manual.
- **Sí:** ángulo de rebote según el punto de impacto en la paleta, con un máximo de 60°. Da control al jugador.
- **No:** reflexión simple, porque es predecible y aburrida.
- **Sí:** canvas vertical de 480×640 con bloques a su tamaño nativo de 32×16. Imita el original y evita escalar los sprites.
- **No:** canvas de 800×600.
- **Sí:** paleta dibujada a 96×14 en lugar de los 162 px nativos, porque a 162 px ocuparía un tercio del ancho.
- **Sí:** una fila por color sin `gray`. Hay 7 colores y 6 filas, y `gray` se reserva para futuros bloques especiales.
- **Sí:** velocidades en px/s con `dt` limitado a 1/30 s. El juego va igual a 60 y a 144 Hz y se evitan túneles tras cambiar de pestaña.
- **Sí:** aceleración de +5% cada 10 bloques, con tope de 1.6× y reinicio al perder una vida, para que perder una vida no castigue doble.
- **Sí:** récord en `localStorage` bajo la clave versionada `arkanoid:highscore:v1`, por si en el futuro cambia el formato.
- **No:** sonidos ni explosiones. El usuario los dejó fuera del MVP aunque los assets existen.
- **No:** pausa, que el usuario no la seleccionó.
- **No:** tests automatizados ni `package.json`. La verificación es manual en el navegador y el MVP se queda sin build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los ES modules no cargan con `file://` (CORS) | Servir siempre la raíz por HTTP (`npx serve .` o `python -m http.server`), como ya indica `CLAUDE.md`. |
| `src/main.js` se ejecuta antes de que existan los globales de `spritesheet.js` | El `<script>` clásico va antes del `type="module"`. Los módulos se difieren, así que los globales ya existen. |
| Efecto túnel: la pelota atraviesa un bloque o la paleta con un `dt` grande | `dt` limitado a 1/30 s. A la velocidad máxima de 640 px/s son unos 21 px por frame. Es menos que la ventana de choque con un bloque (16 + 12 = 28 px) y con la paleta (14 + 12 = 26 px). |
| La pelota se queda atrapada rebotando dentro de la paleta | Al rebotar en la paleta se fuerza `vy < 0` y la pelota se recoloca justo encima de la paleta. |
| La pelota entra en un bucle casi horizontal | El rebote en la paleta limita el ángulo a 60° respecto a la vertical. |
| `localStorage` lanza una excepción (modo privado o datos bloqueados) | `HighScoreStore` envuelve las lecturas y escrituras en `try/catch` y recurre a memoria. |
| El directorio no es un repositorio git y `/spec-impl` lo necesita | Ejecutar `git init` y un commit inicial antes de implementar. |

## Lo que **no** entra en este spec

- Sonidos y animaciones de explosión.
- Control con ratón o táctil.
- Pausa.
- Varios niveles.
- Bloques especiales, como los de varios golpes o los indestructibles.
- Power-ups.
- Tests automatizados y tooling (`package.json`, build, lint).

Si alguna de estas cosas llega a hacerse, irá en su propio spec.
