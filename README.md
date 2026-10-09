# Zumaque 90.5 FM — Landing

Landing page de la emisora **Zumaque 90.5 FM** ("La Fija en tu Radio"): reproductor en vivo, programación, podcasts, locutores y espacios de **publicidad rotativa** para comercios locales.

Hecho con **React 18 + Vite**. Sin backend: todo el contenido se edita en archivos de datos.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior
- [pnpm](https://pnpm.io) 9 (`npm i -g pnpm`, o `corepack enable`)

## Inicio rápido

```bash
pnpm install     # instala dependencias
pnpm dev         # servidor de desarrollo → http://localhost:5173
```

| Comando        | Qué hace                                              |
| -------------- | ----------------------------------------------------- |
| `pnpm dev`     | Servidor de desarrollo con recarga automática         |
| `pnpm build`   | Genera la versión de producción en `dist/`            |
| `pnpm preview` | Sirve `dist/` en local para probar el build           |

Para publicar, sube el contenido de `dist/` a cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, cPanel…).

## Antes de publicar (pendientes)

Todo lo siguiente es contenido de ejemplo y debe reemplazarse:

- [ ] **URL del stream** (`streamUrl` en `src/data/station.js`). Sin ella el botón de play da error. Debe ser un enlace de audio directo (MP3/AAC) y empezar con `https://`.
- [ ] **Contacto:** teléfono, WhatsApp, correo, dirección y redes sociales (`station.js`).
- [ ] **Programación, locutores y podcasts** (`station.js`): los nombres son inventados.
- [ ] **Anuncios** (`src/data/ads.js`): negocios y teléfonos de ejemplo.
- [ ] **Imágenes de prueba:** las fotos de `public/mock/` (Unsplash) y los avatares de `public/voces/` (DiceBear) son de relleno. Cámbialas por material propio.

## Qué editar

| Archivo                | Contenido                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| `src/data/station.js`  | Datos de la emisora, menú, programación, locutores y podcasts             |
| `src/data/ads.js`      | Espacios y anuncios rotativos                                             |
| `src/index.css`        | Estilos y colores (variables en `:root`, tomadas del logo)                |
| `src/assets/logo.png`  | Logo optimizado. El original está en `assets/`                            |

### Zona horaria y "Al aire"

`station.timeZone` (ej. `America/Caracas`) define qué programa está al aire para **todos** los visitantes, sin importar dónde estén. La programación se escribe en hora de la emisora y corre de lunes a viernes; fuera de la parrilla se muestra `defaultShow`.

### Publicidad rotativa

`src/data/ads.js` define dos espacios: `banner` (grande, bajo el reproductor) y `sidebar` (columna derecha). Cada uno rota sus anuncios cada `interval` ms y se pausa al pasar el mouse.

```js
{
  id: 'cliente-1',
  image: '/ads/cliente-1.jpg',   // opcional; guarda el archivo en public/ads/
  title: 'Anuncie aquí',         // texto sobre la imagen (opcional)
  subtitle: 'Restaurante El Sabor',
  phone: '0414-123-4567',
  href: 'https://wa.me/584141234567',
}
```

Sin `image`, el anuncio se muestra como tarjeta de color (`bg` y `fg`). Medidas recomendadas: **banner 1200×250**, **sidebar 300×250**.

### Locutores y podcasts

En `station.js`, cada locutor tiene `photo` (ej. `/voces/maria.jpg`, archivo en `public/voces/`) e `instagram` opcional. Cada podcast usa `image` (ej. `/mock/podcasts/historias.jpg`).

## Estructura

```
src/
├── components/   Header, Hero, LivePlayer, MiniPlayer, AdSlot, Schedule,
│                 Podcasts, Voices, Advertise, Footer, VolumeControl
├── context/      RadioContext: un único <audio> compartido por el
│                 reproductor principal y la barra flotante
├── hooks/        useCurrentShow: programa al aire según la hora
├── data/         station.js, ads.js (contenido editable)
└── index.css     Estilos globales y responsive
public/           favicon, imágenes (mock/, voces/, ads/)
assets/           Logo original en alta resolución
```

## Notas

- El reproductor flotante aparece al pasar el reproductor principal y comparte audio y volumen con él. El volumen se recuerda en el navegador de cada visitante.
- Para probar la página desde otro dispositivo sin desplegarla, se puede usar un túnel (por ejemplo `cloudflared tunnel --url http://localhost:4173` sobre `pnpm preview`; el dominio `.trycloudflare.com` ya está permitido en `vite.config.js`).
