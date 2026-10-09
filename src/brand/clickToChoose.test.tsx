import MenuItem from '@mui/material/MenuItem'
import { ThemeProvider } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { theme } from './theme.ts'

/** Un desplegable cualquiera de una aplicación: no pasa nada especial, lo pone el tema. */
function Responsable() {
  const [value, setValue] = useState('')

  return (
    <ThemeProvider theme={theme}>
      <TextField select label="Responsable" value={value} onChange={(e) => setValue(e.target.value)}>
        <MenuItem value="">
          <em>Sin responsable</em>
        </MenuItem>
        <MenuItem value="admin.prueba@example.com">Admin de prueba</MenuItem>
        <MenuItem value="vocal.prueba@example.com">Vocal de Prueba</MenuItem>
      </TextField>
    </ThemeProvider>
  )
}

describe('los desplegables', () => {
  it('soltar sobre una opción el clic que abrió el menú no la elige', async () => {
    const { container } = render(<Responsable />)

    // Es lo que pasa cuando el menú no cabe debajo y MUI lo sube encima del
    // campo: el botón se suelta sobre una opción, y a los 200 ms MUI la daría
    // por elegida.
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Responsable' }))
    await new Promise((resolve) => setTimeout(resolve, 450))
    fireEvent.mouseUp(screen.getByRole('option', { name: 'Admin de prueba' }))

    expect(screen.queryByRole('listbox')).not.toBeNull()
    expect(container.querySelector('input')?.value).toBe('')
  })

  it('un clic sobre la opción la elige', async () => {
    const user = userEvent.setup()
    render(<Responsable />)

    await user.click(screen.getByRole('combobox', { name: 'Responsable' }))
    await user.click(screen.getByRole('option', { name: 'Vocal de Prueba' }))

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Responsable' }).textContent).toContain('Vocal de Prueba')
  })

  it('la segunda vez que se abre tampoco elige con el clic de abrir', async () => {
    const user = userEvent.setup()
    const { container } = render(<Responsable />)

    await user.click(screen.getByRole('combobox', { name: 'Responsable' }))
    await user.click(screen.getByRole('option', { name: 'Vocal de Prueba' }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Responsable' }))
    await new Promise((resolve) => setTimeout(resolve, 450))
    fireEvent.mouseUp(screen.getByRole('option', { name: 'Admin de prueba' }))

    expect(screen.queryByRole('listbox')).not.toBeNull()
    expect(container.querySelector('input')?.value).toBe('vocal.prueba@example.com')
  })
})
