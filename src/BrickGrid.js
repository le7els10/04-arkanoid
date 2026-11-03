import { Brick } from './Brick.js';
import { intersects } from './Collision.js';

export class BrickGrid {
  constructor( { rows, cols, width, height, gap, offsetTop, offsetLeft, colors } ) {
    this.bricks = [];
    for ( let row = 0; row < rows; row++ ) {
      for ( let col = 0; col < cols; col++ ) {
        const x = offsetLeft + col * ( width + gap );
        const y = offsetTop + row * ( height + gap );
        this.bricks.push( new Brick( x, y, width, height, colors[ row % colors.length ] ) );
      }
    }
  }

  reset() {
    this.bricks.forEach( brick => { brick.alive = true; } );
  }

  // Primer bloque vivo que toca el rectángulo dado, o null.
  findHit( rect ) {
    return this.bricks.find( brick => brick.alive && intersects( rect, brick ) ) ?? null;
  }

  aliveCount() {
    return this.bricks.filter( brick => brick.alive ).length;
  }

  allDestroyed() {
    return this.aliveCount() === 0;
  }
}
