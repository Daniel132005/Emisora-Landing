import { useEffect, useState } from 'react'
import { defaultShow } from '../data/station.js'
import { useStation } from '../context/StationContext.jsx'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

/** Barra fija abajo que aparece cuando el reproductor principal sale de pantalla hacia arriba. */
export default function MiniPlayer() {
  const { playing, loading, isLive, liveInfo, toggle } = useRadio()
  const station = useStation()
  const scheduled = useCurrentShow() ?? defaultShow
  const [visible, setVisible] = useState(false)

  const showTitle = (isLive && liveInfo.program) ? liveInfo.program : scheduled.show

  useEffect(() => {
    const target = document.querySelector('.player')
    if (!target) return
    const update = () => setVisible(target.getBoundingClientRect().bottom < 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className={`mini ${visible ? 'is-visible' : ''}`} aria-hidden={!visible} inert={visible ? undefined : ''}>
      <button
        className="player__play mini__play"
        onClick={toggle}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
        disabled={loading}
      >
        {loading ? <span className="spinner" /> : playing ? '⏸' : '▶'}
      </button>
      <img src={station.logoUrl} alt="" className="mini__cover" />
      <a href="#en-vivo" className="mini__info">
        <span className={'mini__live' + (isLive ? ' mini__live--active' : ' mini__live--off')}>
          <span className={'live__dot' + (isLive ? ' live__dot--active' : ' live__dot--off')} />
          {isLive ? 'En vivo' : 'Fuera del aire'}
        </span>
        <strong>{showTitle}</strong>
      </a>
      <VolumeControl compact />
    </div>
  )
}
