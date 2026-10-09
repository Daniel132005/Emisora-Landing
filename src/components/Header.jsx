import { useState } from 'react'
import logo from '../assets/logo.png'
import { nav } from '../data/station.js'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#inicio" className="header__logo" aria-label="Zumaque 90.5 FM — inicio">
          <img src={logo} alt="Zumaque 90.5 FM" />
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
