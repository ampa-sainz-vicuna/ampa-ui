import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
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
 *
 * Desde la 0.2.4, con la franja roja arriba, como la barra de dentro, y sobre
 * un fondo con los dos colores de la marca muy difuminados: es la primera
 * pantalla que ve todo el mundo y tiene que parecer la misma casa.
 */
export function EntryCard({ subtitle, children }: Props) {
  const { name } = useSuiteApp()

  return (
    <Box
      component="main"
      sx={(theme) => ({
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        backgroundImage: [
          `radial-gradient(640px 480px at 15% 10%, ${alpha(theme.palette.primary.main, 0.1)}, transparent 70%)`,
          `radial-gradient(720px 520px at 85% 90%, ${alpha(theme.palette.secondary.main, 0.14)}, transparent 70%)`,
        ].join(', '),
      })}
    >
      <Card
        sx={(theme) => ({
          width: '100%',
          maxWidth: 420,
          borderRadius: '28px',
          // La banda roja de arriba, recta: el borde de la tarjeta la recorta.
          '&::before': { content: '""', display: 'block', height: 4, bgcolor: 'primary.main' },
          boxShadow: `0 2px 6px ${alpha(theme.palette.secondary.main, 0.08)}, 0 24px 60px ${alpha(theme.palette.secondary.main, 0.16)}`,
        })}
      >
        <CardContent sx={{ px: { xs: 3, sm: 5 }, py: 5, textAlign: 'center', '&:last-child': { pb: 5 } }}>
          <Box
            component="img"
            src={AMPA_LOGO}
            alt="AMPA CEIP Manuel Sainz de Vicuña"
            sx={{ width: '100%', maxWidth: 220, height: 'auto', mx: 'auto', display: 'block' }}
          />

          <Typography variant="h5" component="h1" sx={{ mt: 4 }}>
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
