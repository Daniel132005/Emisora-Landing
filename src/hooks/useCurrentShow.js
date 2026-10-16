import { useEffect, useState } from 'react'
import { station } from '../data/station.js'
import { useSchedule } from '../context/ScheduleContext.jsx'

export const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_SHORT = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Día (1 = lunes … 7 = domingo) y minuto actuales de la emisora, sin importar la zona horaria del visitante. */
export function nowAtStation() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: station.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => parts.find((p) => p.type === type).value
  return {
    weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** "24:00" se muestra como "00:00" */
export const showTime = (time) => (time === '24:00' ? '00:00' : time)

/** "Con María Pérez & Andrés Gómez", o la descripción si el programa no tiene locutores. */
export function programSubtitle(program, hosts) {
  const names = program.hostIds.map((id) => hosts.find((h) => h.id === id)?.name).filter(Boolean)
  return names.length ? `Con ${names.join(' & ')}` : program.description
}

/** Horario resumido: "Lun–Vie · 08:00 – 12:00" (primera franja del programa). */
export function programWhen(program) {
  const first = program.slots[0]
  if (!first) return ''
  const days = program.slots.filter((s) => s.start === first.start && s.end === first.end).map((s) => s.weekday)
  const consecutive = days.length >= 3 && days.every((d, i) => i === 0 || d === days[i - 1] + 1)
  const label = consecutive ? `${DAY_SHORT[days[0]]}–${DAY_SHORT[days.at(-1)]}` : days.map((d) => DAY_SHORT[d]).join(', ')
  return `${label} · ${first.start} – ${showTime(first.end)}`
}

function findCurrent(programs) {
  const { weekday, minutes } = nowAtStation()
  return programs.find((p) => p.slots.some((s) => s.weekday === weekday && minutes >= toMinutes(s.start) && minutes < toMinutes(s.end))) ?? null
}

/**
 * Programa que está al aire ahora según la parrilla (o null), con { show, hosts } para los reproductores.
 * Se recalcula cada 30 s para que cambie solo al empezar el siguiente programa.
 */
export function useCurrentShow() {
  const { programs, hosts } = useSchedule()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const program = findCurrent(programs)
  return program ? { ...program, show: program.name, hosts: programSubtitle(program, hosts) } : null
}
