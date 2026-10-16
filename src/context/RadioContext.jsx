import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_URL, ICECAST_URL, WS_URL } from '../api/config.js'
import { useStation } from './StationContext.jsx'

const RadioContext = createContext(null)
const VOLUME_KEY = 'zumaque:volume'
const FALLBACK_STREAM = `${API_URL}/stream`

// Reintentos de audio tras un corte: 2 s, 4 s, 8 s… hasta 15 s entre intentos, durante 2 minutos como máximo
const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 15000
const RETRY_GIVE_UP_MS = 120000
// Si el audio no avanza durante este tiempo, se considera cortado
const STALL_TIMEOUT_MS = 4000

function savedVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

// Avisos del servidor que interesan a otras partes de la web (identidad, parrilla, noticias, galería)
function forwardEvent(data) {
  if (data.type === 'station') window.dispatchEvent(new CustomEvent('zumaque:station', { detail: data.station }))
  else if (data.type === 'schedule') window.dispatchEvent(new Event('zumaque:schedule'))
  else if (data.type === 'news') window.dispatchEvent(new Event('zumaque:news'))
  else if (data.type === 'gallery') window.dispatchEvent(new Event('zumaque:gallery'))
}

export function RadioProvider({ children }) {
  const station = useStation()
  const audioRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState('')
  const [volume, setVolumeState] = useState(savedVolume)
  const [muted, setMuted] = useState(false)
  const [streamSource, setStreamSource] = useState(null) // 'icecast' | 'direct'

  // Estado de la emisión (WebSocket, con consulta HTTP de respaldo)
  const [isLive, setIsLive] = useState(false)
  const [liveInfo, setLiveInfo] = useState({ program: null, host: null })
  const [listeners, setListeners] = useState(0)

  // Lo que el oyente quiere: si pulsó play, se reintenta hasta que vuelva la señal o pulse stop
  const wantPlay = useRef(false)
  const retry = useRef({ timer: null, attempt: 0, since: 0 })
  const isLiveRef = useRef(false)
  // true mientras el propio reproductor cambia de fuente (sus pausas internas no son un stop del oyente)
  const switching = useRef(false)

  // --- Volumen ---
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

  // --- Reproducción ---

  const clearTimers = () => {
    clearTimeout(retry.current.timer)
    retry.current.timer = null
  }

  const resetAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }

  /** Para del todo (el oyente pulsó stop o terminó la emisión). */
  const stopPlayback = useCallback(() => {
    wantPlay.current = false
    clearTimers()
    resetAudio()
    setPlaying(false)
    setLoading(false)
    setReconnecting(false)
    setStreamSource(null)
  }, [])

  /** Conecta con el audio: primero Icecast (MP3) y, si falla, el stream directo del servidor. */
  const connectAudio = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false
    switching.current = true
    try {
      for (const [source, url] of [['icecast', ICECAST_URL], ['direct', FALLBACK_STREAM]]) {
        if (!wantPlay.current) return false
        try {
          audio.src = `${url}?t=${Date.now()}`
          await audio.play()
          setStreamSource(source)
          return true
        } catch (err) {
          console.warn(`[Radio] No se pudo conectar con ${source}`, err)
        }
      }
      return false
    } finally {
      switching.current = false
    }
  }, [])

  /** Tras un corte: reintenta con espera creciente mientras la emisión siga y el oyente no haya parado. */
  const scheduleReconnect = useCallback(() => {
    if (!wantPlay.current || retry.current.timer) return
    if (!retry.current.since) retry.current.since = Date.now()
    if (Date.now() - retry.current.since > RETRY_GIVE_UP_MS) {
      stopPlayback()
      setError('Se perdió la señal. Revisa tu conexión y pulsa play para volver a intentarlo.')
      return
    }
    setReconnecting(true)
    setPlaying(false)
    const delay = Math.min(RETRY_BASE_MS * 2 ** retry.current.attempt, RETRY_MAX_MS)
    retry.current.attempt++
    retry.current.timer = setTimeout(async () => {
      retry.current.timer = null
      // Sin emisión no se insiste en el audio: se espera a que el estado diga que vuelve a estar al aire
      if (!isLiveRef.current) return scheduleReconnect()
      if (await connectAudio()) {
        retry.current = { timer: null, attempt: 0, since: 0 }
        setReconnecting(false)
        setPlaying(true)
        setError('')
      } else {
        scheduleReconnect()
      }
    }, delay)
  }, [connectAudio, stopPlayback])

  /** Señal de que la conexión volvió (red o WebSocket): reintentar ya, sin esperar a la siguiente ronda. */
  const retryNow = useCallback(() => {
    if (!wantPlay.current || !retry.current.timer) return
    clearTimeout(retry.current.timer)
    retry.current.timer = null
    retry.current.attempt = 0
    scheduleReconnect()
  }, [scheduleReconnect])

  const toggle = useCallback(async () => {
    setError('')
    if (wantPlay.current) {
      stopPlayback()
      return
    }
    if (!isLiveRef.current) {
      setError('El locutor no está al aire en este momento. Sintoniza durante los horarios de programación.')
      return
    }
    wantPlay.current = true
    retry.current = { timer: null, attempt: 0, since: 0 }
    setLoading(true)
    const ok = await connectAudio()
    setLoading(false)
    if (ok) {
      setPlaying(true)
    } else if (wantPlay.current) {
      stopPlayback()
      setError('No se pudo conectar con la señal de audio. Intenta nuevamente.')
    }
  }, [connectAudio, stopPlayback])

  // Eventos del <audio>: un corte con el oyente escuchando activa la reconexión
  const onAudioProblem = useCallback(() => {
    if (wantPlay.current && !loading) scheduleReconnect()
  }, [loading, scheduleReconnect])

  // Vigilante: los navegadores tardan en avisar de un corte; si el audio no avanza, se da por cortado
  useEffect(() => {
    if (!playing) return
    let last = audioRef.current?.currentTime ?? 0
    let stuckSince = Date.now()
    const watch = setInterval(() => {
      const now = audioRef.current?.currentTime ?? 0
      if (now !== last) {
        last = now
        stuckSince = Date.now()
      } else if (Date.now() - stuckSince > STALL_TIMEOUT_MS) {
        clearInterval(watch)
        onAudioProblem()
      }
    }, 1000)
    return () => clearInterval(watch)
  }, [playing, onAudioProblem])

  // El navegador avisa de que vuelve a haber red
  useEffect(() => {
    window.addEventListener('online', retryNow)
    return () => window.removeEventListener('online', retryNow)
  }, [retryNow])

  const onPlaying = useCallback(() => {
    if (wantPlay.current) {
      setPlaying(true)
      setReconnecting(false)
    }
  }, [])

  // --- Estado de la emisión ---

  const applyStatus = useCallback((data) => {
    isLiveRef.current = Boolean(data.live)
    setIsLive(Boolean(data.live))
    setLiveInfo({ program: data.program, host: data.host })
    if (typeof data.listeners === 'number') setListeners(data.listeners)
    if (!data.live && wantPlay.current) {
      // Terminó la emisión: no tiene sentido reintentar
      stopPlayback()
      setError('La emisión en vivo ha finalizado.')
    } else if (data.live) {
      // Llegó estado del servidor: hay conexión, así que si se estaba reconectando se intenta ya
      retryNow()
    }
  }, [stopPlayback, retryNow])

  // WebSocket permanente (se conecta una sola vez; si se cae, consulta por HTTP y reintenta)
  useEffect(() => {
    let ws = null
    let reconnectTimer = null
    let pollTimer = null
    let closed = false

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`)
        if (res.ok) applyStatus(await res.json())
      } catch { /* sin conexión: se reintentará */ }
    }
    const startPolling = () => {
      if (!pollTimer) pollTimer = setInterval(poll, 8000)
    }
    const stopPolling = () => {
      clearInterval(pollTimer)
      pollTimer = null
    }

    const connect = () => {
      if (closed) return
      try {
        ws = new WebSocket(WS_URL)
      } catch {
        startPolling()
        reconnectTimer = setTimeout(connect, 3000)
        return
      }
      ws.onopen = stopPolling
      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return // el servidor también envía audio binario: se ignora
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'status') applyStatus(data)
          else forwardEvent(data)
        } catch {}
      }
      ws.onclose = () => {
        if (closed) return
        startPolling()
        reconnectTimer = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    poll()

    return () => {
      closed = true
      clearTimeout(reconnectTimer)
      stopPolling()
      ws?.close()
    }
  }, [applyStatus])

  // --- Controles del sistema (pantalla de bloqueo, auriculares, Android Auto…) ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const title = liveInfo.program || station.name
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: liveInfo.host ? `Con ${liveInfo.host}` : station.name,
      album: station.name,
      artwork: [{ src: new URL(station.logoUrl, window.location.href).href, sizes: '512x512' }],
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [liveInfo, station.name, station.logoUrl, playing])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const play = () => { if (!wantPlay.current) toggle() }
    const stop = () => { if (wantPlay.current) stopPlayback() }
    navigator.mediaSession.setActionHandler('play', play)
    navigator.mediaSession.setActionHandler('pause', stop)
    navigator.mediaSession.setActionHandler('stop', stop)
    return () => {
      for (const action of ['play', 'pause', 'stop']) navigator.mediaSession.setActionHandler(action, null)
    }
  }, [toggle, stopPlayback])

  // Al desmontar, sin temporizadores colgando
  useEffect(() => clearTimers, [])

  const value = {
    playing,
    loading,
    reconnecting,
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
        playsInline
        onPlaying={onPlaying}
        onError={onAudioProblem}
        onEnded={onAudioProblem}
        // Pausa desde fuera (p. ej. auriculares desconectados): se respeta como stop
        onPause={() => { if (wantPlay.current && !switching.current && !retry.current.timer && !reconnecting) stopPlayback() }}
      />
    </RadioContext.Provider>
  )
}

export function useRadio() {
  return useContext(RadioContext)
}
