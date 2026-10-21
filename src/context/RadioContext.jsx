import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_URL, ICECAST_URL, WS_URL } from '../api/config.js'
import { useStation } from './StationContext.jsx'

const RadioContext = createContext(null)
const VOLUME_KEY = 'zumaque:volume'
const DEVICE_TOKEN_KEY = 'zumaque:device_token'
const POLL_VOTES_KEY = 'zumaque:poll_votes'
const SONG_VOTES_KEY = 'zumaque:song_votes'
// Señal Matriz: el servidor backend sirve el audio en vivo y música en off continuo 24/7
const MAIN_STREAM = `${API_URL}/stream`

const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 15000
const RETRY_GIVE_UP_MS = 120000

function savedVolume() {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

function getOrCreateDeviceToken() {
  try {
    let token = localStorage.getItem(DEVICE_TOKEN_KEY)
    if (!token) {
      token = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
      localStorage.setItem(DEVICE_TOKEN_KEY, token)
    }
    return token
  } catch {
    return 'anon_' + Date.now()
  }
}

function loadStoredVotes(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function RadioProvider({ children }) {
  const station = useStation()

  // Estado del reproductor
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState('')
  const [volume, setVolumeState] = useState(savedVolume)
  const [muted, setMuted] = useState(false)
  const [streamSource, setStreamSource] = useState(null)

  // Estado de emisión en vivo y oyentes
  const [isLive, setIsLive] = useState(false)
  const [liveInfo, setLiveInfo] = useState({ program: '', host: '', startedAt: null })
  const [listeners, setListeners] = useState(0)

  // Canales temáticos alternativos
  const [channels, setChannels] = useState([])
  const [currentChannel, setCurrentChannel] = useState(null) // null = Señal Matriz

  // Canción que suena (Now Playing) y votaciones
  const [nowPlaying, setNowPlaying] = useState({ track: null, history: [] })
  const [songVotes, setSongVotes] = useState(() => loadStoredVotes(SONG_VOTES_KEY))

  // Encuesta en vivo y votos
  const [activePoll, setActivePoll] = useState(null)
  const [pollVotes, setPollVotes] = useState(() => loadStoredVotes(POLL_VOTES_KEY))

  // Radio Visual
  const [visualRadio, setVisualRadio] = useState({ enabled: false, platform: 'youtube', stream_url: '' })

  const audioRef = useRef(null)
  const deviceToken = useRef(getOrCreateDeviceToken())
  const wantPlay = useRef(false)
  const switching = useRef(false)
  const retry = useRef({ timer: null, attempt: 0, since: 0 })
  const unmounted = useRef(false)
  const wsRef = useRef(null)

  // Sincronizar volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const setVolume = useCallback((v) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeState(clamped)
    if (clamped > 0) setMuted(false)
    try { localStorage.setItem(VOLUME_KEY, String(clamped)) } catch {}
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const clearTimers = useCallback(() => {
    if (retry.current.timer) {
      clearTimeout(retry.current.timer)
      retry.current.timer = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    clearTimers()
    wantPlay.current = false
    retry.current = { timer: null, attempt: 0, since: 0 }
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch {}
    }
    setPlaying(false)
    setLoading(false)
    setReconnecting(false)
    setStreamSource(null)
  }, [clearTimers])

  /** Conectar señal de audio (Matriz o Canal Alternativo) */
  const connectAudio = useCallback(async (targetChannel = currentChannel) => {
    const audio = audioRef.current
    if (!audio) return false
    switching.current = true
    try {
      let targetSrc = ''
      let sourceName = ''

      const isAlt = targetChannel && targetChannel.slug !== 'matriz' && targetChannel.id !== 1 && targetChannel.id !== 'main'
      if (isAlt && targetChannel.slug) {
        targetSrc = `${API_URL}/api/public/channels/${targetChannel.slug}/stream`
        sourceName = 'channel'
      } else {
        targetSrc = MAIN_STREAM
        sourceName = isLive ? 'live' : 'ambient'
      }

      if (!wantPlay.current) return false

      if (audio.src !== targetSrc) {
        audio.src = targetSrc
      }

      try {
        await audio.play()
        setStreamSource(sourceName)
        setError('')
        return true
      } catch (err) {
        if (!wantPlay.current) return false
        console.warn('[Radio] Error al reproducir audio:', err)
        return false
      }
    } finally {
      switching.current = false
    }
  }, [currentChannel, isLive])

  /** Reintentos tras cortes */
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

    const delay = Math.min(RETRY_BASE_MS * Math.pow(1.6, retry.current.attempt), RETRY_MAX_MS)
    retry.current.attempt += 1

    retry.current.timer = setTimeout(async () => {
      retry.current.timer = null
      if (!wantPlay.current) return
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

  const onPlaying = useCallback(() => {
    retry.current = { timer: null, attempt: 0, since: 0 }
    setLoading(false)
    setReconnecting(false)
    setPlaying(true)
    setError('')
  }, [])

  const play = useCallback(async (chanToPlay = currentChannel) => {
    setError('')
    wantPlay.current = true
    retry.current = { timer: null, attempt: 0, since: 0 }
    setLoading(true)
    const ok = await connectAudio(chanToPlay)
    setLoading(false)
    if (ok) {
      setPlaying(true)
    } else if (wantPlay.current) {
      stopPlayback()
      setError('No se pudo conectar con la señal de audio. Intenta nuevamente.')
    }
  }, [connectAudio, stopPlayback, currentChannel])

  /** Cambio de canal alternativo */
  const switchChannel = useCallback(async (chan) => {
    setError('')
    const isSame = (chan === null && currentChannel === null) || (chan?.id === currentChannel?.id)
    if (isSame) return

    setCurrentChannel(chan)

    // Cargar inmediatamente los metadatos de la canción de este canal
    try {
      const npEndpoint = chan && chan.slug !== 'matriz'
        ? `${API_URL}/api/public/channels/${chan.slug}/now-playing`
        : `${API_URL}/api/public/now-playing`
      fetch(npEndpoint)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return
          const track = data.track || (data.id || data.title ? data : null)
          setNowPlaying({ track, history: data.history || [] })
        })
        .catch(() => {})
    } catch {}

    if (wantPlay.current) {
      setLoading(true)
      const ok = await connectAudio(chan)
      setLoading(false)
      if (ok) setPlaying(true)
    }
  }, [currentChannel, connectAudio])

  const onAudioProblem = useCallback(() => {
    if (wantPlay.current && !loading && !switching.current) scheduleReconnect()
  }, [loading, scheduleReconnect])

  const toggle = useCallback(async () => {
    if (playing) {
      stopPlayback()
    } else {
      await play()
    }
  }, [playing, stopPlayback, play])

  const currentChannelRef = useRef(currentChannel)
  useEffect(() => {
    currentChannelRef.current = currentChannel
  }, [currentChannel])

  // Cargar canales, Now Playing y Encuesta iniciales
  useEffect(() => {
    unmounted.current = false

    const fetchInitialData = async () => {
      try {
        const [chRes, npRes, pollRes, vrRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/public/channels`),
          fetch(`${API_URL}/api/public/now-playing`),
          fetch(`${API_URL}/api/public/polls/active`),
          fetch(`${API_URL}/api/public/visual-radio`),
        ])

        if (chRes.status === 'fulfilled' && chRes.value.ok) {
          const chData = await chRes.value.json()
          setChannels(chData)
        }
        if (npRes.status === 'fulfilled' && npRes.value.ok) {
          const npData = await npRes.value.json()
          const track = npData?.track || (npData?.id || npData?.title ? npData : null)
          setNowPlaying({
            track,
            history: npData?.history || [],
          })
          // Sanear votos locales huérfanos si la pista en el servidor tiene 0 votos
          if (track && track.likes === 0 && track.fire === 0) {
            setSongVotes((prev) => {
              if (prev && prev[track.id]) {
                const next = { ...prev }
                delete next[track.id]
                try { localStorage.setItem(SONG_VOTES_KEY, JSON.stringify(next)) } catch {}
                return next
              }
              return prev
            })
          }
        }
        if (pollRes.status === 'fulfilled' && pollRes.value.ok) {
          const pData = await pollRes.value.json()
          setActivePoll(pData)
        }
        if (vrRes.status === 'fulfilled' && vrRes.value.ok) {
          const vrData = await vrRes.value.json()
          setVisualRadio({
            ...vrData,
            active: Boolean(vrData.active ?? vrData.enabled),
            enabled: Boolean(vrData.active ?? vrData.enabled),
            stream_url: vrData.embedUrl || vrData.stream_url || vrData.streamId || '',
          })
        }
      } catch (e) {
        console.warn('[RadioContext] Error cargando datos iniciales:', e)
      }
    }

    fetchInitialData()

    // Polling periódico para Now Playing sincronizado (cada 8s según el canal activo)
    const npInterval = setInterval(async () => {
      try {
        const cur = currentChannelRef.current
        const endpoint = cur && cur.slug !== 'matriz'
          ? `${API_URL}/api/public/channels/${cur.slug}/now-playing`
          : `${API_URL}/api/public/now-playing`
        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          const track = data?.track || (data?.id || data?.title ? data : null)
          setNowPlaying({
            track,
            history: data?.history || [],
          })
        }
      } catch {}
    }, 8000)

    return () => {
      unmounted.current = true
      clearInterval(npInterval)
    }
  }, [])

  // Conexión WebSocket para eventos en tiempo real
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null

    const connectWS = () => {
      try {
        ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            if (msg.type === 'status') {
              const nowLive = Boolean(msg.live)
              setIsLive(nowLive)
              setLiveInfo({
                program: msg.program || '',
                host: msg.host || '',
                startedAt: msg.startedAt || null,
              })
              setListeners(msg.listeners || 0)
              if (nowLive) {
                // Si la cabina sale al aire y no hay canción fijada por el locutor, limpiar pista de fondo
                setNowPlaying((prev) => (prev.track?.fromStudio ? prev : { track: null, history: prev.history || [] }))
              }
            } else if (msg.type === 'now_playing') {
              const track = msg.data?.track || (msg.data?.id || msg.data?.title ? msg.data : null)
              setNowPlaying((prev) => ({
                ...prev,
                track,
                history: msg.data?.history || prev.history || [],
              }))
            } else if (msg.type === 'track_rated' || msg.type === 'rating_update') {
              const ratedId = msg.data?.id || msg.trackId
              const likes = msg.data?.likes ?? msg.likes
              const fire = msg.data?.fire ?? msg.fire
              setNowPlaying((prev) => {
                if (prev.track && (prev.track.id === ratedId || String(prev.track.id) === String(ratedId))) {
                  return {
                    ...prev,
                    track: { ...prev.track, likes, fire },
                  }
                }
                return prev
              })
            } else if (msg.type === 'poll_active') {
              setActivePoll(msg.data)
            } else if (msg.type === 'poll_voted') {
              setActivePoll((prev) => (prev && prev.id === msg.data.id ? msg.data : prev))
            } else if (msg.type === 'visual_radio') {
              const v = msg.visual || msg.data || {}
              setVisualRadio({
                ...v,
                active: Boolean(v.active ?? v.enabled),
                enabled: Boolean(v.active ?? v.enabled),
                stream_url: v.embedUrl || v.stream_url || v.streamId || '',
              })
            }
          } catch {}
        }

        ws.onclose = () => {
          if (!unmounted.current) {
            reconnectTimeout = setTimeout(connectWS, 4000)
          }
        }
      } catch {}
    }

    connectWS()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) ws.close()
    }
  }, [])

  // Votar por una canción con persistencia garantizada y sincronización en tiempo real
  const rateCurrentTrack = useCallback(async (type) => {
    if (!nowPlaying.track) return
    const trackId = nowPlaying.track.id
    if (songVotes[trackId]) return

    const normalizedRating = type === 'likes' ? 'like' : type

    // Registro optimista en UI
    setSongVotes((prev) => {
      const next = { ...prev, [trackId]: type }
      try { localStorage.setItem(SONG_VOTES_KEY, JSON.stringify(next)) } catch {}
      return next
    })

    setNowPlaying((prev) => {
      if (!prev.track || prev.track.id !== trackId) return prev
      return {
        ...prev,
        track: {
          ...prev.track,
          [type]: (prev.track[type] || 0) + 1,
        },
      }
    })

    try {
      const res = await fetch(`${API_URL}/api/public/now-playing/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          rating: normalizedRating,
          type: normalizedRating,
          deviceToken: deviceToken.current,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNowPlaying((prev) => {
          if (!prev.track || prev.track.id !== trackId) return prev
          return {
            ...prev,
            track: {
              ...prev.track,
              likes: data.likes,
              fire: data.fire,
            },
          }
        })
      } else if (res.status !== 409) {
        // En caso de error del servidor, revertir el voto optimista
        setSongVotes((prev) => {
          const next = { ...prev }
          delete next[trackId]
          try { localStorage.setItem(SONG_VOTES_KEY, JSON.stringify(next)) } catch {}
          return next
        })
        setNowPlaying((prev) => {
          if (!prev.track || prev.track.id !== trackId) return prev
          return {
            ...prev,
            track: {
              ...prev.track,
              [type]: Math.max(0, (prev.track[type] || 1) - 1),
            },
          }
        })
      }
    } catch (e) {
      console.warn('[Radio] Error al registrar voto musical:', e)
    }
  }, [nowPlaying.track, songVotes])

  // Votar en la encuesta
  const votePoll = useCallback(async (optionId) => {
    if (!activePoll || pollVotes[activePoll.id]) return

    setPollVotes((prev) => {
      const next = { ...prev, [activePoll.id]: optionId }
      try { localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(next)) } catch {}
      return next
    })

    try {
      const res = await fetch(`${API_URL}/api/public/polls/${activePoll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId,
          deviceToken: deviceToken.current,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setActivePoll(updated)
      }
    } catch (e) {
      console.warn('[Radio] Error al votar en encuesta:', e)
    }
  }, [activePoll, pollVotes])

  // Integración con Media Session API (Pantalla de bloqueo, barra de notificaciones y Bluetooth)
  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata === 'undefined') return

    try {
      let title = station.name || 'Zumaque 90.5 FM'
      let artist = station.slogan || 'La Fija en tu Radio'
      const album = `${station.name || 'Zumaque'} (90.5 FM)`

      if (currentChannel && currentChannel.slug !== 'matriz' && currentChannel.name) {
        title = nowPlaying.track?.title
          ? `${nowPlaying.track.title} — ${currentChannel.name}`
          : currentChannel.name
        artist = nowPlaying.track?.artist || 'Canal Temático'
      } else if (nowPlaying.track?.title) {
        title = nowPlaying.track.title
        artist = nowPlaying.track.artist || (isLive && liveInfo.host ? `Con ${liveInfo.host}` : station.name)
      } else if (isLive && liveInfo.program) {
        title = liveInfo.program
        artist = liveInfo.host ? `Con ${liveInfo.host}` : 'En Vivo'
      }

      const artwork = [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ]

      const trackCover = nowPlaying.track?.cover || nowPlaying.track?.image
      if (trackCover) {
        artwork.unshift({
          src: trackCover,
          sizes: '512x512',
          type: 'image/jpeg',
        })
      }

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title,
        artist,
        album,
        artwork,
      })

      navigator.mediaSession.playbackState = playing ? 'playing' : (loading ? 'none' : 'paused')
    } catch (e) {
      console.warn('[MediaSession] Error actualizando metadatos:', e)
    }
  }, [playing, loading, nowPlaying, isLive, liveInfo, currentChannel, station.name, station.slogan])

  // Acciones físicas y remotas (Play, Pausa, Stop desde auriculares o pantalla de bloqueo)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        play()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        stopPlayback()
      })
      navigator.mediaSession.setActionHandler('stop', () => {
        stopPlayback()
      })
    } catch (e) {
      console.warn('[MediaSession] Error configurando handlers:', e)
    }

    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null)
          navigator.mediaSession.setActionHandler('pause', null)
          navigator.mediaSession.setActionHandler('stop', null)
        } catch {}
      }
    }
  }, [play, stopPlayback])


  const value = {
    apiUrl: API_URL,
    playing,
    loading,
    reconnecting,
    error,
    volume,
    muted,
    streamSource,
    isLive,
    liveInfo,
    listeners,
    channels,
    currentChannel,
    switchChannel,
    nowPlaying,
    songVotes,
    rateCurrentTrack,
    activePoll,
    pollVotes,
    votePoll,
    visualRadio,
    deviceToken: deviceToken.current,
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
      />
    </RadioContext.Provider>
  )
}

export function useRadio() {
  return useContext(RadioContext)
}
