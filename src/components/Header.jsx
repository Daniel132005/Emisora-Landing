import { useState } from 'react'
import { nav } from '../data/station.js'
import NavLink from './NavLink.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { useStation } from '../context/StationContext.jsx'

export default function Header() {
  const [open, setOpen] = useState(false)
  const station = useStation()

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink href="#inicio" className="header__logo" aria-label={`${station.name} — inicio`}>
          <img src={station.logoUrl} alt={station.name} />
        </NavLink>

        <div className="header__end">
          <nav id="main-nav" className={`header__nav ${open ? 'is-open' : ''}`}>
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="header__install-btn"
            title="Instalar aplicación en tu dispositivo"
            aria-label="Instalar aplicación móvil"
            onClick={() => window.dispatchEvent(new CustomEvent('pwa-open-install'))}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="header__install-text">Instalar App</span>
          </button>

          <ThemeToggle />

          <button
            className="header__toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label="Abrir menú"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  )
}
