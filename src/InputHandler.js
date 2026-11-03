const LEFT_KEYS = [ 'ArrowLeft', 'KeyA' ];
const RIGHT_KEYS = [ 'ArrowRight', 'KeyD' ];
const BLOCKED_KEYS = [ 'ArrowLeft', 'ArrowRight', 'Space' ]; // evitan el scroll de la página

export class InputHandler {
  constructor( target ) {
    this.held = new Set();
    this.pressed = new Set(); // pulsaciones nuevas en el frame actual

    target.addEventListener( 'keydown', e => {
      if ( BLOCKED_KEYS.includes( e.code ) ) e.preventDefault();
      if ( !e.repeat ) this.pressed.add( e.code );
      this.held.add( e.code );
    } );
    target.addEventListener( 'keyup', e => this.held.delete( e.code ) );
    target.addEventListener( 'blur', () => this.held.clear() );
  }

  isLeft() {
    return LEFT_KEYS.some( code => this.held.has( code ) );
  }

  isRight() {
    return RIGHT_KEYS.some( code => this.held.has( code ) );
  }

  wasPressed( code ) {
    return this.pressed.has( code );
  }

  // Se llama al final de cada frame para que una pulsación solo cuente una vez.
  endFrame() {
    this.pressed.clear();
  }
}
