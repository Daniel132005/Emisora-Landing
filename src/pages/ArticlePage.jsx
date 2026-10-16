import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL, mediaUrl } from '../api/config.js'
import { useStation } from '../context/StationContext.jsx'
import { formatNewsDate } from '../hooks/useNews.js'
import { renderMarkdown } from '../lib/markdown.js'
import SocialIcon, { SOCIAL_NETWORKS } from '../components/SocialIcon.jsx'

/** /noticias/:slug — una noticia completa, con botones para compartirla. */
export default function ArticlePage() {
  const { slug } = useParams()
  const station = useStation()
  const [article, setArticle] = useState(null) // null = cargando, false = no existe
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setArticle(null)
    const load = () =>
      fetch(`${API_URL}/api/public/news/${encodeURIComponent(slug)}`)
        .then((res) => (res.ok ? res.json() : false))
        .then((data) => !cancelled && setArticle(data))
        .catch(() => !cancelled && setArticle(false))
    load()
    // Si la editan o la retiran mientras se lee, se actualiza
    window.addEventListener('zumaque:news', load)
    return () => {
      cancelled = true
      window.removeEventListener('zumaque:news', load)
    }
  }, [slug])

  useEffect(() => {
    document.title = article ? `${article.title} · ${station.name}` : station.name
  }, [article, station.name])

  if (article === null) return <main className="container page"><p className="page__empty">Cargando…</p></main>
  if (article === false) {
    return (
      <main className="container page">
        <h1 className="section-title page__title">Noticia no encontrada</h1>
        <p className="section-sub">Puede que se haya retirado o que el enlace esté incompleto.</p>
        <Link to="/noticias" className="btn btn--primary page__more">Ver todas las noticias</Link>
      </main>
    )
  }

  const url = window.location.href
  const shareText = encodeURIComponent(`${article.title} — ${station.name}`)
  const share = [
    ['whatsapp', 'WhatsApp', `https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`],
    ['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
    ['x', 'X', `https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(url)}`],
    ['telegram', 'Telegram', `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${shareText}`],
  ]

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <main className="container page">
      <article className="article">
        <Link to="/noticias" className="article__back">← Noticias</Link>
        <h1 className="article__title">{article.title}</h1>
        <p className="article__meta">
          <time dateTime={new Date(article.publishedAt).toISOString()}>{formatNewsDate(article.publishedAt)}</time>
          {article.author && <> · {article.author}</>}
        </p>
        {article.summary && <p className="article__lead">{article.summary}</p>}
        {article.cover && <img className="article__cover" src={mediaUrl(article.cover)} alt="" />}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />

        <div className="article__share">
          <span>Compartir:</span>
          {share.map(([network, label, href]) => (
            <a key={network} href={href} target="_blank" rel="noopener noreferrer" className={`social social--${network}`} style={{ '--brand': `#${SOCIAL_NETWORKS[network].hex}` }} aria-label={`Compartir en ${label}`} title={label}>
              <SocialIcon network={network} size={18} />
            </a>
          ))}
          <button type="button" className="btn btn--ghost article__copy" onClick={copyLink}>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</button>
        </div>
      </article>
    </main>
  )
}
