// Genera src/brand/logo.ts a partir de assets/logo-ampa-480.png.
//
//   docker compose run --rm node node scripts/logo.mjs
//
// Solo hace falta volver a ejecutarlo si cambia el logo.
//
// assets/logo-ampa.png es el original (974 × 680). El que se usa es una copia
// de 480 px de ancho: en pantalla nunca pasa de 240 px (la entrada), y 480 es
// el doble, para que se vea nítido en pantallas de alta densidad. Pesa la mitad
// y a ese tamaño no se distingue del original. Se hizo así:
//
//   docker run --rm -v "C:/Users/jimix/dev/ampa-ui/assets:/a" alpine:3.22 sh -c \
//     "apk add --no-cache imagemagick && magick /a/logo-ampa.png -resize 480x -colors 128 PNG8:/a/logo-ampa-480.png"

import { readFileSync, writeFileSync } from 'node:fs'

const png = readFileSync(new URL('../assets/logo-ampa-480.png', import.meta.url))

const source = `// GENERADO por scripts/logo.mjs a partir de assets/logo-ampa-480.png. No editar a mano.
//
// El logo va dentro del JavaScript, como data: URI, y no como un .png aparte.
// Un .png dentro de un paquete de node_modules lo entiende Vite al compilar,
// pero no Node, que es quien carga la librería cuando Vitest corre los tests de
// una aplicación: el primer test que pintara la cabecera fallaría. A cambio
// pesa un tercio más (${Math.round((png.length * 4) / 3 / 1024)} KB en vez de ${Math.round(png.length / 1024)} KB), una sola vez por visita.

export const AMPA_LOGO = 'data:image/png;base64,${png.toString('base64')}'
`

writeFileSync(new URL('../src/brand/logo.ts', import.meta.url), source)
