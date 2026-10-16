import { useState } from 'react'
import { nav } from '../data/station.js'
import NavLink from './NavLink.jsx'
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
            <NavLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
