import { useEffect, useState, useRef } from 'react'
import { podcasts as defaultPodcasts } from '../data/station.js'
import { useRadio } from '../context/RadioContext.jsx'
import { useStation } from '../context/StationContext.jsx'

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const remM = m % 60
    return `${h}h ${remM}m`
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Podcasts() {
  const { apiUrl, stopPlayback } = useRadio()
  const station = useStation()
  const [podcastList, setPodcastList] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [activeFilter, setActiveFilter] = useState('all') // 'all' or podcast_id
  const [currentEpisode, setCurrentEpisode] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [rssCopied, setRssCopied] = useState(false)
  const podcastAudioRef = useRef(null)

  // Cargar podcasts y episodios oficiales
  useEffect(() => {
    async function loadPodcastsAndEpisodes() {
      try {
        const [podRes, epRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/public/podcasts`),
          fetch(`${apiUrl}/api/public/podcasts/episodes/latest?limit=24`),
        ])

        if (podRes.status === 'fulfilled' && podRes.value.ok) {
          const pods = await podRes.value.json()
          setPodcastList(pods)
        }

        if (epRes.status === 'fulfilled' && epRes.value.ok) {
          const eps = await epRes.value.json()
          if (eps && eps.length > 0) {
            setEpisodes(eps)
            return
          }
        }

        // Si no hay episodios oficiales, intentar cargar grabaciones públicas previas
        const recRes = await fetch(`${apiUrl}/api/public/recordings`)
        if (recRes.ok) {
          const recs = await recRes.json()
          if (recs && recs.length > 0) {
            // Mapear grabaciones al formato de episodio
            setEpisodes(
              recs.filter(r => r.url).map(r => ({
                id: `rec_${r.id}`,
                title: r.title || r.program || 'Emisión grabada',
                artwork_url: r.artwork_url || r.artworkUrl || null,
                podcast_title: 'Radio a la Carta',
                author: r.host,
                duration_sec: r.durationSec,
                audio_url: r.url,
                published_at: r.startedAt,
                plays: 0,
                is_recording: true,
              }))
            )
          }
        }
      } catch (err) {
        console.warn('[Podcasts] Fallo al cargar podcasts del servidor:', err)
      }
    }
    loadPodcastsAndEpisodes()
  }, [apiUrl])

  const handlePlayEpisode = async (ep) => {
    stopPlayback() // Pausar radio en vivo

    if (currentEpisode?.id === ep.id) {
      if (isPlaying) {
        podcastAudioRef.current?.pause()
        setIsPlaying(false)
      } else {
        podcastAudioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentEpisode(ep)
      setIsPlaying(true)
      const srcUrl = ep.audio_url?.startsWith('http') ? ep.audio_url : `${apiUrl}${ep.audio_url}`
      if (podcastAudioRef.current) {
        podcastAudioRef.current.src = srcUrl
        podcastAudioRef.current.play().catch(() => setIsPlaying(false))
      }

      // Registrar reproducción en el servidor si es episodio oficial
      if (!ep.is_recording && typeof ep.id === 'number') {
        try {
          await fetch(`${apiUrl}/api/public/podcasts/episodes/${ep.id}/play`, { method: 'POST' })
          setEpisodes((prev) =>
            prev.map((e) => (e.id === ep.id ? { ...e, plays: (e.plays || 0) + 1 } : e))
          )
        } catch {}
      }
    }
  }

  const copyRssUrl = async () => {
    const rssUrl = `${apiUrl}/feed/podcast.xml`
    try {
      await navigator.clipboard.writeText(rssUrl)
      setRssCopied(true)
      setTimeout(() => setRssCopied(false), 2500)
    } catch {
      window.open(rssUrl, '_blank')
    }
  }

  // Filtrado de episodios
  const filteredEpisodes = episodes.filter((ep) => {
    if (activeFilter === 'all') return true
    return ep.podcast_id === activeFilter || ep.podcast_title === activeFilter
  })

  return (
    <section id="podcasts" className="podcasts">
      <div className="section-header section-header--with-action">
        <div>
          <h2 className="section-title">Radio a la Carta y Podcasts</h2>
          <p className="section-sub">
            Escucha tus programas favoritos en diferido, entrevistas exclusivas y ediciones especiales cuando quieras.
          </p>
        </div>

        {/* Botón de suscripción RSS 2.0 */}
        <div className="podcasts__rss-wrap">
          <button
            onClick={copyRssUrl}
            className="btn-rss-feed"
            title="Copiar enlace de suscripción RSS para Apple Podcasts, Spotify, Pocket Casts, etc."
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z"/>
            </svg>
            {rssCopied ? '¡Enlace RSS Copiado!' : 'Feed RSS Podcast'}
          </button>
        </div>
      </div>

      {/* Filtros por programa / serie de podcast */}
      {podcastList.length > 0 && (
        <div className="podcasts__filters" role="tablist" aria-label="Filtros de podcast">
          <button
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`filter-pill ${activeFilter === 'all' ? 'filter-pill--active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos ({episodes.length})
          </button>
          {podcastList.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={activeFilter === p.id}
              className={`filter-pill ${activeFilter === p.id ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveFilter(p.id)}
            >
              {p.title} ({p.episodes_count || 0})
            </button>
          ))}
        </div>
      )}

      {/* Reproductor de audio flotante para el episodio activo */}
      {currentEpisode && (
        <div className="podcast-bar">
          <div className="podcast-bar__info">
            <span className="podcast-bar__tag">
              {currentEpisode.is_recording ? 'Emisión grabada' : 'Episodio en reproducción'}:
            </span>
            <strong className="podcast-bar__title">{currentEpisode.title}</strong>
            <span className="podcast-bar__meta">
              {currentEpisode.podcast_title || 'Zumaque 90.5 FM'} • {formatDuration(currentEpisode.duration_sec)}
            </span>
          </div>
          <audio
            ref={podcastAudioRef}
            controls
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            src={currentEpisode.audio_url?.startsWith('http') ? currentEpisode.audio_url : `${apiUrl}${currentEpisode.audio_url}`}
            className="podcast-bar__audio"
          />
          <button
            className="podcast-bar__close"
            onClick={() => {
              podcastAudioRef.current?.pause()
              setCurrentEpisode(null)
              setIsPlaying(false)
            }}
            title="Cerrar reproductor"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid de Episodios */}
      <div className="podcasts__grid">
        {filteredEpisodes.length > 0 ? (
          filteredEpisodes.map((ep) => {
            const active = currentEpisode?.id === ep.id && isPlaying
            const defaultCover = station?.logoUrl || '/assets/logo.png'
            const rawCover = ep.artwork_url || ep.podcast_artwork
            const cover = rawCover ? (rawCover.startsWith('http') ? rawCover : `${apiUrl}${rawCover}`) : defaultCover
            return (
              <article key={ep.id} className={'podcast-card' + (active ? ' is-active' : '')}>
                <div className="podcast-card__media">
                  <img
                    src={cover}
                    alt={ep.title}
                    className="podcast-card__cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = defaultCover }}
                  />
                  <button
                    className="podcast-card__play-btn"
                    onClick={() => handlePlayEpisode(ep)}
                    aria-label={active ? 'Pausar episodio' : 'Reproducir episodio'}
                  >
                    {active ? '⏸' : '▶'}
                  </button>
                  <span className="podcast-card__duration">{formatDuration(ep.duration_sec)}</span>
                </div>

                <div className="podcast-card__content">
                  {ep.podcast_title && (
                    <span className="podcast-card__series">{ep.podcast_title}</span>
                  )}
                  <h3 className="podcast-card__title">{ep.title}</h3>
                  {ep.description && (
                    <p className="podcast-card__desc">{ep.description}</p>
                  )}
                  <div className="podcast-card__footer">
                    <span>📅 {formatDate(ep.published_at)}</span>
                    {typeof ep.plays === 'number' && (
                      <span className="podcast-card__plays" title="Total de reproducciones">
                        ▶ {ep.plays} {ep.plays === 1 ? 'reproducción' : 'reproducciones'}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          defaultPodcasts.map((p) => (
            <article key={p.title} className="podcast-card">
              <div className="podcast-card__media">
                <img src={p.image} alt={p.title} className="podcast-card__cover" loading="lazy" />
                <button className="podcast-card__play-btn" aria-label="Reproducir">▶</button>
                <span className="podcast-card__duration">{p.duration}</span>
              </div>
              <div className="podcast-card__content">
                <span className="podcast-card__series">Podcast Oficial</span>
                <h3 className="podcast-card__title">{p.title}</h3>
                <p className="podcast-card__desc">{p.desc}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
