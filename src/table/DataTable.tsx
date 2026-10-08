import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Theme } from '@mui/material/styles'
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  compareCells,
  filterOptions,
  formatCell,
  matchesSearch,
  type DataTableColumn,
  type HideBelow,
} from './columns.ts'
import { exportXlsx } from './exportXlsx.ts'

export interface DataTableSort {
  key: string
  direction: 'asc' | 'desc'
}

interface Props<Row> {
  /** El nombre de la tabla para los lectores de pantalla: «Apuntes de octubre». */
  label: string
  /** Todas las filas. La tabla busca, filtra y ordena sobre ellas, sin pedir nada al servidor. */
  rows: Row[]
  columns: DataTableColumn<Row>[]
  /** Un identificador único de cada fila (React lo necesita para pintar la lista). */
  rowKey: (row: Row) => string | number
  /**
   * El nombre del Excel, sin `.xlsx`: «apuntes-2026-10». Sin él no hay botón
   * de exportar.
   */
  exportFileName?: string
  /** El nombre de la hoja dentro del Excel. Por defecto, `label`. */
  exportSheetName?: string
  /** El orden al abrir, y al que se vuelve tras pinchar tres veces una cabecera. */
  initialSort?: DataTableSort
  /**
   * Filtros propios de la aplicación, que se ponen en la barra junto al
   * buscador: el interruptor de archivadas, el mes… La aplicación filtra antes
   * de pasar las filas.
   */
  toolbar?: ReactNode
  /** Lo que se dice cuando no hay ninguna fila. */
  emptyText?: ReactNode
  /** Lo que se dice cuando hay filas pero ninguna pasa la búsqueda o los filtros. */
  noMatchText?: ReactNode
  /**
   * Qué hacer al pinchar en una fila (abrir su detalle). Sin esto, las filas no
   * se pinchan. Con el teclado no se llega a una fila: lo que haga esto tiene
   * que estar también en un botón de la fila.
   */
  onRowClick?: (row: Row) => void
  /**
   * Si la primera columna se queda quieta al desplazar la tabla de lado en una
   * pantalla estrecha, para no perder de vista de qué es cada fila. Por
   * defecto, sí.
   */
  stickyFirstColumn?: boolean
}

/** Las columnas de números van a la derecha, para que las cifras queden alineadas. */
function alignOf<Row>(column: DataTableColumn<Row>): 'left' | 'right' {
  return column.type === 'number' || column.type === 'money' ? 'right' : 'left'
}

function hiddenBelow(breakpoint: HideBelow | undefined) {
  return breakpoint ? { display: { xs: 'none', [breakpoint]: 'table-cell' } } : {}
}

const STICKY = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  bgcolor: 'background.paper',
} as const

// La primera columna, al ser fija, tiene fondo propio y taparía el color de la
// fila al pasar el ratón: se le pinta encima el mismo velo.
const CLICKABLE_ROW = {
  cursor: 'pointer',
  '&:hover > td:first-of-type': {
    backgroundImage: (theme: Theme) => `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`,
  },
} as const

/**
 * La tabla común de la suite: buscador sin tildes, orden pinchando en la
 * cabecera, un desplegable por cada columna filtrable y «Exportar a Excel» de
 * lo que se está viendo, en el mismo orden.
 *
 * Todo pasa en el navegador sobre las filas que le da la aplicación: las
 * tablas de la suite tienen de decenas a pocos cientos de filas y el servidor
 * ya las manda todas.
 *
 * En una pantalla estrecha, las columnas con `hideBelow` desaparecen y lo que
 * aún no cabe se desplaza de lado, con la primera columna quieta.
 */
export function DataTable<Row>({
  label,
  rows,
  columns,
  rowKey,
  exportFileName,
  exportSheetName,
  initialSort,
  toolbar,
  emptyText = 'Todavía no hay nada.',
  noMatchText = 'Nada coincide con la búsqueda o los filtros.',
  onRowClick,
  stickyFirstColumn = true,
}: Props<Row>) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<DataTableSort | null>(initialSort ?? null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(false)

  const filterable = useMemo(() => columns.filter((column) => column.filterable && column.value), [columns])

  // Las opciones de cada desplegable, aparte del filtrado: no cambian al
  // escribir en el buscador.
  const options = useMemo(
    () => Object.fromEntries(filterable.map((column) => [column.key, filterOptions(rows, column)])),
    [rows, filterable],
  )

  // Lo elegido en un desplegable que ya no está entre sus opciones (la
  // aplicación ha cambiado las filas: ha quitado las archivadas, ha recargado)
  // se olvida. Si no, el desplegable se vería vacío y la tabla seguiría
  // filtrando por algo que no se ve.
  const activeFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([key, wanted]) => wanted !== '' && options[key]?.includes(wanted)),
      ),
    [filters, options],
  )

  const visible = useMemo(() => {
    const matching = rows.filter(
      (row) =>
        matchesSearch(row, columns, query) &&
        filterable.every((column) => {
          const wanted = activeFilters[column.key]
          return !wanted || formatCell(column.value!(row), column.type) === wanted
        }),
    )

    const sortColumn = sort && columns.find((column) => column.key === sort.key && column.value)
    if (!sort || !sortColumn) {
      return matching
    }

    // sort() de JavaScript es estable: a igualdad, se respeta el orden en que
    // llegaron las filas.
    return [...matching].sort((a, b) =>
      compareCells(sortColumn.value!(a), sortColumn.value!(b), sortColumn.type ?? 'text', sort.direction),
    )
  }, [rows, columns, filterable, activeFilters, query, sort])

  // Pinchar una cabecera: de menor a mayor, de mayor a menor y vuelta al orden
  // de partida. La columna de partida empieza en su sentido y luego el otro
  // (fecha de más nueva a más vieja, de más vieja a más nueva y vuelta).
  function toggleSort(key: string) {
    const first = initialSort?.key === key ? initialSort.direction : 'asc'

    if (sort?.key !== key) {
      setSort({ key, direction: first })
    } else if (sort.direction === first) {
      setSort({ key, direction: first === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort(initialSort ?? null)
    }
  }

  // Un clic en un botón, un enlace o un campo de la fila es para ese control,
  // no para abrir la fila.
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, row: Row) {
    if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea, [role="button"]')) {
      return
    }
    onRowClick?.(row)
  }

  async function handleExport() {
    setExporting(true)
    setExportError(false)
    try {
      await exportXlsx(visible, columns, exportFileName!, exportSheetName ?? label)
    } catch {
      // Lo normal es que no se haya podido descargar el trozo con la librería
      // (sin conexión, o una versión nueva desplegada mientras tanto).
      setExportError(true)
    } finally {
      setExporting(false)
    }
  }

  const filtered = visible.length !== rows.length

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <TextField
          label="Buscar"
          type="search"
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ flex: '1 1 14rem', maxWidth: { sm: '20rem' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        {filterable.map((column) => (
          <TextField
            key={column.key}
            select
            label={column.header}
            size="small"
            value={activeFilters[column.key] ?? ''}
            onChange={(event) => setFilters({ ...filters, [column.key]: event.target.value })}
            sx={{ minWidth: '10rem' }}
          >
            <MenuItem value="">
              <em>Cualquiera</em>
            </MenuItem>
            {options[column.key].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        ))}
        {toolbar}
        <Box sx={{ flexGrow: 1 }} />
        {/* Siempre montado, aunque vacío: un lector de pantalla solo anuncia
            los cambios de una zona aria-live que ya estaba. */}
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {filtered ? `${visible.length} de ${rows.length}` : ''}
        </Typography>
        {exportFileName && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            disabled={exporting || visible.length === 0}
          >
            Exportar a Excel
          </Button>
        )}
      </Box>

      {exportError && (
        <Alert severity="error" onClose={() => setExportError(false)} sx={{ mb: 1.5 }}>
          No se ha podido preparar el Excel. Recarga la página y vuelve a probar.
        </Alert>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label={label}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => {
                const sortable = column.value !== undefined && column.sortable !== false
                const active = sort?.key === column.key

                return (
                  <TableCell
                    key={column.key}
                    align={alignOf(column)}
                    sortDirection={active ? sort.direction : false}
                    sx={[
                      { fontWeight: 600, whiteSpace: 'nowrap' },
                      stickyFirstColumn && index === 0 ? STICKY : {},
                      hiddenBelow(column.hideBelow),
                    ]}
                  >
                    {sortable ? (
                      <TableSortLabel
                        active={active}
                        direction={active ? sort.direction : 'asc'}
                        onClick={() => toggleSort(column.key)}
                      >
                        {column.header}
                      </TableSortLabel>
                    ) : (
                      column.header
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    {rows.length === 0 ? emptyText : noMatchText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover={onRowClick !== undefined}
                  onClick={onRowClick ? (event) => handleRowClick(event, row) : undefined}
                  sx={onRowClick ? CLICKABLE_ROW : undefined}
                >
                  {columns.map((column, index) => (
                    <TableCell
                      key={column.key}
                      align={alignOf(column)}
                      sx={[stickyFirstColumn && index === 0 ? STICKY : {}, hiddenBelow(column.hideBelow)]}
                    >
                      {column.render ? column.render(row) : formatCell(column.value?.(row), column.type)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
