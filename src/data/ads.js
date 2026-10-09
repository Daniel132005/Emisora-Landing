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
    ads: [
      {
        id: 'b1', image: '/mock/ads/tu-marca.jpg',
        title: 'Tu marca aquí',
        subtitle: 'Llega a miles de oyentes de tu ciudad todos los días',
        phone: 'Anuncie: +58 414 000 0000',
        bg: 'linear-gradient(120deg,#4b0a7a 0%,#7a1fb0 55%,#ff5a00 100%)',
        fg: '#fff',
        href: '#contacto',
      },
      {
        id: 'b2', image: '/mock/ads/restaurante-banner.jpg',
        title: 'Restaurante El Sabor Criollo',
        subtitle: 'Almuerzos ejecutivos y comida típica — domicilios',
        phone: '0414-123-4567',
        bg: 'linear-gradient(120deg,#7a2e0e 0%,#c2410c 60%,#f59e0b 100%)',
        fg: '#fff',
        href: '#',
      },
      {
        id: 'b3', image: '/mock/ads/automotriz-banner.jpg',
        title: 'Automotriz del Norte',
        subtitle: 'Repuestos, mantenimiento y lavado — Av. Principal, local 3',
        phone: '0412-987-6543',
        bg: 'linear-gradient(120deg,#0f2a5c 0%,#1d4ed8 70%,#60a5fa 100%)',
        fg: '#fff',
        href: '#',
      },
    ],
  },

  // Columna lateral: un solo espacio fijo que rota todos los anuncios locales
  sidebar: {
    interval: 5000,
    ads: [
      { id: 's1', image: '/mock/ads/restaurante.jpg', title: 'Anuncie aquí', subtitle: 'Restaurante El Sabor Criollo', phone: '0414-123-4567', bg: '#5b0f8a', fg: '#fff', href: '#' },
      { id: 's2', image: '/mock/ads/automotriz.jpg', title: 'Anuncie aquí', subtitle: 'Automotriz del Norte', phone: '0412-987-6543', bg: '#1e3a8a', fg: '#fff', href: '#' },
      { id: 's3', image: '/mock/ads/farmacia.jpg', title: 'Anuncie aquí', subtitle: 'Farmacia Salud Total', phone: '0426-444-1122', bg: '#047857', fg: '#fff', href: '#' },
      { id: 's4', image: '/mock/ads/panaderia.jpg', title: 'Anuncie aquí', subtitle: 'Panadería La Espiga', phone: '0424-222-3344', bg: '#9a3412', fg: '#fff', href: '#' },
      { id: 's5', image: '/mock/ads/ferreteria.jpg', title: 'Anuncie aquí', subtitle: 'Ferretería El Constructor', phone: '0416-555-7788', bg: '#374151', fg: '#fff', href: '#' },
      { id: 's6', image: '/mock/ads/optica.jpg', title: 'Anuncie aquí', subtitle: 'Óptica Visión Clara', phone: '0414-888-9900', bg: '#0e7490', fg: '#fff', href: '#' },
    ],
  },
}
