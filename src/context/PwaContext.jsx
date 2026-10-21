import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const PwaContext = createContext(null)

const STORAGE_KEY = 'zumaque:pwa_installed'
const DISMISSED_KEY = 'zumaque:pwa_dismissed'

function checkIsStandalone() {
  if (typeof window === 'undefined') return false

  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches

  const isIosStandalone = window.navigator.standalone === true
  const isAndroidTwa = typeof document !== 'undefined' && document.referrer.includes('android-app://')

  let hasPwaParam = false
  try {
    const params = new URLSearchParams(window.location.search)
    hasPwaParam = params.get('source') === 'pwa' || params.get('mode') === 'standalone'
  } catch {}

  return Boolean(isStandaloneMedia || isIosStandalone || isAndroidTwa || hasPwaParam)
}

function checkInitialInstalled() {
  if (checkIsStandalone()) return true
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function PwaProvider({ children }) {
  const [isStandalone, setIsStandalone] = useState(checkIsStandalone)
  const [isInstalled, setIsInstalled] = useState(checkInitialInstalled)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  useEffect(() => {
    const standaloneMode = checkIsStandalone()
    setIsStandalone(standaloneMode)

    if (standaloneMode) {
      setIsInstalled(true)
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {}
    }

    // Detección de iOS (Safari)
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua) && !standaloneMode
    setIsIos(iosDevice)

    // Comprobar si se descartó el aviso en esta sesión
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === 'true') {
        setIsDismissed(true)
      }
    } catch {}

    // 1. Si el navegador ofrece instalar, definitivamente no está instalada aún
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
      setIsInstalled(false)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }

    // 2. Evento cuando la instalación finaliza con éxito
    const handleAppInstalled = () => {
      setCanInstall(false)
      setDeferredPrompt(null)
      setIsInstalled(true)
      setIsStandalone(true)
      setInstalledSuccess(true)
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {}
      setTimeout(() => setInstalledSuccess(false), 4500)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 3. Listener a cambios en modo de pantalla (standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsStandalone(true)
        setIsInstalled(true)
        try {
          localStorage.setItem(STORAGE_KEY, 'true')
        } catch {}
      }
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange)
    }

    // 4. API getInstalledRelatedApps (Chrome 80+ / Android)
    if ('getInstalledRelatedApps' in window.navigator) {
      window.navigator
        .getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true)
            try {
              localStorage.setItem(STORAGE_KEY, 'true')
            } catch {}
          }
        })
        .catch(() => {})
    }

    // 5. Soporte para evento global pwa-open-install
    const handleCustomTrigger = () => {
      setIsDismissed(false)
      if (iosDevice) {
        setShowIosModal(true)
      } else if (deferredPrompt) {
        deferredPrompt.prompt()
      } else {
        setCanInstall(true)
      }
    }
    window.addEventListener('pwa-open-install', handleCustomTrigger)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
      window.removeEventListener('pwa-open-install', handleCustomTrigger)
    }
  }, [deferredPrompt])

  const promptInstall = useCallback(async () => {
    if (isIos) {
      setShowIosModal(true)
      return
    }

    if (!deferredPrompt) {
      // Si no hay prompt nativo pero es Android/Chrome, reintentamos o mostramos modal
      setShowIosModal(true)
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setCanInstall(false)
        setDeferredPrompt(null)
        setIsInstalled(true)
        try {
          localStorage.setItem(STORAGE_KEY, 'true')
        } catch {}
      }
    } catch (err) {
      console.warn('[PWA] Error al disparar prompt:', err)
    }
  }, [deferredPrompt, isIos])

  const dismissBanner = useCallback(() => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true')
    } catch {}
  }, [])

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        isStandalone,
        canInstall,
        isIos,
        showIosModal,
        setShowIosModal,
        isDismissed,
        dismissBanner,
        installedSuccess,
        promptInstall,
      }}
    >
      {children}
    </PwaContext.Provider>
  )
}

export function usePwa() {
  const context = useContext(PwaContext)
  if (!context) {
    throw new Error('usePwa debe ser usado dentro de un PwaProvider')
  }
  return context
}
