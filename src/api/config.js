// Direcciones del servidor de la radio (con fallback automático al VPS en producción)
const PROD_HOST = 'radio.164-68-102-4.sslip.io'

export const WS_URL =
  import.meta.env.VITE_RADIO_WS_URL ||
  (import.meta.env.PROD ? `wss://${PROD_HOST}/listen` : 'ws://localhost:4000/listen')

export const ICECAST_URL =
  import.meta.env.VITE_ICECAST_URL ||
  (import.meta.env.PROD ? `https://${PROD_HOST}/live.mp3` : 'http://localhost:8000/live.mp3')

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? `https://${PROD_HOST}` : WS_URL.replace(/^ws/, 'http').replace(/\/listen$/, ''))

/** URL completa de un archivo subido desde el panel (/media/...). */
export function mediaUrl(path) {
  if (!path) return null
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`
}
