import { useStation } from '../context/StationContext.jsx'

export default function Hero() {
  const station = useStation()
  return (
    <section id="inicio" className="hero" style={{ backgroundImage: `url(${station.heroImageUrl})` }}>
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="hero__kicker">{station.slogan}</p>
          <h1>
            {station.heroTitle}<br />
            <span>{station.heroHighlight}</span>
          </h1>
          {station.heroText && <p className="hero__lead">{station.heroText}</p>}
          <div className="hero__actions">
            <a href="#en-vivo" className="btn btn--primary">▶ Escuchar en vivo</a>
            <a href="#publicidad" className="btn btn--ghost">Anuncia tu negocio</a>
          </div>
        </div>

        <div className="hero__art" aria-hidden="true">
          <div className="hero__glow" />
          <img src={station.logoUrl} alt="" className="hero__logo" />
          <div className="eq">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
