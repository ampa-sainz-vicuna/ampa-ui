import { createContext, useContext } from 'react'

/**
 * Lo poco que distingue a una aplicación de la suite de las demás. Todo lo
 * demás (colores, cabecera, cómo se entra) es igual en todas.
 */
export interface SuiteApp {
  /** Cómo la llama quien la usa: "Listados del AMPA". Sale en la barra y en los avisos. */
  name: string
  /**
   * Dónde está el portal del AMPA, que es donde se entra (con Google) para
   * toda la suite. A quien llega sin sesión se le manda allí. En producción,
   * `https://portal.ampasainzvicuna.com`; en desarrollo, el Vite del portal
   * (`http://localhost:5176`).
   */
  portalUrl: string
  /**
   * Solo el propio portal: aquí se entra con Google. Con esto, `SessionGate`
   * pinta el botón de Google en vez de mandar al portal.
   */
  google?: {
    /** ID de cliente OAuth de Google. Es público por diseño: el navegador lo necesita para pintar el botón. */
    clientId: string
    /**
     * Solo una pista para que Google ofrezca las cuentas del AMPA; quien lo
     * impone es el servidor. Sin él, se ofrece cualquier cuenta de Google (es
     * lo que necesitará tareas, donde entran los vocales con su cuenta personal).
     */
    hostedDomain?: string
  }
}

export const SuiteAppContext = createContext<SuiteApp | null>(null)

export function useSuiteApp(): SuiteApp {
  const app = useContext(SuiteAppContext)
  if (app === null) {
    throw new Error('useSuiteApp() solo funciona dentro de <SuiteRoot>.')
  }
  return app
}
