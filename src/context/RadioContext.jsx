import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { station } from '../data/station.js'

const RadioContext = createContext(null)
const VOLUME_KEY = 'zumaque:volume'

function savedVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

/**
 * Un único <audio> para toda la página: el reproductor principal y la barra
 * flotante leen y controlan el mismo estado.
 */
export function RadioProvider({ children }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [volume, setVolumeState] = useState(savedVolume)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
    try { localStorage.setItem(VOLUME_KEY, String(volume)) } catch { /* sin storage */ }
  }, [volume, muted])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    setMuted(v === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (muted || volume === 0) {
      if (volume === 0) setVolumeState(0.5)
      setMuted(false)
    } else {
      setMuted(true)
    }
  }, [muted, volume])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    setError('')
    if (playing) {
      audio.pause()
      // Soltar el buffer para que al reanudar se escuche el directo, no lo atrasado
      audio.src = ''
      setPlaying(false)
      return
    }
    try {
      setLoading(true)
      audio.src = station.streamUrl
      await audio.play()
      setPlaying(true)
    } catch {
      setError('No se pudo conectar con la señal. Intenta de nuevo en unos segundos.')
    } finally {
      setLoading(false)
    }
  }, [playing])

  const value = { playing, loading, error, volume, muted, toggle, setVolume, toggleMute }

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" onPause={() => setPlaying(false)} />
    </RadioContext.Provider>
  )
}

export function useRadio() {
  return useContext(RadioContext)
}
