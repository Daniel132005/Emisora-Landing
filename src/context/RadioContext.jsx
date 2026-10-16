import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_URL, ICECAST_URL, WS_URL } from '../api/config.js'

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

const FALLBACK_STREAM = `${API_URL}/stream`

export function RadioProvider({ children }) {
  const audioRef = useRef(null)
  const wsRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [volume, setVolumeState] = useState(savedVolume)
  const [muted, setMuted] = useState(false)
  const [streamSource, setStreamSource] = useState(null) // 'icecast' | 'direct'

  // Metadatos en vivo desde el WebSocket / API
  const [isLive, setIsLive] = useState(false)
  const [liveInfo, setLiveInfo] = useState({ program: null, host: null })
  const [listeners, setListeners] = useState(0)

  // Control de volumen
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

  // Función para consultar API de estado por HTTP (fallback)
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`)
      if (res.ok) {
        const data = await res.json()
        setIsLive(data.live)
        setLiveInfo({ program: data.program, host: data.host })
        if (typeof data.listeners === 'number') {
          setListeners(data.listeners)
        }
        if (!data.live && playing) {
          stopPlayback()
          setError('La emisión en vivo ha finalizado.')
        }
      }
    } catch {
      // Ignorar errores transitorios de polling
    }
  }, [playing])

  // Conectar WebSocket permanente para recibir estado en tiempo real
  useEffect(() => {
    let ws = null
    let reconnectTimer = null
    let pollInterval = null

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          // Si el WebSocket conecta con éxito, detenemos el sondeo HTTP frecuente
          if (pollInterval) clearInterval(pollInterval)
        }

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data)
              if (data.type === 'status') {
                setIsLive(data.live)
                setLiveInfo({ program: data.program, host: data.host })
                if (typeof data.listeners === 'number') {
                  setListeners(data.listeners)
                }
                if (!data.live && playing) {
                  const audio = audioRef.current
                  if (audio) {
                    audio.pause()
                    audio.removeAttribute('src')
                    audio.load()
                  }
                  setPlaying(false)
                  setLoading(false)
                  setError('La emisión en vivo ha finalizado.')
                }
              } else if (data.type === 'station') {
                // El panel guardó cambios de identidad: StationContext los aplica al momento
                window.dispatchEvent(new CustomEvent('zumaque:station', { detail: data.station }))
              }
            } catch {}
          }
        }

        ws.onclose = () => {
          // Al desconectarse WebSocket, activamos polling HTTP y reintento
          if (!pollInterval) {
            pollInterval = setInterval(pollStatus, 8000)
          }
          reconnectTimer = setTimeout(connect, 3000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch (err) {
        if (!pollInterval) {
          pollInterval = setInterval(pollStatus, 8000)
        }
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()
    pollStatus()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (pollInterval) clearInterval(pollInterval)
      if (ws) ws.close()
    }
  }, [playing, pollStatus])

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setPlaying(false)
    setLoading(false)
    setStreamSource(null)
  }, [])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    setError('')

    if (playing) {
      stopPlayback()
      return
    }

    if (!isLive) {
      setError('El locutor no está al aire en este momento. Sintoniza durante los horarios de programación.')
      return
    }

    setLoading(true)

    // Intento 1: Conectar al stream de Icecast
    try {
      audio.src = `${ICECAST_URL}?t=${Date.now()}`
      await audio.play()
      setPlaying(true)
      setStreamSource('icecast')
      setLoading(false)
      return
    } catch (icecastErr) {
      console.warn('Fallo al conectar con Icecast, intentando fallback directo...', icecastErr)
    }

    // Intento 2: Fallback directo a endpoint HTTP /stream del servidor
    try {
      audio.src = `${FALLBACK_STREAM}?t=${Date.now()}`
      await audio.play()
      setPlaying(true)
      setStreamSource('direct')
    } catch (fallbackErr) {
      console.error('Error al reproducir stream directo:', fallbackErr)
      setError('No se pudo conectar con la señal de audio. Intenta nuevamente.')
      setPlaying(false)
      setStreamSource(null)
    } finally {
      setLoading(false)
    }
  }, [playing, isLive, stopPlayback])

  const value = {
    playing,
    loading,
    error,
    volume,
    muted,
    isLive,
    liveInfo,
    listeners,
    streamSource,
    apiUrl: API_URL,
    icecastUrl: ICECAST_URL,
    toggle,
    stopPlayback,
    setVolume,
    toggleMute,
  }

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setLoading(false); }}
        onError={() => {
          if (playing) {
            setError('Señal interrumpida.')
            setPlaying(false)
            setLoading(false)
          }
        }}
        playsInline
      />
    </RadioContext.Provider>
  )
}

export function useRadio() {
  return useContext(RadioContext)
}
