import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderInSuite } from '../test/fixtures.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'

function renderDialog(props: { busy?: boolean } = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  renderInSuite(
    <ConfirmDialog open title="¿Borrar «Kárate 2»?" confirmLabel="Borrar" onConfirm={onConfirm} onCancel={onCancel} {...props}>
      Se borrarán también <strong>los tres grupos</strong> que llevan a esa hoja.
    </ConfirmDialog>,
  )

  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('el diálogo se llama como su título y cuenta lo que va a pasar', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog', { name: '¿Borrar «Kárate 2»?' })
    expect(dialog.textContent).toContain('Se borrarán también los tres grupos que llevan a esa hoja.')
  })

  it('confirmar y cancelar llaman a quien toca', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('mientras está ocupado no deja confirmar dos veces', () => {
    renderDialog({ busy: true })

    expect(screen.getByRole('button', { name: 'Borrar' }).hasAttribute('disabled')).toBe(true)
  })
})
