import { useEffect } from 'react'
import Hero from '../components/Hero.jsx'
import LivePlayer from '../components/LivePlayer.jsx'
import BoothOnAirWidget from '../components/BoothOnAirWidget.jsx'
import PollWidget from '../components/PollWidget.jsx'
import AdSlot from '../components/AdSlot.jsx'
import Schedule from '../components/Schedule.jsx'
import Podcasts from '../components/Podcasts.jsx'
import ClipsSection from '../components/ClipsSection.jsx'
import Voices from '../components/Voices.jsx'
import Advertise from '../components/Advertise.jsx'
import NewsSection from '../components/NewsSection.jsx'
import GallerySection from '../components/GallerySection.jsx'
import NavLink from '../components/NavLink.jsx'
import { useStation } from '../context/StationContext.jsx'

export default function Home() {
  const station = useStation()

  useEffect(() => {
    document.title = `${station.name}${station.slogan ? ` • ${station.slogan}` : ''}`
  }, [station.name, station.slogan])

  return (
    <main>
      <Hero />
      <div className="container">
        <LivePlayer />

        {/* Mensaje al Aire desde Cabina */}
        <BoothOnAirWidget />

        {/* Módulo de Encuesta Sincronizada en Vivo */}
        <PollWidget />

        <div className="content-grid">
          <div className="content-main">
            <AdSlot slot="banner" variant="banner" />
            <NewsSection />
            <Schedule />
            <Podcasts />
          </div>
          <aside className="content-side" aria-label="Publicidad local">
            <h2 className="section-title section-title--side">Publicidad local</h2>
            <AdSlot slot="sidebar" variant="sidebar" />
            <NavLink href="#publicidad" className="side-cta">
              ¿Quieres aparecer aquí? <span>Anúnciate →</span>
            </NavLink>
          </aside>
        </div>
      </div>

      {/* Videoteca de Clips */}
      <div className="container">
        <ClipsSection />
      </div>

      <Voices />

      <GallerySection />

      <div className="container">
        <Advertise />
      </div>
    </main>
  )
}
