import { createContext, useContext } from 'react'
import type { SessionUser } from './authContext.ts'

/**
 * Lo que ha contestado `GET /api/me`, para lo que se pinta dentro de la
 * sesión sin que la aplicación tenga que pasarlo a mano (el selector de
 * aplicaciones de la barra). Lo pone SessionGate; fuera de él, null.
 */
export const SessionUserContext = createContext<SessionUser | null>(null)

export function useSessionUser(): SessionUser | null {
  return useContext(SessionUserContext)
}
