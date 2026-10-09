import { voices } from '../data/station.js'
import { useCurrentShow } from '../hooks/useCurrentShow.js'

function initials(name) {
  if (name.startsWith('DJ ')) return 'DJ'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export default function Voices() {
  const current = useCurrentShow()

  return (
    <section id="voces" className="voices">
      <div className="container">
        <h2 className="section-title">Voces de la radio</h2>
        <p className="section-sub">Las personas que te acompañan cada día al aire.</p>
        <ul className="voices__list">
          {voices.map((v) => {
            const live = current?.show === v.show
            return (
              <li key={v.name} className={`voice ${live ? 'is-live' : ''}`}>
                <div className="voice__avatar">
                  {v.photo ? <img src={v.photo} alt={v.name} loading="lazy" /> : <span>{initials(v.name)}</span>}
                </div>
                {live && <span className="badge voice__badge">Al aire</span>}
                <strong>{v.name}</strong>
                <span className="voice__show">{v.show}</span>
                <span className="voice__time">{v.time}</span>
                {v.instagram && (
                  <a href={v.instagram} target="_blank" rel="noopener" className="voice__social">
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
