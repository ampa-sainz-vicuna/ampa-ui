/**
 * Guarda el JWT propio de la aplicación en sessionStorage: sobrevive a recargar
 * la página pero se borra al cerrar la pestaña.
 *
 * Aquí solo va el token. Ningún dato de la aplicación se guarda en el
 * navegador: se pide al servidor cada vez, porque puede haber cambiado desde
 * otro dispositivo.
 *
 * El acceso va envuelto en try/catch porque algunos navegadores lo bloquean
 * (modo privado, cookies desactivadas). En ese caso la aplicación sigue
 * funcionando, solo que pide entrar de nuevo al recargar.
 *
 * `key` es la clave completa, p. ej. "ampa-listados.token".
 */

export function loadToken(key: string, now: number = Date.now()): string | null {
  let token: string | null
  try {
    token = sessionStorage.getItem(key)
  } catch {
    return null
  }

  if (token === null) {
    return null
  }
  if (isExpired(token, now)) {
    clearToken(key)
    return null
  }
  return token
}

export function saveToken(key: string, token: string): void {
  try {
    sessionStorage.setItem(key, token)
  } catch {
    // Sin almacenamiento: la sesión vivirá solo en memoria.
  }
}

export function clearToken(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nada que borrar.
  }
}

/**
 * Lee la caducidad ("exp") del token sin comprobar la firma.
 *
 * Es solo por comodidad: evita enseñar una pantalla que va a fallar al instante
 * con un 401. Quien decide si el token vale es el servidor, siempre. Un token
 * que no se puede leer se trata como caducado.
 */
export function isExpired(token: string, now: number): boolean {
  const payload = token.split('.')[1]
  if (!payload) {
    return true
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims: unknown = JSON.parse(atob(base64))
    if (typeof claims !== 'object' || claims === null || !('exp' in claims) || typeof claims.exp !== 'number') {
      return true
    }
    // "exp" viene en segundos; Date.now() en milisegundos.
    return claims.exp * 1000 <= now
  } catch {
    return true
  }
}
