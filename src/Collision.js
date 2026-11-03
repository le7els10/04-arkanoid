// Funciones puras de colisión. Reciben rectángulos { x, y, width, height } y devuelven
// resultados nuevos sin modificar los argumentos ni conocer el canvas.

export function intersects( a, b ) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

// Rebote contra las paredes laterales y el techo. Devuelve la posición y velocidad corregidas.
export function reflectInBounds( ball, { minX, maxX, minY } ) {
  let { x, y, vx, vy } = ball;

  if ( x < minX ) {
    x = minX;
    vx = Math.abs( vx );
  } else if ( x + ball.width > maxX ) {
    x = maxX - ball.width;
    vx = -Math.abs( vx );
  }

  if ( y < minY ) {
    y = minY;
    vy = Math.abs( vy );
  }

  return { x, y, vx, vy };
}

// Velocidad de salida al golpear la paleta: el ángulo depende del punto de impacto.
// Centro = vertical; extremos = ±maxAngle. Siempre sale hacia arriba.
export function paddleBounceVelocity( ballCenterX, paddle, speed, maxAngle ) {
  const offset = ( ballCenterX - paddle.centerX ) / ( paddle.width / 2 );
  const angle = Math.max( -1, Math.min( 1, offset ) ) * maxAngle;
  return {
    vx: speed * Math.sin( angle ),
    vy: -speed * Math.cos( angle ),
  };
}

// Rebote contra un bloque: invierte el eje de menor penetración y aleja la pelota del bloque.
export function brickBounceVelocity( ball, brick ) {
  const overlapX = Math.min( ball.x + ball.width, brick.x + brick.width ) - Math.max( ball.x, brick.x );
  const overlapY = Math.min( ball.y + ball.height, brick.y + brick.height ) - Math.max( ball.y, brick.y );

  const ballCenterX = ball.x + ball.width / 2;
  const ballCenterY = ball.y + ball.height / 2;
  const brickCenterX = brick.x + brick.width / 2;
  const brickCenterY = brick.y + brick.height / 2;

  if ( overlapX < overlapY ) {
    const sign = ballCenterX < brickCenterX ? -1 : 1;
    return { vx: sign * Math.abs( ball.vx ), vy: ball.vy };
  }
  const sign = ballCenterY < brickCenterY ? -1 : 1;
  return { vx: ball.vx, vy: sign * Math.abs( ball.vy ) };
}
