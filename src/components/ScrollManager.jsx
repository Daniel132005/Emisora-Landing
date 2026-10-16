import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de página: arriba del todo, o a la sección indicada (#programacion).
 * Reintenta un momento porque algunas secciones aparecen cuando llegan los datos del servidor.
 */
export default function ScrollManager() {
  // key cambia en cada navegación: volver a pulsar el mismo apartado vuelve a llevar a él
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    let tries = 0
    const timer = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      // Hasta 3 s: noticias y galería aparecen cuando llegan los datos del servidor
      if (el || ++tries > 60) {
        clearInterval(timer)
        el?.scrollIntoView()
      }
    }, 50)
    return () => clearInterval(timer)
  }, [pathname, hash, key])

  return null
}
