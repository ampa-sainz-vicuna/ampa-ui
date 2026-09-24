import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider.tsx'
import { theme } from '../brand/theme.ts'
import { SuiteAppContext, type SuiteApp } from './suiteApp.ts'

interface Props {
  app: SuiteApp
  children: ReactNode
}

/**
 * Lo que envuelve a cualquier aplicación de la suite, en su main.tsx: el tema
 * del AMPA, la normalización de estilos y la sesión.
 *
 * Las fuentes (Roboto) no van aquí: son CSS, y un CSS dentro de un paquete no
 * lo puede cargar Node al correr los tests. Las importa cada main.tsx.
 */
export function SuiteRoot({ app, children }: Props) {
  return (
    <SuiteAppContext value={app}>
      <ThemeProvider theme={theme}>
        {/* Normaliza estilos entre navegadores y pinta el fondo del tema. */}
        <CssBaseline />
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </SuiteAppContext>
  )
}
