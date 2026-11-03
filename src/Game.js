import { reflectInBounds, intersects, paddleBounceVelocity, brickBounceVelocity } from './Collision.js';

export const GameState = Object.freeze( {
  START: 'start',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'levelclear',
  WON: 'won',
  GAME_OVER: 'gameover',
} );

const MAX_DT = 1 / 30; // evita túneles tras cambiar de pestaña
const MAX_STEP_DISTANCE = 8; // px que avanza la pelota como máximo por sub-paso

export class Game {
  constructor( { renderer, input, scoreBoard, paddle, ball, brickGrid, explosions, sound, levels, config } ) {
    this.renderer = renderer;
    this.input = input;
    this.scoreBoard = scoreBoard;
    this.paddle = paddle;
    this.ball = ball;
    this.brickGrid = brickGrid;
    this.explosions = explosions;
    this.sound = sound;
    this.levels = levels;
    this.config = config;

    this.state = GameState.START;
    this.bricksThisLife = 0;
    this.lastTime = null;
    this.loadLevel(); // la pantalla de inicio ya muestra el nivel 1
  }

  start() {
    requestAnimationFrame( time => this.loop( time ) );
  }

  loop( time ) {
    const dt = this.lastTime === null ? 0 : Math.min( ( time - this.lastTime ) / 1000, MAX_DT );
    this.lastTime = time;

    this.update( dt );
    this.render();
    this.input.endFrame();

    requestAnimationFrame( t => this.loop( t ) );
  }

  update( dt ) {
    this.explosions.update( dt ); // en todos los estados: la última explosión se ve completa al ganar

    if ( this.state === GameState.PLAYING ) {
      this.updatePlaying( dt );
    } else if ( this.input.wasPressed( 'Space' ) ) {
      if ( this.state === GameState.LEVEL_CLEAR ) {
        this.continueLevel();
      } else {
        this.newGame();
      }
    }
  }

  newGame() {
    this.scoreBoard.reset();
    this.levels.reset();
    this.loadLevel();
    this.explosions.clear();
    this.startRound();
    this.state = GameState.PLAYING;
  }

  // Aplica el nivel actual: bloques, ancho de paleta, velocidad de la pelota y puntos.
  loadLevel() {
    const { layout, paddleWidth, ballSpeed, points } = this.levels.current;
    this.brickGrid.load( layout );
    this.paddle.setWidth( paddleWidth );
    this.ball.setInitialSpeed( ballSpeed );
    this.scoreBoard.setPointsPerBrick( points );
    this.placeOnPaddle();
  }

  // Cuadrícula vacía: victoria en el último nivel; si no, se carga el siguiente bajo el mensaje.
  completeLevel() {
    if ( this.levels.isLast() ) {
      this.state = GameState.WON;
      return;
    }
    this.levels.advance();
    this.loadLevel();
    this.state = GameState.LEVEL_CLEAR;
  }

  continueLevel() {
    this.explosions.clear();
    this.startRound();
    this.state = GameState.PLAYING;
  }

  placeOnPaddle() {
    this.paddle.centerAt( this.config.canvas.width / 2 );
    this.ball.resetSpeed();
    this.ball.resetOn( this.paddle );
    this.bricksThisLife = 0;
  }

  // Nueva vida: paleta centrada, velocidad inicial y saque automático.
  startRound() {
    this.placeOnPaddle();
    const range = this.config.ball.launchAngleRange;
    this.ball.launch( ( Math.random() * 2 - 1 ) * range );
  }

  // La física se divide en sub-pasos para que la pelota no avance más de MAX_STEP_DISTANCE
  // de golpe y no atraviese bloques ni la paleta a velocidades altas.
  updatePlaying( dt ) {
    this.movePaddle( dt );

    const steps = Math.max( 1, Math.ceil( this.ball.speed * dt / MAX_STEP_DISTANCE ) );
    const stepDt = dt / steps;
    for ( let i = 0; i < steps; i++ ) {
      if ( !this.stepBall( stepDt ) ) break;
    }
  }

  // Devuelve false si hay que cortar los sub-pasos: cambió el estado o se perdió una vida.
  stepBall( dt ) {
    this.ball.update( dt );

    const before = { vx: this.ball.vx, vy: this.ball.vy };
    this.handleWalls();
    this.handlePaddle();
    if ( this.didBounce( before ) ) this.sound.play( 'bounce' );

    this.handleBricks();
    if ( this.state !== GameState.PLAYING ) return false;
    return !this.handleFall();
  }

  // Hubo rebote si cambió el signo de alguna componente de la velocidad.
  didBounce( { vx, vy } ) {
    return Math.sign( vx ) !== Math.sign( this.ball.vx ) || Math.sign( vy ) !== Math.sign( this.ball.vy );
  }

  movePaddle( dt ) {
    if ( this.input.isLeft() ) this.paddle.moveLeft( dt );
    if ( this.input.isRight() ) this.paddle.moveRight( dt );
    this.paddle.clamp( 0, this.config.canvas.width );
  }

  handleWalls() {
    const { x, y, vx, vy } = reflectInBounds( this.ball, {
      minX: 0,
      maxX: this.config.canvas.width,
      minY: this.config.hud.height,
    } );
    this.ball.x = x;
    this.ball.y = y;
    this.ball.setVelocity( { vx, vy } );
  }

  handlePaddle() {
    const { ball, paddle } = this;
    if ( ball.vy <= 0 || !intersects( ball, paddle ) ) return;

    ball.setVelocity( paddleBounceVelocity( ball.centerX, paddle, ball.speed, this.config.ball.maxBounceAngle ) );
    ball.y = paddle.y - ball.size; // evita que se quede atrapada dentro de la paleta
  }

  handleBricks() {
    const brick = this.brickGrid.findHit( this.ball );
    if ( !brick ) return;

    this.ball.setVelocity( brickBounceVelocity( this.ball, brick ) );
    brick.break();
    this.explosions.spawn( brick );
    this.sound.play( 'break' );
    this.scoreBoard.addBrick();

    this.bricksThisLife++;
    if ( this.bricksThisLife % this.config.ball.bricksPerStep === 0 ) this.ball.accelerate();

    if ( this.brickGrid.allDestroyed() ) this.completeLevel();
  }

  // Devuelve true si la pelota cayó y se perdió una vida.
  handleFall() {
    if ( this.ball.y <= this.config.canvas.height ) return false;

    this.scoreBoard.loseLife();
    if ( this.scoreBoard.isOutOfLives() ) {
      this.state = GameState.GAME_OVER;
    } else {
      this.startRound();
    }
    return true;
  }

  render() {
    const { renderer, scoreBoard } = this;
    renderer.clear();
    renderer.drawBricks( this.brickGrid );
    renderer.drawExplosions( this.explosions );
    renderer.drawPaddle( this.paddle );
    if ( this.state !== GameState.GAME_OVER ) renderer.drawBall( this.ball );
    renderer.drawHud( scoreBoard, this.levels.number );

    const summary = `Puntos: ${ scoreBoard.score }   Récord: ${ scoreBoard.highScore }`;
    if ( this.state === GameState.START ) {
      renderer.drawMessage( 'ARKANOID', [ 'Pulsa ESPACIO para empezar' ] );
    } else if ( this.state === GameState.LEVEL_CLEAR ) {
      renderer.drawMessage( `NIVEL ${ this.levels.number }`, [
        `Puntos: ${ scoreBoard.score }   Vidas: ${ scoreBoard.lives }`,
        'Pulsa ESPACIO para continuar',
      ] );
    } else if ( this.state === GameState.WON ) {
      renderer.drawMessage( '¡VICTORIA!', [ summary, 'Pulsa ESPACIO para reiniciar' ] );
    } else if ( this.state === GameState.GAME_OVER ) {
      renderer.drawMessage( 'GAME OVER', [ summary, 'Pulsa ESPACIO para reiniciar' ] );
    }
  }
}
