import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TEST_PORTAL, jsonResponse, renderInSuite } from '../test/fixtures.tsx'
import { useAuth } from './authContext.ts'
import { SessionGate } from './SessionGate.tsx'

/** Lo que el portal ve del estado de la entrada. */
function Probe() {
  const { epoch, notice } = useAuth()

  return (
    <p>
      epoch {epoch} · {notice ?? 'sin aviso'}
    </p>
  )
}

function arriveAt(search: string) {
  window.history.replaceState(null, '', `/${search}`)
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('la vuelta de Google (?entrada=)', () => {
  it('si ha ido bien, arranca como recién entrado (epoch 1) y deja el volver en la dirección', () => {
    arriveAt('?entrada=ok&volver=https%3A%2F%2Flistados.ampa.test%2F')

    renderInSuite(<Probe />, TEST_PORTAL)

    expect(screen.getByText('epoch 1 · sin aviso')).toBeTruthy()
    expect(window.location.search).toBe('?volver=https%3A%2F%2Flistados.ampa.test%2F')
  })

  it('si la cuenta no tiene acceso, la pantalla de entrada lo dice', async () => {
    arriveAt('?entrada=sin-acceso')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))

    renderInSuite(<SessionGate>{() => 'Dentro'}</SessionGate>, TEST_PORTAL)

    expect(await screen.findByText('Esa cuenta no tiene acceso a ninguna aplicación del AMPA.')).toBeTruthy()
    expect(window.location.search).toBe('')
  })

  it('si la entrada ha caducado, pide volver a intentarlo', () => {
    arriveAt('?entrada=caducada')

    renderInSuite(<Probe />, TEST_PORTAL)

    expect(screen.getByText(/epoch 0 · La entrada se ha cortado o ha tardado demasiado/)).toBeTruthy()
  })

  it('un valor que no es suyo no cuenta', () => {
    arriveAt('?entrada=toString')

    renderInSuite(<Probe />, TEST_PORTAL)

    expect(screen.getByText('epoch 0 · sin aviso')).toBeTruthy()
  })

  it('sin ?entrada= todo sigue como siempre', () => {
    renderInSuite(<Probe />, TEST_PORTAL)

    expect(screen.getByText('epoch 0 · sin aviso')).toBeTruthy()
  })
})
