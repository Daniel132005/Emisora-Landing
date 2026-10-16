import { useCallback, useEffect, useState } from 'react'
import { API_URL } from '../api/config.js'

/** Noticias publicadas, paginadas. Se recargan solas cuando el panel publica o retira una. */
export function useNews(pageSize = 9) {
  const [items, setItems] = useState(null) // null = cargando
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(false)

  const load = useCallback(async (offset = 0) => {
    try {
      const res = await fetch(`${API_URL}/api/public/news?limit=${pageSize}&offset=${offset}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems((prev) => (offset === 0 ? data.items : [...(prev ?? []), ...data.items]))
      setTotal(data.total)
      setError(false)
    } catch {
      setError(true)
      setItems((prev) => prev ?? [])
    }
  }, [pageSize])

  useEffect(() => {
    load(0)
    const reload = () => load(0)
    window.addEventListener('zumaque:news', reload)
    return () => window.removeEventListener('zumaque:news', reload)
  }, [load])

  return { items, total, error, loadMore: () => load(items?.length ?? 0) }
}

/** "15 de octubre de 2026" en la hora de la emisora */
export function formatNewsDate(ts) {
  return new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', day: 'numeric', month: 'long', year: 'numeric' }).format(ts)
}
