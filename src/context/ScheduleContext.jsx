import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '../api/config.js'
import { schedule as staticSchedule, voices as staticVoices } from '../data/station.js'

/**
 * Respaldo si el servidor no responde: la parrilla que la web tenía escrita en su código,
 * convertida al formato de la API ({ programs, hosts }, weekday 1 = lunes … 7 = domingo).
 */
function fallbackSchedule() {
  const hosts = staticVoices.map((v, i) => ({ id: -(i + 1), name: v.name, photo: null, staticPhoto: v.photo, bio: '', instagram: v.instagram }))
  const programs = staticSchedule.map((s, i) => {
    const [start, end] = s.time.split('–').map((t) => t.trim())
    return {
      id: -(i + 1),
      name: s.show,
      description: s.hosts,
      hostIds: hosts.filter((h) => staticVoices.find((v) => v.name === h.name)?.show === s.show).map((h) => h.id),
      slots: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start, end: end === '00:00' ? '24:00' : end })),
    }
  })
  return { programs, hosts }
}

// Fotos de ejemplo incluidas en la web, para los locutores que aún no tienen foto subida
const STATIC_PHOTOS = Object.fromEntries(staticVoices.map((v) => [v.name, v.photo]))

const ScheduleContext = createContext(fallbackSchedule())

export function ScheduleProvider({ children }) {
  const [schedule, setSchedule] = useState(fallbackSchedule)

  useEffect(() => {
    const load = () =>
      fetch(`${API_URL}/api/public/schedule`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setSchedule({
          programs: data.programs,
          hosts: (data.hosts || [])
            .filter((h) => h?.name && !/administrador|admin/i.test(String(h.name).trim()))
            .map((h) => ({ ...h, staticPhoto: STATIC_PHOTOS[h.name] ?? null })),
        }))
        .catch(() => {}) // sin servidor: se queda el respaldo

    load()
    // El panel guardó cambios en la programación (aviso por el WebSocket de la radio)
    window.addEventListener('zumaque:schedule', load)
    return () => window.removeEventListener('zumaque:schedule', load)
  }, [])

  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
