# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Idioma:** responde siempre en español al usuario. Esto incluye las preguntas y los specs que generan `/spec` y `/spec-impl`. El código y los identificadores técnicos pueden quedar en inglés.

## Estado del proyecto

Es un juego Arkanoid/Breakout para navegador que se construye con el método spec-driven. Por ahora el repositorio solo tiene los assets y los skills de specs. Todavía no hay código del juego, ni `package.json`, ni build, lint o tests, ni carpeta `specs/`. El directorio **todavía no es un repositorio git**, y `/spec-impl` lo necesita porque crea una rama `spec-NN-slug`. Ejecuta `git init` antes de la primera implementación.

La idea es que el juego sea JavaScript plano de navegador dibujado sobre `<canvas>`. `assets/spritesheet.js` define globales (sin módulos) y carga la imagen desde la ruta relativa `assets/spritesheet-breakout.png`. Sirve la raíz del proyecto por HTTP (por ejemplo con `npx serve .` o `python -m http.server`) para que esa ruta funcione.

## Flujo de trabajo: desarrollo guiado por specs

Hay dos skills del proyecto. Están en `.agents/skills/`, enlazados con symlinks en `.claude/skills/` y fijados en `skills-lock.json`; vienen de `Klerith/fernando-skills`. Solo el usuario puede invocarlos, el modelo no:

- `/spec <feature>`: diseño interactivo del spec. Hace preguntas aclaratorias en bloques, escribe el spec sección por sección siguiendo `.agents/skills/spec/template.md` y lo guarda en `specs/NN-slug.md`. No escribe código.
- `/spec-impl <NN-slug | NN | slug>`: implementa un spec solo si su estado significa "Aprobado". Crea la rama `spec-NN-slug`, se cambia a ella y luego implementa paso a paso, con pausas para revisar los diffs. Con `specs/.spec-config.yml` (`AutoCreateBranch`) se puede desactivar la creación de la rama.

Convenciones de los specs: el blockquote de cabecera lleva `Estado` / `Depende de` / `Fecha` / `Objetivo` (una sola oración). Los estados son `Borrador`, `En revisión`, `Aprobado`, `Implementado` y `Obsoleto`. Los specs nuevos deben usar el mismo idioma y la misma redacción que los que ya existen.

## API de assets (`assets/spritesheet.js`)

- `loadSpritesheet(cb)` carga el PNG una sola vez, lo copia a un canvas fuera de pantalla y encola los callbacks hasta que termina de cargar. Arranca el game loop desde su callback.
- `drawSprite(ctx, name, x, y, w, h)`: `name` es `'paddle'`, `'ball'` o `'block_<color>'`. Los colores son gray, red, yellow, cyan, magenta, hotpink y green.
- `drawFrame(ctx, frame, x, y, w, h)` dibuja un rectángulo `{sx, sy, sw, sh}` tal cual. Úsalo con `EXPLOSION_FRAMES[color]`, que tiene 4 frames por color. `EXPLOSION_DURATION` es de 150 ms. Gray reutiliza los frames de explosión de red.
- Tamaños de origen de los sprites: bloques 32×16, pelota 16×16, paleta 162×14.
- Sonidos: `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`.
