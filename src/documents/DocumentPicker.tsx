import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import FolderRounded from '@mui/icons-material/FolderRounded'
import ImageRounded from '@mui/icons-material/ImageRounded'
import InsertDriveFileRounded from '@mui/icons-material/InsertDriveFileRounded'
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { messageOf } from '../api/client.ts'
import { useSessionUser } from '../auth/sessionUserContext.ts'
import {
  documentsUrlOf,
  fetchFolder,
  fetchSpaces,
  pickedFrom,
  searchDocuments,
  type DocumentItem,
  type PickedDocument,
} from './documentsApi.ts'

interface Props {
  open: boolean
  /** Por defecto, «Adjuntar desde Documentos». */
  title?: string
  /** El botón que confirma; por defecto, «Adjuntar». */
  confirmLabel?: string
  /**
   * Solo ficheros que se puedan descargar (facturación, que se lleva una
   * copia): fuera los formularios y accesos directos de Google.
   */
  requireContent?: boolean
  /** Mientras la aplicación guarda el adjunto, para no mandarlo dos veces. */
  busy?: boolean
  /** Lo que haya contestado el servidor de la aplicación al guardarlo. */
  error?: string | null
  /** Con lo elegido, la aplicación guarda el adjunto (y cierra el diálogo cuando acabe). */
  onPick: (document: PickedDocument) => void
  onClose: () => void
}

/**
 * Elegir un fichero de Documentos para adjuntarlo en otra aplicación (fase 2
 * de Documentos): los espacios que ve quien ha entrado, sus carpetas y la
 * búsqueda (también dentro de los PDF, la de Drive).
 *
 * Solo elige. Lo que se hace con el fichero lo decide la aplicación en su
 * servidor: tareas y proveedores guardan el enlace; facturación, una copia. En
 * los dos casos el servidor se lo dice a Documentos, que comprueba que esa
 * persona lo ve y apunta «usado en…».
 *
 * Quien no entra en Documentos (no sale en `applications` de `/api/me`) ve un
 * aviso en vez del selector. En el móvil, a pantalla completa.
 */
export function DocumentPicker({ open, title = 'Adjuntar desde Documentos', confirmLabel = 'Adjuntar', requireContent = false, busy = false, error = null, onPick, onClose }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const titleId = useId()

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} aria-labelledby={titleId}>
      <DialogTitle id={titleId} sx={{ pr: 7 }}>
        {title}
        <IconButton aria-label="Cerrar" onClick={onClose} disabled={busy} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      {/* Dentro del Dialog: se monta de nuevo cada vez que se abre, sin lo elegido la vez anterior. */}
      <PickerBody confirmLabel={confirmLabel} requireContent={requireContent} busy={busy} error={error} onPick={onPick} onClose={onClose} />
    </Dialog>
  )
}

type Place = { kind: 'spaces' } | { kind: 'folder'; space: string; folder: string | null }

type Selected = { space: { code: string; name: string }; item: DocumentItem }

function PickerBody({ confirmLabel, requireContent, busy, error, onPick, onClose }: Required<Omit<Props, 'open' | 'title'>>) {
  const user = useSessionUser()
  const baseUrl = documentsUrlOf(user?.applications)
  const [place, setPlace] = useState<Place>({ kind: 'spaces' })
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Selected | null>(null)

  // Se busca cuando se deja de escribir: Drive tarda, y no merece una
  // búsqueda por letra.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 350)
    return () => clearTimeout(timer)
  }, [text])

  if (baseUrl === null) {
    return (
      <>
        <DialogContent>
          <Alert severity="info">No entras en Documentos. Pide acceso a quien lleva los permisos en el portal, o sube el fichero desde tu equipo.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </>
    )
  }

  const searching = query.length >= 2
  const choose = (space: { code: string; name: string }, item: DocumentItem) => {
    if (item.kind === 'folder') {
      setPlace({ kind: 'folder', space: space.code, folder: item.id })
      setSelected(null)
      // Las dos: si no, la búsqueda seguiría a la vista hasta que pasara la espera.
      setText('')
      setQuery('')
      return
    }
    setSelected({ space, item })
  }

  return (
    <>
      <DialogContent dividers sx={{ p: 0, minHeight: { sm: 420 } }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre o por lo que pone dentro"
            value={text}
            onChange={(event) => setText(event.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar en Documentos' },
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
        {searching ? (
          <SearchList baseUrl={baseUrl} query={query} requireContent={requireContent} selected={selected} onChoose={choose} />
        ) : place.kind === 'spaces' ? (
          <SpacesList baseUrl={baseUrl} onOpen={(space) => setPlace({ kind: 'folder', space, folder: null })} />
        ) : (
          <FolderList
            baseUrl={baseUrl}
            space={place.space}
            folder={place.folder}
            requireContent={requireContent}
            selected={selected}
            onChoose={choose}
            onGo={(next) => {
              setPlace(next)
              setSelected(null)
            }}
          />
        )}
      </DialogContent>
      {error !== null && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}
      <DialogActions sx={{ justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0, pl: 1 }}>
          {selected === null ? 'Elige un fichero' : selected.item.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="contained" disabled={selected === null || busy} onClick={() => selected !== null && onPick(pickedFrom(selected.space, selected.item))}>
            {busy ? 'Guardando…' : confirmLabel}
          </Button>
        </Box>
      </DialogActions>
    </>
  )
}

function SpacesList({ baseUrl, onOpen }: { baseUrl: string; onOpen: (space: string) => void }) {
  const load = useCallback(() => fetchSpaces(baseUrl), [baseUrl])
  const status = useLoad(`spaces:${baseUrl}`, load)

  return (
    <Loaded status={status}>
      {(spaces) =>
        spaces.length === 0 ? (
          <Empty text="No ves ningún espacio de Documentos." />
        ) : (
          <List aria-label="Espacios">
            {spaces.map((space) => (
              <ListItemButton key={space.code} onClick={() => onOpen(space.code)}>
                <ListItemIcon>
                  <FolderRounded color="primary" />
                </ListItemIcon>
                <ListItemText primary={space.name} secondary={space.description} />
              </ListItemButton>
            ))}
          </List>
        )
      }
    </Loaded>
  )
}

function FolderList({
  baseUrl,
  space,
  folder,
  requireContent,
  selected,
  onChoose,
  onGo,
}: {
  baseUrl: string
  space: string
  folder: string | null
  requireContent: boolean
  selected: Selected | null
  onChoose: (space: { code: string; name: string }, item: DocumentItem) => void
  onGo: (place: Place) => void
}) {
  const load = useCallback(() => fetchFolder(baseUrl, space, folder), [baseUrl, space, folder])
  const status = useLoad(`folder:${baseUrl}:${space}:${folder ?? ''}`, load)

  return (
    <Loaded status={status}>
      {(view) => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
            <IconButton
              aria-label="Subir un nivel"
              size="small"
              onClick={() => {
                const parent = view.path.at(-1)
                onGo(folder === null ? { kind: 'spaces' } : { kind: 'folder', space, folder: parent?.id ?? null })
              }}
            >
              <ArrowBackRounded fontSize="small" />
            </IconButton>
            <Breadcrumbs aria-label="Dónde estás" sx={{ fontSize: 14, minWidth: 0 }}>
              <Link component="button" type="button" underline="hover" color="inherit" onClick={() => onGo({ kind: 'folder', space, folder: null })}>
                {view.space.name}
              </Link>
              {view.path.map((step) => (
                <Link key={step.id} component="button" type="button" underline="hover" color="inherit" onClick={() => onGo({ kind: 'folder', space, folder: step.id })}>
                  {step.name}
                </Link>
              ))}
              {view.folder !== null && <Typography sx={{ fontSize: 14 }}>{view.folder.name}</Typography>}
            </Breadcrumbs>
          </Box>
          {view.items.length === 0 ? (
            <Empty text="Esta carpeta está vacía." />
          ) : (
            <ItemList items={view.items.map((item) => ({ space: view.space, item, detail: null }))} requireContent={requireContent} selected={selected} onChoose={onChoose} />
          )}
        </>
      )}
    </Loaded>
  )
}

function SearchList({
  baseUrl,
  query,
  requireContent,
  selected,
  onChoose,
}: {
  baseUrl: string
  query: string
  requireContent: boolean
  selected: Selected | null
  onChoose: (space: { code: string; name: string }, item: DocumentItem) => void
}) {
  const load = useCallback(() => searchDocuments(baseUrl, query), [baseUrl, query])
  const status = useLoad(`search:${baseUrl}:${query}`, load)

  return (
    <Loaded status={status}>
      {(hits) =>
        hits.length === 0 ? (
          <Empty text={`Nada con «${query}» en lo que ves.`} />
        ) : (
          <ItemList
            items={hits.map((hit) => ({ space: hit.space, item: hit.item, detail: [hit.space.name, hit.folderName].filter((part) => part !== null).join(' › ') }))}
            requireContent={requireContent}
            selected={selected}
            onChoose={onChoose}
          />
        )
      }
    </Loaded>
  )
}

function ItemList({
  items,
  requireContent,
  selected,
  onChoose,
}: {
  items: { space: { code: string; name: string }; item: DocumentItem; detail: string | null }[]
  requireContent: boolean
  selected: Selected | null
  onChoose: (space: { code: string; name: string }, item: DocumentItem) => void
}) {
  return (
    <List aria-label="Carpetas y ficheros" dense>
      {items.map(({ space, item, detail }) => {
        const unusable = item.kind === 'file' && requireContent && item.contentType === null
        return (
          <ListItemButton
            key={`${space.code}/${item.id}`}
            selected={selected?.item.id === item.id && selected.space.code === space.code}
            disabled={unusable}
            onClick={() => onChoose(space, item)}
          >
            <ListItemIcon>{iconOf(item)}</ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={unusable ? 'No se puede copiar (un formulario o un acceso directo de Google)' : detail}
              slotProps={{ primary: { sx: { overflowWrap: 'anywhere' } } }}
            />
          </ListItemButton>
        )
      })}
    </List>
  )
}

function iconOf(item: DocumentItem): ReactNode {
  if (item.kind === 'folder') return <FolderRounded color="primary" />
  if ((item.contentType ?? item.mimeType) === 'application/pdf') return <PictureAsPdfRounded color="secondary" />
  if (item.mimeType.startsWith('image/')) return <ImageRounded color="action" />
  return <InsertDriveFileRounded color="action" />
}

function Empty({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6, px: 2 }}>
      {text}
    </Typography>
  )
}

type LoadStatus<T> = { kind: 'loading' } | { kind: 'ready'; value: T } | { kind: 'error'; message: string; retry: () => void }

/**
 * Pide algo a Documentos cada vez que cambia `key`, como `useHelp`: la
 * respuesta se guarda con la pregunta a la que contesta y «cargando» se
 * deduce al pintar, sin un setState dentro del efecto.
 */
function useLoad<T>(key: string, load: () => Promise<T>): LoadStatus<T> {
  const [attempt, setAttempt] = useState(0)
  const question = `${key}#${attempt}`
  const [answer, setAnswer] = useState<{ question: string; status: LoadStatus<T> } | null>(null)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    load()
      .then((value) => {
        if (!cancelled) setAnswer({ question, status: { kind: 'ready', value } })
      })
      .catch((failure: unknown) => {
        if (!cancelled) setAnswer({ question, status: { kind: 'error', message: messageOf(failure), retry } })
      })

    return () => {
      cancelled = true
    }
  }, [question, load, retry])

  return answer?.question === question ? answer.status : { kind: 'loading' }
}

function Loaded<T>({ status, children }: { status: LoadStatus<T>; children: (value: T) => ReactNode }) {
  if (status.kind === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} aria-label="Cargando" />
      </Box>
    )
  }

  if (status.kind === 'error') {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={status.retry}>
            Reintentar
          </Button>
        }
      >
        {status.message}
      </Alert>
    )
  }

  return <>{children(status.value)}</>
}
