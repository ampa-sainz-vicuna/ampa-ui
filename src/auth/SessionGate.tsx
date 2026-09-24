import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useCallback, type ReactNode } from 'react'
import { AppShell } from '../shell/AppShell.tsx'
import { useAuth, type SessionUser } from './authContext.ts'
import { LoginPage } from './LoginPage.tsx'
import { useSession } from './useSession.ts'

/** Lo que recibe la aplicación una vez se sabe quién ha entrado. */
export interface Session<U extends SessionUser> {
  user: U
  token: string
  /**
   * Para cuando una llamada devuelve 401: vuelve a la pantalla de entrada
   * avisando de que la sesión ha caducado.
   */
  onUnauthorized: () => void
  /** El botón de salir. */
  signOut: () => void
}

interface Props<U extends SessionUser> {
  children: (session: Session<U>) => ReactNode
}

/**
 * La puerta de cualquier aplicación de la suite: sin sesión, la pantalla de
 * entrada; con sesión, pregunta al servidor quién es y hasta que contesta
 * enseña la barra y un indicador de carga (o el error, con "Reintentar").
 * Solo cuando lo sabe le pasa el control a la aplicación.
 *
 * Es lo que fichajes y listados tenían copiado en su App.tsx casi letra a letra.
 *
 *     <SessionGate<SessionUser>>
 *       {({ user, token, onUnauthorized, signOut }) => <Workspace … />}
 *     </SessionGate>
 */
export function SessionGate<U extends SessionUser = SessionUser>({ children }: Props<U>) {
  const { token, signOut } = useAuth()

  const handleUnauthorized = useCallback(() => signOut('Tu sesión ha caducado. Vuelve a entrar.'), [signOut])
  const handleSignOut = useCallback(() => signOut(), [signOut])

  if (token === null) {
    return <LoginPage />
  }

  return (
    <SignedIn<U> token={token} onUnauthorized={handleUnauthorized} onSignOut={handleSignOut}>
      {children}
    </SignedIn>
  )
}

interface SignedInProps<U extends SessionUser> extends Props<U> {
  token: string
  onUnauthorized: () => void
  onSignOut: () => void
}

function SignedIn<U extends SessionUser>({ token, onUnauthorized, onSignOut, children }: SignedInProps<U>) {
  const { user, error, retry } = useSession<U>(token, onUnauthorized)

  if (user === null) {
    return (
      <AppShell onSignOut={onSignOut}>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress aria-label="Cargando" />
          </Box>
        )}
      </AppShell>
    )
  }

  return children({ user, token, onUnauthorized, signOut: onSignOut })
}
