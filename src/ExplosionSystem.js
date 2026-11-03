import { Explosion } from './Explosion.js';

// Lista de explosiones activas. Las terminadas se descartan en update().
export class ExplosionSystem {
  constructor( { duration } ) {
    this.duration = duration; // ms
    this.explosions = [];
  }

  spawn( brick ) {
    this.explosions.push( new Explosion( brick, this.duration ) );
  }

  update( dt ) {
    this.explosions.forEach( explosion => explosion.update( dt ) );
    this.explosions = this.explosions.filter( explosion => !explosion.isDone() );
  }

  clear() {
    this.explosions = [];
  }
}
