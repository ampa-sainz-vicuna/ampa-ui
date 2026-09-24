import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../test/fixtures.tsx'
import { ApiError, apiDownload, apiRequest, messageOf } from './client.ts'

describe('apiRequest', () => {
  it('la sesión va en la cookie, solo al propio origen, y un GET no lleva cuerpo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/api/me')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/me')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('same-origin')
    // Desde la 0.2.0 no hay token en el navegador que mandar a mano.
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.body).toBeUndefined()
  })

  it('manda el cuerpo como JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/api/auth/google', { method: 'POST', body: { credential: 'x' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"credential":"x"}')
  })

  it('un FormData se manda tal cual y sin Content-Type, para que el navegador ponga el suyo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, {}))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.append('title', 'Contrato')

    await apiRequest('/api/documents', { method: 'POST', body: form })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe(form)
    expect(init.headers['Content-Type']).toBeUndefined()
  })

  it('un 204 sin cuerpo no es un error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(204, null)))

    await expect(apiRequest('/api/entries/1', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('un error con mensaje del servidor lo conserva tal cual, con su código y su cuerpo', async () => {
    const body = { error: 'El fichero trae dos meses.', months: ['2026-09', '2026-10'] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, body)))

    const error = await apiRequest('/api/listings/summary', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'El fichero trae dos meses.', payload: body })
  })

  it.each([
    [401, 'Tu sesión ha caducado. Vuelve a entrar.'],
    [404, 'Eso ya no existe. Recarga la página para ver cómo están las cosas.'],
    [413, 'El fichero es demasiado grande.'],
    [502, 'El servidor ha respondido con un error (502). Inténtalo de nuevo en un momento.'],
  ])('un %i sin mensaje del servidor (lo corta antes el servidor web) se explica', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>error</html>', { status })))

    await expect(apiRequest('/api/me')).rejects.toMatchObject({ status, message })
  })

  it('sin red lanza un ApiError con status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiRequest('/api/me')).rejects.toMatchObject({ status: 0 })
  })
})

describe('apiDownload', () => {
  it('devuelve el fichero con el nombre que le pone el servidor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('PK', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="Listados 2026-09 (22-09-2026 20h15).xlsx"' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const file = await apiDownload('/api/listings/file', { method: 'POST' })

    expect(await file.blob.text()).toBe('PK')
    expect(file.filename).toBe('Listados 2026-09 (22-09-2026 20h15).xlsx')
    expect(fetchMock.mock.calls[0][1].credentials).toBe('same-origin')
  })

  it('entiende el nombre codificado (filename*), que es como llegan los acentos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('PK', {
          status: 200,
          headers: { 'Content-Disposition': "attachment; filename*=UTF-8''Cuadrante%20de%20agosto.pdf" },
        }),
      ),
    )

    const file = await apiDownload('/api/months/2026-08/file')

    expect(file.filename).toBe('Cuadrante de agosto.pdf')
  })

  it('con las dos formas (la de Symfony), se queda con la de los acentos y no con la copia en ASCII', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('%PDF', {
          status: 200,
          headers: { 'Content-Disposition': "attachment; filename=N_mina.pdf; filename*=utf-8''N%C3%B3mina.pdf" },
        }),
      ),
    )

    const file = await apiDownload('/api/me/documents/1/file')

    expect(file.filename).toBe('Nómina.pdf')
  })

  it('si el servidor no dice el nombre, usa el que se le pasa', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('PK', { status: 200 })))

    const file = await apiDownload('/api/listings/file', {}, 'listados.xlsx')

    expect(file.filename).toBe('listados.xlsx')
  })

  it('si falla, lanza el mensaje del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(503, { error: 'Drive no responde.' })))

    await expect(apiDownload('/api/documents/1/file')).rejects.toMatchObject({
      status: 503,
      message: 'Drive no responde.',
    })
  })
})

describe('messageOf', () => {
  it('de un error, su mensaje', () => {
    expect(messageOf(new ApiError(422, 'El mes 2026-08 está cerrado.'))).toBe('El mes 2026-08 está cerrado.')
  })

  it('de cualquier otra cosa, un mensaje genérico', () => {
    expect(messageOf('algo')).toBe('Ha pasado algo que no sabemos explicar. Vuelve a intentarlo.')
  })
})
