import { station } from '../data/station.js'

const perks = [
  { title: 'Cuñas al aire', text: 'Tu mensaje en nuestra programación de mayor sintonía.' },
  { title: 'Banners rotativos', text: 'Presencia en esta página, en los espacios de publicidad local.' },
  { title: 'Menciones en vivo', text: 'Nuestros locutores recomiendan tu negocio en directo.' },
  { title: 'Redes sociales', text: 'Difusión en nuestras cuentas oficiales.' },
]

export default function Advertise() {
  const waText = encodeURIComponent('Hola, quiero información para anunciar en Zumaque 90.5 FM')
  return (
    <section id="publicidad" className="advertise">
      <div className="advertise__intro">
        <h2>¿Tienes un negocio? <span>Haz que te escuchen.</span></h2>
        <p>Paquetes de publicidad a la medida para comercios locales: radio + web.</p>
        <a
          className="btn btn--primary"
          href={`https://wa.me/${station.whatsapp}?text=${waText}`}
          target="_blank" rel="noopener"
        >
          Cotizar por WhatsApp
        </a>
      </div>
      <ul className="advertise__perks">
        {perks.map((p) => (
          <li key={p.title}>
            <strong>{p.title}</strong>
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
