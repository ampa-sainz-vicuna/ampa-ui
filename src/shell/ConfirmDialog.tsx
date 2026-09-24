import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useId, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  /** Qué va a pasar exactamente. No "¿estás seguro?": lo que cambia. */
  children: ReactNode
  confirmLabel: string
  /** Mientras la petición está en marcha, para no mandarla dos veces. */
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Preguntar antes de hacer algo que no se deshace solo.
 *
 * No lo lleva todo: lo que se vuelve a meter en dos segundos se borra sin
 * preguntar. Esto es para lo que arrastra otras cosas con él o para lo que
 * otra persona ya había decidido.
 *
 * Había tres versiones, una por aplicación. Esta junta lo de las tres: el texto
 * como children (se puede meter un nombre en negrita), `busy` de fichajes y el
 * título enlazado al diálogo de facturación, para los lectores de pantalla.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const titleId = useId()

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2">{children}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
