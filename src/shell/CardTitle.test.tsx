import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardTitle } from './CardTitle.tsx'

describe('CardTitle', () => {
  it('pone el título como encabezado de sección, con su línea y su acción', () => {
    render(
      <CardTitle icon={<svg data-testid="icono" />} subtitle="Lo que hay pendiente" action={<button>Añadir</button>}>
        Empleados
      </CardTitle>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Empleados' })).toBeTruthy()
    expect(screen.getByText('Lo que hay pendiente')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeTruthy()
    expect(screen.getByTestId('icono')).toBeTruthy()
  })
})
