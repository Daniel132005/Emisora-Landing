import { useState, useRef, useEffect } from 'react'
import { useRadio } from '../context/RadioContext.jsx'
import { mediaUrl } from '../api/config.js'

export default function BoothOnAirWidget() {
  const { boothOnAir, playing, duckRadio, isLive } = useRadio()
  const [dismissedId, setDismissedId] = useState(null)
  const [playingVoice, setPlayingVoice] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  const isVoice = Boolean(boothOnAir?.audio_url)
  const isWhatsApp = boothOnAir?.channel === 'whatsapp'
  const audioSrc = isVoice ? mediaUrl(boothOnAir.audio_url) : ''

  // Manejar el ciclo de vida del mensaje al aire y auto-reproducción con 1s de retraso
  useEffect(() => {
    if (!boothOnAir?.id) {
      if (playingVoice) {
        duckRadio(false)
        setPlayingVoice(false)
      }
      return
    }

    // Resetear estados locales
    setPlayingVoice(false)
    setAudioProgress(0)
    setAutoplayBlocked(false)

    // Si tiene nota de voz y viene marcado para auto-play en vivo
    if (boothOnAir.audio_url && boothOnAir.autoPlay) {
      setCountdown(1) // 1 segundo de retraso solicitado

      timerRef.current = setTimeout(() => {
        setCountdown(null)
        if (!audioRef.current) return

        // Si la radio está sonando, activar ducking para que el audio del oyente
        // destaque claramente y el locutor pueda hablar sobre la pista
        if (playing) {
          duckRadio(true)
        }

        audioRef.current.currentTime = 0
        audioRef.current
          .play()
          .then(() => {
            setPlayingVoice(true)
            setAutoplayBlocked(false)
          })
          .catch((err) => {
            console.warn('[Cabina] Autoplay restringido por el navegador:', err)
            duckRadio(false)
            setAutoplayBlocked(true)
          })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      duckRadio(false)
    }
  }, [boothOnAir?.id, boothOnAir?.triggerTime])

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      duckRadio(false)
    }
  }, [duckRadio])

  if (!isLive || !boothOnAir || !boothOnAir.id || dismissedId === boothOnAir.id) {
    return null
  }

  const toggleVoicePlayback = () => {
    if (!audioRef.current) return

    if (playingVoice) {
      audioRef.current.pause()
      setPlayingVoice(false)
      duckRadio(false)
    } else {
      if (playing) {
        duckRadio(true)
      }
      audioRef.current
        .play()
        .then(() => {
          setPlayingVoice(true)
          setAutoplayBlocked(false)
        })
        .catch(() => {})
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
    }
  }

  const handleAudioEnded = () => {
    setPlayingVoice(false)
    setAudioProgress(0)
    duckRadio(false) // Restaurar volumen original de la radio
  }

  const handleDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    duckRadio(false)
    setPlayingVoice(false)
    setDismissedId(boothOnAir.id)
  }

  return (
    <section className="booth-onair-widget" aria-label="Mensaje al aire en cabina">
      <div className="booth-onair-card">
        {/* Cabecera del Zócalo */}
        <div className="booth-onair-head">
          <div className="booth-onair-tag">
            <span className="booth-onair-pulse" />
            <span className="booth-onair-tag-text">
              {playingVoice
                ? '🔴 SONANDO EN VIVO • NOTA DE VOZ AL AIRE'
                : countdown !== null
                ? '⏳ ENTRANDO AL AIRE...'
                : isVoice
                ? 'EN CABINA • NOTA DE VOZ AL AIRE'
                : 'EN CABINA • MENSAJE AL AIRE'}
            </span>
          </div>

          <div className="booth-onair-meta-right">
            <span className={`booth-onair-badge ${isWhatsApp ? 'booth-onair-badge--wa' : isVoice ? 'booth-onair-badge--voice' : 'booth-onair-badge--web'}`}>
              {isWhatsApp ? '💬 WhatsApp' : isVoice ? '🎙️ Nota de Voz' : '✉️ Web'}
            </span>
            <button
              className="booth-onair-close"
              onClick={handleDismiss}
              title="Ocultar este mensaje"
              aria-label="Cerrar mensaje al aire"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Remitente */}
        <div className="booth-onair-sender">
          <span className="booth-onair-sender-icon">👤</span>
          <strong className="booth-onair-sender-name">{boothOnAir.sender_name || 'Oyente en Sintonía'}</strong>
        </div>

        {/* Contenido: Texto o Nota de Voz */}
        {isVoice ? (
          <div className="booth-onair-voice-player">
            <audio
              ref={audioRef}
              src={audioSrc}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              preload="auto"
            />
            <button
              className={`booth-onair-play-btn ${playingVoice ? 'booth-onair-play-btn--active' : ''}`}
              onClick={toggleVoicePlayback}
              title={playingVoice ? 'Pausar nota de voz' : 'Escuchar nota de voz del oyente'}
            >
              {playingVoice ? '⏸' : '▶'}
            </button>

            <div className="booth-onair-progress-bar" onClick={(e) => {
              if (audioRef.current && audioRef.current.duration) {
                const rect = e.currentTarget.getBoundingClientRect()
                const pos = (e.clientX - rect.left) / rect.width
                audioRef.current.currentTime = pos * audioRef.current.duration
              }
            }}>
              <div
                className="booth-onair-progress-fill"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            <span className="booth-onair-duration">
              {playingVoice
                ? 'En Vivo 🔊'
                : boothOnAir.duration_sec
                ? `${boothOnAir.duration_sec}s`
                : 'Audio'}
            </span>

            {autoplayBlocked && (
              <button
                className="btn btn--sm btn--primary"
                style={{ marginLeft: 8, fontSize: '0.8rem', padding: '4px 8px' }}
                onClick={toggleVoicePlayback}
              >
                🔊 Tocar para escuchar
              </button>
            )}
          </div>
        ) : (
          <blockquote className="booth-onair-quote">
            “{boothOnAir.text}”
          </blockquote>
        )}

        {/* Pie informativo */}
        <div className="booth-onair-foot">
          <span>📻 Transmisión en directo por Zumaque 90.5 FM</span>
          {playingVoice && (
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.8rem' }}>
              • Audio del oyente al aire
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
