import { useStation } from '../context/StationContext.jsx'
import { useRadio } from '../context/RadioContext.jsx'

export default function Hero() {
  const station = useStation()
  const { playing, loading, toggle } = useRadio()

  const handleListenClick = () => {
    if (!playing && !loading) {
      toggle()
    }
  }

  return (
    <section id="inicio" className="hero" style={station.heroImageUrl ? { backgroundImage: `url(${station.heroImageUrl})` } : undefined}>
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="hero__kicker">{station.slogan}</p>
          <h1>
            {station.heroTitle}<br />
            <span>{station.heroHighlight}</span>
          </h1>
          {station.heroText && <p className="hero__lead">{station.heroText}</p>}
          <div className="hero__actions">
            <a href="#en-vivo" className="btn btn--primary" onClick={handleListenClick}>▶ Escuchar en vivo</a>
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
