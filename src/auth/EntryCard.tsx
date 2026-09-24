import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'
import { AMPA_LOGO } from '../brand/logo.ts'

interface Props {
  /** La frase bajo el nombre de la aplicación. */
  subtitle: string
  children: ReactNode
}

/**
 * La tarjeta con el logo y el nombre de la aplicación que se ve antes de
 * estar dentro: entrar con Google (en el portal), "te llevamos al portal" y
 * "no tienes acceso". Las tres se parecen a propósito.
 */
export function EntryCard({ subtitle, children }: Props) {
  const { name } = useSuiteApp()

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
            {subtitle}
          </Typography>

          <Stack spacing={2} sx={{ mt: 4 }}>
            {children}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
