import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  children: ReactNode
  /** Una línea debajo del título, en gris. */
  subtitle?: ReactNode
  /** Lo que va a la derecha del título: un botón, un contador… */
  action?: ReactNode
  /** El color del icono. Rojo para lo que pide atención; azul para lo demás. */
  color?: 'primary' | 'secondary' | 'warning' | 'info' | 'success'
}

/**
 * La cabecera de una tarjeta, igual en todas las aplicaciones de la suite: el
 * icono en un círculo del color de la marca, el título y, si hace falta, una
 * acción a la derecha. Da a cada tarjeta un punto de color y hace que se
 * reconozca de un vistazo sin leer el título.
 *
 * El título es un h2: cada tarjeta es una sección de la pantalla.
 */
export function CardTitle({ icon, children, subtitle, action, color = 'secondary' }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: theme.palette[color].main,
          bgcolor: alpha(theme.palette[color].main, 0.12),
        })}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
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
