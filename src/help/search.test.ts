import { describe, expect, it } from 'vitest'
import type { HelpEntry } from './helpContent.ts'
import { normalize, queryTerms, searchHelp } from './search.ts'

function entry(id: string, fields: Partial<HelpEntry> = {}): HelpEntry {
  return { id, application: 'general', question: '', answer: '', keywords: [], manual: null, ...fields }
}

const ids = (entries: HelpEntry[], query: string, current: string | null = null) =>
  searchHelp(entries, query, current).map((result) => result.entry.id)

describe('normalize', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalize('¿Cómo CIERRO el Año? Pingüino, niño')).toBe('¿como cierro el ano? pinguino, nino')
  })
})

describe('queryTerms', () => {
  it('quita las palabras vacías, las tildes y las repetidas', () => {
    expect(queryTerms('¿Cómo cierro el mes de la cuenta, el mes?')).toEqual(['cierro', 'mes', 'cuenta'])
  })

  it('si solo hay palabras vacías, las busca tal cual', () => {
    expect(queryTerms('¿Cómo?')).toEqual(['como'])
  })
})

describe('searchHelp', () => {
  const entries = [
    entry('recibo', { question: '¿Qué hago con un recibo devuelto?', application: 'facturacion' }),
    entry('arqueo', { question: '¿Cómo cierro el mes?', keywords: ['arqueo', 'cierre'], application: 'facturacion' }),
    entry('vacaciones', { question: '¿Cómo pido vacaciones?', answer: 'Desde la pestaña Ausencias.', application: 'fichajes' }),
    entry('general', { question: 'No puedo entrar', answer: 'Comprueba que entras con la cuenta del AMPA.' }),
  ]

  it('encuentra sin tildes ni mayúsculas', () => {
    expect(ids(entries, 'DEVUELTO')).toEqual(['recibo'])
    expect(ids(entries, 'que hago con un recibo')).toEqual(['recibo'])
  })

  it('encuentra por el principio de una palabra', () => {
    expect(ids(entries, 'devuel')).toEqual(['recibo'])
    expect(ids(entries, 'vacac')).toEqual(['vacaciones'])
  })

  it('un trozo muy corto no cuenta como principio de palabra', () => {
    expect(ids(entries, 'va')).toEqual([])
  })

  it('las palabras vacías no hacen encajar nada', () => {
    // «cómo», «el», «de» salen en casi todas las preguntas; «tractor» en ninguna.
    expect(ids(entries, 'cómo el tractor de')).toEqual([])
  })

  it('pesa más la pregunta que las palabras clave, y estas más que la respuesta', () => {
    const ranked = [
      entry('en-la-respuesta', { answer: 'Para el cierre, ve a Diario.' }),
      entry('en-la-pregunta', { question: 'El cierre del curso' }),
      entry('en-las-claves', { question: 'Terminar el mes', keywords: ['cierre'] }),
    ]

    expect(ids(ranked, 'cierre')).toEqual(['en-la-pregunta', 'en-las-claves', 'en-la-respuesta'])
  })

  it('antes las que encajan con todas las palabras, y con la mitad basta para salir', () => {
    const ranked = [
      entry('una', { question: 'Cambiar el correo' }),
      entry('dos', { question: 'Cambiar el correo de avisos' }),
      entry('ninguna', { question: 'Borrar una tarea' }),
    ]

    expect(ids(ranked, 'cambiar correo avisos')).toEqual(['dos', 'una'])
  })

  it('un poco más si es de la aplicación abierta, pero no más que encajar mejor', () => {
    const ranked = [
      entry('de-otra', { question: 'Exportar el listado', application: 'listados' }),
      entry('de-esta', { question: 'Exportar el listado', application: 'fichajes' }),
      entry('mejor', { question: 'Exportar', keywords: ['exportar'], application: 'listados' }),
    ]

    expect(ids(ranked, 'exportar', 'fichajes')).toEqual(['mejor', 'de-esta', 'de-otra'])
  })

  it('sin nada escrito no busca', () => {
    expect(ids(entries, '   ')).toEqual([])
  })
})
