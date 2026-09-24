/**
 * Cómo habla el navegador con el servidor de su aplicación.
 *
 * Las rutas son relativas (`/api/...`): en producción React y Symfony salen del
 * mismo contenedor y del mismo dominio, y en desarrollo Vite reenvía `/api` a
 * nginx. Para el navegador siempre es el mismo origen, así que no hay CORS ni
 * dirección de la API que configurar.
 *
 * La sesión no se manda a mano: es la cookie de la suite, que el navegador
 * añade solo a cada llamada del mismo origen (desde la 0.2.0; antes era un
 * `Authorization: Bearer` con el token guardado en el navegador).
 */

/**
 * Un error de la API con su código HTTP, para que quien llama decida qué hacer:
 * un 401 manda al login; un 409 o un 422 suelen ser el servidor diciendo que
 * eso no se puede hacer ahora, y su mensaje se enseña tal cual.
 *
 * status 0 = ni siquiera hubo respuesta (sin red, servidor caído).
 */
export class ApiError extends Error {
  readonly status: number
  /** El cuerpo de la respuesta, para los errores que traen datos dentro. */
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Un objeto se manda como JSON; un FormData, como formulario con ficheros. */
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options, 'application/json')
  // Un 204 (borrado) no trae cuerpo, y un error del servidor web puede traer HTML.
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(response.status, payload), payload)
  }

  return payload as T
}

/** Un fichero descargado y el nombre que le puso el servidor. */
export interface DownloadedFile {
  blob: Blob
  filename: string
}

/**
 * Descarga un fichero. Si algo falla, el servidor contesta con JSON como en
 * cualquier otra llamada y el error se lanza igual.
 *
 * `fallbackName` es para cuando el servidor no dice cómo se llama.
 */
export async function apiDownload(
  path: string,
  options: RequestOptions = {},
  fallbackName = 'descarga',
): Promise<DownloadedFile> {
  const response = await send(path, options, '*/*')

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw new ApiError(response.status, errorMessage(response.status, payload), payload)
  }

  return {
    blob: await response.blob(),
    filename: filenameFrom(response.headers.get('Content-Disposition')) ?? fallbackName,
  }
}

/**
 * Lo que se enseña cuando algo falla: el mensaje del servidor si lo hay, que
 * está escrito para leerse, y uno genérico si no. Así un mismo fallo se cuenta
 * siempre igual en todas las pantallas.
 */
export function messageOf(failure: unknown): string {
  return failure instanceof Error ? failure.message : 'Ha pasado algo que no sabemos explicar. Vuelve a intentarlo.'
}

async function send(path: string, options: RequestOptions, accept: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: accept }

  // Con FormData el Content-Type lo pone el navegador, porque incluye el
  // separador entre las partes del formulario. Si lo pusiéramos nosotros
  // faltaría ese separador y el servidor no sabría leer el fichero.
  const isForm = options.body instanceof FormData
  if (options.body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    return await fetch(path, {
      method: options.method ?? 'GET',
      // Es lo que hace fetch por defecto; se escribe para que se vea que la
      // cookie de sesión va, y solo a nuestro propio origen.
      credentials: 'same-origin',
      headers,
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Comprueba la red e inténtalo de nuevo.')
  }
}

/**
 * Saca el nombre de la cabecera `Content-Disposition`. Llega de dos formas:
 *
 *     attachment; filename="Listados 2026-09 (22-09-2026 20h15).xlsx"
 *     attachment; filename=N_mina.pdf; filename*=utf-8''N%C3%B3mina.pdf
 *
 * La segunda es la de Symfony cuando el nombre lleva acentos: `filename` es
 * una copia en ASCII para navegadores antiguos y `filename*`, el nombre de
 * verdad. Por eso se busca primero `filename*`.
 */
function filenameFrom(header: string | null): string | null {
  const encoded = /filename\*=(?:UTF-8'')?"?([^";]+)"?/i.exec(header ?? '')
  if (encoded) {
    return decodeURIComponent(encoded[1])
  }

  const plain = /filename="?([^";]+)"?/i.exec(header ?? '')

  return plain ? plain[1] : null
}

/**
 * Los mensajes del servidor ya están escritos para leerse ("Este Excel no
 * parece el listado de inscritos de MiAmpa", "El mes 2026-08 está cerrado"),
 * así que se enseñan tal cual. El texto genérico es solo para cuando no manda
 * ninguno.
 */
function errorMessage(status: number, payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string') {
    return payload.error
  }
  if (status === 401) {
    return 'Tu sesión ha caducado. Vuelve a entrar.'
  }
  if (status === 404) {
    return 'Eso ya no existe. Recarga la página para ver cómo están las cosas.'
  }
  // Lo corta el servidor web antes de llegar a Symfony, así que no trae mensaje.
  if (status === 413) {
    return 'El fichero es demasiado grande.'
  }

  return `El servidor ha respondido con un error (${status}). Inténtalo de nuevo en un momento.`
}
