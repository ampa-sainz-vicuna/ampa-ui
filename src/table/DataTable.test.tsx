import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SuiteRoot } from '../app/SuiteRoot.tsx'
import { renderInSuite, TEST_APP } from '../test/fixtures.tsx'
import type { DataTableColumn } from './columns.ts'
import { DataTable } from './DataTable.tsx'
import { exportXlsx } from './exportXlsx.ts'

// El Excel en sí se prueba en exportXlsx.test.ts; aquí, solo qué filas le llegan.
vi.mock('./exportXlsx.ts', () => ({ exportXlsx: vi.fn() }))

interface Entry {
  id: number
  concept: string
  category: string
  cents: number
}

const ENTRIES: Entry[] = [
  { id: 1, concept: 'Cuota de Kárate', category: 'Extraescolares', cents: 3000 },
  { id: 2, concept: 'Fruta del festival', category: 'Fiestas', cents: 4550 },
  { id: 3, concept: 'Árbitro de baloncesto', category: 'Extraescolares', cents: 2000 },
]

const COLUMNS: DataTableColumn<Entry>[] = [
  { key: 'concept', header: 'Concepto', value: (entry) => entry.concept },
  { key: 'category', header: 'Partida', value: (entry) => entry.category, filterable: true },
  { key: 'amount', header: 'Importe', type: 'money', value: (entry) => entry.cents },
]

function renderTable(rows: Entry[] = ENTRIES, props: Partial<ComponentProps<typeof DataTable<Entry>>> = {}) {
  return renderInSuite(
    <DataTable
      label="Apuntes"
      rows={rows}
      columns={COLUMNS}
      rowKey={(entry) => entry.id}
      exportFileName="apuntes"
      {...props}
    />,
  )
}

/** Los conceptos de las filas, en el orden en que se ven. */
function concepts(): string[] {
  const table = screen.getByRole('table', { name: 'Apuntes' })
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

beforeEach(() => {
  vi.mocked(exportXlsx).mockReset()
})

describe('DataTable', () => {
  it('pinta las filas con los importes formateados', () => {
    renderTable()

    expect(concepts()).toEqual(['Cuota de Kárate', 'Fruta del festival', 'Árbitro de baloncesto'])
    // Testing Library convierte el espacio duro antes del € en uno normal.
    expect(screen.getByText('45,50 €')).toBeTruthy()
  })

  it('busca sin tildes y dice cuántas quedan', async () => {
    renderTable()

    await userEvent.type(screen.getByLabelText('Buscar'), 'arbitro')

    expect(concepts()).toEqual(['Árbitro de baloncesto'])
    expect(screen.getByText('1 de 3')).toBeTruthy()
  })

  it('ordena pinchando en la cabecera: de menor a mayor, de mayor a menor y como venía', async () => {
    renderTable()
    const header = screen.getByRole('button', { name: 'Importe' })

    await userEvent.click(header)
    expect(concepts()).toEqual(['Árbitro de baloncesto', 'Cuota de Kárate', 'Fruta del festival'])

    await userEvent.click(header)
    expect(concepts()).toEqual(['Fruta del festival', 'Cuota de Kárate', 'Árbitro de baloncesto'])

    await userEvent.click(header)
    expect(concepts()).toEqual(['Cuota de Kárate', 'Fruta del festival', 'Árbitro de baloncesto'])
  })

  it('la columna del orden de partida empieza en su sentido y vuelve a él', async () => {
    renderTable(ENTRIES, { initialSort: { key: 'amount', direction: 'desc' } })
    const header = screen.getByRole('button', { name: 'Importe' })
    expect(concepts()).toEqual(['Fruta del festival', 'Cuota de Kárate', 'Árbitro de baloncesto'])

    await userEvent.click(header)
    expect(concepts()).toEqual(['Árbitro de baloncesto', 'Cuota de Kárate', 'Fruta del festival'])

    await userEvent.click(header)
    expect(concepts()).toEqual(['Fruta del festival', 'Cuota de Kárate', 'Árbitro de baloncesto'])
  })

  it('pinchar la fila la abre, pero pinchar un botón de la fila no', async () => {
    const onRowClick = vi.fn()
    const columns: DataTableColumn<Entry>[] = [
      ...COLUMNS,
      { key: 'actions', header: '', render: (entry) => <button type="button">Editar {entry.id}</button> },
    ]
    renderTable(ENTRIES, { columns, onRowClick })

    await userEvent.click(screen.getByRole('button', { name: 'Editar 1' }))
    expect(onRowClick).not.toHaveBeenCalled()

    await userEvent.click(screen.getByText('Cuota de Kárate'))
    expect(onRowClick).toHaveBeenCalledWith(ENTRIES[0])
  })

  it('si lo elegido en un desplegable desaparece de las filas, deja de filtrar', async () => {
    const { rerender } = renderTable()
    await userEvent.click(screen.getByRole('combobox', { name: 'Partida' }))
    await userEvent.click(screen.getByRole('option', { name: 'Fiestas' }))

    const withoutParties = ENTRIES.filter((entry) => entry.category !== 'Fiestas')
    rerender(
      <SuiteRoot app={TEST_APP}>
        <DataTable label="Apuntes" rows={withoutParties} columns={COLUMNS} rowKey={(entry) => entry.id} />
      </SuiteRoot>,
    )

    expect(concepts()).toEqual(['Cuota de Kárate', 'Árbitro de baloncesto'])
  })

  it('el desplegable de una columna filtrable deja solo ese valor', async () => {
    renderTable()

    await userEvent.click(screen.getByRole('combobox', { name: 'Partida' }))
    await userEvent.click(screen.getByRole('option', { name: 'Fiestas' }))

    expect(concepts()).toEqual(['Fruta del festival'])
  })

  it('exporta lo que se ve, en el orden en que se ve', async () => {
    renderTable()

    await userEvent.type(screen.getByLabelText('Buscar'), 'extraescolares')
    await userEvent.click(screen.getByRole('button', { name: 'Concepto' }))
    await userEvent.click(screen.getByRole('button', { name: 'Exportar a Excel' }))

    expect(exportXlsx).toHaveBeenCalledWith([ENTRIES[2], ENTRIES[0]], COLUMNS, 'apuntes', 'Apuntes')
  })

  it('si no se puede preparar el Excel, lo dice', async () => {
    vi.mocked(exportXlsx).mockRejectedValue(new Error('sin conexión'))
    renderTable()

    await userEvent.click(screen.getByRole('button', { name: 'Exportar a Excel' }))

    expect(await screen.findByText(/No se ha podido preparar el Excel/)).toBeTruthy()
  })

  it('distingue «no hay nada» de «nada coincide»', async () => {
    renderTable([])
    expect(screen.getByText('Todavía no hay nada.')).toBeTruthy()
  })

  it('cuando nada coincide, lo dice y no deja exportar', async () => {
    renderTable()

    await userEvent.type(screen.getByLabelText('Buscar'), 'piscina')

    expect(screen.getByText('Nada coincide con la búsqueda o los filtros.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Exportar a Excel' }).hasAttribute('disabled')).toBe(true)
  })
})
