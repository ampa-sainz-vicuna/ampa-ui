import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { ACCENTS, type Accent } from '../brand/tones.ts'

interface Props {
  accent: Accent
  children: ReactNode
}

/**
 * El icono de una pestaña en un cuadrito del color de su sección (desde la
 * 0.2.14). Va en la prop `icon` de la `Tab` de MUI, con
 * `iconPosition="start"`: así cada pestaña se reconoce sin leerla.
 */
export function SectionIcon({ accent, children }: Props) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: 24,
        height: 24,
        borderRadius: 2,
        display: 'inline-grid',
        placeItems: 'center',
        flexShrink: 0,
        color: ACCENTS[accent],
        bgcolor: alpha(ACCENTS[accent], 0.13),
        '& svg': { fontSize: 16 },
      }}
    >
      {children}
    </Box>
  )
}
