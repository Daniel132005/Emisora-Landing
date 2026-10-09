import { useEffect, useState } from 'react'
import { adSlots } from '../data/ads.js'

/**
 * Espacio publicitario rotativo.
 * - Rota los anuncios del slot cada `interval` ms.
 * - Pausa la rotación al pasar el mouse / enfocar con teclado.
 * - Soporta anuncios con imagen o placeholders de texto.
 */
export default function AdSlot({ slot, variant = 'banner' }) {
  const config = adSlots[slot]
  const ads = config?.ads ?? []
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || ads.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % ads.length), config.interval ?? 6000)
    return () => clearInterval(id)
  }, [paused, ads.length, config?.interval])

  if (!ads.length) return null

  return (
    <div
      className={`ad ad--${variant}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="ad__label">Publicidad</span>
      <div className="ad__track">
        {ads.map((ad, i) => (
          <a
            key={ad.id}
            href={ad.href || '#'}
            className={`ad__item ${i === index ? 'is-active' : ''}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            target={ad.href?.startsWith('http') ? '_blank' : undefined}
            rel={ad.href?.startsWith('http') ? 'noopener sponsored' : undefined}
            style={ad.image ? undefined : { background: ad.bg, color: ad.fg }}
          >
            {ad.image ? (
              <>
                <img src={ad.image} alt={ad.alt || ad.subtitle || 'Anuncio'} loading="lazy" />
                {ad.title && (
                  <div className="ad__placeholder ad__overlay">
                    <strong>{ad.title}</strong>
                    {ad.subtitle && <span>{ad.subtitle}</span>}
                    {ad.phone && <em>{ad.phone}</em>}
                  </div>
                )}
              </>
            ) : (
              <div className="ad__placeholder">
                <strong>{ad.title}</strong>
                {ad.subtitle && <span>{ad.subtitle}</span>}
                {ad.phone && <em>{ad.phone}</em>}
              </div>
            )}
          </a>
        ))}
      </div>
      {ads.length > 1 && (
        <div className="ad__dots">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              className={i === index ? 'is-active' : ''}
              aria-label={`Ver anuncio ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
