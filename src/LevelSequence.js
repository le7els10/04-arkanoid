// Secuencia de niveles de la partida y nivel en curso.
export class LevelSequence {
  constructor( levels ) {
    if ( levels.length === 0 ) throw new Error( 'LevelSequence: se necesita al menos un nivel' );
    this.levels = levels;
    this.index = 0;
  }

  get current() {
    return this.levels[ this.index ];
  }

  // Número visible del nivel, empezando en 1.
  get number() {
    return this.index + 1;
  }

  isLast() {
    return this.index === this.levels.length - 1;
  }

  advance() {
    if ( !this.isLast() ) this.index++;
  }

  reset() {
    this.index = 0;
  }
}
