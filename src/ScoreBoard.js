export class ScoreBoard {
  // highScoreStore: cualquier objeto con load(): number y save( score: number ): void.
  constructor( highScoreStore, { lives, points } ) {
    this.store = highScoreStore;
    this.initialLives = lives;
    this.pointsPerBrick = points;
    this.highScore = this.store.load();
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = this.initialLives;
    this.bricksBroken = 0;
  }

  addBrick() {
    this.bricksBroken++;
    this.score += this.pointsPerBrick;
    // Se guarda en cuanto se supera, así el récord sobrevive aunque se recargue a mitad de partida.
    if ( this.score > this.highScore ) {
      this.highScore = this.score;
      this.store.save( this.highScore );
    }
  }

  loseLife() {
    this.lives = Math.max( 0, this.lives - 1 );
  }

  isOutOfLives() {
    return this.lives === 0;
  }
}
