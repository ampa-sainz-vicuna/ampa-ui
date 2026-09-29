/**
 * Las preguntas de la ayuda, tal como las sirve el portal en `GET /api/ayuda`.
 *
 * Las sirve el portal, y no cada aplicación, para que estén escritas en un
 * solo sitio: las generales valen para todas y cada persona ve solo las de
 * las aplicaciones a las que tiene acceso (eso lo filtra el servidor). Desde
 * una aplicación es otro origen, así que la llamada lleva
 * `credentials: 'include'` para que vaya la cookie de la suite (es de
 * `.ampasainzvicuna.com`), y el portal contesta CORS con credenciales a los
 * orígenes de la suite. En el propio portal es el mismo origen y no cambia
 * nada.
 */

/** Una pregunta con su respuesta. */
export interface HelpEntry {
  id: string
  /** De qué aplicación es, por su código del catálogo del portal, o `general`. */
  application: string
  question: string
  /** Texto con un poco de formato: párrafos, `1. ` listas, `- ` viñetas y `**negrita**`. */
  answer: string
  keywords: string[]
  /** El capítulo del manual donde está explicado, si lo hay: "06". */
  manual: string | null
}

export interface HelpContent {
  /** El cuaderno de NotebookLM al que se manda lo que no está en la ayuda. */
  notebookUrl: string | null
  /** A quién escribir si tampoco sirve el asistente. */
  contactEmail: string | null
  /** Cuándo se revisaron las preguntas por última vez: "2026-09-28". */
  updatedAt: string | null
  entries: HelpEntry[]
}

/** La dirección de la ayuda en el portal. */
export function helpUrl(portalUrl: string): string {
  return `${portalUrl.replace(/\/+$/, '')}/api/ayuda`
}

// Lo ya cargado, mientras dure la página: la ayuda cambia poco y no merece
// una llamada cada vez que se abre el panel o se cambia de pantalla. Lo que
// está en camino también se guarda, para no pedirlo dos veces a la vez.
const loaded = new Map<string, HelpContent>()
const pending = new Map<string, Promise<HelpContent>>()

/** Lo que ya se cargó de esa dirección, si se cargó. */
export function loadedHelp(url: string): HelpContent | undefined {
  return loaded.get(url)
}

/**
 * Pide la ayuda al portal, una sola vez por página. Si falla, no se guarda
 * nada: el siguiente intento vuelve a preguntar.
 */
export function loadHelp(url: string): Promise<HelpContent> {
  const cached = loaded.get(url)
  if (cached !== undefined) {
    return Promise.resolve(cached)
  }

  let request = pending.get(url)
  if (request === undefined) {
    request = fetchHelp(url)
      .then((content) => {
        loaded.set(url, content)
        return content
      })
      .finally(() => pending.delete(url))
    pending.set(url, request)
  }

  return request
}

/** Solo para los tests: que cada uno empiece sin nada cargado. */
export function forgetLoadedHelp(): void {
  loaded.clear()
  pending.clear()
}

async function fetchHelp(url: string): Promise<HelpContent> {
  const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`La ayuda ha respondido ${response.status}.`)
  }

  return parseHelp(await response.json())
}

/**
 * Lo que contesta el portal, comprobado: una entrada mal escrita se salta en
 * vez de romper el panel entero.
 */
export function parseHelp(payload: unknown): HelpContent {
  const body = isObject(payload) ? payload : {}
  const entries = Array.isArray(body.entries) ? body.entries : []

  return {
    notebookUrl: textOrNull(body.notebookUrl),
    contactEmail: textOrNull(body.contactEmail),
    updatedAt: textOrNull(body.updatedAt),
    entries: entries.flatMap((raw, index): HelpEntry[] => {
      if (!isObject(raw) || typeof raw.question !== 'string' || typeof raw.answer !== 'string') {
        return []
      }

      return [
        {
          id: typeof raw.id === 'string' ? raw.id : `pregunta-${index}`,
          application: typeof raw.application === 'string' ? raw.application : 'general',
          question: raw.question,
          answer: raw.answer,
          keywords: Array.isArray(raw.keywords) ? raw.keywords.filter((k): k is string => typeof k === 'string') : [],
          manual: textOrNull(raw.manual),
        },
      ]
    }),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}
