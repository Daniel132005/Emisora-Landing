import { useState } from 'react'
import logo from '../assets/logo.png'
import { station, defaultShow } from '../data/station.js'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

export default function LivePlayer() {
  const current = useCurrentShow() ?? defaultShow
  const { playing, loading, error, toggle } = useRadio()
  const [shared, setShared] = useState(false)

  const share = async () => {
    const data = { title: station.name, text: `Escucha ${station.name} en vivo`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch { /* el usuario canceló */ }
  }

  return (
    <section id="en-vivo" className="live">
      <h2 className="section-title section-title--live">
        <span className="live__dot" /> En vivo
      </h2>
      <div className="player">
        <img src={logo} alt="" className="player__cover" />
        <div className="player__body">
          <p className="player__now" aria-live="polite">
            AHORA EN DIRECTO: “{current.show}” <span>· {current.hosts}</span>
          </p>
          <div className="player__controls">
            <button
              className="player__play"
              onClick={toggle}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : playing ? '❚❚' : '▶'}
            </button>
            <div className={`player__wave ${playing ? 'is-playing' : ''}`} aria-hidden="true">
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${(i * 37) % 900}ms` }} />
              ))}
            </div>
            <VolumeControl />
            <button className="player__share" onClick={share}>
              {shared ? '¡Enlace copiado!' : 'Compartir'}
            </button>
          </div>
          {error && <p className="player__error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  )
}
