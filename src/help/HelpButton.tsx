import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'
import type { SuiteLink } from '../auth/authContext.ts'
import { currentApplication } from '../shell/here.ts'
import { helpUrl } from './helpContent.ts'
import { HelpPanel } from './HelpPanel.tsx'
import { useHelp } from './useHelp.ts'

interface Props {
  portalUrl: string
  applications: SuiteLink[]
}

/**
 * El botón de la barra que abre la ayuda. La ayuda se pide al portal la
 * primera vez que se abre, no antes: casi nadie la mira en cada visita.
 */
export function HelpButton({ portalUrl, applications }: Props) {
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const help = useHelp(helpUrl(portalUrl), opened)

  return (
    <>
      <Tooltip title="Ayuda">
        <IconButton
          onClick={() => {
            setOpened(true)
            setOpen(true)
          }}
          aria-label="Ayuda"
          aria-haspopup="dialog"
        >
          <HelpOutlineRounded />
        </IconButton>
      </Tooltip>
      <HelpPanel
        open={open}
        onClose={() => setOpen(false)}
        help={help}
        currentApplication={currentApplication(portalUrl, applications)}
        applications={applications}
      />
    </>
  )
}
