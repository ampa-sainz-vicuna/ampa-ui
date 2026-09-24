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

/**
 * La sesión de la suite vista desde el navegador.
 *
 * El navegador NO tiene el token: va en una cookie `HttpOnly` que pone el
 * portal y que el JavaScript no puede leer (así un fallo de XSS no basta para
 * robar la sesión). Lo único que sabe el navegador es lo que contesta
 * `GET /api/me`, y por eso esto no guarda "si hay sesión", sino cuándo hay que
 * volver a preguntarlo.
 */
export interface AuthState {
  /** Sube cada vez que hay que volver a preguntar quién soy: al entrar, al salir, tras un 401. */
  epoch: number
  /** Aviso para la pantalla de entrada, p. ej. "tu sesión ha caducado". */
  notice: string | null
  /** Si la sesión se ha cerrado a propósito (el botón de salir), y no por caducar. */
  signedOut: boolean
  /**
   * Solo en el portal: canjea la credencial de Google por la cookie de la
   * suite (`POST /api/auth/google`). Lanza ApiError si falla.
   */
  signIn: (googleCredential: string) => Promise<void>
  /** Borra la cookie (`POST /api/auth/salir`): sale de TODA la suite. */
  signOut: (notice?: string) => Promise<void>
  /** Una llamada ha devuelto 401: la sesión ha caducado o ya no vale. */
  expire: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) {
    throw new Error('useAuth() solo funciona dentro de <SuiteRoot>.')
  }
  return auth
}
