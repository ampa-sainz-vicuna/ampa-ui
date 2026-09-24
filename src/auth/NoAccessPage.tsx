import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { useSuiteApp } from '../app/suiteApp.ts'
import { EntryCard } from './EntryCard.tsx'

interface Props {
  /** Lo que ha dicho el servidor ("No tienes acceso a esta aplicación."). */
  message: string
  onSignOut: () => void
}

/**
 * La sesión vale para la suite, pero no tiene acceso a esta aplicación (403).
 * No se le manda a entrar otra vez: no arreglaría nada y daría vueltas entre
 * el portal y aquí. Se le lleva al portal, que enseña a qué sí puede ir, o a
 * salir, por si ha entrado con la cuenta equivocada.
 */
export function NoAccessPage({ message, onSignOut }: Props) {
  const { portalUrl } = useSuiteApp()

  return (
    <EntryCard subtitle="Has entrado, pero no con acceso a esta aplicación">
      <Alert severity="info" sx={{ textAlign: 'left' }}>
        {message} Si crees que deberías tenerlo, pídeselo a quien gestiona los permisos del AMPA.
      </Alert>
      <Button href={portalUrl} variant="contained">
        Ir al portal del AMPA
      </Button>
      <Button onClick={onSignOut}>Entrar con otra cuenta</Button>
    </EntryCard>
  )
}
