import logo from '../assets/logo.png'
import { nav, station } from '../data/station.js'

export default function Footer() {
  return (
    <footer id="contacto" className="footer">
      <div className="container footer__inner">
        <div>
          <h3>Enlaces</h3>
          <ul>
            {nav.map((n) => (
              <li key={n.href}><a href={n.href}>{n.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Contacto</h3>
          <ul>
            <li>📍 {station.address}</li>
            <li>📞 <a href={`tel:${station.phone.replace(/\s/g, '')}`}>{station.phone}</a></li>
            <li>✉️ <a href={`mailto:${station.email}`}>{station.email}</a></li>
          </ul>
        </div>
        <div>
          <h3>Síguenos</h3>
          <div className="footer__social">
            {Object.entries(station.social).map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener" aria-label={name}>
                {name[0].toUpperCase()}
              </a>
            ))}
          </div>
        </div>
        <img src={logo} alt="Zumaque 90.5 FM" className="footer__logo" />
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} {station.name}. Todos los derechos reservados.</p>
    </footer>
  )
}
