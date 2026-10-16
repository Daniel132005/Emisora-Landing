import { Link } from 'react-router-dom'
import { mediaUrl } from '../api/config.js'
import { formatNewsDate } from '../hooks/useNews.js'

export default function NewsCard({ news }) {
  return (
    <article className="news-card">
      <Link to={`/noticias/${news.slug}`} className="news-card__link">
        <div className="news-card__cover">
          {news.cover ? <img src={mediaUrl(news.cover)} alt="" loading="lazy" /> : <span aria-hidden="true">📰</span>}
        </div>
        <div className="news-card__body">
          <time className="news-card__date" dateTime={new Date(news.publishedAt).toISOString()}>{formatNewsDate(news.publishedAt)}</time>
          <h3>{news.title}</h3>
          {news.summary && <p>{news.summary}</p>}
          <span className="news-card__more">Leer más →</span>
        </div>
      </Link>
    </article>
  )
}
