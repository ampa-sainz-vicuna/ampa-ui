import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HelpAnswer } from './HelpAnswer.tsx'

const texts = (elements: NodeListOf<Element>) => [...elements].map((element) => element.textContent)

describe('HelpAnswer', () => {
  it('párrafos, pasos numerados, viñetas y negrita', () => {
    const { container } = render(
      <HelpAnswer answer={'Primero, entra en **Diario**.\nDespués, elige el mes.\n\n1. Pulsa Cerrar.\n2. Confirma.\n\n- Una viñeta\n- Otra con **negrita**\n\nFin.'} />,
    )

    const paragraphs = container.querySelectorAll('p')
    expect(texts(paragraphs)).toEqual(['Primero, entra en Diario.Después, elige el mes.', 'Fin.'])
    // Las líneas de un mismo párrafo, con un salto entre ellas.
    expect(paragraphs[0].querySelectorAll('br')).toHaveLength(1)

    expect(texts(container.querySelectorAll('ol > li'))).toEqual(['Pulsa Cerrar.', 'Confirma.'])
    expect(texts(container.querySelectorAll('ul > li'))).toEqual(['Una viñeta', 'Otra con negrita'])
    expect(texts(container.querySelectorAll('strong'))).toEqual(['Diario', 'negrita'])
  })

  it('una lista pegada al párrafo, sin línea en blanco, también es una lista', () => {
    const { container } = render(<HelpAnswer answer={'Así:\n1. Uno\n2. Dos'} />)

    expect(texts(container.querySelectorAll('p'))).toEqual(['Así:'])
    expect(texts(container.querySelectorAll('ol > li'))).toEqual(['Uno', 'Dos'])
  })

  it('una lista que no empieza en 1 sigue su número', () => {
    const { container } = render(<HelpAnswer answer={'3. Tercero\n4. Cuarto'} />)

    expect(container.querySelector('ol')?.getAttribute('start')).toBe('3')
  })

  it('el HTML que venga en el texto se pinta como texto, nunca como HTML', () => {
    const { container } = render(<HelpAnswer answer={'<b>hola</b> <img src=x onerror="alert(1)"> y **bien**'} />)

    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('<b>hola</b> <img src=x onerror="alert(1)"> y bien')
  })

  it('un ** sin cerrar se queda tal cual', () => {
    const { container } = render(<HelpAnswer answer={'2 ** 3 es potencia'} />)

    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toBe('2 ** 3 es potencia')
  })
})
