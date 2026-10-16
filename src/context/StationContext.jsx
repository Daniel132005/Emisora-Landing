import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL, mediaUrl } from '../api/config.js'
import { station as staticStation } from '../data/station.js'
import bundledLogo from '../assets/logo.png'

// Respaldo si el servidor no responde: los datos que la web tenía escritos en el código
const FALLBACK = {
  ...staticStation,
  logo: null,
  heroImage: null,
  heroTitle: 'Zumaque 90.5 FM:',
  heroHighlight: 'Más que radio',
  heroText: 'Tu música, tu comercio, tu conexión.',
  social: { facebook: '', instagram: '', youtube: '', tiktok: '', x: '', telegram: '' },
  announcement: { active: false, text: '', link: '' },
}

/** Añade las URLs listas para usar: logo e imagen de portada (subidos o los incluidos). */
function resolve(station) {
  return {
    ...station,
    logoUrl: mediaUrl(station.logo) || bundledLogo,
    heroImageUrl: mediaUrl(station.heroImage) || '/mock/estudio.jpg',
  }
}

const StationContext = createContext(resolve(FALLBACK))

export function StationProvider({ children }) {
  const [station, setStation] = useState(() => resolve(FALLBACK))

  useEffect(() => {
    const apply = (data) => setStation(resolve({ ...FALLBACK, ...data }))

    fetch(`${API_URL}/api/public/station`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && apply(data))
      .catch(() => {}) // sin servidor: se queda el respaldo

    // Cambios guardados desde el panel mientras la web está abierta (llegan por el WebSocket de la radio)
    const onUpdate = (e) => apply(e.detail)
    window.addEventListener('zumaque:station', onUpdate)
    return () => window.removeEventListener('zumaque:station', onUpdate)
  }, [])

  return <StationContext.Provider value={station}>{children}</StationContext.Provider>
}

export function useStation() {
  return useContext(StationContext)
}
