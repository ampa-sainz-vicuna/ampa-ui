import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useEffect } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { goTo, portalSignInUrl } from './navigation.ts'

interface Props {
  /**
   * Si se acaba de salir a propósito: entonces se va al portal sin pedirle
   * que vuelva aquí (quien sale no quiere volver a entrar en esta aplicación).
   */
  afterSignOut: boolean
}

/**
 * Sin sesión, en cualquier aplicación que no sea el portal: se entra en el
 * portal y el portal devuelve aquí. Se hace solo; el enlace es por si el
 * navegador no lo hiciera.
 */
export function SignInAtPortal({ afterSignOut }: Props) {
  const { portalUrl } = useSuiteApp()
  const target = afterSignOut ? portalUrl : portalSignInUrl(portalUrl, window.location.href)

  useEffect(() => {
    goTo(target)
  }, [target])

  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', px: 2 }}
    >
      <CircularProgress aria-label="Yendo al portal" />
      <Button href={target} variant="text">
        Entrar en el portal del AMPA
      </Button>
    </Box>
  )
}
