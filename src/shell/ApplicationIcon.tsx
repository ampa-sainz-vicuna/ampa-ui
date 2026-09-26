import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AppsRounded from '@mui/icons-material/AppsRounded'
import FactCheckRounded from '@mui/icons-material/FactCheckRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import ViewKanbanRounded from '@mui/icons-material/ViewKanbanRounded'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { ComponentType } from 'react'

/**
 * El icono de cada aplicación, el mismo en las tarjetas del portal y en el
 * selector de la barra. Por código del catálogo del portal; una aplicación
 * nueva que no esté sale con el genérico hasta que se le ponga el suyo.
 */
const ICONS: Record<string, ComponentType<SvgIconProps>> = {
  portal: HomeRounded,
  fichajes: AccessTimeRounded,
  listados: FactCheckRounded,
  facturacion: AccountBalanceWalletRounded,
  tareas: ViewKanbanRounded,
}

interface Props extends SvgIconProps {
  /** El código del catálogo del portal: "fichajes", "tareas"… "portal", el propio portal. */
  code: string
}

export function ApplicationIcon({ code, ...props }: Props) {
  const Icon = ICONS[code] ?? AppsRounded

  return <Icon {...props} />
}
