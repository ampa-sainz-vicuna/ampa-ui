/**
 * La vuelta de Google al entrar en el portal.
 *
 * El botón de Google va en modo redirección (ver GoogleSignInButton): la
 * página entera se va a Google, Google manda a la persona a
 * `POST /api/auth/google/vuelta`, y el portal la devuelve a su portada con
 * `?entrada=` diciendo cómo ha ido (y el `?volver=` que hubiera).
 */
export type SignInReturn = 'ok' | 'sin-acceso' | 'no-valida' | 'caducada'

const PARAM = 'entrada'

const MESSAGES: Record<Exclude<SignInReturn, 'ok'>, string> = {
  'sin-acceso': 'Esa cuenta no tiene acceso a ninguna aplicación del AMPA.',
  'no-valida': 'Google no ha confirmado esa cuenta. Vuelve a intentarlo.',
  caducada: 'La entrada se ha cortado o ha tardado demasiado. Vuelve a intentarlo.',
}

/** Qué dice la dirección de la página, sin tocarla (se puede llamar dos veces). */
export function readSignInReturn(): SignInReturn | null {
  const value = new URLSearchParams(window.location.search).get(PARAM)

  return value === 'ok' || (value !== null && Object.hasOwn(MESSAGES, value)) ? (value as SignInReturn) : null
}

/** El aviso para la pantalla de entrada, o null si ha ido bien. */
export function signInReturnNotice(outcome: SignInReturn | null): string | null {
  return outcome === null || outcome === 'ok' ? null : MESSAGES[outcome]
}

/**
 * Quita `?entrada=` de la dirección (deja el resto, `?volver=` incluido): que
 * recargar la página no lo repita ni el enlace copiado lo lleve.
 */
export function clearSignInReturn(): void {
  const params = new URLSearchParams(window.location.search)
  if (!params.has(PARAM)) {
    return
  }
  params.delete(PARAM)
  const query = params.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
}
