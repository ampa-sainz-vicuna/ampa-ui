import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../shell/AppShell.tsx'
import { TEST_APP, TEST_PORTAL, jsonResponse, renderInSuite } from '../test/fixtures.tsx'
import { useAuth, type SessionUser } from './authContext.ts'
import { goTo } from './navigation.ts'
import { SessionGate } from './SessionGate.tsx'

// jsdom no sabe navegar: se comprueba a dónde se habría ido.
vi.mock('./navigation.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./navigation.ts')>()),
  goTo: vi.fn(),
}))

interface AdminUser extends SessionUser {
  isAdmin: boolean
}

const ALBERTO: AdminUser = { name: 'Alberto', email: 'alberto@ampasainzvicuna.com', isAdmin: true }

function renderGate(app = TEST_APP) {
  return renderInSuite(
    <SessionGate<AdminUser>>
      {({ user, signOut, onUnauthorized }) => (
        <AppShell userName={user.name} onSignOut={signOut}>
          {user.isAdmin ? 'Pantalla de administración' : 'Pantalla normal'}
          <button onClick={onUnauthorized}>Una llamada da 401</button>
        </AppShell>
      )}
    </SessionGate>,
    app,
  )
}

/** Lo que haría el botón de Google, que en jsdom no se puede pulsar. */
function SignInWith({ credential }: { credential: string }) {
  const { signIn } = useAuth()

  return <button onClick={() => void signIn(credential)}>Entrar</button>
}

beforeEach(() => {
  vi.mocked(goTo).mockClear()
})

describe('SessionGate', () => {
  it('pregunta al servidor quién es y le pasa a la aplicación lo que contesta', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ALBERTO))
    vi.stubGlobal('fetch', fetchMock)

    renderGate()

    expect(await screen.findByText('Pantalla de administración')).toBeTruthy()
    expect(screen.getByText('Alberto')).toBeTruthy()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/me')
    // La sesión es la cookie de la suite: nada que mandar a mano.
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('sin sesión, en una aplicación, lleva al portal pidiéndole que vuelva aquí', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))

    renderGate()

    expect(await screen.findByRole('link', { name: 'Entrar en el portal del AMPA' })).toBeTruthy()
    expect(goTo).toHaveBeenCalledWith(`https://portal.ampa.test/?volver=${encodeURIComponent(window.location.href)}`)
  })

  it('sin sesión, en el portal, pinta la entrada con Google', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))

    renderGate(TEST_PORTAL)

    expect(await screen.findByRole('heading', { name: 'Portal del AMPA' })).toBeTruthy()
    expect(screen.getByText('Entra con tu cuenta de Google del AMPA')).toBeTruthy()
    expect(goTo).not.toHaveBeenCalled()
  })

  it('en el portal, sin dominio configurado no dice "del AMPA": entra cualquier cuenta de Google', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))

    renderGate({ ...TEST_PORTAL, google: { clientId: 'x' } })

    expect(await screen.findByText('Entra con tu cuenta de Google')).toBeTruthy()
  })

  it('con sesión pero sin acceso a esta aplicación, lo dice y ofrece el portal (sin dar vueltas)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(403, { error: 'No tienes acceso a esta aplicación.' })))

    renderGate()

    expect(await screen.findByText(/No tienes acceso a esta aplicación\./)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir al portal del AMPA' }).getAttribute('href')).toBe('https://portal.ampa.test')
    expect(goTo).not.toHaveBeenCalled()
  })

  it('si el servidor falla, enseña el error y deja reintentar', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(503, { error: 'No se ha podido comprobar la sesión.' }))
        .mockResolvedValueOnce(jsonResponse(200, ALBERTO)),
    )

    renderGate()
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Pantalla de administración')).toBeTruthy()
  })

  it('si una llamada da 401, vuelve a preguntar y, sin sesión, lleva a entrar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse(200, ALBERTO)).mockResolvedValueOnce(jsonResponse(401, {})),
    )

    renderGate()
    await userEvent.click(await screen.findByRole('button', { name: 'Una llamada da 401' }))

    expect(await screen.findByRole('link', { name: 'Entrar en el portal del AMPA' })).toBeTruthy()
    expect(goTo).toHaveBeenCalledOnce()
  })

  it('en el portal, tras un 401 avisa de que la sesión ha caducado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse(200, ALBERTO)).mockResolvedValueOnce(jsonResponse(401, {})),
    )

    renderGate(TEST_PORTAL)
    await userEvent.click(await screen.findByRole('button', { name: 'Una llamada da 401' }))

    expect(await screen.findByText('Tu sesión ha caducado. Vuelve a entrar.')).toBeTruthy()
  })

  it('al salir borra la cookie en el servidor y va al portal, sin pedirle que vuelva', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, ALBERTO))
      .mockResolvedValueOnce(jsonResponse(204, null))
      .mockResolvedValueOnce(jsonResponse(401, {}))
    vi.stubGlobal('fetch', fetchMock)

    renderGate()
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('link', { name: 'Entrar en el portal del AMPA' })).toBeTruthy()
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/salir')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
    expect(goTo).toHaveBeenCalledWith('https://portal.ampa.test')
  })

  it('en el portal, entrar con Google pone la cookie y vuelve a preguntar quién es', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, ALBERTO))
      .mockResolvedValueOnce(jsonResponse(200, ALBERTO))
    vi.stubGlobal('fetch', fetchMock)

    renderInSuite(
      <>
        <SignInWith credential="credencial-de-google" />
        <SessionGate<AdminUser>>{({ user }) => <p>Dentro, {user.name}</p>}</SessionGate>
      </>,
      TEST_PORTAL,
    )
    await screen.findByRole('heading', { name: 'Portal del AMPA' })
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Dentro, Alberto')).toBeTruthy()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/auth/google')
    expect(init.body).toBe('{"credential":"credencial-de-google"}')
    expect(fetchMock.mock.calls[2][0]).toBe('/api/me')
  })

  it('en el portal, al salir vuelve a la entrada sin avisos', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(200, ALBERTO))
        .mockResolvedValueOnce(jsonResponse(204, null))
        .mockResolvedValueOnce(jsonResponse(401, {})),
    )

    renderGate(TEST_PORTAL)
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Portal del AMPA' })).toBeTruthy()
    expect(screen.queryByText('Tu sesión ha caducado. Vuelve a entrar.')).toBeNull()
  })
})
