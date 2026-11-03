// Una explosión en curso. Solo lleva el tiempo; el dibujo lo hace Renderer.
export class Explosion {
  constructor( { x, y, width, height, color }, durationMs ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.elapsed = 0;                   // s
    this.duration = durationMs / 1000;  // s
  }

  update( dt ) {
    this.elapsed += dt;
  }

  isDone() {
    return this.elapsed >= this.duration;
  }

  frameIndex( frameCount ) {
    return Math.min( frameCount - 1, Math.floor( this.elapsed / this.duration * frameCount ) );
  }
}
