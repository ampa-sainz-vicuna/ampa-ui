import { createContext, useContext } from 'react'

/**
 * Lo mínimo que el servidor de cualquier aplicación de la suite dice de quien
 * ha entrado (`GET /api/me`). Cada aplicación lo amplía con lo suyo: fichajes,
 * por ejemplo, añade si es empleado y si es administrador.
 */
export interface SessionUser {
  name: string
  email: string
}

/** Lo que contesta `POST /api/auth/google` al canjear la credencial de Google. */
export interface AuthResponse {
  token: string
  user: SessionUser
}

export interface AuthState {
  /** JWT propio de la aplicación, o null si no hay sesión. */
  token: string | null
  /** Aviso para la pantalla de entrada, p. ej. "tu sesión ha caducado". */
  notice: string | null
  /** Canjea la credencial de Google por un token propio. Lanza ApiError si falla. */
  signIn: (googleCredential: string) => Promise<void>
  signOut: (notice?: string) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) {
    throw new Error('useAuth() solo funciona dentro de <SuiteRoot>.')
  }
  return auth
}
