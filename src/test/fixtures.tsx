import { render, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SuiteRoot } from '../app/SuiteRoot.tsx'
import type { SuiteApp } from '../app/suiteApp.ts'

/** Una aplicación cualquiera de la suite: sin sesión, manda al portal. */
export const TEST_APP: SuiteApp = {
  name: 'Pruebas del AMPA',
  portalUrl: 'https://portal.ampa.test',
}

/** El portal: sin sesión, pinta el botón de Google. */
export const TEST_PORTAL: SuiteApp = {
  name: 'Portal del AMPA',
  portalUrl: 'https://portal.ampa.test',
  google: {
    clientId: 'cliente-de-pruebas.apps.googleusercontent.com',
    hostedDomain: 'ampasainzvicuna.com',
  },
}

/** Pinta algo dentro de la suite, como lo haría el main.tsx de una aplicación. */
export function renderInSuite(ui: ReactNode, app: SuiteApp = TEST_APP): RenderResult {
  return render(<SuiteRoot app={app}>{ui}</SuiteRoot>)
}

export function jsonResponse(status: number, body: unknown): Response {
  // Un 204 no lleva cuerpo, y el constructor de Response rechaza que se lo
  // pongas. Es lo que contesta el servidor al borrar o al salir.
  if (status === 204) {
    return new Response(null, { status })
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
