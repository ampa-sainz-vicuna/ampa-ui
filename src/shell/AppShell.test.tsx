import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SessionUserContext } from '../auth/sessionUserContext.ts'
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

  it('el logo lleva al portal', () => {
    renderInSuite(<AppShell>Contenido</AppShell>)

    expect(screen.getByRole('link', { name: 'Ir al portal del AMPA' }).getAttribute('href')).toBe('https://portal.ampa.test')
  })

  it('sin la lista de aplicaciones (un servidor anterior) no hay selector', () => {
    renderInSuite(
      <SessionUserContext value={{ name: 'Alberto', email: 'info@ampa.test' }}>
        <AppShell>Contenido</AppShell>
      </SessionUserContext>,
    )

    expect(screen.queryByRole('button', { name: 'Aplicaciones del AMPA' })).toBeNull()
  })

  it('el selector lleva al portal y a las aplicaciones de quien ha entrado, con la abierta marcada', async () => {
    const here = { code: 'tareas', name: 'Tareas del AMPA', url: window.location.origin }
    const other = { code: 'fichajes', name: 'Fichajes del AMPA', url: 'https://fichajes.ampa.test' }
    renderInSuite(
      <SessionUserContext value={{ name: 'Alberto', email: 'info@ampa.test', applications: [other, here] }}>
        <AppShell>Contenido</AppShell>
      </SessionUserContext>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Aplicaciones del AMPA' }))

    const items = screen.getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Portal', 'Fichajes del AMPA', 'Tareas del AMPA'])
    expect(items[0].getAttribute('href')).toBe('https://portal.ampa.test')
    expect(items[1].getAttribute('href')).toBe('https://fichajes.ampa.test')
    expect(items[2].getAttribute('href')).toBeNull()
    expect(items[2].getAttribute('aria-current')).toBe('page')
  })

  it('fuera de SuiteRoot avisa de lo que falta, en vez de pintarse a medias', () => {
    // React escribe el error en la consola además de lanzarlo.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AppShell>Contenido</AppShell>)).toThrow('useSuiteApp() solo funciona dentro de <SuiteRoot>.')
  })
})
