import { createContext, useContext } from 'react'

/**
 * Lo poco que distingue a una aplicación de la suite de las demás. Todo lo
 * demás (colores, cabecera, cómo se entra) es igual en todas.
 */
export interface SuiteApp {
  /** Cómo la llama quien la usa: "Listados del AMPA". Sale en la barra y al entrar. */
  name: string
  /**
   * Prefijo de lo que se guarda en el navegador: con "ampa-listados", el token
   * queda en `sessionStorage['ampa-listados.token']`. Cada aplicación está en
   * su propio subdominio y no chocarían, pero con el nombre se sabe de quién es
   * cada cosa al mirarlo en las herramientas del navegador.
   */
  storageKey: string
  /** ID de cliente OAuth de Google. Es público por diseño: el navegador lo necesita para pintar el botón. */
  googleClientId: string
  /**
   * Solo una pista para que Google ofrezca las cuentas del AMPA; quien lo
   * impone es el servidor. Sin él, se ofrece cualquier cuenta de Google (es lo
   * que necesita tareas, donde entran los vocales con su cuenta personal).
   */
  hostedDomain?: string
}

export const SuiteAppContext = createContext<SuiteApp | null>(null)

export function useSuiteApp(): SuiteApp {
  const app = useContext(SuiteAppContext)
  if (app === null) {
    throw new Error('useSuiteApp() solo funciona dentro de <SuiteRoot>.')
  }
  return app
}
