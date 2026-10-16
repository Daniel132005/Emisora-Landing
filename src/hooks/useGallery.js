import { useCallback, useEffect, useState } from 'react'
import { API_URL } from '../api/config.js'

/** Galería pública (opcionalmente de un álbum). Se recarga sola cuando el panel la cambia. */
export function useGallery({ album = '', pageSize = 24 } = {}) {
  const [items, setItems] = useState(null) // null = cargando
  const [albums, setAlbums] = useState([])
  const [total, setTotal] = useState(0)

  const load = useCallback(async (offset = 0) => {
    try {
      const params = new URLSearchParams({ limit: pageSize, offset, ...(album ? { album } : {}) })
      const res = await fetch(`${API_URL}/api/public/gallery?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems((prev) => (offset === 0 ? data.items : [...(prev ?? []), ...data.items]))
      setAlbums(data.albums)
      setTotal(data.total)
    } catch {
      setItems((prev) => prev ?? [])
    }
  }, [album, pageSize])

  useEffect(() => {
    load(0)
    const reload = () => load(0)
    window.addEventListener('zumaque:gallery', reload)
    return () => window.removeEventListener('zumaque:gallery', reload)
  }, [load])

  return { items, albums, total, loadMore: () => load(items?.length ?? 0) }
}
