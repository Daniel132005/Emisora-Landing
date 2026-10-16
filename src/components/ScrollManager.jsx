import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de página: arriba del todo, o a la sección indicada (#programacion).
 * Reintenta un momento porque algunas secciones aparecen cuando llegan los datos del servidor.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    let tries = 0
    const timer = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el || ++tries > 20) {
        clearInterval(timer)
        el?.scrollIntoView()
      }
    }, 50)
    return () => clearInterval(timer)
  }, [pathname, hash])

  return null
}
