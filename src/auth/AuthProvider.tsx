import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../api/client.ts'
import { useSuiteApp } from '../app/suiteApp.ts'
import { AuthContext, type AuthResponse, type AuthState } from './authContext.ts'
import { clearToken, loadToken, saveToken } from './tokenStorage.ts'

/**
 * La sesión: el token propio de la aplicación y cómo se consigue.
 *
 * Todas las aplicaciones de la suite canjean la credencial de Google en la
 * misma ruta, `POST /api/auth/google`, y reciben `{ token, user }`. Ese es el
 * contrato con el servidor; el día que exista el portal del AMPA, cambia aquí
 * y en ningún otro sitio.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { storageKey } = useSuiteApp()
  const tokenKey = `${storageKey}.token`

  // Función en useState: se lee sessionStorage una sola vez, al arrancar.
  const [token, setToken] = useState<string | null>(() => loadToken(tokenKey))
  const [notice, setNotice] = useState<string | null>(null)

  const signIn = useCallback(
    async (googleCredential: string) => {
      const { token: appToken } = await apiRequest<AuthResponse>('/api/auth/google', {
        method: 'POST',
        body: { credential: googleCredential },
      })
      saveToken(tokenKey, appToken)
      setNotice(null)
      setToken(appToken)
    },
    [tokenKey],
  )

  const signOut = useCallback(
    (reason?: string) => {
      clearToken(tokenKey)
      // Evita que Google vuelva a entrar solo con la misma cuenta sin preguntar.
      // "google" solo existe si llegó a cargarse el script de Google.
      if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect()
      }
      setNotice(reason ?? null)
      setToken(null)
    },
    [tokenKey],
  )

  const value = useMemo<AuthState>(() => ({ token, notice, signIn, signOut }), [token, notice, signIn, signOut])

  return <AuthContext value={value}>{children}</AuthContext>
}
