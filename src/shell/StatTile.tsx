import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { toneColors, type Tone } from '../brand/tones.ts'

interface Props {
  tone: Tone
  /** La cifra: «3», «12». */
  value: number | string
  label: string
  /** Una línea debajo, en gris: «1.240,00 € en total». */
  detail?: string
  /** Pinchar el recuadro filtra lo de abajo. */
  onClick: () => void
  /** Si su filtro está puesto: sale con el borde de su color. */
  selected?: boolean
}

/**
 * Un recuadro de lo que pide atención, encima de una lista (desde la 0.2.14):
 * «3 nuevas por revisar», «12 con deuda». La cifra va en un cuadrado lleno de
 * su color y el recuadro, con un velo suave de ese color. Al pincharlo filtra
 * la lista; pincharlo otra vez quita el filtro (lo decide la aplicación).
 */
export function StatTile({ tone, value, label, detail, onClick, selected = false }: Props) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      // Lo que se oye, de una vez: «12 Con deuda, 1.240,00 € en total».
      aria-label={[`${value} ${label}`, detail].filter(Boolean).join(', ')}
      sx={(theme) => {
        const colors = toneColors(theme, tone)
        return {
          width: '100%',
          justifyContent: 'flex-start',
          textAlign: 'left',
          gap: 1.5,
          p: 2,
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: `linear-gradient(135deg, ${colors.soft}, ${alpha(theme.palette.background.paper, 0)} 70%)`,
          border: 1,
          borderColor: selected ? colors.main : alpha(colors.main, 0.2),
          boxShadow: selected ? `0 0 0 3px ${alpha(colors.main, 0.18)}` : `0 1px 2px ${alpha(colors.main, 0.08)}`,
          transition: 'box-shadow 150ms, border-color 150ms, transform 100ms',
          '&:hover': { borderColor: colors.main },
          '&:active': { transform: 'scale(0.99)' },
        }
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => {
          const colors = toneColors(theme, tone)
          return {
            minWidth: 44,
            height: 44,
            px: 1,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: '1.125rem',
            color: '#fff',
            // El de texto, más oscuro: el blanco encima pasa el contraste también en el naranja.
            bgcolor: colors.text,
          }
        }}
      >
        {value}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" component="span" sx={{ display: 'block', color: 'text.primary' }}>
          {label}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
            {detail}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  )
}
