import { useEffect, useState } from 'react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  useEffect(() => {
    // 1. Detectar si ya está en modo app independiente (instalada)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(Boolean(standaloneMode))

    // 2. Detectar iOS (Safari no dispara beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua) && !standaloneMode
    setIsIos(iosDevice)

    // 3. Comprobar si el usuario ya descartó el aviso en esta sesión
    try {
      if (sessionStorage.getItem('zumaque:pwa_dismissed')) {
        setDismissed(true)
      }
    } catch {}

    // 4. Capturar evento de instalación estándar (Chrome, Edge, Samsung Internet, Opera)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setCanInstall(false)
      setDeferredPrompt(null)
      setIsStandalone(true)
      setInstalledSuccess(true)
      setTimeout(() => setInstalledSuccess(false), 4000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    const handleCustomTrigger = () => {
      setDismissed(false)
      // Si es iOS abrir modal de instrucciones, o si hay prompt dispararlo
      if (iosDevice) {
        setShowIosModal(true)
      } else {
        setCanInstall(true)
      }
    }
    window.addEventListener('pwa-open-install', handleCustomTrigger)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('pwa-open-install', handleCustomTrigger)
    }
  }, [])


  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true)
      return
    }

    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setCanInstall(false)
        setDeferredPrompt(null)
      }
    } catch (e) {
      console.warn('[PWA] Error en prompt:', e)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('zumaque:pwa_dismissed', 'true')
    } catch {}
  }

  // Si ya está instalada o descartada y no hay evento ni es iOS, ocultar banner flotante
  const showBanner = !isStandalone && !dismissed && (canInstall || isIos)

  return (
    <>
      {/* Toast de instalación exitosa */}
      {installedSuccess && (
        <div className="pwa-toast-success" role="status" aria-live="polite">
          <span className="pwa-toast-icon">📻</span>
          <div>
            <strong>¡Zumaque 90.5 FM instalada!</strong>
            <p>Ya puedes acceder directamente desde la pantalla de inicio de tu dispositivo.</p>
          </div>
        </div>
      )}

      {/* Banner flotante de instalación rápida */}
      {showBanner && (
        <aside className="pwa-install-banner" aria-label="Instalar aplicación web">
          <div className="pwa-install-banner__content">
            <img
              src="/icons/icon-192.png"
              alt="Logo Zumaque 90.5 FM"
              className="pwa-install-banner__icon"
              width="44"
              height="44"
            />
            <div className="pwa-install-banner__text">
              <span className="pwa-install-banner__badge">APLICACIÓN MÓVIL</span>
              <strong className="pwa-install-banner__title">Instalar Zumaque 90.5 FM</strong>
              <p className="pwa-install-banner__desc">
                Escucha sin cortes en segundo plano y con la pantalla bloqueada.
              </p>
            </div>
          </div>

          <div className="pwa-install-banner__actions">
            <button
              type="button"
              className="pwa-install-btn"
              onClick={handleInstallClick}
              aria-label="Instalar app en tu dispositivo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{isIos ? '¿Cómo instalar?' : 'Instalar App'}</span>
            </button>

            <button
              type="button"
              className="pwa-dismiss-btn"
              onClick={handleDismiss}
              aria-label="Cerrar aviso de instalación"
              title="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Modal interactivo de instrucciones para iPhone / iPad (iOS Safari) */}
      {showIosModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div
            className="pwa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pwa-modal__header">
              <img
                src="/icons/icon-192.png"
                alt="Logo Zumaque"
                className="pwa-modal__logo"
                width="48"
                height="48"
              />
              <div>
                <h3 id="ios-install-title">Instala Zumaque 90.5 en tu iPhone</h3>
                <span className="pwa-modal__sub">Sin descargar nada de la App Store</span>
              </div>
              <button
                type="button"
                className="pwa-modal__close"
                onClick={() => setShowIosModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="pwa-modal__body">
              <div className="pwa-step">
                <div className="pwa-step__num">1</div>
                <div className="pwa-step__text">
                  En la barra inferior de <strong>Safari</strong>, toca el botón <strong>Compartir</strong>:
                  <div className="pwa-step__icon-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span>Compartir</span>
                  </div>
                </div>
              </div>

              <div className="pwa-step">
                <div className="pwa-step__num">2</div>
                <div className="pwa-step__text">
                  Baja en el menú de opciones y pulsa en <strong>"Agregar a pantalla de inicio"</strong>:
                  <div className="pwa-step__icon-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span>Agregar a pantalla de inicio</span>
                  </div>
                </div>
              </div>

              <div className="pwa-step">
                <div className="pwa-step__num">3</div>
                <div className="pwa-step__text">
                  Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Ya tendrás la app en tu pantalla principal.
                </div>
              </div>
            </div>

            <div className="pwa-modal__footer">
              <button
                type="button"
                className="pwa-modal__btn"
                onClick={() => setShowIosModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
