import { reflectInBounds, intersects, paddleBounceVelocity, brickBounceVelocity } from './Collision.js';

export const GameState = Object.freeze( {
  START: 'start',
  PLAYING: 'playing',
  WON: 'won',
  GAME_OVER: 'gameover',
} );

const MAX_DT = 1 / 30; // evita túneles tras cambiar de pestaña

export class Game {
  constructor( { renderer, input, scoreBoard, paddle, ball, brickGrid, config } ) {
    this.renderer = renderer;
    this.input = input;
    this.scoreBoard = scoreBoard;
    this.paddle = paddle;
    this.ball = ball;
    this.brickGrid = brickGrid;
    this.config = config;

    this.state = GameState.START;
    this.bricksThisLife = 0;
    this.lastTime = null;
    this.placeOnPaddle();
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
    if ( this.state === GameState.PLAYING ) {
      this.updatePlaying( dt );
    } else if ( this.input.wasPressed( 'Space' ) ) {
      this.newGame();
    }
  }

  newGame() {
    this.scoreBoard.reset();
    this.brickGrid.reset();
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

  updatePlaying( dt ) {
    this.movePaddle( dt );
    this.ball.update( dt );

    this.handleWalls();
    this.handlePaddle();
    this.handleBricks();
    this.handleFall();
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
    this.scoreBoard.addBrick();

    this.bricksThisLife++;
    if ( this.bricksThisLife % this.config.ball.bricksPerStep === 0 ) this.ball.accelerate();

    if ( this.brickGrid.allDestroyed() ) this.state = GameState.WON;
  }

  handleFall() {
    if ( this.ball.y <= this.config.canvas.height ) return;

    this.scoreBoard.loseLife();
    if ( this.scoreBoard.isOutOfLives() ) {
      this.state = GameState.GAME_OVER;
    } else {
      this.startRound();
    }
  }

  render() {
    const { renderer, scoreBoard } = this;
    renderer.clear();
    renderer.drawBricks( this.brickGrid );
    renderer.drawPaddle( this.paddle );
    if ( this.state !== GameState.GAME_OVER ) renderer.drawBall( this.ball );
    renderer.drawHud( scoreBoard );

    const summary = `Puntos: ${ scoreBoard.score }   Récord: ${ scoreBoard.highScore }`;
    if ( this.state === GameState.START ) {
      renderer.drawMessage( 'ARKANOID', [ 'Pulsa ESPACIO para empezar' ] );
    } else if ( this.state === GameState.WON ) {
      renderer.drawMessage( '¡VICTORIA!', [ summary, 'Pulsa ESPACIO para reiniciar' ] );
    } else if ( this.state === GameState.GAME_OVER ) {
      renderer.drawMessage( 'GAME OVER', [ summary, 'Pulsa ESPACIO para reiniciar' ] );
    }
  }
}
