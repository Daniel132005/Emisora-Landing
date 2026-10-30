import { useEffect, useState } from 'react'
import { API_URL } from '../api/config.js'

export function useAds() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchAds() {
      try {
        const res = await fetch(`${API_URL}/api/public/ads`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setAds(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        // Fallback silencioso
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAds()
    const timer = setInterval(fetchAds, 60000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { ads, loading }
}
