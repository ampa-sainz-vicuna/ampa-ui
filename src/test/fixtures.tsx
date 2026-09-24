import { render, type RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SuiteRoot } from '../app/SuiteRoot.tsx'
import type { SuiteApp } from '../app/suiteApp.ts'

export const TEST_APP: SuiteApp = {
  name: 'Pruebas del AMPA',
  storageKey: 'ampa-pruebas',
  googleClientId: 'cliente-de-pruebas.apps.googleusercontent.com',
  hostedDomain: 'ampasainzvicuna.com',
}

/** Pinta algo dentro de la suite, como lo haría el main.tsx de una aplicación. */
export function renderInSuite(ui: ReactNode, app: SuiteApp = TEST_APP): RenderResult {
  return render(<SuiteRoot app={app}>{ui}</SuiteRoot>)
}

/** Un JWT con solo la parte que lee el navegador (la firma no se comprueba aquí). */
export function fakeJwt(expSeconds: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode({ username: 'alberto@ampa.test', exp: expSeconds })}.firma`
}

/** Un token que caduca dentro de una hora. */
export function liveJwt(): string {
  return fakeJwt(Math.floor(Date.now() / 1000) + 3600)
}

export function jsonResponse(status: number, body: unknown): Response {
  // Un 204 no lleva cuerpo, y el constructor de Response rechaza que se lo
  // pongas. Es lo que contesta el servidor al borrar.
  if (status === 204) {
    return new Response(null, { status })
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
