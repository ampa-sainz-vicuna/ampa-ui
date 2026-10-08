import CloseRounded from '@mui/icons-material/CloseRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useId, useMemo, useState } from 'react'
import type { SuiteLink } from '../auth/authContext.ts'
import { HelpAnswer } from './HelpAnswer.tsx'
import type { HelpContent, HelpEntry } from './helpContent.ts'
import { searchHelp } from './search.ts'
import type { HelpStatus } from './useHelp.ts'

/** Cómo se llama cada aplicación en la ayuda. Una nueva que no esté, con el nombre que da el portal. */
const LABELS: Record<string, string> = {
  general: 'General',
  portal: 'Portal',
  fichajes: 'Fichajes',
  listados: 'Listados',
  facturacion: 'Facturación',
  tareas: 'Tareas',
  crm: 'Proveedores',
  documentos: 'Documentos',
  familias: 'Familias',
}

interface Props {
  open: boolean
  onClose: () => void
  help: HelpStatus & { retry: () => void }
  /** El código de la aplicación abierta (`portal` en el portal), o null si no se sabe. */
  currentApplication: string | null
  /** Las aplicaciones de quien ha entrado, para el nombre de las que no estén en LABELS. */
  applications: SuiteLink[]
}

/**
 * El panel de la ayuda, a la derecha (a pantalla completa en el móvil): un
 * buscador sobre las preguntas ya escritas y, si no está, el asistente
 * (un cuaderno de NotebookLM) o a quién escribir. Sin IA aquí: busca en lo
 * escrito, y lo que no esté lo contesta el cuaderno.
 */
export function HelpPanel({ open, onClose, help, currentApplication, applications }: Props) {
  const titleId = useId()
  const label = (code: string) =>
    LABELS[code] ?? applications.find((application) => application.code === code)?.name ?? code

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          'aria-labelledby': titleId,
          sx: { width: { xs: '100%', sm: 440 }, display: 'flex', flexDirection: 'column' },
        },
      }}
    >
      {/* Solo se monta abierto: cada vez que se abre, buscador vacío y con el foco. */}
      <HelpContents
        titleId={titleId}
        onClose={onClose}
        help={help}
        currentApplication={currentApplication}
        label={label}
      />
    </Drawer>
  )
}

interface ContentsProps {
  titleId: string
  onClose: () => void
  help: HelpStatus & { retry: () => void }
  currentApplication: string | null
  label: (code: string) => string
}

function HelpContents({ titleId, onClose, help, currentApplication, label }: ContentsProps) {
  const [query, setQuery] = useState('')
  const content = help.kind === 'ready' ? help.content : null

  return (
    <>
      <Box sx={{ px: 2, pt: 1.5, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography id={titleId} variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            Ayuda
          </Typography>
          <IconButton onClick={onClose} aria-label="Cerrar la ayuda" sx={{ mr: -1 }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <TextField
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="¿Qué quieres hacer?"
          autoFocus
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar en la ayuda' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1 }}>
        {help.kind === 'error' ? (
          <Alert
            severity="error"
            sx={{ mt: 1 }}
            action={
              <Button color="inherit" size="small" onClick={help.retry}>
                Reintentar
              </Button>
            }
          >
            No se ha podido cargar la ayuda.
          </Alert>
        ) : content === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label="Cargando la ayuda" />
          </Box>
        ) : content.entries.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Todavía no hay preguntas cargadas.
          </Typography>
        ) : query.trim() === '' ? (
          <Browse content={content} currentApplication={currentApplication} label={label} />
        ) : (
          <Results content={content} query={query} currentApplication={currentApplication} label={label} />
        )}
      </Box>

      {content !== null && (content.notebookUrl !== null || content.updatedAt !== null) && (
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {content.notebookUrl !== null && (
            <Link href={content.notebookUrl} target="_blank" rel="noopener" variant="body2" sx={{ flexGrow: 1 }}>
              ¿No lo encuentras? Pregunta al asistente
            </Link>
          )}
          {content.updatedAt !== null && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Revisada el {formatDate(content.updatedAt)}
            </Typography>
          )}
        </Box>
      )}
    </>
  )
}

interface ListProps {
  content: HelpContent
  currentApplication: string | null
  label: (code: string) => string
}

/** Sin nada escrito: las preguntas de la aplicación abierta y después las generales. */
function Browse({ content, currentApplication, label }: ListProps) {
  const groups = [currentApplication, 'general']
    .filter((code, index, all): code is string => code !== null && all.indexOf(code) === index)
    .map((code) => ({ code, entries: content.entries.filter((entry) => entry.application === code) }))
    .filter((group) => group.entries.length > 0)

  if (groups.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Escribe arriba lo que buscas.
      </Typography>
    )
  }

  return groups.map((group) => (
    <Box key={group.code} component="section" aria-label={label(group.code)} sx={{ mt: 1.5 }}>
      <Typography variant="overline" component="h3" color="secondary" sx={{ lineHeight: 2 }}>
        {label(group.code)}
      </Typography>
      {group.entries.map((entry) => (
        <HelpItem key={entry.id} entry={entry} label={label} heading="h4" />
      ))}
    </Box>
  ))
}

/** Con algo escrito: lo que encaja, de más a menos; si nada, el asistente. */
function Results({ content, query, currentApplication, label }: ListProps & { query: string }) {
  const results = useMemo(
    () => searchHelp(content.entries, query, currentApplication),
    [content.entries, query, currentApplication],
  )

  if (results.length === 0) {
    return <NotFound content={content} />
  }

  return (
    <Box component="section" aria-label="Resultados" sx={{ mt: 1 }}>
      {results.map(({ entry }) => (
        <HelpItem key={entry.id} entry={entry} label={label} heading="h3" />
      ))}
    </Box>
  )
}

function NotFound({ content }: { content: HelpContent }) {
  const { notebookUrl, contactEmail } = content

  return (
    <Box sx={{ py: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography>No está en la ayuda.</Typography>
      {notebookUrl !== null && (
        <Button variant="contained" href={notebookUrl} target="_blank" rel="noopener" endIcon={<OpenInNewRounded />}>
          Preguntar al asistente
        </Button>
      )}
      {contactEmail !== null && (
        <Typography variant="body2" color="text.secondary">
          {notebookUrl !== null ? 'o escribe a ' : 'Escribe a '}
          {/* Un clic lo selecciona entero, para copiarlo. */}
          <Box component="span" sx={{ userSelect: 'all', color: 'text.primary', fontWeight: 500 }}>
            {contactEmail}
          </Box>
        </Typography>
      )}
    </Box>
  )
}

interface ItemProps {
  entry: HelpEntry
  label: (code: string) => string
  /** El nivel del título de la pregunta: debajo del de su grupo, si lo hay. */
  heading: 'h3' | 'h4'
}

/** Una pregunta, plegada; al abrirla, la respuesta y de dónde sale. */
function HelpItem({ entry, label, heading }: ItemProps) {
  const source = [entry.manual !== null ? `Manual ${entry.manual}` : null, label(entry.application)]
    .filter((part) => part !== null)
    .join(' · ')

  return (
    <Accordion
      disableGutters
      elevation={0}
      square
      slots={{ heading }}
      slotProps={{ transition: { unmountOnExit: true } }}
      sx={{ bgcolor: 'transparent', borderBottom: 1, borderColor: 'divider', '&::before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ px: 0 }}>
        <Typography sx={{ fontWeight: 500 }}>{entry.question}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0 }}>
        <HelpAnswer answer={entry.answer} />
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {source}
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}

/** "2026-09-28" → "28/09/2026". Sin pasar por Date, que la movería de día según la zona horaria. */
function formatDate(date: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)

  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : date
}
