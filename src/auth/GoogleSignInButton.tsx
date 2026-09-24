import Alert from '@mui/material/Alert'
import { useEffect, useRef, useState } from 'react'
import { useSuiteApp } from '../app/suiteApp.ts'

/**
 * Botón oficial "Iniciar sesión con Google", de Google Identity Services (GIS).
 *
 * Se carga el script de Google directamente, sin librerías de terceros: es un
 * solo fichero, y así no hay un intermediario más que mantener durante años.
 *
 * Google abre su propia ventana, la persona elige su cuenta y Google llama a
 * `onCredential` con un ID token firmado. Ese token se manda tal cual al
 * servidor, que es quien lo comprueba. El frontal no decide nada.
 */

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'

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

// GIS se configura una sola vez por página. React monta los componentes dos
// veces en desarrollo, y un segundo initialize() provoca avisos de Google. Por
// eso la inicialización y el callback viven fuera del componente.
let initialized = false
let credentialHandler: (credential: string) => void = () => {}

function initializeGoogle(clientId: string, hostedDomain: string | undefined): void {
  if (initialized) {
    return
  }
  google.accounts.id.initialize({
    client_id: clientId,
    // Solo es una pista para el selector de cuentas; el servidor lo impone.
    hd: hostedDomain || undefined,
    callback: (response) => credentialHandler(response.credential),
  })
  initialized = true
}

interface Props {
  onCredential: (credential: string) => void
}

export function GoogleSignInButton({ onCredential }: Props) {
  // Solo lo pinta LoginPage, que solo sale en el portal (con `google`).
  const { google: config } = useSuiteApp()
  const googleClientId = config?.clientId ?? ''
  const hostedDomain = config?.hostedDomain
  const container = useRef<HTMLDivElement>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    credentialHandler = onCredential
  }, [onCredential])

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
