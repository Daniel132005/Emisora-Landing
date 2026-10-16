import { Link } from 'react-router-dom'
import { useNews } from '../hooks/useNews.js'
import NewsCard from './NewsCard.jsx'

/** Últimas noticias en la portada. No aparece si todavía no hay ninguna publicada. */
export default function NewsSection() {
  const { items, total } = useNews(3)
  if (!items?.length) return null

  return (
    <section id="noticias" className="news">
      <div className="news__head">
        <div>
          <h2 className="section-title">Noticias</h2>
          <p className="section-sub">Lo último de la radio y de nuestra región.</p>
        </div>
        {total > items.length && <Link to="/noticias" className="news__all">Ver todas →</Link>}
      </div>
      <div className="news__grid">
        {items.map((n) => <NewsCard key={n.id} news={n} />)}
      </div>
    </section>
  )
}
