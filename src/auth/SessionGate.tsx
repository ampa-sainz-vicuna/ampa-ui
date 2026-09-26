import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useCallback, type ReactNode } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { AppShell } from '../shell/AppShell.tsx'
import { useAuth, type SessionUser } from './authContext.ts'
import { LoginPage } from './LoginPage.tsx'
import { NoAccessPage } from './NoAccessPage.tsx'
import { SessionUserContext } from './sessionUserContext.ts'
import { SignInAtPortal } from './SignInAtPortal.tsx'
import { useSession } from './useSession.ts'

/** Lo que recibe la aplicación una vez se sabe quién ha entrado. */
export interface Session<U extends SessionUser> {
  user: U
  /**
   * Para cuando una llamada devuelve 401: la sesión ha caducado o ya no vale.
   * Vuelve a preguntar quién soy y, sin sesión, lleva a entrar.
   */
  onUnauthorized: () => void
  /** El botón de salir. Sale de toda la suite: la sesión es una sola. */
  signOut: () => void
}

interface Props<U extends SessionUser> {
  children: (session: Session<U>) => ReactNode
}

/**
 * La puerta de cualquier aplicación de la suite. Pregunta al servidor quién
 * soy (`GET /api/me`, con la cookie de la suite, que el navegador manda solo)
 * y, según lo que conteste:
 *
 * - quién es → le pasa el control a la aplicación;
 * - 401 (sin sesión) → en el portal, el botón de Google; en cualquier otra
 *   aplicación, al portal a entrar, y el portal la devuelve aquí;
 * - 403 (sin acceso a esta aplicación) → lo dice, con el camino al portal;
 * - otro error → la barra con el error y "Reintentar".
 *
 *     <SessionGate<SessionUser>>
 *       {({ user, onUnauthorized, signOut }) => <Workspace … />}
 *     </SessionGate>
 */
export function SessionGate<U extends SessionUser = SessionUser>({ children }: Props<U>) {
  const { google } = useSuiteApp()
  const { epoch, signedOut, signOut, expire } = useAuth()
  const session = useSession<U>(epoch)

  const handleSignOut = useCallback(() => void signOut(), [signOut])

  switch (session.kind) {
    case 'ready':
      return (
        <SessionUserContext value={session.user}>
          {children({ user: session.user, onUnauthorized: expire, signOut: handleSignOut })}
        </SessionUserContext>
      )

    case 'signedOut':
      return google ? <LoginPage /> : <SignInAtPortal afterSignOut={signedOut} />

    case 'forbidden':
      return <NoAccessPage message={session.message} onSignOut={handleSignOut} />

    case 'error':
      return (
        <AppShell onSignOut={handleSignOut}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={session.retry}>
                Reintentar
              </Button>
            }
          >
            {session.message}
          </Alert>
        </AppShell>
      )

    case 'loading':
      return (
        <AppShell>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress aria-label="Cargando" />
          </Box>
        </AppShell>
      )
  }
}
