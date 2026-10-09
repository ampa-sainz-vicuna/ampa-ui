import type { MenuProps } from '@mui/material/Menu'
import type { MouseEvent } from 'react'

/** Si se ha pulsado dentro del menú abierto. Solo hay un menú abierto a la vez. */
let pressedInMenu = false

/**
 * Que una opción de un desplegable se elija solo con un clic entero sobre
 * ella. Va en el tema (`MuiMenu`), así que lo llevan todos los `Select` y
 * `TextField select` de la suite sin tocar cada campo.
 *
 * MUI 9 copia del desplegable nativo el "pulsar, arrastrar y soltar": el menú
 * se abre al pulsar, y soltar el botón sobre una opción la elige si han pasado
 * más de 200 ms. Cuando el menú no cabe debajo del campo (una lista larga, o
 * una ventana baja), MUI lo sube y queda encima del campo: el mismo clic que
 * lo abre suelta sobre una opción, la elige y lo cierra, y hay que volver a
 * abrirlo. Visto en tareas el 27/09/2026 (que lo arregló campo a campo) y en
 * otras aplicaciones el 09/10/2026; desde la 0.2.13, aquí para todas.
 *
 * Se para el `mouseup` que llega al menú sin un `mousedown` dentro antes: el
 * del clic que lo abrió. Con el teclado y en el móvil no cambia nada, y en los
 * menús que se abren con un clic (los de los tres puntos) tampoco: ahí el
 * `mouseup` ya pasó antes de abrirse.
 *
 * MUI mezcla los `slotProps` del tema con los de cada menú, ranura a ranura y
 * prop a prop: un menú que pase sus propios `slotProps.list` no pierde esto
 * salvo que pase también `onMouseDownCapture` u `onMouseUpCapture`.
 */
export const CLICK_TO_CHOOSE: Partial<MenuProps> = {
  slotProps: {
    // Al empezar a abrirse, se olvida lo de menús anteriores (por ejemplo, un
    // clic que empezó dentro de otro menú y se soltó fuera).
    transition: {
      onEntering: () => {
        pressedInMenu = false
      },
    },
    list: {
      onMouseDownCapture: () => {
        pressedInMenu = true
      },
      onMouseUpCapture: (event: MouseEvent) => {
        if (!pressedInMenu) {
          event.stopPropagation()
        }
        pressedInMenu = false
      },
    },
  },
}
