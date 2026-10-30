import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { defaultShow } from '../data/station.js'
import { useStation } from '../context/StationContext.jsx'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

/** Barra fija abajo que aparece cuando el reproductor principal sale de pantalla hacia arriba. */
export default function MiniPlayer() {
  const { playing, loading, reconnecting, isLive, liveInfo, toggle, syncLive, isSyncing, driftSeconds } = useRadio()
  const station = useStation()
  const scheduled = useCurrentShow() ?? defaultShow
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()

  const isGenericAdmin = (val) => !val || /administrador|admin/i.test(String(val).trim())
  const showTitle = (isLive && liveInfo.program && !isGenericAdmin(liveInfo.program)) ? liveInfo.program : scheduled.show

  useEffect(() => {
    const target = document.querySelector('.player')
    // En páginas sin el reproductor grande (noticias), la barra está siempre a mano
    if (!target) {
      setVisible(true)
      return
    }
    const update = () => setVisible(target.getBoundingClientRect().bottom < 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  return (
    <div className={`mini ${visible ? 'is-visible' : ''}`} aria-hidden={!visible} inert={visible ? undefined : ''}>
      <button
        className="player__play mini__play"
        onClick={toggle}
        aria-label={reconnecting || loading ? 'Cancelar' : playing ? 'Pausar' : 'Reproducir'}
      >
        {loading || reconnecting ? <span className="spinner" /> : playing ? '⏸' : '▶'}
      </button>
      <img src={station.logoUrl} alt="" className="mini__cover" />
      <a href="#en-vivo" className="mini__info">
        <span className={'mini__live' + (isLive ? ' mini__live--active' : ' mini__live--off')}>
          <span className={'live__dot' + (isLive ? ' live__dot--active' : ' live__dot--off')} />
          {reconnecting ? 'Reconectando…' : isLive ? 'En vivo' : 'Fuera del aire'}
        </span>
        <strong>{showTitle}</strong>
      </a>
      <button
        type="button"
        className={`mini__sync-btn ${driftSeconds > 6 ? 'mini__sync-btn--warning' : ''}`}
        onClick={syncLive}
        disabled={isSyncing}
        title="Sincronizar con la señal en directo"
      >
        {isSyncing ? '...' : driftSeconds > 6 ? `⚠️ +${driftSeconds}s` : '🔴 Sincronizar'}
      </button>
      <VolumeControl compact />
    </div>
  )
}
