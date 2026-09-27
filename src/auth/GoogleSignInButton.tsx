import Alert from '@mui/material/Alert'
import { useEffect, useRef, useState } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'

/**
 * Botón oficial "Iniciar sesión con Google", de Google Identity Services (GIS).
 *
 * Se carga el script de Google directamente, sin librerías de terceros: es un
 * solo fichero, y así no hay un intermediario más que mantener durante años.
 *
 * En **modo redirección**: al pulsarlo, la página entera se va a Google, la
 * persona elige su cuenta y Google la devuelve con un POST a
 * `/api/auth/google/vuelta` del portal (el mismo origen que esta página), que
 * comprueba el token, pone la cookie y la lleva a la portada con `?entrada=`
 * (ver signInReturn.ts). El frontal no decide nada.
 *
 * Hasta la 0.2.2 iba en modo ventana emergente, y en algunos móviles Android
 * esa ventana se quedaba en blanco (about:blank) sin llegar a Google
 * (27/09/2026). Con la redirección no hay ventana que se pueda colgar.
 *
 * La dirección de vuelta tiene que estar en los "URI de redirección
 * autorizados" del cliente OAuth en Google Cloud, una por cada origen desde el
 * que se entra (el README del portal dice cuáles).
 */

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'

/** La ruta del portal que recibe la vuelta de Google. */
export const GOOGLE_RETURN_PATH = '/api/auth/google/vuelta'

let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (scriptPromise === null) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GIS_SCRIPT
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null // Permite reintentar recargando el componente.
        reject(new Error('No se pudo cargar Google Identity Services.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// GIS acepta `state` (lo devuelve tal cual en el POST de vuelta), pero sus
// tipos no lo traen.
type IdConfiguration = google.accounts.id.IdConfiguration & { state?: string }

// GIS se configura una sola vez por página. React monta los componentes dos
// veces en desarrollo, y un segundo initialize() provoca avisos de Google.
let initialized = false

function initializeGoogle(clientId: string, hostedDomain: string | undefined): void {
  if (initialized) {
    return
  }
  const config: IdConfiguration = {
    client_id: clientId,
    // Solo es una pista para el selector de cuentas; el servidor lo impone.
    hd: hostedDomain || undefined,
    ux_mode: 'redirect',
    login_uri: `${window.location.origin}${GOOGLE_RETURN_PATH}`,
    // La aplicación de la que se venía (?volver=, lo pone SessionGate): el
    // portal la devuelve a la portada y es la portada la que comprueba que
    // sea de las suyas. Sin `callback`: con él, GIS no haría la redirección.
    state: new URLSearchParams(window.location.search).get('volver') ?? undefined,
  }
  google.accounts.id.initialize(config)
  initialized = true
}

export function GoogleSignInButton() {
  // Solo lo pinta LoginPage, que solo sale en el portal (con `google`).
  const { google: config } = useSuiteApp()
  const googleClientId = config?.clientId ?? ''
  const hostedDomain = config?.hostedDomain
  const container = useRef<HTMLDivElement>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || container.current === null) {
          return
        }
        initializeGoogle(googleClientId, hostedDomain)
        google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          locale: 'es',
        })
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [googleClientId, hostedDomain])

  if (loadFailed) {
    return (
      <Alert severity="error" sx={{ textAlign: 'left' }}>
        No se ha podido cargar el acceso con Google. Comprueba la conexión y recarga la página.
      </Alert>
    )
  }

  // El botón lo dibuja Google dentro de este div: su aspecto es el oficial y
  // no se puede (ni se debe) cambiar.
  return <div ref={container} />
}
