export const CONFIG = Object.freeze( {
  canvas: { width: 480, height: 640 },
  hud: { height: 40 },
  paddle: { width: 96, height: 14, speed: 420, bottomOffset: 40 }, // speed en px/s
  ball: {
    size: 12,
    initialSpeed: 400,             // px/s
    speedStep: 0.05,               // +5%
    bricksPerStep: 10,
    maxSpeedFactor: 1.6,
    maxBounceAngle: Math.PI / 3,   // 60° respecto a la vertical
    launchAngleRange: Math.PI / 6, // saque: ±30° respecto a la vertical, hacia arriba
  },
  bricks: {
    rows: 6, cols: 13, width: 32, height: 16, gap: 2,
    offsetTop: 80, offsetLeft: 20,
    colors: [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ], // una por fila
    points: 10,
  },
  sounds: {
    break: 'assets/sounds/break-sound.mp3',
    bounce: 'assets/sounds/ball-bounce.mp3',
  },
  explosion: { duration: EXPLOSION_DURATION }, // ms, global de spritesheet.js
  lives: 3,
  storageKey: 'arkanoid:highscore:v1',
} );
