import { useState, useEffect } from 'react'
import { defaultShow } from '../data/station.js'
import { useStation } from '../context/StationContext.jsx'
import { useCurrentShow } from '../hooks/useCurrentShow.js'
import { useRadio } from '../context/RadioContext.jsx'
import VolumeControl from './VolumeControl.jsx'

export default function LivePlayer() {
  const scheduled = useCurrentShow() ?? defaultShow
  const {
    playing,
    loading,
    reconnecting,
    error,
    isLive,
    liveInfo,
    listeners,
    toggle,
    channels,
    currentChannel,
    switchChannel,
    nowPlaying,
    songVotes,
    rateCurrentTrack,
    visualRadio,
  } = useRadio()

  const [shared, setShared] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const station = useStation()

  // Oculto temporalmente (NO eliminado) para activar en el futuro al integrar Cabina TV / Video en vivo
  const ENABLE_VISUAL_RADIO = false
  const isVisualActive = ENABLE_VISUAL_RADIO && Boolean(visualRadio?.active || visualRadio?.enabled)
  const embedUrl = visualRadio?.embedUrl || (visualRadio?.stream_url && visualRadio.stream_url.includes('embed') ? visualRadio.stream_url : (visualRadio?.streamId?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([a-zA-Z0-9_-]{11})/) ? `https://www.youtube-nocookie.com/embed/${visualRadio.streamId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([a-zA-Z0-9_-]{11})/)[1]}?autoplay=1` : visualRadio?.stream_url))

  const currentTrack = nowPlaying?.track || (nowPlaying?.id || nowPlaying?.title ? nowPlaying : null)
  const userVote = currentTrack ? songVotes[currentTrack.id] : null

  // Identificar si estamos en un canal alternativo
  const isAltChannel = Boolean(currentChannel && currentChannel.slug !== 'matriz' && currentChannel.id !== 1 && currentChannel.id !== 'main')

  const displayTitle = isAltChannel
    ? currentChannel.name
    : (isLive && liveInfo.program ? liveInfo.program : scheduled.show)

  const isGenericAdmin = (val) => !val || /administrador|admin/i.test(String(val).trim())

  const displaySubtitle = isAltChannel
    ? `${currentChannel.genre || 'Transmisión Web Alternativa'} • ${currentChannel.bitrate_kbps || 128} kbps`
    : (isLive
        ? (liveInfo.host && !isGenericAdmin(liveInfo.host) ? `Con ${liveInfo.host}` : '')
        : (scheduled.hosts && !isGenericAdmin(scheduled.hosts) ? scheduled.hosts : ''))

  const trackCover = currentTrack?.coverUrl || currentTrack?.cover_url
  const coverUrl = trackCover
    ? trackCover
    : (isAltChannel && currentChannel?.logo_url ? currentChannel.logo_url : station.logoUrl)

  const share = async () => {
    const textToShare = currentTrack
      ? `Escuchando "${currentTrack.title}" de ${currentTrack.artist} en ${station.name}`
      : `Escucha ${station.name} en vivo`
    const data = {
      title: station.name,
      text: textToShare,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {}
  }

  // Sincronizar metadatos oficiales en la pantalla de bloqueo (iOS / Android / Control de medios)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayTitle || 'Zumaque 90.5 FM',
        artist: displaySubtitle || (isLive ? 'Transmisión en Directo' : (scheduled.show || 'Zumaque 90.5 FM')),
        album: 'Zumaque 90.5 FM',
        artwork: [
          { src: coverUrl || station.logoUrl || '/logo.png', sizes: '512x512', type: 'image/png' },
        ],
      })
    }
  }, [displayTitle, displaySubtitle, coverUrl, station.logoUrl, isLive, scheduled.show])

  // Filtrar los canales temáticos para no duplicar la matriz
  const altChannels = (channels || []).filter(
    (c) => c.slug !== 'matriz' && c.id !== 1 && c.id !== 'main'
  )

  return (
    <section id="en-vivo" className="live">
      {/* Barra de Píldoras de Canales */}
      <div className="live__channels-bar" role="tablist" aria-label="Canales de emisión">
        <button
          role="tab"
          aria-selected={!isAltChannel}
          className={`channel-pill ${!isAltChannel ? 'channel-pill--active' : ''}`}
          onClick={() => switchChannel(null)}
        >
          <span className="channel-pill__dot" />
          <span className="channel-pill__name">Señal Matriz 90.5 FM</span>
          <span className="channel-pill__badge">{isLive ? 'EN VIVO' : 'OFICIAL'}</span>
        </button>

        {altChannels.map((chan) => {
          const isActive = currentChannel?.id === chan.id
          return (
            <button
              key={chan.id}
              role="tab"
              aria-selected={isActive}
              className={`channel-pill ${isActive ? 'channel-pill--active' : ''}`}
              onClick={() => switchChannel(chan)}
            >
              <span className="channel-pill__dot" />
              <span className="channel-pill__name">{chan.name}</span>
              {chan.genre && <span className="channel-pill__genre">{chan.genre}</span>}
            </button>
          )
        })}
      </div>

      <div className="live__header-bar">
        <div className="live__header-left">
          <h2 className="section-title section-title--live">
            <span className={'live__dot' + ((isLive || isAltChannel) ? ' live__dot--active' : ' live__dot--off')} />
            {isAltChannel ? `Canal: ${currentChannel.name}` : (isLive ? 'En vivo ahora' : 'Fuera del aire')}
          </h2>
          {isVisualActive && !isAltChannel && (
            <button
              className={`visual-radio-badge ${showVideo ? 'visual-radio-badge--active' : ''}`}
              onClick={() => setShowVideo((v) => !v)}
              title="Alternar transmisión en video"
            >
              <span className="visual-radio-badge__pulse" />
              📹 {showVideo ? 'Ocultar Cabina' : 'Ver Cabina en Video'}
            </button>
          )}
        </div>

        {((isLive && !isAltChannel) || isAltChannel) && listeners > 0 && (
          <span className="live__listeners-badge" aria-live="polite">
            👥 {listeners} {listeners === 1 ? 'oyente' : 'oyentes'} ahora
          </span>
        )}
      </div>

      {/* Reproductor de Radio Visual en vivo */}
      {isVisualActive && showVideo && !isAltChannel && embedUrl && (
        <div className="visual-player-container">
          <div className="visual-player-wrapper">
            <iframe
              src={embedUrl}
              title="Radio Visual Zumaque 90.5 FM"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="visual-player-frame"
            />
          </div>
          <div className="visual-player-footer">
            <span>🔴 Transmisión en directo desde la cabina principal</span>
            <button className="btn-close-video" onClick={() => setShowVideo(false)}>
              Cerrar video
            </button>
          </div>
        </div>
      )}

      {/* Caja Principal del Reproductor */}
      <div className={'player' + ((!isLive && !isAltChannel) ? ' player--off-air' : '')}>
        <div className="player__top">
          <div className="player__cover-wrap">
            <img
              src={coverUrl}
              alt="Portada"
              className="player__cover"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = station.logoUrl
              }}
            />
            {currentTrack && !isAltChannel && (
              <span className="player__music-badge" title="Canción identificada">🎵</span>
            )}
          </div>

          <div className="player__meta">
            <div className="player__status-line">
              <span className={'badge-state' + ((isLive || isAltChannel) ? ' badge-state--live' : ' badge-state--off')}>
                {isAltChannel
                  ? `📻 EMISIÓN TEMÁTICA • ${currentChannel.genre || 'WEB'}`
                  : (isLive ? '🔴 TRANSMISIÓN EN DIRECTO' : '⏳ PROGRAMACIÓN HABITUAL')}
              </span>
            </div>

            <div className="player__info-block">
              <p className="player__now" aria-live="polite">
                <strong>{displayTitle}</strong>
                <span> • {displaySubtitle}</span>
              </p>

              {/* Si hay canción sonando en la emisora o canal */}
              {currentTrack && (
                <div className="player__track-card">
                  <div className="player__track-header">
                    <span className="player__track-label">Sonando ahora:</span>
                    <strong className="player__track-title">{currentTrack.title}</strong>
                    <span className="player__track-artist">{currentTrack.artist}</span>
                    {currentTrack.album && <span className="player__track-album">({currentTrack.album})</span>}
                  </div>

                  {/* Acciones de la canción: Spotify, Apple Music y Rating */}
                  <div className="player__track-actions">
                    {currentTrack.spotifyUrl && (
                      <a
                        href={currentTrack.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="track-service-btn track-service-btn--spotify"
                        title="Escuchar en Spotify"
                      >
                        Spotify
                      </a>
                    )}
                    {currentTrack.appleUrl && (
                      <a
                        href={currentTrack.appleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="track-service-btn track-service-btn--apple"
                        title="Escuchar en Apple Music"
                      >
                        Apple Music
                      </a>
                    )}

                    <div className="player__rating-group">
                      <button
                        type="button"
                        className={`rate-btn ${userVote === 'likes' ? 'rate-btn--active' : ''}`}
                        onClick={() => rateCurrentTrack('likes')}
                        disabled={Boolean(userVote)}
                        title="Me gusta esta canción"
                      >
                        👍 <span>{currentTrack.likes || 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`rate-btn ${userVote === 'fire' ? 'rate-btn--active' : ''}`}
                        onClick={() => rateCurrentTrack('fire')}
                        disabled={Boolean(userVote)}
                        title="¡Está que arde!"
                      >
                        🔥 <span>{currentTrack.fire || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isLive && !isAltChannel && (
                <p className="player__scheduled-notice">
                  La señal en vivo se activa cuando el locutor inicia transmisión. ¡Conéctate en los horarios de programación o disfruta de nuestros canales alternativos!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controles de Reproducción */}
        <div className="player__controls">
          <button
            className="player__play"
            onClick={toggle}
            aria-label={reconnecting ? 'Cancelar reconexión' : playing ? 'Pausar' : 'Reproducir'}
            disabled={loading}
            title={reconnecting ? 'Reconectando… (pulsa para cancelar)' : (playing ? 'Pausar emisión' : 'Escuchar en vivo')}
          >
            {loading || reconnecting ? <span className="spinner" /> : playing ? '⏸' : '▶'}
          </button>

          <div className={'player__wave' + (playing ? ' is-playing' : '')} aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} style={{ animationDelay: ((i * 37) % 900) + 'ms' }} />
            ))}
          </div>

          <VolumeControl />

          <button className="player__share" onClick={share}>
            {shared ? '✓ ¡Copiado!' : 'Compartir'}
          </button>

          {/* Botón de historial de canciones (solo señal matriz) */}
          {!isAltChannel && nowPlaying.history?.length > 0 && (
            <button
              className={`player__history-btn ${showHistory ? 'player__history-btn--active' : ''}`}
              onClick={() => setShowHistory((h) => !h)}
              title="Historial de canciones transmitidas"
            >
              🎵 Historial ({nowPlaying.history.length})
            </button>
          )}
        </div>

        {/* Acordeón de Historial */}
        {!isAltChannel && showHistory && nowPlaying.history?.length > 0 && (
          <div className="player__history-list">
            <h4 className="player__history-title">Canciones recientes en antena:</h4>
            <ul>
              {nowPlaying.history.slice(0, 5).map((t, idx) => (
                <li key={t.id || idx} className="player__history-item">
                  <span className="player__history-track">
                    <strong>{t.title}</strong> — {t.artist}
                  </span>
                  {t.spotifyUrl && (
                    <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" className="history-link">
                      Escuchar →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reconnecting && <p className="player__reconnecting" role="status">Se cortó la señal. Reconectando…</p>}
        {error && <p className="player__error" role="alert">{error}</p>}
      </div>
    </section>
  )
}
