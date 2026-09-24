import Button from '@mui/material/Button'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from '../shell/AppShell.tsx'
import { TEST_APP, jsonResponse, liveJwt, renderInSuite } from '../test/fixtures.tsx'
import { useAuth, type SessionUser } from './authContext.ts'
import { SessionGate } from './SessionGate.tsx'

interface AdminUser extends SessionUser {
  isAdmin: boolean
}

const ALBERTO: AdminUser = { name: 'Alberto', email: 'alberto@ampasainzvicuna.com', isAdmin: true }

function renderGate() {
  return renderInSuite(
    <SessionGate<AdminUser>>
      {({ user, signOut }) => (
        <AppShell userName={user.name} onSignOut={signOut}>
          {user.isAdmin ? 'Pantalla de administración' : 'Pantalla normal'}
        </AppShell>
      )}
    </SessionGate>,
  )
}

describe('SessionGate', () => {
  it('sin sesión enseña la pantalla de entrada con el nombre de la aplicación', () => {
    renderGate()

    expect(screen.getByRole('heading', { name: 'Pruebas del AMPA' })).toBeTruthy()
    expect(screen.getByText('Entra con tu cuenta de Google del AMPA')).toBeTruthy()
  })

  it('sin dominio configurado no dice "del AMPA": entra cualquier cuenta de Google', () => {
    renderInSuite(<SessionGate>{() => null}</SessionGate>, { ...TEST_APP, hostedDomain: undefined })

    expect(screen.getByText('Entra con tu cuenta de Google')).toBeTruthy()
  })

  it('con sesión pregunta al servidor quién es y le pasa a la aplicación lo que contesta', async () => {
    const token = liveJwt()
    sessionStorage.setItem('ampa-pruebas.token', token)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ALBERTO))
    vi.stubGlobal('fetch', fetchMock)

    renderGate()

    expect(await screen.findByText('Pantalla de administración')).toBeTruthy()
    expect(screen.getByText('Alberto')).toBeTruthy()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/me')
    expect(init.headers.Authorization).toBe(`Bearer ${token}`)
  })

  it('si el servidor ya no acepta el token, vuelve a la entrada avisando', async () => {
    sessionStorage.setItem('ampa-pruebas.token', liveJwt())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))

    renderGate()

    expect(await screen.findByText('Tu sesión ha caducado. Vuelve a entrar.')).toBeTruthy()
    expect(sessionStorage.getItem('ampa-pruebas.token')).toBeNull()
  })

  it('si el servidor falla, enseña el error y deja reintentar', async () => {
    sessionStorage.setItem('ampa-pruebas.token', liveJwt())
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(503, { error: 'La base de datos no responde.' }))
        .mockResolvedValueOnce(jsonResponse(200, ALBERTO)),
    )

    renderGate()
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Pantalla de administración')).toBeTruthy()
  })

  it('al salir borra el token y vuelve a la entrada sin avisos', async () => {
    sessionStorage.setItem('ampa-pruebas.token', liveJwt())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, ALBERTO)))

    renderGate()
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(screen.getByRole('heading', { name: 'Pruebas del AMPA' })).toBeTruthy()
    expect(screen.queryByText('Tu sesión ha caducado. Vuelve a entrar.')).toBeNull()
    expect(sessionStorage.getItem('ampa-pruebas.token')).toBeNull()
  })
})

describe('AuthProvider', () => {
  function SignInWith({ credential }: { credential: string }) {
    const { token, signIn } = useAuth()

    return token === null ? <Button onClick={() => void signIn(credential)}>Entrar</Button> : <p>Dentro</p>
  }

  it('canjea la credencial de Google por el token propio y lo guarda con la clave de la aplicación', async () => {
    const token = liveJwt()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { token, user: ALBERTO }))
    vi.stubGlobal('fetch', fetchMock)

    renderInSuite(<SignInWith credential="credencial-de-google" />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Dentro')).toBeTruthy()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/google')
    expect(init.body).toBe('{"credential":"credencial-de-google"}')
    expect(sessionStorage.getItem('ampa-pruebas.token')).toBe(token)
  })
})
