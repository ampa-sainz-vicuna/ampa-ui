import { describe, expect, it, vi } from 'vitest'
import { saveFile } from './saveFile.ts'

describe('saveFile', () => {
  it('pincha un enlace al blob con el nombre del fichero y lo libera un rato después, no en el acto', () => {
    vi.useFakeTimers()
    // jsdom no trae estas dos: en un navegador existen siempre.
    const createObjectURL = vi.fn(() => 'blob:fichero')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = createObjectURL
        static revokeObjectURL = revokeObjectURL
      },
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe('blob:fichero')
      expect(this.download).toBe('Nómina.pdf')
    })

    saveFile({ blob: new Blob(['%PDF']), filename: 'Nómina.pdf' })

    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60_000)

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fichero')
    click.mockRestore()
  })
})
