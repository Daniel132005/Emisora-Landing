import { useEffect, useState } from 'react'
import { API_URL, mediaUrl } from '../api/config.js'
import { adSlots as fallbackSlots } from '../data/ads.js'

function normalizeWhatsApp(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return '58' + digits.slice(1)
  if (digits.length === 10) return '58' + digits
  return digits
}

export default function AdSlot({ slot = 'banner', variant = 'banner', dynamicAds = null }) {
  const [internalAds, setInternalAds] = useState([])
  const [adIndex, setAdIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (dynamicAds !== null) {
      setInternalAds(dynamicAds)
      return
    }

    let cancelled = false
    async function fetchSlotAds() {
      try {
        const res = await fetch(`${API_URL}/api/public/ads?slot=${slot}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setInternalAds(data)
            return
          }
        }
      } catch {}

      const fallback = fallbackSlots[slot]?.ads || []
      if (!cancelled) setInternalAds(fallback)
    }

    fetchSlotAds()
  }, [slot, dynamicAds])

  const ads = internalAds

  // Rotar entre anuncios diferentes cada 8 segundos si hay más de 1
  useEffect(() => {
    if (paused || ads.length < 2) return
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % ads.length)
      setImageIndex(0)
    }, 8000)
    return () => clearInterval(timer)
  }, [paused, ads.length])

  const currentAd = ads[adIndex] || ads[0] || null
  const images = Array.isArray(currentAd?.images)
    ? currentAd.images.filter(Boolean)
    : currentAd?.image
    ? [currentAd.image]
    : []

  useEffect(() => {
    setImageIndex(0)
  }, [adIndex])

  // Rotar entre imágenes del anuncio actual cada 4s
  useEffect(() => {
    if (paused || images.length < 2) return
    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [paused, images.length])

  if (!currentAd) return null

  const cleanPhone = normalizeWhatsApp(currentAd.phone)
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola, vi su publicidad de "${currentAd.title || 'su negocio'}" en Zumaque 90.5 FM y quisiera más información.`)}`
    : null

  const currentImage = images[imageIndex] || images[0] || null

  const handleTrackClick = () => {
    if (currentAd.id && typeof currentAd.id === 'number') {
      try {
        fetch(`${API_URL}/api/public/ads/${currentAd.id}/click`, { method: 'POST' }).catch(() => {})
      } catch {}
    }
  }

  // Navegación manual con flechitas
  const handlePrev = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (images.length > 1) {
      setImageIndex((prev) => (prev - 1 + images.length) % images.length)
    } else if (ads.length > 1) {
      setAdIndex((prev) => (prev - 1 + ads.length) % ads.length)
      setImageIndex(0)
    }
  }

  const handleNext = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (images.length > 1) {
      setImageIndex((prev) => (prev + 1) % images.length)
    } else if (ads.length > 1) {
      setAdIndex((prev) => (prev + 1) % ads.length)
      setImageIndex(0)
    }
  }

  // Píldora de navegación interactiva con flechitas
  const renderNavPill = () => {
    if (images.length <= 1 && ads.length <= 1) return null

    const currentCount = images.length > 1 ? imageIndex + 1 : adIndex + 1
    const totalCount = images.length > 1 ? images.length : ads.length

    return (
      <div className="dynamic-ad__nav-pill">
        <button
          type="button"
          className="dynamic-ad__nav-btn"
          onClick={handlePrev}
          title="Anterior"
          aria-label="Anterior"
        >
          ‹
        </button>
        <span className="dynamic-ad__nav-count">
          {currentCount} de {totalCount}
        </span>
        <button
          type="button"
          className="dynamic-ad__nav-btn"
          onClick={handleNext}
          title="Siguiente"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>
    )
  }

  // 1. CASO BANNER HORIZONTAL CON IMAGEN (Ocupa toda la tira visualmente)
  if (variant === 'banner' && currentImage) {
    return (
      <div
        className="dynamic-ad dynamic-ad--banner dynamic-ad--banner-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="dynamic-ad__banner-frame">
          <img
            src={mediaUrl(currentImage)}
            alt={currentAd.title || 'Publicidad'}
            className="dynamic-ad__banner-img"
          />

          <div className="dynamic-ad__banner-top">
            <span className="dynamic-ad__badge">📢 PUBLICIDAD</span>
            {renderNavPill()}
          </div>

          {images.length > 1 && (
            <div className="dynamic-ad__dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`dynamic-ad__dot ${i === imageIndex ? 'dynamic-ad__dot--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageIndex(i)
                  }}
                />
              ))}
            </div>
          )}

          <div className="dynamic-ad__banner-bottom">
            {(currentAd.title || currentAd.description) && (
              <div className="dynamic-ad__banner-info">
                {currentAd.title && <h4 className="dynamic-ad__banner-title">{currentAd.title}</h4>}
                {currentAd.description && <p className="dynamic-ad__banner-desc">{currentAd.description}</p>}
              </div>
            )}

            <div className="dynamic-ad__actions">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dynamic-ad__btn dynamic-ad__btn--wa"
                  onClick={handleTrackClick}
                  title="Escribir por WhatsApp directamente al anunciante"
                >
                  <span className="dynamic-ad__btn-icon">💬</span>
                  <span>WhatsApp{currentAd.phone ? ` (${currentAd.phone})` : ''}</span>
                </a>
              )}

              {currentAd.link_url && (
                <a
                  href={currentAd.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dynamic-ad__btn dynamic-ad__btn--link"
                  onClick={handleTrackClick}
                >
                  🌐 Web →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. CASO BARRA LATERAL (FLYER VERTICAL) CON IMAGEN (Edge-to-Edge, la imagen abarca al máximo)
  if (variant === 'sidebar' && currentImage) {
    return (
      <div
        className="dynamic-ad dynamic-ad--sidebar dynamic-ad--sidebar-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="dynamic-ad__flyer-frame">
          <img
            src={mediaUrl(currentImage)}
            alt={currentAd.title || 'Publicidad'}
            className="dynamic-ad__flyer-img"
            loading="lazy"
          />

          <div className="dynamic-ad__flyer-top">
            <span className="dynamic-ad__badge">📢 PUBLICIDAD</span>
            {renderNavPill()}
          </div>

          {images.length > 1 && (
            <div className="dynamic-ad__dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`dynamic-ad__dot ${i === imageIndex ? 'dynamic-ad__dot--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageIndex(i)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="dynamic-ad__flyer-footer">
          <div className="dynamic-ad__info">
            <h4 className="dynamic-ad__title">{currentAd.title}</h4>
            {currentAd.description && (
              <p className="dynamic-ad__desc">{currentAd.description}</p>
            )}
          </div>

          <div className="dynamic-ad__actions">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dynamic-ad__btn dynamic-ad__btn--wa"
                onClick={handleTrackClick}
                title="Escribir por WhatsApp directamente al anunciante"
              >
                <span className="dynamic-ad__btn-icon">💬</span>
                <span>WhatsApp{currentAd.phone ? ` (${currentAd.phone})` : ''}</span>
              </a>
            )}

            {currentAd.link_url && (
              <a
                href={currentAd.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="dynamic-ad__btn dynamic-ad__btn--link"
                onClick={handleTrackClick}
              >
                🌐 Visitar web →
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. CASO GENERAL O TEXT-ONLY (Sin imagen)
  return (
    <div
      className={`dynamic-ad dynamic-ad--${variant}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="dynamic-ad__header">
        <span className="dynamic-ad__badge">📢 PUBLICIDAD</span>
        {renderNavPill()}
      </div>

      <div className="dynamic-ad__content">
        <h4 className="dynamic-ad__title">{currentAd.title}</h4>
        {currentAd.description && (
          <p className="dynamic-ad__desc">{currentAd.description}</p>
        )}

        <div className="dynamic-ad__actions">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dynamic-ad__btn dynamic-ad__btn--wa"
              onClick={handleTrackClick}
              title="Escribir por WhatsApp directamente al anunciante"
            >
              <span className="dynamic-ad__btn-icon">💬</span>
              <span>WhatsApp{currentAd.phone ? ` (${currentAd.phone})` : ''}</span>
            </a>
          )}

          {currentAd.link_url && (
            <a
              href={currentAd.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="dynamic-ad__btn dynamic-ad__btn--link"
              onClick={handleTrackClick}
            >
              🌐 Visitar web →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
