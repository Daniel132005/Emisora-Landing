import { podcasts } from '../data/station.js'

export default function Podcasts() {
  return (
    <section id="podcasts" className="podcasts">
      <h2 className="section-title">Podcasts</h2>
      <div className="podcasts__grid">
        {podcasts.map((p) => (
          <article key={p.title} className="podcast">
            <div className="podcast__cover"><img src={p.image} alt="" loading="lazy" /><span className="podcast__play" aria-hidden="true">▶</span></div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <span className="podcast__meta">{p.duration}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
