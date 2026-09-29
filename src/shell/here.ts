import type { SuiteLink } from '../auth/authContext.ts'

/**
 * Si una dirección es la de esta misma página. Se compara el origen (esquema,
 * dominio y puerto): cada aplicación tiene el suyo, en producción y en
 * desarrollo.
 */
export function isHere(url: string): boolean {
  try {
    return new URL(url).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * El código de la aplicación abierta: `portal` si es el portal, el de la
 * aplicación de la lista de `/api/me` cuyo origen es este, o null si no se
 * sabe (un servidor anterior al cliente del portal 0.1.4, que no da la lista).
 */
export function currentApplication(portalUrl: string, applications: SuiteLink[]): string | null {
  if (isHere(portalUrl)) {
    return 'portal'
  }

  return applications.find((application) => isHere(application.url))?.code ?? null
}
