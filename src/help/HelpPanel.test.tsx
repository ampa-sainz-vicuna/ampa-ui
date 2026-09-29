import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '../auth/authContext.ts'
import { SessionUserContext } from '../auth/sessionUserContext.ts'
import { AppShell } from '../shell/AppShell.tsx'
import { jsonResponse, renderInSuite } from '../test/fixtures.tsx'
import { forgetLoadedHelp } from './helpContent.ts'

const NOTEBOOK = 'https://notebooklm.google.com/notebook/de-pruebas'

// La aplicación abierta es fichajes: su dirección es la de esta página.
const USER: SessionUser = {
  name: 'Alberto',
  email: 'info@ampa.test',
  applications: [
    { code: 'fichajes', name: 'Fichajes del AMPA', url: window.location.origin },
    { code: 'facturacion', name: 'Facturación del AMPA', url: 'https://facturacion.ampa.test' },
  ],
}

const HELP = {
  notebookUrl: NOTEBOOK,
  contactEmail: 'ayuda@ampa.test',
  updatedAt: '2026-09-28',
  entries: [
    {
      id: 'general-entrar',
      application: 'general',
      question: '¿No puedo entrar?',
      answer: 'Entra con la cuenta del AMPA.',
      keywords: ['sesión'],
      manual: null,
    },
    {
      id: 'facturacion-devuelto',
      application: 'facturacion',
      question: '¿Qué hago con un recibo devuelto?',
      answer: 'Míralo en el diario.\n\n1. Abre el recibo.\n2. Pulsa **Devuelto**.',
      keywords: ['banco'],
      manual: '06',
    },
    {
      id: 'fichajes-vacaciones',
      application: 'fichajes',
      question: '¿Cómo pido vacaciones?',
      answer: 'Desde Ausencias.',
      keywords: [],
      manual: '02',
    },
  ],
}

function stubFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) {
    if (response instanceof Error) {
      fetchMock.mockRejectedValueOnce(response)
    } else {
      fetchMock.mockResolvedValueOnce(response)
    }
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderShell(user: SessionUser | null = USER) {
  return renderInSuite(
    <SessionUserContext value={user}>
      <AppShell userName="Alberto">Contenido</AppShell>
    </SessionUserContext>,
  )
}

async function openHelp() {
  await userEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
  return screen.findByRole('dialog', { name: 'Ayuda' })
}

describe('La ayuda de la barra', () => {
  beforeEach(() => forgetLoadedHelp())

  it('sin sesión no hay botón de ayuda', () => {
    renderShell(null)

    expect(screen.queryByRole('button', { name: 'Ayuda' })).toBeNull()
  })

  it('no pide nada hasta que se abre, y entonces al portal con la cookie', async () => {
    const fetchMock = stubFetch(jsonResponse(200, HELP))
    renderShell()

    expect(fetchMock).not.toHaveBeenCalled()
    await openHelp()

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://portal.ampa.test/api/ayuda')
    expect(init?.credentials).toBe('include')
  })

  it('al abrir, el buscador tiene el foco; sin nada escrito, las de esta aplicación y después las generales', async () => {
    stubFetch(jsonResponse(200, HELP))
    renderShell()

    const panel = await openHelp()

    await within(panel).findByText('¿Cómo pido vacaciones?')
    expect(document.activeElement).toBe(within(panel).getByRole('searchbox', { name: 'Buscar en la ayuda' }))
    const groups = within(panel).getAllByRole('heading', { level: 3 })
    expect(groups.map((group) => group.textContent)).toEqual(['Fichajes', 'General'])
    expect(within(panel).getByText('¿No puedo entrar?')).toBeTruthy()
    // Las de otra aplicación salen al buscar, no de entrada.
    expect(within(panel).queryByText('¿Qué hago con un recibo devuelto?')).toBeNull()
  })

  it('busca sin tildes y a medio escribir, y al abrir la pregunta enseña la respuesta y de dónde sale', async () => {
    stubFetch(jsonResponse(200, HELP))
    renderShell()
    const panel = await openHelp()
    await within(panel).findByText('¿Cómo pido vacaciones?')

    await userEvent.type(within(panel).getByRole('searchbox'), 'QUE HAGO con un RECIBO devuel')

    const question = within(panel).getByRole('button', { name: '¿Qué hago con un recibo devuelto?' })
    expect(within(panel).queryByText('¿Cómo pido vacaciones?')).toBeNull()
    await userEvent.click(question)

    expect(await within(panel).findByText('Míralo en el diario.')).toBeTruthy()
    expect(within(panel).getByText('Devuelto').tagName).toBe('STRONG')
    expect(within(panel).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Abre el recibo.',
      'Pulsa Devuelto.',
    ])
    expect(within(panel).getByText('Manual 06 · Facturación')).toBeTruthy()
  })

  it('si no está, el botón del asistente abre el cuaderno en otra pestaña, y el correo', async () => {
    stubFetch(jsonResponse(200, HELP))
    renderShell()
    const panel = await openHelp()
    await within(panel).findByText('¿Cómo pido vacaciones?')

    await userEvent.type(within(panel).getByRole('searchbox'), 'tractor amarillo')

    expect(within(panel).getByText('No está en la ayuda.')).toBeTruthy()
    const assistant = within(panel).getByRole('link', { name: 'Preguntar al asistente' })
    expect(assistant.getAttribute('href')).toBe(NOTEBOOK)
    expect(assistant.getAttribute('target')).toBe('_blank')
    expect(assistant.getAttribute('rel')).toBe('noopener')
    expect(within(panel).getByText('ayuda@ampa.test').parentElement?.textContent).toBe('o escribe a ayuda@ampa.test')
    // Y al pie, siempre, el mismo cuaderno más discreto.
    expect(within(panel).getByRole('link', { name: '¿No lo encuentras? Pregunta al asistente' }).getAttribute('href')).toBe(NOTEBOOK)
  })

  it('sin cuaderno, si no está, solo el correo', async () => {
    stubFetch(jsonResponse(200, { ...HELP, notebookUrl: null }))
    renderShell()
    const panel = await openHelp()
    await within(panel).findByText('¿Cómo pido vacaciones?')

    await userEvent.type(within(panel).getByRole('searchbox'), 'tractor')

    expect(within(panel).queryByRole('link')).toBeNull()
    expect(within(panel).getByText('ayuda@ampa.test').parentElement?.textContent).toBe('Escribe a ayuda@ampa.test')
  })

  it('sin red lo dice, y "Reintentar" vuelve a pedirla', async () => {
    const fetchMock = stubFetch(new TypeError('Failed to fetch'), jsonResponse(200, HELP))
    renderShell()
    const panel = await openHelp()

    expect(await within(panel).findByText('No se ha podido cargar la ayuda.')).toBeTruthy()
    await userEvent.click(within(panel).getByRole('button', { name: 'Reintentar' }))

    expect(await within(panel).findByText('¿Cómo pido vacaciones?')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('un 401 del portal también es "no se ha podido cargar"', async () => {
    stubFetch(jsonResponse(401, { error: 'Sin sesión.' }))
    renderShell()
    const panel = await openHelp()

    expect(await within(panel).findByText('No se ha podido cargar la ayuda.')).toBeTruthy()
  })

  it('sin preguntas cargadas lo dice', async () => {
    stubFetch(jsonResponse(200, { notebookUrl: null, contactEmail: null, updatedAt: null, entries: [] }))
    renderShell()
    const panel = await openHelp()

    expect(await within(panel).findByText('Todavía no hay preguntas cargadas.')).toBeTruthy()
  })

  it('se pide una sola vez: al cerrar y volver a abrir ya está, y con el buscador vacío', async () => {
    const fetchMock = stubFetch(jsonResponse(200, HELP))
    renderShell()
    let panel = await openHelp()
    await within(panel).findByText('¿Cómo pido vacaciones?')
    await userEvent.type(within(panel).getByRole('searchbox'), 'recibo')

    await userEvent.click(within(panel).getByRole('button', { name: 'Cerrar la ayuda' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    panel = await openHelp()

    expect(within(panel).getByText('¿Cómo pido vacaciones?')).toBeTruthy()
    expect((within(panel).getByRole('searchbox') as HTMLInputElement).value).toBe('')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('en el portal, las del portal primero', async () => {
    // El portal es la propia página: su dirección es la de este origen.
    stubFetch(
      jsonResponse(200, {
        ...HELP,
        entries: [...HELP.entries, { id: 'portal-permisos', application: 'portal', question: '¿Cómo doy permisos?', answer: 'En Permisos.', keywords: [], manual: null }],
      }),
    )
    renderInSuite(
      <SessionUserContext value={{ name: 'Admin', email: 'admin@ampa.test', applications: [] }}>
        <AppShell>Contenido</AppShell>
      </SessionUserContext>,
      { name: 'Portal del AMPA', portalUrl: window.location.origin },
    )
    const panel = await openHelp()

    await within(panel).findByText('¿Cómo doy permisos?')
    expect(within(panel).getAllByRole('heading', { level: 3 }).map((group) => group.textContent)).toEqual(['Portal', 'General'])
  })
})
