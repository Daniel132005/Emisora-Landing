import { useStation } from '../context/StationContext.jsx'

/** Franja de aviso editable desde el panel (Estación → Aviso en la web). */
export default function AnnouncementBar() {
  const { announcement } = useStation()
  if (!announcement?.active || !announcement.text) return null

  return (
    <div className="announce" role="status">
      <div className="container announce__inner">
        <span className="announce__icon" aria-hidden="true">📢</span>
        {announcement.link ? (
          <a href={announcement.link} target="_blank" rel="noopener">{announcement.text} <span aria-hidden="true">→</span></a>
        ) : (
          <span>{announcement.text}</span>
        )}
      </div>
    </div>
  )
}
