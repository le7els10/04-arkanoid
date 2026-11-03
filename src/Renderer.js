// Único módulo que conoce el canvas y los globales de assets/spritesheet.js.
export class Renderer {
  constructor( ctx, config ) {
    this.ctx = ctx;
    this.config = config;
  }

  clear() {
    const { width, height } = this.config.canvas;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect( 0, 0, width, height );
  }

  drawPaddle( paddle ) {
    drawSprite( this.ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  }

  drawBall( ball ) {
    drawSprite( this.ctx, 'ball', ball.x, ball.y, ball.size, ball.size );
  }

  drawBricks( brickGrid ) {
    for ( const brick of brickGrid.bricks ) {
      if ( !brick.alive ) continue;
      drawSprite( this.ctx, `block_${ brick.color }`, brick.x, brick.y, brick.width, brick.height );
    }
  }

  drawExplosions( explosionSystem ) {
    for ( const explosion of explosionSystem.explosions ) {
      const frames = EXPLOSION_FRAMES[ explosion.color ];
      const frame = frames[ explosion.frameIndex( frames.length ) ];
      drawFrame( this.ctx, frame, explosion.x, explosion.y, explosion.width, explosion.height );
    }
  }

  drawHud( scoreBoard ) {
    const { ctx } = this;
    const { width } = this.config.canvas;
    const hudHeight = this.config.hud.height;
    const textY = hudHeight / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText( `PUNTOS ${ scoreBoard.score }`, 12, textY );
    ctx.textAlign = 'center';
    ctx.fillText( `RÉCORD ${ scoreBoard.highScore }`, width / 2, textY );
    ctx.textAlign = 'right';
    ctx.fillText( `VIDAS ${ scoreBoard.lives }`, width - 12, textY );

    ctx.fillStyle = '#444';
    ctx.fillRect( 0, hudHeight - 2, width, 2 );
  }

  drawMessage( title, lines = [] ) {
    const { ctx } = this;
    const { width, height } = this.config.canvas;
    const centerY = height / 2 + 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect( 0, centerY - 70, width, 140 );

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px monospace';
    ctx.fillText( title, width / 2, centerY - 30 );

    ctx.font = '16px monospace';
    lines.forEach( ( line, i ) => ctx.fillText( line, width / 2, centerY + 10 + i * 24 ) );
  }
}
