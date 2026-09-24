/**
 * Salir de esta página hacia otra (el portal).
 *
 * En una función aparte solo para los tests: jsdom no sabe navegar, y
 * `window.location` no se deja sustituir. Los tests cambian este módulo con
 * `vi.mock('./navigation.ts')`.
 */
export function goTo(url: string): void {
  window.location.assign(url)
}

/**
 * La dirección del portal para entrar y, al terminar, volver a donde estaba.
 * El portal solo hace caso de `volver` si es una de las aplicaciones de quien
 * entra: si no, cualquiera podría usar el portal para mandar a otra web.
 */
export function portalSignInUrl(portalUrl: string, returnTo: string): string {
  return `${portalUrl.replace(/\/+$/, '')}/?volver=${encodeURIComponent(returnTo)}`
}
