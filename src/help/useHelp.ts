import { useCallback, useEffect, useState } from 'react'
import { loadedHelp, loadHelp, type HelpContent } from './helpContent.ts'

/**
 * - `idle`: todavía no se ha abierto el panel, así que no se ha pedido nada.
 * - `loading`: preguntando al portal.
 * - `ready`: cargada (puede no traer ninguna pregunta).
 * - `error`: sin red, sin sesión, o el portal no contesta. Se puede reintentar.
 */
export type HelpStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; content: HelpContent }
  | { kind: 'error' }

/**
 * La ayuda del portal, pedida la primera vez que hace falta (`wanted`: se ha
 * abierto el panel) y guardada mientras dure la página. Así abrir una
 * aplicación no cuesta una llamada más al portal si nadie mira la ayuda.
 *
 * Como `useSession`: la respuesta se guarda con la pregunta a la que
 * contesta, y "cargando" se deduce al pintar, sin un setState en el efecto.
 */
export function useHelp(url: string, wanted: boolean): HelpStatus & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const question = `${url}#${attempt}`
  const [answer, setAnswer] = useState<{ question: string; status: HelpStatus } | null>(null)
  const cached = loadedHelp(url)

  useEffect(() => {
    if (!wanted || cached !== undefined) {
      return
    }

    let cancelled = false
    const settle = (status: HelpStatus) => {
      if (!cancelled) {
        setAnswer({ question, status })
      }
    }

    loadHelp(url)
      .then((content) => settle({ kind: 'ready', content }))
      .catch(() => settle({ kind: 'error' }))

    return () => {
      cancelled = true
    }
  }, [url, question, wanted, cached])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  let status: HelpStatus
  if (cached !== undefined) {
    status = { kind: 'ready', content: cached }
  } else if (!wanted) {
    status = { kind: 'idle' }
  } else {
    status = answer?.question === question ? answer.status : { kind: 'loading' }
  }

  return { ...status, retry }
}
