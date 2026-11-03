# SPEC 02 — Animación de explosión de bloques y sonidos

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-03
> **Objetivo:** Reproducir la animación de explosión de 4 frames y el sonido `break-sound.mp3` al romper un bloque, y el sonido `ball-bounce.mp3` cuando la pelota rebota en paredes, techo y paleta.

## Por qué existe este spec

El SPEC 01 dejó fuera sonidos y explosiones aunque los assets ya existen (`assets/sounds/*`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`). Este spec los conecta al juego sin romper la arquitectura del MVP: solo `Renderer` dibuja, las dependencias se inyectan desde `main.js` y cada responsabilidad vive en su propia clase.

## Alcance

**Entra:**

- Animación de explosión de 4 frames (`EXPLOSION_FRAMES[color]`) en la posición del bloque roto, con duración `EXPLOSION_DURATION` (150 ms).
- Sonido `assets/sounds/break-sound.mp3` al romper un bloque.
- Sonido `assets/sounds/ball-bounce.mp3` al rebotar la pelota en pared lateral, techo o paleta.
- Reproducción solapable: cada reproducción usa un clon del `Audio`, así que romper varios bloques seguidos no corta el sonido anterior.
- Las explosiones en curso siguen animándose en las pantallas de victoria y game over; al empezar una partida nueva se descartan.
- Las explosiones no afectan a la colisión, a los puntos ni a la pelota: el bloque deja de existir en el mismo frame en que se rompe.

**Fuera de alcance (para futuros specs):**

- Sonido de rebote al golpear un bloque (al romper un bloque suena solo `break-sound`, no `ball-bounce`).
- Sonido al perder una vida, al ganar o en game over.
- Música de fondo.
- Control de volumen o silenciar (mute).
- Partículas u otros efectos distintos de los 4 frames de `EXPLOSION_FRAMES`.
- Modificar `assets/spritesheet.js` o los archivos de audio.

## Modelo de datos

### Archivos nuevos y modificados

```
src/
  Explosion.js        // nuevo: una explosión en curso (posición, color, tiempo)
  ExplosionSystem.js  // nuevo: lista de explosiones activas
  SoundPlayer.js      // nuevo: reproduce sonidos por nombre
  config.js           // modificado: secciones sounds y explosion
  Renderer.js         // modificado: drawExplosions()
  Game.js             // modificado: dispara sonidos y explosiones
  main.js             // modificado: crea e inyecta SoundPlayer y ExplosionSystem
```

### Configuración (`src/config.js`)

```js
sounds: {
  break: 'assets/sounds/break-sound.mp3',
  bounce: 'assets/sounds/ball-bounce.mp3',
},
explosion: { duration: EXPLOSION_DURATION }, // ms, global de spritesheet.js
```

`spritesheet.js` se carga como script clásico antes del module, así que `EXPLOSION_DURATION` ya existe cuando se evalúa `config.js`.

### Entidades

```js
// Explosion
{ x, y, width, height, color, elapsed, duration }   // update(dt), isDone(), frameIndex(frameCount)

// ExplosionSystem
{ explosions: Explosion[] }                         // spawn(brick), update(dt), clear()

// SoundPlayer
{ sources: { break, bounce }, audioFactory }        // play(name)
```

- `Explosion` copia posición, tamaño y color del `Brick` al crearse. `elapsed` y `duration` están en segundos (la duración de config se convierte de ms al construir).
- `frameIndex(frameCount)` devuelve `Math.min(frameCount - 1, Math.floor(elapsed / duration * frameCount))`.
- `Explosion.isDone()` es `true` cuando `elapsed >= duration`. `ExplosionSystem.update` descarta las terminadas.
- `SoundPlayer.play(name)` hace `cloneNode()` del `Audio` precargado y llama a `play()`. Captura el rechazo de la promesa para que un error de audio nunca rompa el juego.
- `audioFactory` es `(src) => new Audio(src)` y se inyecta desde `main.js` para poder sustituirlo por uno falso.

### Inyección de dependencias

```js
new Game({ renderer, input, scoreBoard, paddle, ball, brickGrid, explosions, sound, config: CONFIG })
```

### Convenciones

- Solo `Renderer` usa `drawFrame` y `EXPLOSION_FRAMES`. `Explosion` solo calcula el índice de frame, no dibuja.
- Las explosiones se actualizan con el mismo `dt` limitado del game loop, en todos los estados, no solo en `PLAYING`.
- Un rebote se detecta en `Game` comparando el signo de `vx`/`vy` de la pelota antes y después de `handleWalls()` y `handlePaddle()`. Los rebotes contra bloques no cuentan.

## Plan de implementación

1. Añadir `sounds` y `explosion` a `src/config.js`. Prueba manual: el juego carga igual y no hay errores en la consola.
2. Crear `src/SoundPlayer.js` con precarga y `play(name)` por clonado, e inyectarlo en `Game` desde `main.js`. Llamar a `sound.play('break')` en `handleBricks()`. Prueba manual: al romper un bloque suena `break-sound`, y al romper varios seguidos los sonidos se solapan.
3. Llamar a `sound.play('bounce')` al rebotar en paredes, techo y paleta. Prueba manual: suena en cada rebote de esos tres sitios y no al golpear un bloque.
4. Crear `src/Explosion.js` y `src/ExplosionSystem.js`, inyectar el sistema en `Game` y llamar a `explosions.spawn(brick)` al romper un bloque. Actualizar con `explosions.update(dt)` al principio de `Game.update()`, en cualquier estado. Prueba manual sin dibujar aún: la lista crece al romper un bloque y se vacía a los 150 ms (comprobar desde la consola).
5. Añadir `Renderer.drawExplosions(explosions)` con `drawFrame` y `EXPLOSION_FRAMES[color]`, y llamarlo desde `Game.render()` entre los bloques y la paleta. Prueba manual: se ve la explosión de 4 frames en el lugar del bloque roto, con el color de su fila.
6. Llamar a `explosions.clear()` en `Game.newGame()`. Prueba manual: ganar rompiendo el último bloque deja ver su explosión completa bajo el mensaje de victoria, y al reiniciar con Espacio no queda ninguna explosión.

## Criterios de aceptación

- [ ] El juego carga sin errores en la consola, también con los archivos de audio disponibles.
- [ ] Al romper un bloque suena `break-sound.mp3`.
- [ ] Al romper dos bloques con menos de 150 ms de diferencia, los dos sonidos se oyen a la vez sin cortarse.
- [ ] Al rebotar la pelota en la pared izquierda, la derecha, el techo y la paleta suena `ball-bounce.mp3`.
- [ ] Al romper un bloque no suena `ball-bounce.mp3`.
- [ ] Al romper un bloque aparece en su posición una animación de 4 frames con el color de su fila.
- [ ] La animación dura 150 ms (`EXPLOSION_DURATION`) y desaparece sola al terminar.
- [ ] La explosión no bloquea la pelota: pasa por el hueco del bloque roto igual que en el SPEC 01.
- [ ] Al romper el último bloque, la explosión se completa mientras se muestra la pantalla de victoria.
- [ ] Al pulsar Espacio para reiniciar no queda ninguna explosión en pantalla.
- [ ] Si el audio falla (archivo ausente o reproducción rechazada), el juego sigue funcionando sin errores no capturados.
- [ ] Ningún archivo de `src/` salvo `Renderer.js` llama a `drawFrame` ni a `drawSprite`.
- [ ] `Game` recibe `explosions` y `sound` por constructor; solo `main.js` los crea con `new`.
- [ ] `assets/spritesheet.js` y los archivos de `assets/sounds/` no han cambiado.

## Decisiones

- **Sí:** reproducir los dos sonidos que existen en `assets/sounds/`. Lo eligió el usuario; el SPEC 01 los había dejado fuera.
- **Sí:** `cloneNode()` de un `Audio` precargado en cada reproducción. Permite solapar sonidos sin Web Audio API ni más código.
- **No:** reutilizar un solo `Audio` con `currentTime = 0`, porque corta el sonido anterior al romper bloques casi a la vez.
- **No:** Web Audio API (`AudioContext`). Es más control del que necesita este spec.
- **Sí:** animación de 4 frames con `EXPLOSION_DURATION` tal cual, en el sitio del bloque. Evita inventar tiempos y reutiliza el asset.
- **Sí:** el bloque se marca como roto de inmediato y la explosión es una entidad aparte. Así colisión, puntos y victoria no cambian respecto al SPEC 01.
- **Sí:** `ExplosionSystem` y `SoundPlayer` como clases propias e inyectadas. Mantienen `Game` sin conocer el DOM ni el audio, y permiten sustituirlas por falsas en tests futuros.
- **Sí:** las explosiones se actualizan en todos los estados. La última explosión se ve completa en la pantalla de victoria.
- **Sí:** al empezar una partida nueva se descartan las explosiones, para empezar limpio.
- **No:** descartarlas al instante al ganar o perder.
- **Sí:** al romper un bloque suena solo `break-sound`. Superponer `ball-bounce` ensuciaría el efecto y no se pidió.
- **Sí:** `SoundPlayer.play` captura el rechazo de la promesa. Los navegadores pueden bloquear audio y el juego no debe romperse por ello.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La política de autoplay del navegador bloquea el audio | El primer sonido llega después de pulsar Espacio (gesto del usuario). Además `play()` captura el rechazo. |
| Muchos clones de `Audio` simultáneos | Cada clon se libera al terminar; con la tasa máxima de bloques rotos no hay acumulación relevante. |
| La ruta relativa del audio falla si no se sirve por HTTP | Mismo requisito que el SPEC 01: servir la raíz por HTTP. Un fallo de carga no rompe el juego. |
| El `dt` limitado alarga la explosión más de 150 ms reales tras cambiar de pestaña | Aceptado: el efecto es solo visual y dura unos frames más como máximo. |

## Lo que **no** entra en este spec

- Sonidos de vida perdida, victoria o game over.
- Música de fondo.
- Volumen o mute.
- Partículas y otros efectos.
- Cambios en `assets/`.

Si alguna de estas cosas llega a hacerse, irá en su propio spec.
