import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getContrastRatio } from '@mui/material/styles'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '../brand/theme.ts'
import { toneColors, type Tone } from '../brand/tones.ts'
import { PageHeader } from './PageHeader.tsx'
import { SectionIcon } from './SectionIcon.tsx'
import { StatTile } from './StatTile.tsx'
import { StatusChip } from './StatusChip.tsx'

const TONES: Tone[] = ['success', 'warning', 'error', 'info', 'neutral']

describe('toneColors', () => {
  it.each(TONES)('el texto de «%s» se lee sobre su fondo suave (AA, 4,5:1)', (tone) => {
    const colors = toneColors(theme, tone)

    // El fondo suave es casi blanco: el texto tiene que pasar contra el blanco
    // con margen. Con el texto sobre el blanco del todo se queda corto el
    // naranja de MUI; por eso tones.ts lo oscurece.
    expect(getContrastRatio(colors.text, '#FFFFFF')).toBeGreaterThanOrEqual(5)
  })
})

describe('StatusChip', () => {
  it('dice su estado con palabras', () => {
    render(<StatusChip tone="warning" label="Sin mandato" />)

    expect(screen.getByText('Sin mandato')).toBeTruthy()
  })
})

describe('StatTile', () => {
  it('se lee entero (cifra y qué es) y al pincharlo avisa', async () => {
    const onClick = vi.fn()
    render(<StatTile tone="error" value={12} label="Con deuda" detail="1.240,00 € en total" onClick={onClick} />)

    const tile = screen.getByRole('button', { name: /12 Con deuda/ })
    expect(tile.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(tile)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('con su filtro puesto, se marca como pulsado', () => {
    render(<StatTile tone="info" value={3} label="Nuevas" onClick={() => {}} selected />)

    expect(screen.getByRole('button', { name: /3 Nuevas/ }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('PageHeader', () => {
  it('pone el título como encabezado de la pantalla, con su línea y su acción', () => {
    render(
      <PageHeader icon={<svg data-testid="icono" />} subtitle="312 activas" action={<button>Nueva familia</button>} accent="teal">
        Familias
      </PageHeader>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Familias' })).toBeTruthy()
    expect(screen.getByText('312 activas')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nueva familia' })).toBeTruthy()
  })
})

describe('SectionIcon', () => {
  it('es decorativo: el nombre lo da la pestaña', () => {
    render(
      <SectionIcon accent="orange">
        <svg data-testid="icono" />
      </SectionIcon>,
    )

    expect(screen.getByTestId('icono').parentElement?.getAttribute('aria-hidden')).toBe('true')
  })
})
