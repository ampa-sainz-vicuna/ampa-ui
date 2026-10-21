import { alpha, darken, type Theme } from '@mui/material/styles'
import { BRAND_NAVY } from './theme.ts'

/**
 * Los colores que dicen algo, iguales en toda la suite (desde la 0.2.14,
 * pedido por el usuario el 21/10/2026: «me faltan colores que indiquen
 * cosas»). Cada estado tiene siempre el mismo significado:
 *
 * - `success`: está bien (socia, domiciliada, cobrado).
 * - `warning`: falta algo o está a medias (sin mandato, pendiente).
 * - `error`: hay que actuar (deuda, recibo devuelto, pide el borrado).
 * - `info`: novedad (familia nueva, cambios).
 * - `neutral`: no cuenta (de baja, sin cuenta, solo consulta).
 *
 * Siempre con fondo suave y el texto en un tono oscuro del mismo color, nunca
 * relleno fuerte: tras horas de trabajo cansa menos y se lee mejor. Y siempre
 * con una palabra: nada se entiende solo por el color.
 */
export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface ToneColors {
  /** El color en sí: el de un icono o un punto. */
  main: string
  /** El del texto sobre `soft`; pasa el contraste AA (4,5:1). */
  text: string
  /** El fondo suave de una etiqueta. */
  soft: string
  /** Un fondo todavía más tenue, para recuadros grandes. */
  faint: string
}

export function toneColors(theme: Theme, tone: Tone): ToneColors {
  const main = tone === 'neutral' ? BRAND_NAVY : theme.palette[tone].main
  // El naranja de MUI es claro: su `dark` tampoco llega a 4,5:1 sobre fondo
  // claro, así que se oscurece más. Los demás, con su `dark` ya pasan.
  const text = tone === 'neutral' ? BRAND_NAVY : tone === 'warning' ? darken(main, 0.45) : theme.palette[tone].dark

  return {
    main,
    text,
    soft: alpha(main, tone === 'neutral' ? 0.09 : 0.13),
    faint: alpha(main, 0.07),
  }
}

/**
 * Colores de sección: cada aplicación da uno a cada pestaña para que se sepa
 * dónde se está sin leer (el icono de la pestaña y de la cabecera de la
 * página, y las etiquetas de lo que es de esa sección). Van por su nombre y no
 * por la sección, porque cada aplicación tiene las suyas. Todos con una
 * claridad parecida, para que ninguno grite más que otro.
 *
 * Nunca para el texto ni para fondos grandes: para eso están los estados.
 */
export const ACCENTS = {
  navy: BRAND_NAVY,
  slate: '#546E7A',
  teal: '#00897B',
  orange: '#EF6C00',
  purple: '#8E24AA',
  pink: '#D81B60',
  blue: '#1E88E5',
  indigo: '#3949AB',
  green: '#2E7D32',
  brown: '#6D4C41',
} as const

export type Accent = keyof typeof ACCENTS
