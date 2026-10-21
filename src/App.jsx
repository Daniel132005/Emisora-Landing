import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import AnnouncementBar from './components/AnnouncementBar.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import BoothWidget from './components/BoothWidget.jsx'
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx'
import Home from './pages/Home.jsx'
import NewsPage from './pages/NewsPage.jsx'
import ArticlePage from './pages/ArticlePage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import { RadioProvider } from './context/RadioContext.jsx'
import { StationProvider } from './context/StationContext.jsx'
import { ScheduleProvider } from './context/ScheduleContext.jsx'

/**
 * Los proveedores y el reproductor quedan fuera de las rutas: al cambiar de página
 * (portada — noticias) la radio sigue sonando sin cortes.
 */
export default function App() {
  return (
    <StationProvider>
      <ScheduleProvider>
        <RadioProvider>
          <ScrollManager />
          <AnnouncementBar />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/noticias" element={<NewsPage />} />
            <Route path="/noticias/:slug" element={<ArticlePage />} />
            <Route path="/galeria" element={<GalleryPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <Footer />
          {/* Cabina Directa (Grabador de notas de voz web + WhatsApp) */}
          <BoothWidget />
          <MiniPlayer />
          {/* Banner y modal de instalación PWA */}
          <PwaInstallPrompt />
        </RadioProvider>
      </ScheduleProvider>
    </StationProvider>
  )
}

