import { useId } from 'react'
import { siFacebook, siInstagram, siTelegram, siTiktok, siWhatsapp, siX, siYoutube } from 'simple-icons'

// Logos oficiales de cada red (simple-icons, licencia CC0) con su color de marca
export const SOCIAL_NETWORKS = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
  tiktok: siTiktok,
  youtube: siYoutube,
  x: siX,
  telegram: siTelegram,
}

// Degradado oficial de Instagram, aplicado sobre el propio glifo (según su guía de marca)
const INSTAGRAM_GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']

/** Icono de una red social. El color de marca queda disponible en --brand para el CSS. */
export default function SocialIcon({ network, size = 20 }) {
  const gradientId = `ig${useId().replace(/:/g, '')}`
  const icon = SOCIAL_NETWORKS[network]
  if (!icon) return null
  const isInstagram = network === 'instagram'
  return (
    <svg role="img" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      {isInstagram && (
        <defs>
          <radialGradient id={gradientId} cx="0.3" cy="1.07" r="1.3">
            {INSTAGRAM_GRADIENT.map((color, i) => (
              <stop key={color} offset={i / (INSTAGRAM_GRADIENT.length - 1)} stopColor={color} />
            ))}
          </radialGradient>
        </defs>
      )}
      <path d={icon.path} fill={isInstagram ? `url(#${gradientId})` : undefined} />
    </svg>
  )
}
