import { useState } from 'react'
import logo from '../assets/logo.png'
import { station, defaultShow } from '../data/station.js'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

export default function LivePlayer() {
  const scheduled = useCurrentShow() ?? defaultShow
  const { playing, loading, error, isLive, liveInfo, listeners, streamSource, toggle } = useRadio()
  const [shared, setShared] = useState(false)

  const showTitle = (isLive && liveInfo.program) ? liveInfo.program : scheduled.show
  const showHosts = (isLive && liveInfo.host) ? 'Con ' + liveInfo.host : scheduled.hosts

  const share = async () => {
    const data = {
      title: station.name,
      text: 'Escucha ' + station.name + ' en vivo',
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      // El usuario canceló
    }
  }

  return (
    <section id="en-vivo" className="live">
      <div className="live__header-bar">
        <h2 className="section-title section-title--live">
          <span className={'live__dot' + (isLive ? ' live__dot--active' : ' live__dot--off')} />
          {isLive ? 'En vivo ahora' : 'Fuera del aire'}
        </h2>
      </div>

      <div className={'player' + (!isLive ? ' player--off-air' : '')}>
        <img src={logo} alt="" className="player__cover" />
        <div className="player__body">
          <div className="player__status-line">
            <span className={'badge-state' + (isLive ? ' badge-state--live' : ' badge-state--off')}>
              {isLive ? '🔴 TRANSMISIÓN EN DIRECTO' : '⏳ PROGRAMACIÓN HABITUAL'}
            </span>
          </div>

          <p className="player__now" aria-live="polite">
            <strong>{showTitle}</strong> <span>· {showHosts}</span>
          </p>

          {!isLive && (
            <p className="player__scheduled-notice">
              La señal en vivo se activa cuando el locutor inicia transmisión. ¡Conéctate en los horarios de programación!
            </p>
          )}

          <div className="player__controls">
            <button
              className={'player__play' + (!isLive ? ' player__play--off' : '')}
              onClick={toggle}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              disabled={loading}
              title={!isLive ? 'Emisora fuera del aire' : (playing ? 'Pausar emisión' : 'Escuchar en vivo')}
            >
              {loading ? <span className="spinner" /> : playing ? '⏸' : '▶'}
            </button>

            <div className={'player__wave' + (playing ? ' is-playing' : '')} aria-hidden="true">
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} style={{ animationDelay: ((i * 37) % 900) + 'ms' }} />
              ))}
            </div>

            <VolumeControl />

            <button className="player__share" onClick={share}>
              {shared ? '✓ ¡Enlace copiado!' : 'Compartir'}
            </button>
          </div>

          {error && <p className="player__error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  )
}
