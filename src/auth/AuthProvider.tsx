import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../api/client.ts'
import { AuthContext, type AuthState } from './authContext.ts'

/**
 * La sesión de la suite: entrar (solo en el portal), salir y "ha caducado".
 *
 * El token vive en una cookie que pone el portal para todo el dominio del
 * AMPA; el navegador la manda sola en cada llamada a `/api` y el JavaScript
 * no la ve. Aquí solo se lleva la cuenta de cuándo hay que volver a preguntar
 * al servidor quién soy (`epoch`), y eso lo hace SessionGate.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [signedOut, setSignedOut] = useState(false)

  const signIn = useCallback(async (googleCredential: string) => {
    await apiRequest('/api/auth/google', { method: 'POST', body: { credential: googleCredential } })
    setNotice(null)
    setSignedOut(false)
    setEpoch((n) => n + 1)
  }, [])

  const signOut = useCallback(async (reason?: string) => {
    try {
      await apiRequest('/api/auth/salir', { method: 'POST' })
    } catch {
      // Sin red no se puede borrar la cookie; al volver a preguntar quién soy
      // se verá si sigue dentro, y no hay nada mejor que hacer aquí.
    }
    // Evita que Google vuelva a entrar solo con la misma cuenta sin preguntar.
    // "google" solo existe si llegó a cargarse el script de Google (el portal).
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect()
    }
    setNotice(reason ?? null)
    setSignedOut(true)
    setEpoch((n) => n + 1)
  }, [])

  const expire = useCallback(() => {
    setNotice('Tu sesión ha caducado. Vuelve a entrar.')
    setEpoch((n) => n + 1)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ epoch, notice, signedOut, signIn, signOut, expire }),
    [epoch, notice, signedOut, signIn, signOut, expire],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
