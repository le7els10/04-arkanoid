export const CONFIG = Object.freeze( {
  canvas: { width: 480, height: 640 },
  hud: { height: 40 },
  paddle: { height: 14, speed: 420, bottomOffset: 40 }, // speed en px/s; el ancho lo pone cada nivel
  ball: {
    size: 12,                      // la velocidad inicial la pone cada nivel
    speedStep: 0.05,               // +5%
    bricksPerStep: 10,
    maxSpeedFactor: 1.6,
    maxBounceAngle: Math.PI / 3,   // 60° respecto a la vertical
    launchAngleRange: Math.PI / 6, // saque: ±30° respecto a la vertical, hacia arriba
  },
  bricks: {
    cols: 13, width: 32, height: 16, gap: 2, // las filas salen del layout de cada nivel
    offsetTop: 80, offsetLeft: 20,
    colors: [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ], // una por fila
  },
  // '#' = bloque, '.' = hueco. ballSpeed en px/s, paddleWidth en px, points por bloque.
  levels: [
    {
      ballSpeed: 400, paddleWidth: 96, points: 10, // cuadrícula completa, 78 bloques
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
      ballSpeed: 500, paddleWidth: 76, points: 25, // pirámide invertida, 48 bloques
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
      ballSpeed: 600, paddleWidth: 60, points: 50, // tablero de ajedrez, 39 bloques
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
  sounds: {
    break: 'assets/sounds/break-sound.mp3',
    bounce: 'assets/sounds/ball-bounce.mp3',
  },
  explosion: { duration: EXPLOSION_DURATION }, // ms, global de spritesheet.js
  lives: 3,
  storageKey: 'arkanoid:highscore:v1',
} );
