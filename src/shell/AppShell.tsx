import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { useSessionUser } from '../auth/sessionUserContext.ts'
import { AMPA_LOGO } from '../brand/logo.ts'
import { HelpButton } from '../help/HelpButton.tsx'
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
 *
 * Desde la 0.2.5, con sesión, también el botón de la ayuda: las preguntas
 * frecuentes que sirve el portal (`GET /api/ayuda`), con buscador.
 */
export function AppShell({ userName, onSignOut, tabs, maxWidth = 'sm', children }: Props) {
  const { name, portalUrl } = useSuiteApp()
  const sessionUser = useSessionUser()
  const applications = sessionUser?.applications ?? []

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderTop: 3, borderTopColor: 'primary.main', borderBottom: 1, borderBottomColor: 'divider' }}
      >
        {/* Desde la 0.2.4, lo de la barra va en la misma columna que el
            contenido (maxWidth), no pegado a los bordes de la pantalla: en el
            ordenador el logo y las pestañas quedan alineados con las tarjetas. */}
        <Toolbar sx={(theme) => ({ gap: 1.5, width: '100%', maxWidth: theme.breakpoints.values[maxWidth], mx: 'auto' })}>
          <Tooltip title="Ir al portal del AMPA">
            <ButtonBase
              href={portalUrl}
              aria-label="Ir al portal del AMPA"
              sx={{ borderRadius: 2, p: 0.5, m: -0.5, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Box component="img" src={AMPA_LOGO} alt="" sx={{ height: 36, width: 'auto', display: 'block' }} />
            </ButtonBase>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ my: 1.75 }} />
          {/* Desde la 0.2.4, primero dónde se está (la aplicación, en negrita) y
              debajo, en gris, quién ha entrado: lo que se busca de un vistazo. */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.3 }} noWrap>
              {userName ?? ' '}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: -1.5 }}>
            {/* La ayuda la sirve el portal y solo a quien ha entrado: sin sesión (cargando, error) no sale. */}
            {sessionUser !== null && <HelpButton portalUrl={portalUrl} applications={applications} />}
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
        {/* El texto de la primera pestaña, a la altura del borde del contenido
            (la pestaña ya trae 16 px de relleno por dentro). */}
        {tabs && (
          <Container maxWidth={maxWidth} disableGutters sx={{ px: { xs: 0, sm: 1 } }}>
            {tabs}
          </Container>
        )}
      </AppBar>

      <Container component="main" maxWidth={maxWidth} sx={{ pt: { xs: 2, sm: 3 }, pb: 12 }}>
        {children}
      </Container>
    </>
  )
}
