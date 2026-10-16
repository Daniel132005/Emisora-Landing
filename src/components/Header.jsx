import { useState } from 'react'
import { nav } from '../data/station.js'
import { useStation } from '../context/StationContext.jsx'

export default function Header() {
  const [open, setOpen] = useState(false)
  const station = useStation()

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#inicio" className="header__logo" aria-label={`${station.name} — inicio`}>
          <img src={station.logoUrl} alt={station.name} />
        </a>

        <button
          className="header__toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label="Abrir menú"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <nav id="main-nav" className={`header__nav ${open ? 'is-open' : ''}`}>
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
