import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiRequest } from '../api/client.ts'
import type { SessionUser } from './authContext.ts'

/**
 * Lo que se sabe de la sesión después de preguntar `GET /api/me`:
 *
 * - `loading`: preguntando.
 * - `ready`: dentro; `user` es lo que ha contestado el servidor.
 * - `signedOut` (401): sin sesión, o ya no vale. Hay que entrar.
 * - `forbidden` (403): la sesión vale para la suite, pero no tiene acceso a
 *   ESTA aplicación. Mandarle a entrar no arreglaría nada.
 * - `error`: cualquier otra cosa (sin red, el portal no contesta…). Se
 *   puede reintentar.
 */
export type SessionStatus<U extends SessionUser> =
  | { kind: 'loading' }
  | { kind: 'ready'; user: U }
  | { kind: 'signedOut' }
  | { kind: 'forbidden'; message: string }
  | { kind: 'error'; message: string }

/**
 * Quién soy y qué puedo hacer, preguntado al servidor. Los permisos no se
 * sacan de ningún sitio del navegador: el servidor los decide en cada
 * petición, y esto es lo que dice ahora mismo.
 *
 * Vuelve a preguntar cada vez que cambia `epoch` (al entrar, al salir, tras un
 * 401) y al pulsar "Reintentar".
 */
export function useSession<U extends SessionUser>(epoch: number): SessionStatus<U> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  // Cada respuesta se guarda con la pregunta a la que contesta. Si la
  // pregunta ya es otra (ha cambiado epoch o se ha pulsado "Reintentar"), la
  // respuesta guardada es vieja y se está cargando: se deduce al pintar, sin
  // un setState "cargando" dentro del efecto.
  const question = `${epoch}:${attempt}`
  const [answer, setAnswer] = useState<{ question: string; status: SessionStatus<U> } | null>(null)

  useEffect(() => {
    let cancelled = false
    const settle = (status: SessionStatus<U>) => {
      if (!cancelled) {
        setAnswer({ question, status })
      }
    }

    apiRequest<U>('/api/me')
      .then((user) => settle({ kind: 'ready', user }))
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          settle({ kind: 'signedOut' })
        } else if (e instanceof ApiError && e.status === 403) {
          settle({ kind: 'forbidden', message: e.message })
        } else {
          settle({ kind: 'error', message: e instanceof Error ? e.message : 'Error inesperado.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [question])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const status: SessionStatus<U> = answer?.question === question ? answer.status : { kind: 'loading' }

  return { ...status, retry }
}
