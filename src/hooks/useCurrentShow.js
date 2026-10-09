import { useEffect, useState } from 'react'
import { schedule, station } from '../data/station.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// Hora y día actuales de la emisora, sin importar la zona horaria del visitante
function nowAtStation() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: station.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => parts.find((p) => p.type === type).value
  return { day: get('weekday'), mins: Number(get('hour')) * 60 + Number(get('minute')) }
}

function toMinutes(t) {
  const [h, m] = t.trim().split(':').map(Number)
  return h * 60 + m
}

function findCurrentShow() {
  const { day, mins } = nowAtStation()
  // La programación publicada es de lunes a viernes
  if (!WEEKDAYS.includes(day)) return null
  return (
    schedule.find((s) => {
      const [start, end] = s.time.split('–').map(toMinutes)
      return mins >= start && mins < (end === 0 ? 24 * 60 : end)
    }) ?? null
  )
}

/**
 * Programa que está al aire ahora (o null si no hay ninguno en la parrilla).
 * Se recalcula cada 30 s para que cambie solo al empezar el siguiente programa.
 */
export function useCurrentShow() {
  const [show, setShow] = useState(findCurrentShow)

  useEffect(() => {
    const id = setInterval(() => setShow(findCurrentShow()), 30_000)
    return () => clearInterval(id)
  }, [])

  return show
}
