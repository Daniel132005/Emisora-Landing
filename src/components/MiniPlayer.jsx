import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import { defaultShow } from '../data/station.js'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

/** Barra fija abajo que aparece cuando el reproductor principal sale de pantalla hacia arriba. */
export default function MiniPlayer() {
  const { playing, loading, toggle } = useRadio()
  const current = useCurrentShow() ?? defaultShow
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.querySelector('.player')
    if (!target) return
    // Visible cuando el reproductor principal ya quedó por encima de la pantalla
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
        {loading ? <span className="spinner" /> : playing ? '❚❚' : '▶'}
      </button>
      <img src={logo} alt="" className="mini__cover" />
      <a href="#en-vivo" className="mini__info">
        <span className="mini__live"><span className="live__dot" /> En vivo</span>
        <strong>{current.show}</strong>
      </a>
      <VolumeControl compact />
    </div>
  )
}
