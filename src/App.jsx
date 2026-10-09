import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import LivePlayer from './components/LivePlayer.jsx'
import AdSlot from './components/AdSlot.jsx'
import Schedule from './components/Schedule.jsx'
import Podcasts from './components/Podcasts.jsx'
import Voices from './components/Voices.jsx'
import Advertise from './components/Advertise.jsx'
import Footer from './components/Footer.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import { RadioProvider } from './context/RadioContext.jsx'

export default function App() {
  return (
    <RadioProvider>
      <Header />
      <main>
        <Hero />
        <div className="container">
          <LivePlayer />

          <div className="content-grid">
            <div className="content-main">
              <AdSlot slot="banner" variant="banner" />
              <Schedule />
              <Podcasts />
            </div>
            <aside className="content-side" aria-label="Publicidad local">
              <h2 className="section-title section-title--side">Publicidad local</h2>
              <AdSlot slot="sidebar" variant="sidebar" />
              <a href="#publicidad" className="side-cta">¿Quieres aparecer aquí? <span>Anúnciate →</span></a>
            </aside>
          </div>
        </div>

        <Voices />

        <div className="container">
          <Advertise />
        </div>
      </main>
      <Footer />
      <MiniPlayer />
    </RadioProvider>
  )
}
