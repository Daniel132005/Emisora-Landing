import { useEffect } from 'react'
import { useStation } from '../context/StationContext.jsx'
import { useNews } from '../hooks/useNews.js'
import NewsCard from '../components/NewsCard.jsx'

/** /noticias: todas las noticias publicadas. */
export default function NewsPage() {
  const station = useStation()
  const { items, total, error, loadMore } = useNews(9)

  useEffect(() => {
    document.title = `Noticias · ${station.name}`
  }, [station.name])

  return (
    <main className="container page">
      <h1 className="section-title page__title">Noticias</h1>
      <p className="section-sub">Lo último de {station.name} y de nuestra región.</p>

      {items === null && <p className="page__empty">Cargando…</p>}
      {error && !items?.length && <p className="page__empty">No pudimos cargar las noticias. Inténtalo de nuevo en un momento.</p>}
      {items?.length === 0 && !error && <p className="page__empty">Pronto publicaremos noticias.</p>}

      <div className="news__grid news__grid--page">
        {items?.map((n) => <NewsCard key={n.id} news={n} />)}
      </div>

      {items && items.length < total && (
        <button className="btn btn--ghost page__more" onClick={loadMore}>Ver más noticias</button>
      )}
    </main>
  )
}
