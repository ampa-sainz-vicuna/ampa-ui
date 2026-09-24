import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, apiRequest } from '../api/client.ts'
import type { SessionUser } from './authContext.ts'

export interface SessionState<U extends SessionUser> {
  user: U | null
  error: string | null
  retry: () => void
}

/**
 * Quién soy y qué puedo hacer, preguntado al servidor al abrir la aplicación
 * (`GET /api/me`). Los permisos no se sacan del token: el servidor los decide
 * en cada petición según su base de datos, y esto es lo que dice ahora mismo.
 */
export function useSession<U extends SessionUser>(token: string, onUnauthorized: () => void): SessionState<U> {
  const [user, setUser] = useState<U | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const onUnauthorizedRef = useRef(onUnauthorized)
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  useEffect(() => {
    let cancelled = false

    apiRequest<U>('/api/me', { token })
      .then((fresh) => {
        if (!cancelled) {
          setUser(fresh)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (cancelled) {
          return
        }
        if (e instanceof ApiError && e.status === 401) {
          onUnauthorizedRef.current()
          return
        }
        setError(e instanceof Error ? e.message : 'Error inesperado.')
      })

    return () => {
      cancelled = true
    }
  }, [token, attempt])

  const retry = useCallback(() => {
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  return { user, error, retry }
}
