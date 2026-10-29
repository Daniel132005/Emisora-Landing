// ============================================================
//  ESPACIOS PUBLICITARIOS ROTATIVOS
// ------------------------------------------------------------
//  Cada "slot" es un espacio de la página. Dentro de cada slot
//  se listan los anuncios que van rotando cada `interval` ms.
//
//  Un anuncio puede ser:
//   - Imagen:  { id, image: '/ads/mi-banner.jpg', href, alt }
//     (coloca las imágenes en /public/ads/)
//   - Placeholder de texto (mientras no haya arte):
//     { id, title, subtitle, phone, bg, fg, href }
//
//  Medidas recomendadas para las imágenes:
//   - banner:   1200 x 250 px
//   - sidebar:   300 x 250 px
// ============================================================

export const adSlots = {
  // Banner grande debajo del reproductor
  banner: {
    interval: 6000,
    ads: [],
  },

  // Columna lateral: un solo espacio fijo que rota todos los anuncios locales
  sidebar: {
    interval: 5000,
    ads: [],
  },
}
