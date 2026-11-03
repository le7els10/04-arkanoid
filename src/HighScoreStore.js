// Persiste el récord en localStorage. Si el almacenamiento no está disponible
// (modo privado, datos bloqueados), recurre a un valor en memoria y el juego sigue.
export class HighScoreStore {
  // getStorage: función que devuelve el Storage; acceder a window.localStorage puede lanzar.
  constructor( key, getStorage ) {
    this.key = key;
    this.getStorage = getStorage;
    this.memoryValue = 0;
  }

  load() {
    try {
      const value = Number.parseInt( this.getStorage().getItem( this.key ), 10 );
      this.memoryValue = Number.isFinite( value ) && value > 0 ? value : 0;
    } catch {
      // Sin almacenamiento: se usa el valor en memoria.
    }
    return this.memoryValue;
  }

  save( score ) {
    this.memoryValue = score;
    try {
      this.getStorage().setItem( this.key, String( score ) );
    } catch {
      // Sin almacenamiento: el récord solo dura esta sesión.
    }
  }
}
