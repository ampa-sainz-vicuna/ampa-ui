import type { ReactNode } from 'react'
import { normalize } from '../help/search.ts'

/**
 * Qué es el dato de una columna. Decide cómo se pinta, cómo se ordena y cómo
 * sale en el Excel:
 *
 * - `text`: texto. Se ordena como un diccionario español (sin distinguir
 *   tildes ni mayúsculas, y «Grupo 2» antes que «Grupo 10»).
 * - `number`: un número cualquiera (alumnos, días…).
 * - `money`: un importe **en céntimos**, como lo guarda toda la suite. Se pinta
 *   «1.234,50 €» y en el Excel sale como número en euros, para que se pueda
 *   sumar.
 * - `date`: un día, sin hora. Vale un `Date` o el texto que manda la API
 *   (`2026-10-08` o una fecha ISO completa, de la que se toma el día de aquí).
 */
export type ColumnType = 'text' | 'number' | 'money' | 'date'

/** Lo que una columna saca de cada fila. `null` o `undefined`: la celda va vacía. */
export type CellValue = string | number | Date | null | undefined

/** Los anchos de pantalla de MUI por debajo de los cuales se puede ocultar una columna. */
export type HideBelow = 'sm' | 'md' | 'lg'

export interface DataTableColumn<Row> {
  /** Nombre interno y estable: identifica la columna al ordenar y filtrar. */
  key: string
  /** El título de la columna, en la tabla y en el Excel. */
  header: string
  /**
   * El dato de la celda. Es lo que se ordena, se busca, se filtra y se exporta.
   * Una columna sin `value` (la de los botones de cada fila) solo se pinta: ni
   * se ordena, ni se busca, ni sale en el Excel.
   */
  value?: (row: Row) => CellValue
  /** Por defecto, `text`. */
  type?: ColumnType
  /**
   * Cómo se pinta la celda, si no basta con el dato formateado (un chip, un
   * enlace, botones…). No cambia lo que se ordena ni lo que se exporta.
   */
  render?: (row: Row) => ReactNode
  /** Si se puede ordenar pinchando en la cabecera. Por defecto, sí, si tiene `value`. */
  sortable?: boolean
  /** Si el buscador mira en esta columna. Por defecto, sí, si tiene `value`. */
  searchable?: boolean
  /**
   * Si la barra pone un desplegable para quedarse con un solo valor de esta
   * columna (la partida, la cuenta, el tipo…). Sus opciones salen de las filas.
   */
  filterable?: boolean
  /** Por debajo de este ancho de pantalla la columna no se ve (en el Excel sí sale). */
  hideBelow?: HideBelow
  /** Ancho en el Excel, en caracteres. Por defecto, el del texto más largo (hasta 50). */
  excelWidth?: number
}

const COLLATOR = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
// Con `always`, el punto de los miles también en «1.234»: en español, Intl no
// lo pone con solo cuatro cifras, y en una columna de importes los de cuatro
// cifras quedarían distintos de los de cinco.
const NUMBER = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })
const MONEY = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' })
const DATE = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

const ONLY_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * El día de una fecha como `Date` a las 00:00 de aquí, o null si no se entiende.
 *
 * `2026-10-08` se lee a mano: `new Date('2026-10-08')` lo toma como medianoche
 * en UTC, que en Madrid es el día 8 a las 2:00, pero en un ordenador con el
 * reloj en un huso al oeste de Greenwich sería el día 7. Una fecha con hora se
 * queda con el día que es aquí.
 */
export function toDay(value: CellValue): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'string') {
    const parts = ONLY_DAY.exec(value)
    if (parts) {
      const [year, month, day] = [Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])]
      const date = new Date(year, month, day)
      // new Date(2026, 1, 31) no falla: da el 3 de marzo. Un día que no existe
      // no es una fecha.
      return date.getMonth() === month && date.getDate() === day ? date : null
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Si la celda está vacía: va al final al ordenar y en blanco en el Excel. */
export function isEmpty(value: CellValue): boolean {
  return value === null || value === undefined || value === ''
}

/** El dato tal como se lee en pantalla: «1.234,50 €», «08/10/2026», «12». */
export function formatCell(value: CellValue, type: ColumnType = 'text'): string {
  if (isEmpty(value)) {
    return ''
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? NUMBER.format(value) : String(value)
    case 'money':
      return typeof value === 'number' ? MONEY.format(value / 100) : String(value)
    case 'date': {
      const day = toDay(value)
      return day ? DATE.format(day) : String(value)
    }
    default:
      return value instanceof Date ? DATE.format(value) : String(value)
  }
}

/**
 * Lo que se compara al ordenar: un número para números y fechas; texto para lo
 * demás. Null si no se entiende (una fecha imposible, un texto en una columna
 * de números): va al final, con lo vacío. Mezclar números y textos en la
 * misma comparación dejaría un orden distinto según por dónde se empiece.
 */
function sortKey(value: CellValue, type: ColumnType): number | string | null {
  if (isEmpty(value)) {
    return null
  }
  if (type === 'date') {
    return toDay(value)?.getTime() ?? null
  }
  if (type === 'number' || type === 'money') {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }

  return formatCell(value, type)
}

/**
 * Compara dos celdas de menor a mayor. Las vacías van siempre al final, también
 * al ordenar de mayor a menor: por eso `direction` entra aquí y no se resuelve
 * dando la vuelta al resultado.
 */
export function compareCells(a: CellValue, b: CellValue, type: ColumnType, direction: 'asc' | 'desc'): number {
  const keyA = sortKey(a, type)
  const keyB = sortKey(b, type)
  if (keyA === null || keyB === null) {
    return keyA === keyB ? 0 : keyA === null ? 1 : -1
  }

  const result =
    typeof keyA === 'number' && typeof keyB === 'number' ? keyA - keyB : COLLATOR.compare(String(keyA), String(keyB))

  return direction === 'asc' ? result : -result
}

/**
 * El texto en que busca el buscador: lo que se ve en pantalla, sin tildes ni
 * mayúsculas. Un importe se busca como se ve: «1.234,50», no «1234».
 */
export function searchTextOf(value: CellValue, type: ColumnType): string {
  return normalize(formatCell(value, type))
}

/**
 * Si una fila tiene todas las palabras buscadas, cada una en alguna columna.
 * Así «kárate lunes» encuentra la fila con «Kárate» en una columna y «Lunes» en
 * otra. Nada escrito: todas valen.
 */
export function matchesSearch<Row>(row: Row, columns: DataTableColumn<Row>[], query: string): boolean {
  const terms = normalize(query).split(/\s+/).filter((term) => term !== '')
  if (terms.length === 0) {
    return true
  }

  const text = columns
    .filter((column) => column.value && column.searchable !== false)
    .map((column) => searchTextOf(column.value!(row), column.type ?? 'text'))
    .join(' ')

  return terms.every((term) => text.includes(term))
}

/** Los valores distintos de una columna, ya formateados y en orden: las opciones de su desplegable. */
export function filterOptions<Row>(rows: Row[], column: DataTableColumn<Row>): string[] {
  const type = column.type ?? 'text'
  const values = rows.map((row) => column.value?.(row)).filter((value) => !isEmpty(value))
  const sorted = [...values].sort((a, b) => compareCells(a, b, type, 'asc'))

  return [...new Set(sorted.map((value) => formatCell(value, type)))]
}
