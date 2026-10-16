import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { mediaUrl } from '../api/config.js'

marked.setOptions({ gfm: true, breaks: true })

/**
 * Markdown de las noticias → HTML seguro (DOMPurify quita scripts y atributos peligrosos).
 * Las imágenes subidas desde el panel (/media/...) se sirven desde el servidor de la radio.
 */
export function renderMarkdown(markdown) {
  const purify = DOMPurify(window)
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || ''
      if (src.startsWith('/media/')) node.setAttribute('src', mediaUrl(src))
      node.setAttribute('loading', 'lazy')
    }
  })
  return purify.sanitize(marked.parse(markdown || ''))
}
