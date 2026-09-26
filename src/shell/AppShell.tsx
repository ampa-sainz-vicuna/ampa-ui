import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { useSessionUser } from '../auth/sessionUserContext.ts'
import { AMPA_LOGO } from '../brand/logo.ts'
import { ApplicationSwitcher } from './ApplicationSwitcher.tsx'

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
 * nombre de la aplicación, quién ha entrado, el selector de aplicaciones y el
 * botón de salir. Barra blanca, como las de Material 3: el color va en el
 * contenido, no en la barra. Solo una franja fina con el rojo del AMPA
 * arriba, para que se reconozca la casa.
 *
 * El logo lleva al portal, como en cualquier web el logo lleva al inicio. El
 * selector sale cuando `/api/me` dice a qué aplicaciones puede ir (cliente
 * del portal 0.1.4); lo lee de SessionGate, sin que la aplicación lo pase.
 */
export function AppShell({ userName, onSignOut, tabs, maxWidth = 'sm', children }: Props) {
  const { name, portalUrl } = useSuiteApp()
  const applications = useSessionUser()?.applications ?? []

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderTop: 3, borderTopColor: 'primary.main', borderBottom: 1, borderBottomColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <Tooltip title="Ir al portal del AMPA">
            <ButtonBase
              href={portalUrl}
              aria-label="Ir al portal del AMPA"
              sx={{ borderRadius: 2, p: 0.5, m: -0.5, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Box component="img" src={AMPA_LOGO} alt="" sx={{ height: 36, width: 'auto', display: 'block' }} />
            </ButtonBase>
          </Tooltip>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.2 }} noWrap>
              {name}
            </Typography>
            <Typography variant="subtitle2" component="p" noWrap>
              {userName ?? ' '}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: -1.5 }}>
            {applications.length > 0 && <ApplicationSwitcher portalUrl={portalUrl} applications={applications} />}
            {onSignOut && (
              <Tooltip title="Cerrar sesión">
                <IconButton onClick={onSignOut} aria-label="Cerrar sesión">
                  <LogoutRounded />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
        {tabs}
      </AppBar>

      <Container component="main" maxWidth={maxWidth} sx={{ py: 2, pb: 12 }}>
        {children}
      </Container>
    </>
  )
}
