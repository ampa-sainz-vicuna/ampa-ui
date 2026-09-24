import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useCallback, useState } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { useAuth } from './authContext.ts'
import { EntryCard } from './EntryCard.tsx'
import { GoogleSignInButton } from './GoogleSignInButton.tsx'

/**
 * Entrar con Google. Solo la ve el portal: el resto de aplicaciones mandan
 * al portal a quien llega sin sesión (ver SessionGate).
 */
export function LoginPage() {
  const { google } = useSuiteApp()
  const { signIn, notice } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleCredential = useCallback(
    async (credential: string) => {
      setBusy(true)
      setError(null)
      try {
        await signIn(credential)
      } catch (e) {
        // 403 = cuenta de Google válida pero sin acceso a nada; el mensaje del
        // servidor ya lo explica.
        setError(e instanceof Error ? e.message : 'No se ha podido entrar.')
        setBusy(false)
      }
    },
    [signIn],
  )

  return (
    <EntryCard subtitle={google?.hostedDomain ? 'Entra con tu cuenta de Google del AMPA' : 'Entra con tu cuenta de Google'}>
      {notice && <Alert severity="warning">{notice}</Alert>}

      <Box sx={{ minHeight: 44, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {busy ? (
          <CircularProgress size={32} aria-label="Entrando" />
        ) : (
          <GoogleSignInButton onCredential={handleCredential} />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ textAlign: 'left' }}>
          {error}
        </Alert>
      )}
    </EntryCard>
  )
}
