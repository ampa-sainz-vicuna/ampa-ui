import { describe, expect, it } from 'vitest'
import type { DataTableColumn } from './columns.ts'
import { buildXlsx, columnWidths, safeSheetName, toSheetData } from './exportXlsx.ts'

interface Entry {
  date: string
  concept: string
  cents: number | null
}

const COLUMNS: DataTableColumn<Entry>[] = [
  { key: 'date', header: 'Fecha', type: 'date', value: (entry) => entry.date },
  { key: 'concept', header: 'Concepto', value: (entry) => entry.concept },
  { key: 'amount', header: 'Importe', type: 'money', value: (entry) => entry.cents },
  { key: 'actions', header: '', render: () => 'editar' },
]

const ENTRIES: Entry[] = [
  { date: '2026-10-08', concept: 'Cuota de Kárate', cents: 123450 },
  { date: '2026-10-09', concept: 'Sin importe', cents: null },
]

describe('toSheetData', () => {
  it('la cabecera en negrita y sin la columna de botones', () => {
    const [header] = toSheetData(ENTRIES, COLUMNS)

    expect(header).toEqual([
      { value: 'Fecha', fontWeight: 'bold' },
      { value: 'Concepto', fontWeight: 'bold' },
      { value: 'Importe', fontWeight: 'bold' },
    ])
  })

  it('los importes en euros como número y las fechas como fecha de ese día', () => {
    const [, first, second] = toSheetData(ENTRIES, COLUMNS)

    expect(first).toEqual([
      // Medianoche UTC: es lo que la librería convierte al día 8 en Excel.
      { value: new Date(Date.UTC(2026, 9, 8)), type: Date, format: 'dd/mm/yyyy' },
      'Cuota de Kárate',
      { value: 1234.5, type: Number, format: '#,##0.00 €' },
    ])
    expect(second[2]).toBeNull()
  })
})

describe('columnWidths', () => {
  it('el ancho del texto más largo, con algo de aire', () => {
    expect(columnWidths(ENTRIES, COLUMNS).map(({ width }) => width)).toEqual([12, 17, 12])
  })
})

describe('safeSheetName', () => {
  it('sin lo que Excel no admite, 31 letras como mucho y nunca vacío', () => {
    expect(safeSheetName('Apuntes: 2026/10')).toBe('Apuntes  2026 10')
    expect(safeSheetName('Una hoja con un nombre larguísimo de verdad')).toHaveLength(31)
    expect(safeSheetName('[?]')).toBe('Hoja1')
  })
})

describe('buildXlsx', () => {
  it('genera un .xlsx de verdad (un zip)', async () => {
    const blob = await buildXlsx(ENTRIES, COLUMNS, 'Apuntes: octubre')
    const bytes = new Uint8Array(await blob.arrayBuffer())

    // Todo zip empieza por «PK».
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK')
  })
})
