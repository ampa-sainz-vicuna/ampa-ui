import AppsRounded from '@mui/icons-material/AppsRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { useId, useState } from 'react'
import type { SuiteLink } from '../auth/authContext.ts'
import { ApplicationIcon } from './ApplicationIcon.tsx'

interface Props {
  portalUrl: string
  applications: SuiteLink[]
}

/**
 * Si una dirección es la de esta misma página. Se compara el origen (esquema,
 * dominio y puerto): cada aplicación tiene el suyo, en producción y en
 * desarrollo.
 */
function isHere(url: string): boolean {
  try {
    return new URL(url).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * El botón de la barra para saltar a otra aplicación sin pasar por el
 * portal: el portal arriba y, debajo, las aplicaciones de quien ha entrado.
 * La sesión es una sola, así que ir a otra no pide entrar otra vez. La que
 * está abierta sale marcada y no lleva a ningún sitio.
 */
export function ApplicationSwitcher({ portalUrl, applications }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const menuId = useId()
  const links: SuiteLink[] = [{ code: 'portal', name: 'Portal', url: portalUrl }, ...applications]

  return (
    <>
      <Tooltip title="Aplicaciones del AMPA">
        <IconButton
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label="Aplicaciones del AMPA"
          aria-controls={anchor ? menuId : undefined}
          aria-haspopup="menu"
          aria-expanded={anchor ? 'true' : undefined}
        >
          <AppsRounded />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 0.5, borderRadius: 3 } } }}
      >
        {links.flatMap((link, index) => {
          const here = isHere(link.url)
          const item = (
            <MenuItem
              key={link.code}
              component="a"
              href={here ? undefined : link.url}
              selected={here}
              aria-current={here ? 'page' : undefined}
              onClick={here ? () => setAnchor(null) : undefined}
              sx={{ py: 1.25, gap: 0.5 }}
            >
              <ListItemIcon sx={{ color: here ? 'primary.main' : 'secondary.main' }}>
                <ApplicationIcon code={link.code} />
              </ListItemIcon>
              <ListItemText primary={link.name} />
              {here && <CheckRounded fontSize="small" color="primary" sx={{ ml: 1 }} />}
            </MenuItem>
          )

          // Una raya entre el portal y las aplicaciones.
          return index === 0 && applications.length > 0 ? [item, <Divider key="divider" />] : [item]
        })}
      </Menu>
    </>
  )
}
