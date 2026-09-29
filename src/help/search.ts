import type { HelpEntry } from './helpContent.ts'

/**
 * El buscador de la ayuda. Sin librerías ni IA: son menos de cien preguntas y
 * con esto basta. Quien busca escribe como habla («cómo devuelvo un
 * recibo»), sin cuidar tildes ni mayúsculas y a veces a medio escribir, así
 * que:
 *
 * - se comparan palabras sin tildes ni mayúsculas;
 * - las palabras vacías («de», «cómo», «un»…) no cuentan;
 * - una palabra a medias vale si es el principio de otra («devuel» encuentra
 *   «devuelto» y «devuelve»), que es también lo más parecido a quitar las
 *   terminaciones del español sin meter un lematizador;
 * - pesa más si está en la pregunta, luego en las palabras clave y luego en
 *   la respuesta, y un poco más si la pregunta es de la aplicación abierta.
 */

/**
 * Las palabras que no dicen nada de lo que se busca, ya sin tildes. Si una
 * búsqueda solo tiene estas («cómo»), se buscan tal cual.
 */
const STOPWORDS = new Set([
  'a', 'al', 'algo', 'como', 'con', 'cual', 'cuando', 'de', 'del', 'donde', 'el', 'en', 'es', 'esta', 'este', 'esto',
  'hago', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'me', 'mi', 'mis', 'no', 'o', 'para', 'pero', 'por', 'porque',
  'puedo', 'que', 'quien', 'quiero', 'se', 'si', 'sin', 'sobre', 'su', 'sus', 'te', 'tu', 'un', 'una', 'unas', 'unos',
  'y', 'ya', 'yo',
])

/** Por debajo de esto, una palabra a medias no se toma como principio de otra: «de» no es «devuelto». */
const MIN_PREFIX = 3

// Lo que suma cada palabra buscada según dónde aparezca: entera o como
// principio de otra.
const WEIGHTS = {
  question: { exact: 10, prefix: 7 },
  keywords: { exact: 6, prefix: 4 },
  answer: { exact: 2, prefix: 1 },
}
/** Lo que suma ser de la aplicación abierta: menos que una coincidencia en la pregunta. */
const CURRENT_APPLICATION_BONUS = 2

/** Sin tildes ni mayúsculas: «Cómo DEVOLVÍ» → «como devolvi». La ñ se queda en n, igual en los dos lados. */
export function normalize(text: string): string {
  // NFD separa cada letra de su tilde (á → a + ´); después se quitan las tildes sueltas.
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Las palabras de un texto, normalizadas. */
export function words(text: string): string[] {
  return normalize(text).split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '')
}

/** Las palabras que cuentan de lo que se ha escrito en el buscador, sin repetir. */
export function queryTerms(query: string): string[] {
  const all = [...new Set(words(query))]
  const meaningful = all.filter((word) => !STOPWORDS.has(word))

  return meaningful.length > 0 ? meaningful : all
}

export interface ScoredEntry {
  entry: HelpEntry
  score: number
}

/**
 * Las preguntas que encajan con la búsqueda, de más a menos relevante.
 *
 * Una pregunta entra si encaja con al menos la mitad de las palabras
 * buscadas: con varias palabras, exigirlas todas dejaría fuera «cómo cierro
 * el mes de septiembre» porque ninguna pregunta dice «septiembre», y
 * bastar con una sacaría cualquier respuesta que diga «mes». Y la
 * puntuación se multiplica por la parte de las palabras con las que encaja,
 * para que las que encajan con todas salgan antes.
 */
export function searchHelp(entries: HelpEntry[], query: string, currentApplication: string | null): ScoredEntry[] {
  const terms = queryTerms(query)
  if (terms.length === 0) {
    return []
  }

  const needed = Math.ceil(terms.length / 2)
  const results: ScoredEntry[] = []

  for (const entry of entries) {
    const fields = {
      question: words(entry.question),
      keywords: entry.keywords.flatMap(words),
      answer: words(entry.answer),
    }

    let sum = 0
    let matched = 0
    for (const term of terms) {
      const termScore =
        fieldScore(fields.question, term, WEIGHTS.question) +
        fieldScore(fields.keywords, term, WEIGHTS.keywords) +
        fieldScore(fields.answer, term, WEIGHTS.answer)
      if (termScore > 0) {
        matched++
        sum += termScore
      }
    }

    if (matched < needed) {
      continue
    }

    const bonus = currentApplication !== null && entry.application === currentApplication ? CURRENT_APPLICATION_BONUS : 0
    results.push({ entry, score: (sum * matched) / terms.length + bonus })
  }

  // sort es estable: a igual puntuación, el orden en que las sirve el portal.
  return results.sort((a, b) => b.score - a.score)
}

/** Lo que vale una palabra buscada en un campo: entera, como principio de otra, o nada. */
function fieldScore(fieldWords: string[], term: string, weight: { exact: number; prefix: number }): number {
  if (fieldWords.includes(term)) {
    return weight.exact
  }
  if (term.length >= MIN_PREFIX && fieldWords.some((word) => word.startsWith(term))) {
    return weight.prefix
  }

  return 0
}
