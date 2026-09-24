import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { AMPA_LOGO } from '../brand/logo.ts'
import { useAuth } from './authContext.ts'
import { GoogleSignInButton } from './GoogleSignInButton.tsx'

export function LoginPage() {
  const { name, hostedDomain } = useSuiteApp()
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
        // 403 = cuenta de Google válida pero sin permiso en esta aplicación; el
        // mensaje del servidor ya lo explica.
        setError(e instanceof Error ? e.message : 'No se ha podido entrar.')
        setBusy(false)
      }
    },
    [signIn],
  )

  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            component="img"
            src={AMPA_LOGO}
            alt="AMPA CEIP Manuel Sainz de Vicuña"
            sx={{ width: '100%', maxWidth: 240, height: 'auto', mx: 'auto', display: 'block' }}
          />

          <Typography variant="h5" component="h1" sx={{ mt: 3, fontWeight: 500 }}>
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {hostedDomain ? 'Entra con tu cuenta de Google del AMPA' : 'Entra con tu cuenta de Google'}
          </Typography>

          <Stack spacing={2} sx={{ mt: 4 }}>
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
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
