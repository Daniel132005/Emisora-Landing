// Direcciones del servidor de la radio (configurables con variables de entorno en Vercel)
export const WS_URL = import.meta.env.VITE_RADIO_WS_URL || 'ws://localhost:4000/listen'
export const ICECAST_URL = import.meta.env.VITE_ICECAST_URL || 'http://localhost:8000/live.mp3'
export const API_URL = import.meta.env.VITE_API_URL || WS_URL.replace(/^ws/, 'http').replace(/\/listen$/, '')

/** URL completa de un archivo subido desde el panel (/media/...). */
export function mediaUrl(path) {
  if (!path) return null
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`
}
