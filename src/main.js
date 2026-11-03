import { CONFIG } from './config.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { BrickGrid } from './BrickGrid.js';
import { HighScoreStore } from './HighScoreStore.js';
import { ScoreBoard } from './ScoreBoard.js';
import { ExplosionSystem } from './ExplosionSystem.js';
import { SoundPlayer } from './SoundPlayer.js';
import { LevelSequence } from './LevelSequence.js';
import { Game } from './Game.js';

// Raíz de composición: único sitio donde se crean las dependencias.
const canvas = document.getElementById( 'game' );
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

loadSpritesheet( () => {
  const paddleY = CONFIG.canvas.height - CONFIG.paddle.bottomOffset - CONFIG.paddle.height;
  const highScoreStore = new HighScoreStore( CONFIG.storageKey, () => window.localStorage );

  const game = new Game( {
    renderer: new Renderer( canvas.getContext( '2d' ), CONFIG ),
    input: new InputHandler( window ),
    scoreBoard: new ScoreBoard( highScoreStore, { lives: CONFIG.lives } ),
    paddle: new Paddle( CONFIG.paddle, paddleY ),
    ball: new Ball( CONFIG.ball ),
    brickGrid: new BrickGrid( CONFIG.bricks ),
    explosions: new ExplosionSystem( CONFIG.explosion ),
    sound: new SoundPlayer( CONFIG.sounds, src => new Audio( src ) ),
    levels: new LevelSequence( CONFIG.levels ),
    config: CONFIG,
  } );

  game.start();
} );
