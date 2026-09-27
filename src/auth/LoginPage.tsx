import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { useSuiteApp } from '../app/suiteApp.ts'
import { useAuth } from './authContext.ts'
import { EntryCard } from './EntryCard.tsx'
import { GoogleSignInButton } from './GoogleSignInButton.tsx'

/**
 * Entrar con Google. Solo la ve el portal: el resto de aplicaciones mandan
 * al portal a quien llega sin sesión (ver SessionGate).
 *
 * El botón se lleva la página a Google y el portal la trae de vuelta; si no
 * se ha podido entrar (cuenta sin acceso, entrada caducada…), el porqué llega
 * en `notice` (AuthProvider lo saca de `?entrada=`).
 */
export function LoginPage() {
  const { google } = useSuiteApp()
  const { notice } = useAuth()

  return (
    <EntryCard subtitle={google?.hostedDomain ? 'Entra con tu cuenta de Google del AMPA' : 'Entra con tu cuenta de Google'}>
      {notice && <Alert severity="warning">{notice}</Alert>}

      <Box sx={{ minHeight: 44, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <GoogleSignInButton />
      </Box>
    </EntryCard>
  )
}
