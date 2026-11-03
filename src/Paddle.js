export class Paddle {
  constructor( { width, height, speed }, y ) {
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.x = 0;
    this.y = y;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  centerAt( x ) {
    this.x = x - this.width / 2;
  }

  moveLeft( dt ) {
    this.x -= this.speed * dt;
  }

  moveRight( dt ) {
    this.x += this.speed * dt;
  }

  clamp( minX, maxX ) {
    this.x = Math.max( minX, Math.min( maxX - this.width, this.x ) );
  }
}
