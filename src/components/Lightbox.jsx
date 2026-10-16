import { useEffect } from 'react'
import { mediaUrl } from '../api/config.js'
import { useRadio } from '../context/RadioContext.jsx'

/**
 * Visor a pantalla completa de fotos y videos. Flechas (o teclado ← →) para pasar, Esc para cerrar.
 * Al abrir un video se detiene la radio para que no suenen los dos a la vez.
 */
export default function Lightbox({ items, index, onIndex, onClose }) {
  const item = items[index]
  const { playing, stopPlayback } = useRadio()
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onIndex(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    // Sin desplazamiento de la página de fondo mientras el visor está abierto
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [index, hasPrev, hasNext, onIndex, onClose])

  useEffect(() => {
    if (item.type !== 'image' && playing) stopPlayback()
    // Solo al cambiar de elemento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.title || 'Galería'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lightbox__close" onClick={onClose} aria-label="Cerrar">✕</button>
      {hasPrev && <button className="lightbox__nav lightbox__nav--prev" onClick={() => onIndex(index - 1)} aria-label="Anterior">‹</button>}
      {hasNext && <button className="lightbox__nav lightbox__nav--next" onClick={() => onIndex(index + 1)} aria-label="Siguiente">›</button>}

      <figure className="lightbox__figure">
        {item.type === 'image' && <img src={mediaUrl(item.src)} alt={item.title} />}
        {item.type === 'video' && (
          <video key={item.id} src={mediaUrl(item.src)} poster={mediaUrl(item.thumb)} controls autoPlay playsInline />
        )}
        {item.type === 'youtube' && (
          <div className="lightbox__yt">
            <iframe
              key={item.id}
              src={`https://www.youtube-nocookie.com/embed/${item.src}?autoplay=1&rel=0`}
              title={item.title || 'Video de YouTube'}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        )}
        {(item.title || item.description) && (
          <figcaption>
            {item.title && <strong>{item.title}</strong>}
            {item.description && <span>{item.description}</span>}
          </figcaption>
        )}
      </figure>
      <p className="lightbox__count">{index + 1} / {items.length}</p>
    </div>
  )
}
