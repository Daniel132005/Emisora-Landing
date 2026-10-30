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
import NewsSection from '../components/NewsSection.jsx'
import GallerySection from '../components/GallerySection.jsx'
import NavLink from '../components/NavLink.jsx'
import { useStation } from '../context/StationContext.jsx'
import { useAds } from '../hooks/useAds.js'

export default function Home() {
  const station = useStation()
  const { ads } = useAds()

  const bannerAds = ads.filter((a) => a.slot === 'all' || a.slot === 'banner')
  const sidebarAds = ads.filter((a) => a.slot === 'all' || a.slot === 'sidebar')

  const hasBannerAds = bannerAds.length > 0
  const hasSidebarAds = sidebarAds.length > 0

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

        <div className={`content-grid ${hasSidebarAds ? '' : 'content-grid--no-side'}`}>
          <div className="content-main">
            {hasBannerAds && <AdSlot slot="banner" variant="banner" dynamicAds={bannerAds} />}
            <NewsSection />
            <Schedule />
            <Podcasts />
          </div>
          {hasSidebarAds && (
            <aside className="content-side" aria-label="Publicidad local">
              <AdSlot slot="sidebar" variant="sidebar" dynamicAds={sidebarAds} />
              
            </aside>
          )}
        </div>
      </div>

      {/* Videoteca de Clips */}
      <ClipsSection />

      <Voices />

      <GallerySection />
    </main>
  )
}
