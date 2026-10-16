import { useState } from 'react'
import { mediaUrl } from '../api/config.js'
import Lightbox from './Lightbox.jsx'

const duration = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')

/** Cuadrícula de miniaturas; al pulsar una se abre el visor. */
export default function GalleryGrid({ items }) {
  const [open, setOpen] = useState(null)

  return (
    <>
      <ul className="gallery__grid">
        {items.map((item, i) => (
          <li key={item.id}>
            <button className="gallery__item" onClick={() => setOpen(i)} aria-label={item.title || (item.type === 'image' ? 'Ver foto' : 'Ver video')}>
              <img src={mediaUrl(item.thumb)} alt="" loading="lazy" />
              {item.type !== 'image' && (
                <span className="gallery__play" aria-hidden="true">
                  ▶{item.type === 'video' && item.durationSec ? <small>{duration(item.durationSec)}</small> : null}
                </span>
              )}
              {item.title && <span className="gallery__caption">{item.title}</span>}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && items[open] && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}
