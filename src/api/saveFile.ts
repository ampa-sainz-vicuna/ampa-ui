import type { DownloadedFile } from './client.ts'

/**
 * Guarda en el disco un fichero que ha llegado por fetch.
 *
 * Hace falta este rodeo porque la descarga va con la cabecera Authorization, y
 * un enlace normal no puede llevarla: el navegador solo manda cabeceras en las
 * peticiones que hace el código. Así que se descarga con fetch y se le pincha
 * al navegador un enlace de mentira que apunta al blob ya descargado.
 */
export function saveFile({ blob, filename }: DownloadedFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Sin esto el blob se queda en memoria hasta que se recargue la página. Pero
  // no en el acto: algunos navegadores empiezan a guardar después del clic y,
  // si el blob ya no existe, cortan la descarga. Venía así de fichajes.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
