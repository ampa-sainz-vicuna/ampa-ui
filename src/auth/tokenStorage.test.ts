import { describe, expect, it } from 'vitest'
import { fakeJwt } from '../test/fixtures.tsx'
import { isExpired, loadToken, saveToken } from './tokenStorage.ts'

const KEY = 'ampa-pruebas.token'
const NOW = Date.parse('2026-09-17T07:00:00Z')
const nowSeconds = NOW / 1000

describe('isExpired', () => {
  it('un token con exp en el futuro sigue vivo', () => {
    expect(isExpired(fakeJwt(nowSeconds + 60), NOW)).toBe(false)
  })

  it('un token con exp en el pasado ha caducado', () => {
    expect(isExpired(fakeJwt(nowSeconds - 1), NOW)).toBe(true)
  })

  it.each(['basura', 'a.b.c', 'a..c', ''])('un token ilegible (%j) se trata como caducado', (token) => {
    expect(isExpired(token, NOW)).toBe(true)
  })
})

describe('loadToken', () => {
  it('devuelve el token guardado si no ha caducado', () => {
    const token = fakeJwt(nowSeconds + 3600)
    saveToken(KEY, token)

    expect(loadToken(KEY, NOW)).toBe(token)
  })

  it('descarta y borra un token caducado', () => {
    saveToken(KEY, fakeJwt(nowSeconds - 1))

    expect(loadToken(KEY, NOW)).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('sin nada guardado no hay sesión', () => {
    expect(loadToken(KEY, NOW)).toBeNull()
  })

  it('solo lee su clave: el token de otra aplicación no le vale', () => {
    saveToken('ampa-fichajes.token', fakeJwt(nowSeconds + 3600))

    expect(loadToken(KEY, NOW)).toBeNull()
  })
})
