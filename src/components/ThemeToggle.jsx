import { useEffect, useState } from 'react'

const KEY = 'zumaque:theme'
const current = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

/**
 * Botón ☀/🌙. Hasta que el visitante elige, la web sigue el tema de su sistema (y cambia con él);
 * después se recuerda su elección. El tema inicial lo aplica el script de index.html antes de pintar.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(current)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = (e) => {
      let saved = null
      try { saved = localStorage.getItem(KEY) } catch {}
      if (saved) return
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
      setTheme(current())
    }
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem(KEY, next) } catch {}
    setTheme(next)
  }

  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  return (
    <button className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
          <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z" />
        </svg>
      )}
    </button>
  )
}
