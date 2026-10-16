import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStation } from '../context/StationContext.jsx'
import { useGallery } from '../hooks/useGallery.js'
import GalleryGrid from '../components/GalleryGrid.jsx'

/** /galeria — toda la galería, con filtro por álbum (?album=…, para poder compartir un álbum). */
export default function GalleryPage() {
  const station = useStation()
  const [params, setParams] = useSearchParams()
  const album = params.get('album') || ''
  const { items, albums, total, loadMore } = useGallery({ album, pageSize: 24 })

  useEffect(() => {
    document.title = `${album || 'Galería'} · ${station.name}`
  }, [album, station.name])

  return (
    <main className="container page">
      <h1 className="section-title page__title">Galería</h1>
      <p className="section-sub">Fotos y videos de {station.name}.</p>

      {albums.length > 0 && (
        <div className="schedule__days gallery__albums" role="tablist" aria-label="Álbumes">
          <button role="tab" aria-selected={!album} className={`schedule__day ${!album ? 'is-active' : ''}`} onClick={() => setParams({})}>Todo</button>
          {albums.map((a) => (
            <button key={a.album} role="tab" aria-selected={album === a.album} className={`schedule__day ${album === a.album ? 'is-active' : ''}`} onClick={() => setParams({ album: a.album })}>
              {a.album} <span className="gallery__count">{a.count}</span>
            </button>
          ))}
        </div>
      )}

      {items === null && <p className="page__empty">Cargando…</p>}
      {items?.length === 0 && <p className="page__empty">Aún no hay fotos aquí.</p>}
      {items?.length > 0 && <GalleryGrid items={items} />}
      {items && items.length < total && <button className="btn btn--ghost page__more" onClick={loadMore}>Ver más</button>}
    </main>
  )
}
