import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

/**
 * Un trozo de la respuesta: un párrafo o una lista.
 *
 * Las respuestas llegan con el poco formato que se escribe a mano en un
 * fichero de texto: párrafos separados por una línea en blanco, `1. ` para
 * los pasos, `- ` para las viñetas y `**negrita**`. Se convierte en
 * elementos de React y nunca en HTML: así lo que venga en el texto se pinta
 * como texto, aunque sea un `<script>`.
 */
type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'numbered'; start: number; items: string[] }
  | { kind: 'bullets'; items: string[] }

const NUMBERED = /^(\d+)[.)]\s+(.*)$/
const BULLET = /^[-*•]\s+(.*)$/

/** Separa la respuesta en párrafos y listas. */
function parseAnswer(answer: string): Block[] {
  const blocks: Block[] = []
  let current: Block | null = null

  const close = () => {
    if (current !== null) {
      blocks.push(current)
      current = null
    }
  }

  for (const raw of answer.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    if (line === '') {
      close()
      continue
    }

    const numbered = NUMBERED.exec(line)
    const bullet = numbered ? null : BULLET.exec(line)
    const block = current as Block | null

    if (numbered) {
      if (block?.kind === 'numbered') {
        block.items.push(numbered[2])
      } else {
        close()
        current = { kind: 'numbered', start: Number(numbered[1]), items: [numbered[2]] }
      }
    } else if (bullet) {
      if (block?.kind === 'bullets') {
        block.items.push(bullet[1])
      } else {
        close()
        current = { kind: 'bullets', items: [bullet[1]] }
      }
    } else if (block?.kind === 'paragraph') {
      block.lines.push(line)
    } else {
      close()
      current = { kind: 'paragraph', lines: [line] }
    }
  }
  close()

  return blocks
}

/** `**negrita**` dentro de una línea. Un `**` sin cerrar se queda tal cual. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, index): ReactNode[] => {
    if (part === '') {
      return []
    }
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return [<strong key={index}>{part.slice(2, -2)}</strong>]
    }

    return [part]
  })
}

interface Props {
  answer: string
}

/** La respuesta de una pregunta de la ayuda, pintada. */
export function HelpAnswer({ answer }: Props) {
  return (
    <Box sx={{ '& > :first-of-type': { mt: 0 }, '& > :last-child': { mb: 0 } }}>
      {parseAnswer(answer).map((block, index) => {
        switch (block.kind) {
          case 'paragraph':
            return (
              <Typography key={index} variant="body2" component="p" sx={{ my: 1 }}>
                {block.lines.flatMap((line, i) => (i === 0 ? inline(line) : [<br key={`br${i}`} />, ...inline(line)]))}
              </Typography>
            )
          case 'numbered':
            return (
              <Box
                key={index}
                component="ol"
                start={block.start === 1 ? undefined : block.start}
                sx={{ my: 1, pl: 3, typography: 'body2', '& li + li': { mt: 0.5 } }}
              >
                {block.items.map((item, i) => (
                  <li key={i}>{inline(item)}</li>
                ))}
              </Box>
            )
          case 'bullets':
            return (
              <Box key={index} component="ul" sx={{ my: 1, pl: 3, typography: 'body2', '& li + li': { mt: 0.5 } }}>
                {block.items.map((item, i) => (
                  <li key={i}>{inline(item)}</li>
                ))}
              </Box>
            )
        }
      })}
    </Box>
  )
}
