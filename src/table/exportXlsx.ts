import type { Cell, SheetData } from 'write-excel-file/universal'
import { saveFile } from '../api/saveFile.ts'
import { formatCell, isEmpty, toDay, type DataTableColumn } from './columns.ts'

/** El ancho máximo que se calcula solo: más, y una columna de observaciones se come la hoja. */
const MAX_WIDTH = 50

/** Las columnas que salen en el Excel: las que tienen dato. Las de botones, no. */
export function exportableColumns<Row>(columns: DataTableColumn<Row>[]): DataTableColumn<Row>[] {
  return columns.filter((column) => column.value !== undefined)
}

/**
 * Una celda del Excel con su tipo de verdad: los números como número y las
 * fechas como fecha, para que en Excel se puedan sumar, filtrar y ordenar.
 */
function excelCell<Row>(row: Row, column: DataTableColumn<Row>): Cell {
  const value = column.value!(row)
  if (isEmpty(value)) {
    return null
  }

  switch (column.type ?? 'text') {
    case 'number':
      return typeof value === 'number' ? { value, type: Number } : String(value)
    case 'money':
      return typeof value === 'number' ? { value: value / 100, type: Number, format: '#,##0.00 €' } : String(value)
    case 'date': {
      const day = toDay(value)
      if (!day) {
        return String(value)
      }
      // La librería pasa la fecha a Excel contando en UTC: hay que darle la
      // medianoche UTC de ese día. Con la medianoche de aquí, en Madrid
      // saldría el día anterior.
      return { value: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())), type: Date, format: 'dd/mm/yyyy' }
    }
    default:
      return formatCell(value, 'text')
  }
}

/** La hoja: la cabecera en negrita y una fila por cada fila de la tabla, en el mismo orden. */
export function toSheetData<Row>(rows: Row[], columns: DataTableColumn<Row>[]): SheetData {
  const exported = exportableColumns(columns)
  const header: Cell[] = exported.map((column) => ({ value: column.header, fontWeight: 'bold' }))

  return [header, ...rows.map((row) => exported.map((column) => excelCell(row, column)))]
}

/** El ancho de cada columna en caracteres: el del texto más largo, cabecera incluida. */
export function columnWidths<Row>(rows: Row[], columns: DataTableColumn<Row>[]): { width: number }[] {
  return exportableColumns(columns).map((column) => {
    if (column.excelWidth) {
      return { width: column.excelWidth }
    }

    const longest = rows.reduce(
      (max, row) => Math.max(max, formatCell(column.value!(row), column.type).length),
      column.header.length,
    )

    return { width: Math.min(longest + 2, MAX_WIDTH) }
  })
}

/** Excel no admite en el nombre de la hoja : \ / ? * [ ], ni más de 31 letras, ni que quede vacío. */
export function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Hoja1'
}

/** El Excel como fichero, sin guardarlo todavía. Aparte para poder probarlo. */
export async function buildXlsx<Row>(rows: Row[], columns: DataTableColumn<Row>[], sheetName: string): Promise<Blob> {
  // La librería se carga aquí y no arriba: el empaquetador de la aplicación la
  // deja en un trozo aparte que solo se descarga al pulsar «Exportar». Quien
  // no exporta nunca no la paga. Es la versión «universal» porque es la que
  // funciona también en Node, donde corren los tests.
  const { default: writeExcelFile } = await import('write-excel-file/universal')

  return writeExcelFile(toSheetData(rows, columns), {
    sheet: safeSheetName(sheetName),
    columns: columnWidths(rows, columns),
    // La cabecera se queda fija al bajar por la hoja.
    stickyRowsCount: 1,
  }).toBlob()
}

/** Genera el Excel y le pide al navegador que lo guarde como `fileName.xlsx`. */
export async function exportXlsx<Row>(
  rows: Row[],
  columns: DataTableColumn<Row>[],
  fileName: string,
  sheetName: string,
): Promise<void> {
  const blob = await buildXlsx(rows, columns, sheetName)

  // Una barra en el nombre del fichero, cada navegador la cambia a su manera.
  saveFile({ blob, filename: `${fileName.replace(/[\\/]/g, '-')}.xlsx` })
}
