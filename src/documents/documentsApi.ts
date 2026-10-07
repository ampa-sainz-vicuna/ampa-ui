import { ApiError } from '../api/client.ts'
import type { SuiteLink } from '../auth/authContext.ts'

/**
 * Lo que el selector de documentos lee de la API de Documentos
 * (`ampa-documentos`), desde la página de otra aplicación.
 *
 * Es otro origen, así que va con `credentials: 'include'` (la cookie de la
 * suite es de `.ampasainzvicuna.com`) y Documentos contesta CORS con
 * credenciales solo a tareas, proveedores y facturación, y solo para leer:
 * los espacios, sus carpetas y la búsqueda. Como la ayuda contra el portal.
 *
 * Apuntar que el fichero se usa (y la comprobación de que esa persona lo ve)
 * no se hace desde aquí: lo hace el servidor de la aplicación al guardar el
 * adjunto, porque el navegador no puede mandar un POST a otro subdominio de
 * la suite (lo para el cliente del portal).
 */

/** Un espacio de Documentos: una unidad compartida entera («AMPA», «Junta»…). */
export interface DocumentSpace {
  code: string
  name: string
  description: string
}

/** Una carpeta o un fichero, tal como lo da Documentos. */
export interface DocumentItem {
  id: string
  name: string
  kind: 'folder' | 'file'
  mimeType: string
  /** El tipo de lo que se descarga (PDF para un documento de Google), o null si no se puede descargar. */
  contentType: string | null
  /** En bytes; null en los documentos de Google. */
  size: number | null
  modifiedAt: string | null
}

export interface DocumentFolder {
  space: DocumentSpace
  /** null: arriba del todo (el espacio). */
  folder: DocumentItem | null
  path: { id: string; name: string }[]
  items: DocumentItem[]
}

export interface DocumentHit {
  space: { code: string; name: string }
  item: DocumentItem
  folderName: string | null
}

/**
 * La carpeta de la que se eligió un fichero. `id` null: la raíz del espacio
 * (y `name` es el nombre del espacio).
 */
export interface PickedFolder {
  id: string | null
  name: string
}

/** Lo que devuelve el selector: con esto la aplicación guarda el adjunto. */
export interface PickedDocument {
  space: string
  spaceName: string
  id: string
  name: string
  mimeType: string
  contentType: string | null
  size: number | null
  /**
   * De qué carpeta salió (para «carpetas recientes»). Desde la búsqueda,
   * null: el resultado trae el nombre de la carpeta pero no su id, y sin id
   * no se puede volver a abrir.
   */
  folder: PickedFolder | null
}

/**
 * Dónde está Documentos para quien ha entrado: la da el portal en `/api/me`
 * (`applications`). null si esa persona no entra en Documentos.
 */
export function documentsUrlOf(applications: SuiteLink[] | undefined): string | null {
  const documents = applications?.find((application) => application.code === 'documentos')

  return documents === undefined ? null : documents.url.replace(/\/+$/, '')
}

export function fetchSpaces(baseUrl: string): Promise<DocumentSpace[]> {
  return read<{ spaces: DocumentSpace[] }>(`${baseUrl}/api/spaces`).then((body) => body.spaces)
}

export function fetchFolder(baseUrl: string, space: string, folder: string | null): Promise<DocumentFolder> {
  const where = folder === null ? 'folder' : `folders/${encodeURIComponent(folder)}`

  return read<DocumentFolder>(`${baseUrl}/api/spaces/${encodeURIComponent(space)}/${where}`)
}

export function searchDocuments(baseUrl: string, text: string): Promise<DocumentHit[]> {
  return read<{ hits: DocumentHit[] }>(`${baseUrl}/api/search?q=${encodeURIComponent(text)}`).then((body) => body.hits)
}

export function pickedFrom(space: { code: string; name: string }, item: DocumentItem, folder: PickedFolder | null): PickedDocument {
  return {
    space: space.code,
    spaceName: space.name,
    id: item.id,
    name: item.name,
    mimeType: item.mimeType,
    contentType: item.contentType,
    size: item.size,
    folder,
  }
}

async function read<T>(url: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } })
  } catch {
    // Sin red, o Documentos no ha contestado CORS (una versión anterior).
    throw new ApiError(0, 'No hay conexión con Documentos. Comprueba la red e inténtalo de nuevo.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, messageFor(response.status, payload), payload)
  }

  return payload as T
}

function messageFor(status: number, payload: unknown): string {
  if (status === 401) {
    return 'Tu sesión ha caducado. Vuelve a entrar.'
  }

  if (typeof payload === 'object' && payload !== null && typeof (payload as { error?: unknown }).error === 'string') {
    return (payload as { error: string }).error
  }

  return status === 403 ? 'No tienes acceso a Documentos.' : 'Documentos no ha podido contestar. Inténtalo de nuevo en un rato.'
}
