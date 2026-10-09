import logo from '../assets/logo.png'
import { station } from '../data/station.js'

export default function Hero() {
  return (
    <section id="inicio" className="hero" style={{ backgroundImage: "url(/mock/estudio.jpg)" }}>
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="hero__kicker">{station.slogan}</p>
          <h1>
            Zumaque 90.5 FM:<br />
            <span>Más que radio</span>
          </h1>
          <p className="hero__lead">Tu música, tu comercio, tu conexión.</p>
          <div className="hero__actions">
            <a href="#en-vivo" className="btn btn--primary">▶ Escuchar en vivo</a>
            <a href="#publicidad" className="btn btn--ghost">Anuncia tu negocio</a>
          </div>
        </div>

        <div className="hero__art" aria-hidden="true">
          <div className="hero__glow" />
          <img src={logo} alt="" className="hero__logo" />
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
