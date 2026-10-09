import { useRadio } from '../context/RadioContext.jsx'

function SpeakerIcon({ level }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      {level === 0 ? (
        <>
          <line x1="16" y1="9" x2="22" y2="15" />
          <line x1="22" y1="9" x2="16" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          {level > 0.5 && <path d="M18.5 5.5a9 9 0 0 1 0 13" />}
        </>
      )}
    </svg>
  )
}

export default function VolumeControl({ compact = false }) {
  const { volume, muted, setVolume, toggleMute } = useRadio()
  const level = muted ? 0 : volume
  const pct = Math.round(level * 100)

  return (
    <div className={`volume ${compact ? 'volume--compact' : ''}`}>
      <button
        type="button"
        className="volume__btn"
        onClick={toggleMute}
        aria-label={level === 0 ? 'Activar sonido' : 'Silenciar'}
      >
        <SpeakerIcon level={level} />
      </button>
      <input
        type="range"
        className="volume__slider"
        min="0" max="1" step="0.01"
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volumen"
        aria-valuetext={`${pct}%`}
        style={{ '--val': `${pct}%` }}
      />
    </div>
  )
}
