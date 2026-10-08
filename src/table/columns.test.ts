import { describe, expect, it } from 'vitest'
import { compareCells, filterOptions, formatCell, matchesSearch, toDay, type DataTableColumn } from './columns.ts'

interface Group {
  name: string
  day: string
  students: number | null
}

const COLUMNS: DataTableColumn<Group>[] = [
  { key: 'name', header: 'Grupo', value: (group) => group.name },
  { key: 'day', header: 'Día', value: (group) => group.day },
  { key: 'students', header: 'Alumnos', type: 'number', value: (group) => group.students },
  { key: 'actions', header: '', render: () => 'botones' },
]

describe('formatCell', () => {
  it('pinta cada tipo como se lee en España', () => {
    // Entre la cifra y el € va un espacio que no se parte (\u00a0).
    expect(formatCell(123450, 'money')).toBe('1.234,50\u00a0€')
    expect(formatCell(1234, 'number')).toBe('1.234')
    expect(formatCell('2026-10-08', 'date')).toBe('08/10/2026')
    expect(formatCell(null, 'money')).toBe('')
  })
})

describe('toDay', () => {
  it('un «2026-10-08» de la API es el día 8 aquí, sea cual sea el huso', () => {
    const day = toDay('2026-10-08')!

    expect([day.getFullYear(), day.getMonth(), day.getDate(), day.getHours()]).toEqual([2026, 9, 8, 0])
  })

  it('lo que no es una fecha no lo es', () => {
    expect(toDay('mañana')).toBeNull()
    expect(toDay('2026-02-31')).toBeNull()
    expect(toDay('')).toBeNull()
  })
})

describe('compareCells', () => {
  it('ordena el texto como un diccionario: sin tildes y con los números en su sitio', () => {
    const names = ['Grupo 10', 'árbol', 'Grupo 2', 'Bádminton']

    expect(names.sort((a, b) => compareCells(a, b, 'text', 'asc'))).toEqual(['árbol', 'Bádminton', 'Grupo 2', 'Grupo 10'])
  })

  it('las fechas, por fecha y no por cómo se escriben', () => {
    const dates = ['2026-10-08', '2025-12-31', '2026-01-15']

    expect(dates.sort((a, b) => compareCells(a, b, 'date', 'desc'))).toEqual(['2026-10-08', '2026-01-15', '2025-12-31'])
  })

  it('lo vacío va al final en los dos sentidos', () => {
    const values = [null, 3, 10]

    expect([...values].sort((a, b) => compareCells(a, b, 'number', 'asc'))).toEqual([3, 10, null])
    expect([...values].sort((a, b) => compareCells(a, b, 'number', 'desc'))).toEqual([10, 3, null])
  })

  it('lo que no se entiende va al final, como lo vacío', () => {
    const dates = ['2026-02-31', '2026-10-08', '2025-12-31']

    expect(dates.sort((a, b) => compareCells(a, b, 'date', 'asc'))).toEqual(['2025-12-31', '2026-10-08', '2026-02-31'])
  })
})

describe('matchesSearch', () => {
  const karate = { name: 'Kárate 2', day: 'Lunes', students: 12 }

  it('no distingue tildes ni mayúsculas', () => {
    expect(matchesSearch(karate, COLUMNS, 'KARATE')).toBe(true)
  })

  it('cada palabra puede estar en una columna distinta, pero tienen que estar todas', () => {
    expect(matchesSearch(karate, COLUMNS, 'karate lunes')).toBe(true)
    expect(matchesSearch(karate, COLUMNS, 'karate martes')).toBe(false)
  })

  it('no busca en lo que solo se pinta', () => {
    expect(matchesSearch(karate, COLUMNS, 'botones')).toBe(false)
  })
})

describe('filterOptions', () => {
  it('los valores distintos, una vez cada uno y en orden', () => {
    const groups = [
      { name: 'A', day: 'Martes', students: 1 },
      { name: 'B', day: 'Lunes', students: 2 },
      { name: 'C', day: 'Martes', students: 3 },
    ]

    expect(filterOptions(groups, COLUMNS[1])).toEqual(['Lunes', 'Martes'])
  })
})
