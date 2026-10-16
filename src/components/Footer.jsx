import { useState } from 'react'
import { nav } from '../data/station.js'
import { useStation } from '../context/StationContext.jsx'
import SocialIcon, { SOCIAL_NETWORKS } from './SocialIcon.jsx'
import NavLink from './NavLink.jsx'

export default function Footer() {
  const station = useStation()
  const [copied, setCopied] = useState(false)

  // mailto: depende de que el visitante tenga una app de correo configurada; copiar siempre funciona
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(station.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Solo las redes configuradas en el panel; WhatsApp sale del número de contacto
  const links = { ...station.social, whatsapp: station.whatsapp ? `https://wa.me/${station.whatsapp}` : '' }
  const social = Object.keys(SOCIAL_NETWORKS).filter((name) => links[name]).map((name) => [name, links[name]])
  return (
    <footer id="contacto" className="footer">
      <div className="container footer__inner">
        <div>
          <h3>Enlaces</h3>
          <ul>
            {nav.map((n) => (
              <li key={n.href}><NavLink href={n.href}>{n.label}</NavLink></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Contacto</h3>
          <ul>
            {station.address && <li>📍 {station.address}</li>}
            {station.phone && <li>📞 <a href={`tel:${station.phone.replace(/\s/g, '')}`}>{station.phone}</a></li>}
            {station.email && (
              <li>
                ✉️ <a href={`mailto:${station.email}`}>{station.email}</a>
                <button type="button" className="footer__copy-btn" onClick={copyEmail} aria-live="polite">
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </li>
            )}
          </ul>
        </div>
        {social.length > 0 && (
          <div>
            <h3>Síguenos</h3>
            <div className="footer__social">
              {social.map(([name, url]) => {
                const { title, hex } = SOCIAL_NETWORKS[name]
                return (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    aria-label={title}
                    title={title}
                    className={`social social--${name}`}
                    style={{ '--brand': `#${hex}` }}
                  >
                    <SocialIcon network={name} />
                  </a>
                )
              })}
            </div>
          </div>
        )}
        <img src={station.logoUrl} alt={station.name} className="footer__logo" />
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} {station.name}. Todos los derechos reservados.</p>
    </footer>
  )
}
