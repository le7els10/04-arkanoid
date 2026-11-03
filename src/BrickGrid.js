import { Brick } from './Brick.js';
import { intersects } from './Collision.js';

const BRICK = '#';
const EMPTY = '.';

export class BrickGrid {
  constructor( { cols, width, height, gap, offsetTop, offsetLeft, colors } ) {
    this.cols = cols;
    this.width = width;
    this.height = height;
    this.gap = gap;
    this.offsetTop = offsetTop;
    this.offsetLeft = offsetLeft;
    this.colors = colors;
    this.bricks = [];
  }

  // Sustituye todos los bloques por los del layout: un string por fila, '#' = bloque, '.' = hueco.
  load( layout ) {
    const bricks = [];
    layout.forEach( ( line, row ) => {
      if ( line.length !== this.cols ) {
        throw new Error( `BrickGrid: la fila ${ row } mide ${ line.length } caracteres y debe medir ${ this.cols }` );
      }
      [ ...line ].forEach( ( cell, col ) => {
        if ( cell === EMPTY ) return;
        if ( cell !== BRICK ) {
          throw new Error( `BrickGrid: carácter inválido '${ cell }' en la fila ${ row }, columna ${ col }` );
        }
        const x = this.offsetLeft + col * ( this.width + this.gap );
        const y = this.offsetTop + row * ( this.height + this.gap );
        bricks.push( new Brick( x, y, this.width, this.height, this.colors[ row % this.colors.length ] ) );
      } );
    } );
    this.bricks = bricks;
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
