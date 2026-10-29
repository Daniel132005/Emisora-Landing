import { useState, useEffect } from 'react'
import { useRadio } from '../context/RadioContext.jsx'

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatDuration(sec) {
  if (!sec) return '0:30'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function ClipsSection() {
  const { apiUrl } = useRadio()
  const [clips, setClips] = useState([])
  const [activeClip, setActiveClip] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    async function loadClips() {
      try {
        const res = await fetch(`${apiUrl}/api/public/clips?limit=12`)
        if (res.ok) {
          const list = await res.json()
          setClips(list)
        }
      } catch (err) {
        console.warn('[Clips] Error al cargar clips:', err)
      }
    }
    loadClips()
  }, [apiUrl])

  const openClip = async (clip) => {
    setActiveClip(clip)
    // Registrar visualización
    try {
      await fetch(`${apiUrl}/api/public/clips/${clip.id}/view`, { method: 'POST' })
      setClips((prev) =>
        prev.map((c) => (c.id === clip.id ? { ...c, views_count: (c.views_count || 0) + 1 } : c))
      )
    } catch {}
  }

  const handleShare = async (e, clip) => {
    e.stopPropagation()
    const shareData = {
      title: clip.title,
      text: `¡Mira este momento de Zumaque 90.5 FM! ${clip.title}`,
      url: window.location.href.split('#')[0] + '#clips',
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        setCopiedId(clip.id)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch {}
  }

  const getEmbedSrc = (src) => {
    if (!src) return ''
    if (src.includes('shorts/')) {
      const id = src.split('shorts/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }
    if (src.includes('v=')) {
      const id = src.split('v=')[1].split('&')[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }
    if (src.includes('youtu.be/')) {
      const id = src.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }
    return src
  }

  if (clips.length === 0) return null

  return (
    <section id="clips" className="clips-section container">
      <div className="section-header">
        <div>
          <span className="section-badge">✨ Momentos Virales</span>
          <h2 className="section-title">Videoteca de Clips</h2>
          <p className="section-sub">
            Los mejores momentos, entrevistas explosivas y risas en cabina listos para ver y compartir.
          </p>
        </div>
      </div>

      <div className="clips-grid">
        {clips.map((clip) => {
          const thumbUrl = clip.thumb?.startsWith('http') ? clip.thumb : `${apiUrl}${clip.thumb}`
          return (
            <article
              key={clip.id}
              className="clip-card"
              onClick={() => openClip(clip)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openClip(clip) }}
              aria-label={`Ver clip: ${clip.title}`}
            >
              <div className="clip-card__media">
                <img src={thumbUrl} alt="" className="clip-card__thumb" loading="lazy" />
                <div className="clip-card__overlay">
                  <div className="clip-card__play-icon">▶</div>
                </div>
                <span className="clip-card__duration">{formatDuration(clip.duration_sec)}</span>
                <span className="clip-card__badge">Reel</span>
              </div>

              <div className="clip-card__content">
                <h3 className="clip-card__title">{clip.title}</h3>
                {clip.description && <p className="clip-card__desc">{clip.description}</p>}

                <div className="clip-card__footer">
                  <span className="clip-card__views">👁️ {formatViews(clip.views_count)} vistas</span>
                  <button
                    className="clip-card__share"
                    onClick={(e) => handleShare(e, clip)}
                    title="Compartir clip"
                    aria-label="Compartir clip"
                  >
                    {copiedId === clip.id ? '✓ Copiado' : '🔗 Compartir'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Modal Lightbox de Reproducción */}
      {activeClip && (
        <div
          className="clip-modal-backdrop"
          onClick={() => setActiveClip(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeClip.title}
        >
          <div className="clip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clip-modal__header">
              <h3 className="clip-modal__title">{activeClip.title}</h3>
              <button
                className="clip-modal__close"
                onClick={() => setActiveClip(null)}
                aria-label="Cerrar reproductor"
              >
                ✕
              </button>
            </div>

            <div className="clip-modal__body">
              {activeClip.video_type === 'youtube_shorts' || activeClip.src?.includes('youtube') ? (
                <div className="clip-modal__video-wrap">
                  <iframe
                    src={getEmbedSrc(activeClip.src)}
                    title={activeClip.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="clip-modal__iframe"
                  />
                </div>
              ) : (
                <div className="clip-modal__video-wrap">
                  <video
                    controls
                    autoPlay
                    playsInline
                    src={activeClip.src?.startsWith('http') ? activeClip.src : `${apiUrl}${activeClip.src}`}
                    className="clip-modal__video"
                  />
                </div>
              )}
            </div>

            <div className="clip-modal__footer">
              <p className="clip-modal__desc">{activeClip.description}</p>
              <button
                className="btn-share-modal"
                onClick={(e) => handleShare(e, activeClip)}
              >
                {copiedId === activeClip.id ? '✓ Enlace Copiado' : '📲 Compartir en Redes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
