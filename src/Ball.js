export class Ball {
  constructor( { size, speedStep, maxSpeedFactor } ) {
    this.size = size;
    this.speedStep = speedStep;
    this.maxSpeedFactor = maxSpeedFactor;
    this.initialSpeed = 0; // lo fija cada nivel con setInitialSpeed()
    this.maxSpeed = 0;
    this.speed = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }

  get centerX() {
    return this.x + this.size / 2;
  }

  // Alias para las funciones de colisión, que trabajan con rectángulos { x, y, width, height }.
  get width() {
    return this.size;
  }

  get height() {
    return this.size;
  }

  update( dt ) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // Coloca la pelota parada justo encima del centro de la paleta.
  resetOn( paddle ) {
    this.x = paddle.centerX - this.size / 2;
    this.y = paddle.y - this.size;
    this.vx = 0;
    this.vy = 0;
  }

  // angle: radianes respecto a la vertical; negativo = izquierda, positivo = derecha.
  launch( angle ) {
    this.vx = this.speed * Math.sin( angle );
    this.vy = -this.speed * Math.cos( angle );
  }

  setVelocity( { vx, vy } ) {
    this.vx = vx;
    this.vy = vy;
  }

  // No cambia la velocidad actual: se aplica con el siguiente resetSpeed().
  setInitialSpeed( speed ) {
    this.initialSpeed = speed;
    this.maxSpeed = speed * this.maxSpeedFactor;
  }

  resetSpeed() {
    this.setSpeed( this.initialSpeed );
  }

  accelerate() {
    this.setSpeed( Math.min( this.speed * ( 1 + this.speedStep ), this.maxSpeed ) );
  }

  // Cambia el módulo de la velocidad manteniendo la dirección.
  setSpeed( speed ) {
    const current = Math.hypot( this.vx, this.vy );
    if ( current > 0 ) {
      this.vx = this.vx / current * speed;
      this.vy = this.vy / current * speed;
    }
    this.speed = speed;
  }
}
