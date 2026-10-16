import { mediaUrl } from '../api/config.js'
import { useSchedule } from '../context/ScheduleContext.jsx'
import { programWhen, useCurrentShow } from '../hooks/useCurrentShow.js'

function initials(name) {
  if (name.startsWith('DJ ')) return 'DJ'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export default function Voices() {
  const { programs, hosts } = useSchedule()
  const current = useCurrentShow()
  if (!hosts.length) return null

  return (
    <section id="voces" className="voices">
      <div className="container">
        <h2 className="section-title">Voces de la radio</h2>
        <p className="section-sub">Las personas que te acompañan cada día al aire.</p>
        <ul className="voices__list">
          {hosts.map((h) => {
            const own = programs.filter((p) => p.hostIds.includes(h.id))
            const live = current?.hostIds.includes(h.id)
            // Foto subida desde el panel, o la de ejemplo incluida en la web
            const photo = mediaUrl(h.photo) || h.staticPhoto
            return (
              <li key={h.id} className={`voice ${live ? 'is-live' : ''}`}>
                <div className="voice__avatar">
                  {photo ? <img src={photo} alt={h.name} loading="lazy" /> : <span>{initials(h.name)}</span>}
                </div>
                {live && <span className="badge voice__badge">Al aire</span>}
                <strong>{h.name}</strong>
                {own[0] && <span className="voice__show">{own.map((p) => p.name).join(' · ')}</span>}
                {own[0] && <span className="voice__time">{programWhen(own[0])}</span>}
                {h.instagram && (
                  <a href={h.instagram} target="_blank" rel="noopener" className="voice__social">
                    Instagram
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
