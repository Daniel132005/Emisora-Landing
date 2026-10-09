import { schedule, station } from '../data/station.js'
import { useCurrentShow } from '../hooks/useCurrentShow.js'

export default function Schedule() {
  const current = useCurrentShow()

  return (
    <section id="programacion" className="schedule">
      <h2 className="section-title">Programación</h2>
      <p className="section-sub">Lunes a viernes · {station.timeZoneLabel}</p>
      <ul className="schedule__list">
        {schedule.map((s) => {
          const live = s === current
          return (
            <li key={s.time} className={live ? 'is-live' : ''}>
              <span className="schedule__time">{s.time}</span>
              <div>
                <strong>{s.show}</strong>
                <span>{s.hosts}</span>
              </div>
              {live && <span className="badge">Al aire</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
