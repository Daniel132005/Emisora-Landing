import { useState } from 'react'
import { station } from '../data/station.js'
import { useSchedule } from '../context/ScheduleContext.jsx'
import { DAY_NAMES, nowAtStation, showTime, useCurrentShow } from '../hooks/useCurrentShow.js'

export default function Schedule() {
  const { programs } = useSchedule()
  const current = useCurrentShow()
  const today = nowAtStation().weekday
  const [day, setDay] = useState(today)

  // Solo los días con programación; si hoy no hay, se abre el primero que tenga
  const days = [1, 2, 3, 4, 5, 6, 7].filter((d) => programs.some((p) => p.slots.some((s) => s.weekday === d)))
  const selected = days.includes(day) ? day : days[0]

  const items = programs
    .flatMap((p) => p.slots.filter((s) => s.weekday === selected).map((s) => ({ ...s, program: p })))
    .sort((a, b) => a.start.localeCompare(b.start))

  return (
    <section id="programacion" className="schedule">
      <h2 className="section-title">Programación</h2>
      <p className="section-sub">{station.timeZoneLabel}</p>

      {days.length > 1 && (
        <div className="schedule__days" role="tablist" aria-label="Día de la semana">
          {days.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={d === selected}
              className={`schedule__day ${d === selected ? 'is-active' : ''}`}
              onClick={() => setDay(d)}
            >
              {d === today ? 'Hoy' : DAY_NAMES[d].slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="schedule__empty">Pronto publicaremos la programación.</p>
      ) : (
        <ul className="schedule__list">
          {items.map((s) => {
            const live = selected === today && current?.id === s.program.id
            return (
              <li key={`${s.program.id}-${s.start}`} className={live ? 'is-live' : ''}>
                <span className="schedule__time">{s.start} – {showTime(s.end)}</span>
                <div>
                  <strong>{s.program.name}</strong>
                </div>
                {live && <span className="badge">Al aire</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
