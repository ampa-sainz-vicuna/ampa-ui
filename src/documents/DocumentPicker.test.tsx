import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '../auth/authContext.ts'
import { SessionUserContext } from '../auth/sessionUserContext.ts'
import { jsonResponse, renderInSuite } from '../test/fixtures.tsx'
import { DocumentPicker } from './DocumentPicker.tsx'
import type { PickedDocument } from './documentsApi.ts'

const DOCUMENTS = 'https://documentos.ampa.test'

const USER: SessionUser = {
  name: 'Alberto',
  email: 'info@ampa.test',
  applications: [
    { code: 'tareas', name: 'Tareas', url: window.location.origin },
    { code: 'documentos', name: 'Documentos', url: `${DOCUMENTS}/` },
  ],
}

const SPACES = {
  spaces: [
    { code: 'ampa', name: 'AMPA', description: 'Lo del AMPA para todos.', readOnly: false, writable: true },
    { code: 'junta', name: 'Junta', description: 'Solo la junta.', readOnly: false, writable: true },
  ],
}

function file(id: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, kind: 'file', mimeType: 'application/pdf', contentType: 'application/pdf', size: 1200, modifiedAt: null, ...extra }
}

const ROOT = {
  space: SPACES.spaces[0],
  folder: null,
  path: [],
  items: [
    { id: 'actas', name: 'Actas', kind: 'folder', mimeType: 'application/vnd.google-apps.folder', contentType: null, size: null, modifiedAt: null },
    file('presupuesto', 'Presupuesto balones.pdf'),
    file('formulario', 'Inscripción', { mimeType: 'application/vnd.google-apps.form', contentType: null, size: null }),
  ],
}

const ACTAS = {
  space: SPACES.spaces[0],
  folder: ROOT.items[0],
  path: [],
  items: [file('acta', 'Acta octubre.pdf')],
}

function stubDocuments(routes: Record<string, unknown>) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input)
    const body = routes[url.replace(DOCUMENTS, '')]
    return body === undefined ? jsonResponse(404, { error: 'No está.' }) : jsonResponse(200, body)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPicker(props: Partial<Parameters<typeof DocumentPicker>[0]> = {}, user: SessionUser | null = USER) {
  const onPick = vi.fn<(document: PickedDocument) => void>()
  renderInSuite(
    <SessionUserContext value={user}>
      <DocumentPicker open onPick={onPick} onClose={() => {}} {...props} />
    </SessionUserContext>,
  )
  return onPick
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('El selector de Documentos', () => {
  it('va de los espacios a una carpeta y devuelve el fichero elegido', async () => {
    const fetchMock = stubDocuments({ '/api/spaces': SPACES, '/api/spaces/ampa/folder': ROOT, '/api/spaces/ampa/folders/actas': ACTAS })
    const onPick = renderPicker()

    await userEvent.click(await screen.findByRole('button', { name: /AMPA/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Actas' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Acta octubre.pdf' }))
    await userEvent.click(screen.getByRole('button', { name: 'Adjuntar' }))

    expect(onPick).toHaveBeenCalledWith({
      space: 'ampa',
      spaceName: 'AMPA',
      id: 'acta',
      name: 'Acta octubre.pdf',
      mimeType: 'application/pdf',
      contentType: 'application/pdf',
      size: 1200,
    })
    // Otro origen: con la cookie de la suite, y a la dirección que da el portal (sin la barra del final).
    expect(fetchMock).toHaveBeenCalledWith(`${DOCUMENTS}/api/spaces`, expect.objectContaining({ credentials: 'include' }))
  })

  it('no deja adjuntar sin elegir, ni copiar lo que no se descarga', async () => {
    stubDocuments({ '/api/spaces': SPACES, '/api/spaces/ampa/folder': ROOT })
    renderPicker({ requireContent: true })

    await userEvent.click(await screen.findByRole('button', { name: /AMPA/ }))
    await screen.findByText('Presupuesto balones.pdf')

    expect(screen.getByRole('button', { name: 'Adjuntar' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /Inscripción/ }).getAttribute('aria-disabled')).toBe('true')
  })

  it('busca en todos los espacios cuando se escribe', async () => {
    stubDocuments({
      '/api/spaces': SPACES,
      '/api/search?q=acta': { hits: [{ space: { code: 'junta', name: 'Junta' }, item: file('acta-junta', 'Acta junta.pdf'), folderName: 'Actas' }] },
    })
    const onPick = renderPicker()

    await userEvent.type(screen.getByRole('textbox', { name: 'Buscar en Documentos' }), 'acta')
    const hit = await screen.findByRole('button', { name: /Acta junta\.pdf/ })
    expect(within(hit).getByText('Junta › Actas')).toBeTruthy()

    await userEvent.click(hit)
    await userEvent.click(screen.getByRole('button', { name: 'Adjuntar' }))
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ space: 'junta', id: 'acta-junta' }))
  })

  it('dice lo que contesta Documentos y deja reintentar', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(503, { error: 'Google Drive no responde.' })).mockResolvedValueOnce(jsonResponse(200, SPACES))
    vi.stubGlobal('fetch', fetchMock)
    renderPicker()

    expect(await screen.findByText('Google Drive no responde.')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: /Junta/ })).toBeTruthy()
  })

  it('a quien no entra en Documentos se lo dice, sin preguntar a nadie', () => {
    const fetchMock = stubDocuments({})
    renderPicker({}, { ...USER, applications: [USER.applications![0]] })

    expect(screen.getByText(/No entras en Documentos/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('enseña el error de la aplicación al guardar y no deja mandarlo dos veces', async () => {
    stubDocuments({ '/api/spaces': SPACES })
    renderPicker({ busy: true, error: 'No se ha podido guardar el adjunto.' })

    await waitFor(() => expect(screen.getByText('No se ha podido guardar el adjunto.')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Guardando…' }).hasAttribute('disabled')).toBe(true)
  })
})
