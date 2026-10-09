// Datos generales de la emisora. Edita aquí sin tocar los componentes.
export const station = {
  name: 'Zumaque 90.5 FM',
  slogan: 'La Fija en tu Radio...',
  // Zona horaria de la emisora: define qué programa está "al aire"
  // para todos los visitantes, estén donde estén.
  timeZone: 'America/Caracas',
  timeZoneLabel: 'Hora Venezuela',
  // URL del stream de audio (Icecast/Shoutcast/Zeno, etc.). Reemplazar por la real.
  streamUrl: 'https://stream.zeno.fm/REEMPLAZAR',
  phone: '+58 414 000 0000',
  whatsapp: '584140000000',
  email: 'publicidad@zumaque905.com',
  address: 'Ciudad, Estado — Venezuela',
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
    tiktok: 'https://tiktok.com/',
  },
}

export const nav = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Programación', href: '#programacion' },
  { label: 'En vivo', href: '#en-vivo' },
  { label: 'Podcasts', href: '#podcasts' },
  { label: 'Voces', href: '#voces' },
  { label: 'Publicidad', href: '#publicidad' },
  { label: 'Contacto', href: '#contacto' },
]

// Programación semanal (lunes a viernes).
export const schedule = [
  { time: '05:00 – 08:00', show: 'Despertar Zumaque', hosts: 'Noticias, clima y buena música' },
  { time: '08:00 – 12:00', show: 'La Mañana Fija', hosts: 'Con María & Andrés' },
  { time: '12:00 – 14:00', show: 'Mediodía Sabroso', hosts: 'Vallenato y tropical' },
  { time: '14:00 – 18:00', show: 'El Ritmo de la Tarde', hosts: 'Con Ana & Carlos' },
  { time: '18:00 – 21:00', show: 'Zona Urbana', hosts: 'Lo más pegado del momento' },
  { time: '21:00 – 00:00', show: 'Noches Románticas', hosts: 'Baladas y despecho' },
]

// Locutores para la franja "Voces de la radio".
// `photo` es opcional: coloca la imagen en /public/voces/ y usa '/voces/archivo.jpg'.
// Sin foto se muestran las iniciales.
export const voices = [
  { name: 'María Pérez', show: 'La Mañana Fija', time: '08:00 – 12:00', photo: '/voces/maria.svg', instagram: '' },
  { name: 'Andrés Gómez', show: 'La Mañana Fija', time: '08:00 – 12:00', photo: '/voces/andres.svg', instagram: '' },
  { name: 'Ana Rodríguez', show: 'El Ritmo de la Tarde', time: '14:00 – 18:00', photo: '/voces/ana.svg', instagram: '' },
  { name: 'Carlos Medina', show: 'El Ritmo de la Tarde', time: '14:00 – 18:00', photo: '/voces/carlos.svg', instagram: '' },
  { name: 'DJ Leo', show: 'Zona Urbana', time: '18:00 – 21:00', photo: '/voces/leo.svg', instagram: '' },
  { name: 'Luis Ramírez', show: 'Noches Románticas', time: '21:00 – 00:00', photo: '/voces/luis.svg', instagram: '' },
]

// Lo que muestra el reproductor cuando no hay un programa en la parrilla
// (madrugadas y fines de semana).
export const defaultShow = { show: 'Música continua', hosts: 'Lo mejor de Zumaque 90.5 FM' }

export const podcasts = [
  { title: 'Historias del Sinú', image: '/mock/podcasts/historias.jpg', desc: 'Relatos y personajes de nuestra región.', duration: '32 min' },
  { title: 'Emprende Local', image: '/mock/podcasts/emprende.jpg', desc: 'Entrevistas a comerciantes y emprendedores.', duration: '25 min' },
  { title: 'Deporte Total', image: '/mock/podcasts/deporte.jpg', desc: 'El análisis deportivo de la semana.', duration: '41 min' },
]
