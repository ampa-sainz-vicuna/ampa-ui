import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderInSuite } from '../test/fixtures.tsx'
import { AppShell } from './AppShell.tsx'

describe('AppShell', () => {
  it('enseña el nombre de la aplicación, quién ha entrado y el contenido', () => {
    renderInSuite(<AppShell userName="Alberto">El contenido</AppShell>)

    expect(screen.getByText('Pruebas del AMPA')).toBeTruthy()
    expect(screen.getByText('Alberto')).toBeTruthy()
    expect(screen.getByRole('main').textContent).toBe('El contenido')
  })

  it('el botón de salir llama a onSignOut', async () => {
    const onSignOut = vi.fn()
    renderInSuite(<AppShell onSignOut={onSignOut}>Contenido</AppShell>)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('sin onSignOut no hay botón de salir (una aplicación que aún no tiene login)', () => {
    renderInSuite(<AppShell>Contenido</AppShell>)

    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })

  it('fuera de SuiteRoot avisa de lo que falta, en vez de pintarse a medias', () => {
    // React escribe el error en la consola además de lanzarlo.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AppShell>Contenido</AppShell>)).toThrow('useSuiteApp() solo funciona dentro de <SuiteRoot>.')
  })
})
