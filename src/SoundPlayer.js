// Reproduce sonidos por nombre. Cada reproducción clona el Audio precargado
// para que varios sonidos se puedan solapar sin cortarse.
export class SoundPlayer {
  constructor( sources, audioFactory ) {
    this.sounds = {};
    for ( const [ name, src ] of Object.entries( sources ) ) {
      const audio = audioFactory( src );
      audio.preload = 'auto';
      this.sounds[ name ] = audio;
    }
  }

  play( name ) {
    const audio = this.sounds[ name ];
    if ( !audio ) return;

    // El navegador puede rechazar la reproducción (autoplay, archivo ausente): nunca rompe el juego.
    audio.cloneNode().play()?.catch( () => {} );
  }
}
