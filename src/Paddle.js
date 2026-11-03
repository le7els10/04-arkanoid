export class Paddle {
  constructor( { height, speed }, y ) {
    this.width = 0; // lo fija cada nivel con setWidth()
    this.height = height;
    this.speed = speed;
    this.x = 0;
    this.y = y;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  setWidth( width ) {
    this.width = width;
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
