import { useEffect, useState, useRef } from 'react'
import { podcasts as defaultPodcasts } from '../data/station.js'
import { useRadio } from '../context/RadioContext.jsx'

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
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

export default function Podcasts() {
  const { apiUrl, stopPlayback } = useRadio()
  const [publishedRecordings, setPublishedRecordings] = useState([])
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const podcastAudioRef = useRef(null)

  useEffect(() => {
    async function loadRecordings() {
      try {
        const res = await fetch(`${apiUrl}/api/recordings`)
        if (res.ok) {
          const list = await res.json()
          const published = list.filter((r) => r.published && r.url)
          setPublishedRecordings(published)
        }
      } catch {
        // En caso de que no haya servidor, se mantienen los podcasts default
      }
    }
    loadRecordings()
  }, [apiUrl])

  const handlePlayRecording = (rec) => {
    // Si la radio en vivo está sonando, pausarla para escuchar la grabación
    stopPlayback()

    if (currentTrack?.id === rec.id) {
      if (isPlaying) {
        podcastAudioRef.current?.pause()
        setIsPlaying(false)
      } else {
        podcastAudioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentTrack(rec)
      setIsPlaying(true)
      if (podcastAudioRef.current) {
        podcastAudioRef.current.src = `${apiUrl}${rec.url}`
        podcastAudioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }

  return (
    <section id="podcasts" className="podcasts">
      <div className="section-header">
        <h2 className="section-title">
          {publishedRecordings.length > 0 ? 'Emisiones Grabadas y Podcasts' : 'Podcasts'}
        </h2>
        <p className="section-sub">
          {publishedRecordings.length > 0
            ? 'Escucha los programas transmitidos recientemente en Zumaque 90.5 FM'
            : 'Contenido exclusivo y las mejores historias de nuestra región'}
        </p>
      </div>

      {/* Reproductor de audio flotante para la grabación activa */}
      {currentTrack && (
        <div className="podcast-bar">
          <div className="podcast-bar__info">
            <span className="podcast-bar__tag">Reproduciendo emisión grabada:</span>
            <strong>{currentTrack.program}</strong>
            <span>Con {currentTrack.host} · {formatDate(currentTrack.startedAt)}</span>
          </div>
          <audio
            ref={podcastAudioRef}
            controls
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            src={`${apiUrl}${currentTrack.url}`}
            className="podcast-bar__audio"
          />
        </div>
      )}

      <div className="podcasts__grid">
        {publishedRecordings.length > 0 ? (
          publishedRecordings.map((rec) => {
            const active = currentTrack?.id === rec.id && isPlaying
            return (
              <article key={rec.id} className={'podcast' + (active ? ' is-active' : '')}>
                <div className="podcast__banner">
                  <span className="podcast__badge">Programa Emitido</span>
                  <button
                    className="podcast__play-btn"
                    onClick={() => handlePlayRecording(rec)}
                    aria-label={active ? 'Pausar programa' : 'Reproducir programa'}
                  >
                    {active ? '⏸' : '▶'}
                  </button>
                </div>
                <h3>{rec.program}</h3>
                <p>Conducción: <strong>{rec.host}</strong></p>
                <div className="podcast__footer-meta">
                  <span>📅 {formatDate(rec.startedAt)}</span>
                  <span>⏱ {formatDuration(rec.durationSec)}</span>
                </div>
              </article>
            )
          })
        ) : (
          defaultPodcasts.map((p) => (
            <article key={p.title} className="podcast">
              <div className="podcast__cover">
                <img src={p.image} alt="" loading="lazy" />
                <span className="podcast__play" aria-hidden="true">▶</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <span className="podcast__meta">{p.duration}</span>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
