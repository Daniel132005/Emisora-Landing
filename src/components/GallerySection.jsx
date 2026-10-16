import { Link } from 'react-router-dom'
import { useGallery } from '../hooks/useGallery.js'
import GalleryGrid from './GalleryGrid.jsx'

/** Últimas fotos y videos en la portada. No aparece si la galería está vacía. */
export default function GallerySection() {
  const { items, total } = useGallery({ pageSize: 8 })
  if (!items?.length) return null

  return (
    <section id="galeria" className="gallery">
      <div className="container">
        <div className="news__head">
          <div>
            <h2 className="section-title">Galería</h2>
            <p className="section-sub">Fotos y videos de la radio, nuestros eventos y la comunidad.</p>
          </div>
          {total > items.length && <Link to="/galeria" className="news__all">Ver toda la galería →</Link>}
        </div>
        <GalleryGrid items={items} />
      </div>
    </section>
  )
}
