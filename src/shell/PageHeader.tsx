import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { ACCENTS, type Accent } from '../brand/tones.ts'
import { BRAND_RED } from '../brand/theme.ts'

interface Props {
  icon: ReactNode
  /** El título de la pantalla: es su h1. */
  children: ReactNode
  /** Una línea debajo, en gris: «312 activas · curso 2026-27». */
  subtitle?: ReactNode
  /** Lo que va a la derecha: el botón principal de la pantalla. */
  action?: ReactNode
  /** El color de la sección (el mismo que el de su pestaña). Por defecto, el azul de la marca. */
  accent?: Accent
}

/**
 * La cabecera de una pantalla (desde la 0.2.14): el icono de la sección en un
 * círculo lleno de su color, el título y el botón principal, sobre un velo
 * muy suave del rojo del AMPA. Es lo primero que se ve al cambiar de pestaña:
 * dice dónde se está y de quién es la casa.
 */
export function PageHeader({ icon, children, subtitle, action, accent = 'navy' }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        px: { xs: 2, sm: 2.5 },
        py: 2,
        borderRadius: 4,
        bgcolor: alpha(BRAND_RED, 0.05),
        border: 1,
        borderColor: alpha(BRAND_RED, 0.12),
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: '#fff',
          bgcolor: ACCENTS[accent],
          boxShadow: `0 2px 8px ${alpha(ACCENTS[accent], 0.3)}`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: '1 1 12rem', minWidth: 0 }}>
        <Typography variant="h5" component="h1">
          {children}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  )
}
