import Chip from '@mui/material/Chip'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactElement } from 'react'
import { toneColors, type Tone } from '../brand/tones.ts'

interface Props {
  tone: Tone
  label: string
  icon?: ReactElement
  sx?: SxProps<Theme>
}

/**
 * Una etiqueta de estado (desde la 0.2.14): «Socia», «Sin mandato», «Debe
 * 45,00 €». Fondo suave del color de su estado y el texto en el mismo color,
 * más oscuro (ver tones.ts).
 */
export function StatusChip({ tone, label, icon, sx }: Props) {
  return (
    <Chip
      size="small"
      label={label}
      icon={icon}
      sx={[
        (theme) => {
          const colors = toneColors(theme, tone)
          return {
            bgcolor: colors.soft,
            color: colors.text,
            '& .MuiChip-icon': { color: colors.main },
          }
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
