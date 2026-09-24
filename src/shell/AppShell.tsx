import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { AMPA_LOGO } from '../brand/logo.ts'

interface Props {
  /** Quién ha entrado. Mientras no se sabe, o si la aplicación no tiene login todavía, se deja vacío. */
  userName?: string | null
  /** El botón de salir. Sin él no sale el botón. */
  onSignOut?: () => void
  /** Pestañas bajo la barra, si la aplicación las tiene. */
  tabs?: ReactNode
  /**
   * Ancho del contenido. `sm` para lo que se usa desde el móvil (fichar) y
   * `md` o `lg` para las pantallas de tablas (el diario, la configuración).
   */
  maxWidth?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

/**
 * El marco de todas las pantallas con sesión: barra superior con el logo, el
 * nombre de la aplicación, quién ha entrado y el botón de salir. Barra blanca,
 * como las de Material 3: el color va en el contenido, no en la barra.
 */
export function AppShell({ userName, onSignOut, tabs, maxWidth = 'sm', children }: Props) {
  const { name } = useSuiteApp()

  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Box component="img" src={AMPA_LOGO} alt="AMPA" sx={{ height: 36, width: 'auto' }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.2 }}>
              {name}
            </Typography>
            <Typography variant="subtitle2" component="p" noWrap>
              {userName ?? ' '}
            </Typography>
          </Box>
          {onSignOut && (
            <Tooltip title="Cerrar sesión">
              <IconButton onClick={onSignOut} aria-label="Cerrar sesión" edge="end">
                <LogoutRounded />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
        {tabs}
      </AppBar>

      <Container component="main" maxWidth={maxWidth} sx={{ py: 2, pb: 12 }}>
        {children}
      </Container>
    </>
  )
}
