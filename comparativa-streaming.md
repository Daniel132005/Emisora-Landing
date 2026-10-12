# Infraestructura de Streaming: Zumaque 90.5 FM

## 1. Requisitos definidos

| Requisito | Decisión |
| :--- | :--- |
| **Modelo de emisión** | Estilo podcast/programas en vivo. **No** hay música 24/7. |
| **Sin locutor al aire** | El stream se apaga y la landing muestra **"Fuera del aire"** + próximo programa. |
| **Cómo transmiten los locutores** | Desde el **navegador** (micrófono), en un panel web con la marca Zumaque. |
| **Grabaciones** | Cada programa queda grabado **completo** y se conserva **7 días**. Archivo interno + opción de **publicar** en la landing. |
| **Calidad** | Sonido de **radio FM**, liviano para **poca cobertura** (Cabimas, Maracaibo): 44.1 kHz, **mono**, 48 kbps / 24 kbps. |
| **Servidor** | VPS Contabo existente: **4 vCPU, 8 GB RAM, 100 GB SSD**, **compartido** con otra aplicación. |

---

## 2. Recomendación: solución ligera a medida (Icecast + ffmpeg + servicio Node)

### 🏆 Veredicto: **Icecast + ffmpeg + servicio propio en Node.js**, no AzuraCast

Con estos requisitos, AzuraCast pierde sus principales ventajas:

- Su gran fuerte es el **AutoDJ** (música continua) → **no se necesita**.
- Su Web DJ tiene la interfaz de AzuraCast → el panel con marca propia **habría que construirlo igual**.
- Su grabación automática solo graba sesiones de locutores (justo lo que se necesita), pero eso se logra fácilmente con `ffmpeg`.
- Cuesta **~1.5–2 GB de RAM** y Docker en un servidor que se comparte con otra aplicación de producción.

La solución a medida hace exactamente lo necesario con **~250–350 MB de RAM**, y todo (panel, reproductor, archivo de programas) mantiene la marca y los datos de Zumaque. El panel es una **aplicación separada** de la landing (ver sección 3).

### Por qué esta combinación y no otras opciones

| Alternativa | Por qué no |
| :--- | :--- |
| Sin Icecast (Node sirve el audio a los oyentes) | Icecast ya resuelve el reparto a muchos oyentes, clientes lentos y estadísticas con ~30 MB. No compensa reprogramarlo. |
| AzuraCast | Su fuerte es la música 24/7 (no se necesita); ~1.5–2 GB de RAM. |
| WebRTC (LiveKit) | Pensado para videollamadas de baja latencia; excesivo para radio y grabar es más complejo. |
| Zeno.fm | De pago (~28–35 USD/mes), sin panel propio ni emisión desde navegador. |

**Riesgo principal:** el código de recepción de audio y reconexión es propio; es la pieza que más hay que probar.

### Cuándo reconsiderar AzuraCast
- Si más adelante se quiere **música 24/7** o programación automática por horarios.
- Si se necesita que locutores transmitan desde **consolas/software externo** (BUTT, OBS) con gestión de cuentas lista.

---

## 3. Piezas y dónde vive cada una

| Pieza | Qué hace | Dónde vive | Quién la ve |
| :--- | :--- | :--- | :--- |
| **Landing** | Reproductor, indicador "En vivo", grabaciones publicadas | Repo `landing-emisora` → `zumaque905.com` | Oyentes |
| **Panel de locutor** | Login, micrófono, botón AL AIRE, gestión de grabaciones | Repo `zumaque-radio/panel` → `panel.zumaque905.com` | Locutores y admin |
| **Servidor Node** | Recibe el audio del panel, controla ffmpeg, sube grabaciones, API | Repo `zumaque-radio/server` → VPS | Nadie (interno) |
| **ffmpeg** | Limpia, procesa ("sonido de radio") y comprime el audio; genera todas las salidas | VPS (lo arranca el servidor Node al salir al aire) | Nadie |
| **Icecast** | Reparte el stream continuo a cada oyente (un "repetidor") | VPS → `radio.zumaque905.com/normal.aac` y `/ahorro.aac` | Nadie (solo el audio) |
| **HLS (Nginx)** | Sirve el audio en trozos para señal débil | VPS → `radio.zumaque905.com/hls/master.m3u8` | Nadie (solo el audio) |
| **Firebase Storage** | Guarda las grabaciones 7 días y las sirve a los oyentes | Google Cloud (`us-east1`) | Nadie (solo los archivos) |

El panel va **separado de la landing**: tiene otro despliegue y otra seguridad (login, micrófono), y la landing sigue siendo un sitio estático y ligero.

**Icecast y AzuraCast no son APIs externas:** son programas que se instalan y corren como servicios dentro del VPS (como Nginx o MySQL). Firebase sí es un servicio externo.

---

## 4. Cómo funciona

```
 LOCUTOR (navegador)                          VPS CONTABO
 ┌────────────────────────┐  WebSocket (wss)  ┌───────────────────────────────────────────────┐
 │ Login                  │  Opus 128 kbps    │ Servidor Node                                 │
 │ Micrófono              │ ────────────────► │  └─► ffmpeg                                   │
 │ Modo Estudio / Casa    │                   │       1. Decodifica                           │
 │ Botón AL AIRE / CORTAR │ ◄──────────────── │       2. Limpia y procesa (sonido de radio)   │
 │ Vúmetro                │  estado, oyentes  │       3. Codifica HE-AAC mono                 │
 └────────────────────────┘                   │          ├─ 48 kbps ─┬─► Icecast /normal.aac ─┼──► OYENTES
                                              │          │           ├─► HLS (trozos de 6 s) ─┼──► (landing)
                                              │          │           └─► Grabación .aac ──────┼──► Firebase
                                              │          └─ 24 kbps ─┬─► Icecast /ahorro.aac ─┼──►
                                              │                      └─► HLS (trozos de 6 s) ─┼──►
                                              │ Nginx (HTTPS) → radio.zumaque905.com          │
                                              └───────────────────────────────────────────────┘
```

1. El locutor entra al panel, inicia sesión, elige programa y modo (Estudio/Casa).
2. Pulsa **AL AIRE**: el navegador captura el micrófono y envía el audio (Opus 128 kbps) por WebSocket al servidor.
3. El servidor arranca **un solo proceso `ffmpeg`** que limpia y procesa el audio y genera **todas las salidas a la vez**: dos calidades por Icecast, dos por HLS y la grabación.
4. Pulsa **CORTAR**: se cierra la emisión, se cierra la grabación y se sube a Firebase Storage.
5. La landing muestra **"🔴 En vivo – [programa]"** u **"Fuera del aire"**, y el número de oyentes.

**Retraso locutor → oyente:** 3–10 s por Icecast; 15–30 s por HLS. Normal en radio por internet.

---

## 5. Calidad de audio: sonido de radio FM, liviano para poca cobertura

### Frecuencia de muestreo vs. bitrate
- **44.1 kHz** (estándar de CD) es la frecuencia de muestreo. No hace falta 48 kHz de estudio: la FM solo reproduce hasta ~15 kHz, y **a igual bitrate el costo es idéntico** (lo que se paga depende de los kbps, no de los kHz).
- **El bitrate (kbps) es lo que decide** el consumo de datos, los oyentes que caben y el costo. Audio sin comprimir "calidad CD" son 1.411 kbps; con HE-AAC se logra sonido de radio con 24–48 kbps (**~97% menos**).

### Por qué mono
- El micrófono del locutor **ya es mono**: en estéreo, los dos canales llevan exactamente lo mismo y se gastan datos para nada.
- **A igual bitrate, mono suena más limpio**: todos los datos van a un solo canal.
- Solo la música en estéreo pierde algo de amplitud; en un formato tipo podcast casi todo es voz. Si se hace un programa musical, se cambia a estéreo con un parámetro.

### Perfil elegido: dos calidades a la vez

| Calidad | Configuración | Datos por hora | Para quién | Cómo suena |
| :--- | :--- | :--- | :--- | :--- |
| **Normal** (por defecto) | HE-AAC v1, 44.1 kHz, **mono, 48 kbps** | **~22 MB** | Wi-Fi, 4G, 3G | Voz limpia y llena, como FM |
| **Ahorro** (señal débil) | HE-AAC v1, 44.1 kHz, **mono, 24 kbps** | **~11 MB** | 3G saturado, 2G/EDGE, pocos datos | Voz clara; la música pierde brillo |

Por debajo de 24 kbps la música suena mal; no se recomienda bajar más.

### Qué calidad aguanta cada red (velocidades reales aproximadas)

| Red | Velocidad típica | Normal 48k | Ahorro 24k |
| :--- | :--- | :--- | :--- |
| 4G / Wi-Fi | 0.5–30 Mbps | ✅ | ✅ |
| **3G** | 0.3–2 Mbps | ✅ | ✅ |
| 3G muy saturado | 100–300 kbps | ⚠️ Cortes posibles | ✅ |
| 2G / EDGE | 50–200 kbps | ❌ | ✅ |

### Datos para el oyente

| Uso | Normal 48k | Ahorro 24k |
| :--- | :--- | :--- |
| 1 hora | ~22 MB | ~11 MB |
| 2 h diarias durante un mes | ~1.3 GB | ~0.65 GB |

### La subida del locutor
- El panel envía **Opus a 128 kbps** (~58 MB por hora de subida): el servidor recibe una fuente limpia y no se acumulan pérdidas al recomprimir.
- **Modo Estudio** (por defecto, con buen micrófono): se **desactivan** la cancelación de eco, la supresión de ruido y el control automático de volumen del navegador, que en radio hacen que la voz suene "robótica" o que el volumen suba y baje solo. El servidor se encarga del sonido.
- **Modo Casa** (lugar ruidoso): se activa la supresión de ruido del navegador.

### Recomendaciones para el estudio (lo que más influye)
- **Micrófono dinámico USB** (~60–80 USD, ej. Samson Q2U, Audio-Technica ATR2100x): rechaza el ruido de la sala. La mejor inversión posible.
- **Audífonos siempre** (evitan eco y acoples).
- Hablar a **5–10 cm** del micrófono, con antipop o espuma.
- Sala con superficies blandas (cortinas, muebles, alfombra) para reducir el eco.

---

## 6. ffmpeg: el procesador de audio del servidor

`ffmpeg` es un programa gratuito y de código abierto (lo usan YouTube, VLC y muchas emisoras). En este sistema actúa como la **"mesa de control" del servidor**.

### Qué hace, paso a paso

| Paso | Qué hace | Por qué |
| :--- | :--- | :--- |
| 1. **Decodifica** | Abre el audio Opus/WebM que envía el navegador | Icecast y muchos reproductores no aceptan ese formato |
| 2. **Limpia** | Filtro de graves y reducción de ruido | Quita golpes, viento, aire acondicionado |
| 3. **Procesa** | Compresor, ecualizador, normalización, limitador | Da el "sonido FM": voz pareja, potente y al mismo volumen en todos los locutores |
| 4. **Codifica** | Comprime a HE-AAC mono 48k y 24k | Reduce los datos ~97% |
| 5. **Reparte** | Envía cada calidad a Icecast, HLS y la grabación | Un solo proceso genera todas las salidas |

### Cadena de procesado ("sonido de radio")

| Filtro ffmpeg | Qué hace |
| :--- | :--- |
| `highpass` (80 Hz) | Quita graves molestos: golpes en la mesa, viento, zumbidos |
| `afftdn` (suave) | Reduce el ruido de fondo constante (aire acondicionado, ventiladores) |
| `deesser` | Suaviza las "eses" silbantes, muy notorias a bitrates bajos |
| `equalizer` (+2–3 dB en ~3 kHz) | Da **presencia**: la voz se entiende mejor, incluso en altavoces de teléfono |
| `acompressor` | Voz pareja y potente (el "sonido FM") |
| `loudnorm` (−16 LUFS) | Todos los locutores al mismo volumen (estándar de streaming) |
| `alimiter` | Ningún pico distorsiona (risas, gritos) |

**Bonus:** el audio procesado se comprime mejor, así que a 24 kbps suena más profesional que sin procesar.

### Qué reduce

| Qué | Antes | Después |
| :--- | :--- | :--- |
| Tamaño de datos | 1.411 kbps (sin comprimir) | 48 / 24 kbps (**~97% menos**) |
| Ruido de fondo | Aire acondicionado, calle | Atenuado |
| Diferencias de volumen | Un locutor grita, otro susurra | Todos parejos |
| Picos | Saturan y distorsionan | Limitados |
| Grabaciones | ~635 MB por hora | ~22 MB por hora |

### Esquema del comando (orientativo; el definitivo se ajusta en la implementación)

```bash
ffmpeg -i pipe:0 \
  -filter_complex "[0:a]highpass=f=80,afftdn=nr=10,deesser,
                   equalizer=f=3000:t=q:w=1:g=2.5,
                   acompressor=threshold=-18dB:ratio=3:attack=10:release=200:makeup=3,
                   loudnorm=I=-16:TP=-1.5:LRA=7,alimiter=limit=0.89,
                   aformat=sample_rates=44100:channel_layouts=mono,asplit=2[normal][ahorro]" \
  -map "[normal]" -c:a libfdk_aac -profile:a aac_he -b:a 48k -f tee \
     "[f=adts]icecast://…/normal.aac | [f=hls]…/hls/normal/index.m3u8 | [f=adts]grabaciones/programa.aac" \
  -map "[ahorro]" -c:a libfdk_aac -profile:a aac_he -b:a 24k -f tee \
     "[f=adts]icecast://…/ahorro.aac | [f=hls]…/hls/ahorro/index.m3u8"
```

### Notas técnicas
- **HE-AAC requiere FDK-AAC** (`libfdk_aac`): el `ffmpeg` de los repositorios no lo incluye. Se compila `ffmpeg` con `--enable-libfdk-aac` (uso en el propio servidor permitido; no se puede redistribuir ese binario). Alternativa sin compilar: el códec `aac` nativo (AAC-LC) a 64 kbps mono, que suena bien para voz pero consume ~33% más.
- **Consumo por emisión:** ~80–120 MB de RAM y ~15–25% de un núcleo (procesado + dos codificaciones).
- **Lo que ffmpeg no hace:** no reparte el audio (eso es Icecast/Nginx), no arregla un mal micrófono o una mala sala, y no recupera los segundos que no llegaron si se corta el internet del locutor.

---

## 7. HLS: modo para señal débil

### Icecast vs. HLS

| | **Icecast** (stream continuo) | **HLS** (trozos de audio) |
| :--- | :--- | :--- |
| Cómo funciona | Una conexión abierta que no para | El audio se corta en trozos de ~6 s que el reproductor descarga uno a uno |
| Si la señal se cae | Se corta la conexión y hay que reconectar desde cero | Solo se reintenta **el trozo** que falló; la emisión sigue |
| Cambio de calidad | El reproductor cambia de stream (pequeño corte) | **Automático, trozo a trozo**, según la red de cada oyente |
| Retraso | 3–10 s | 15–30 s |
| Lo sirve | Icecast | Nginx (archivos normales) |
| Compatibilidad | Todos los navegadores | Safari/iPhone nativo; Chrome/Android con `hls.js` (librería ligera) |
| Lo usan | Radios por internet clásicas | YouTube, apps de radio grandes, Spotify (podcasts en vivo) |

### Cómo se genera
- El **mismo proceso `ffmpeg`** escribe los trozos HLS a la vez que envía a Icecast: **costo 0**.
- Se guardan en **memoria RAM** (`/dev/shm`), solo los últimos ~10 trozos por calidad: unos pocos KB, no tocan el disco.
- Un archivo `master.m3u8` anuncia las dos calidades (48k y 24k) para que el reproductor elija y cambie solo.
- Nginx los sirve con HTTPS en `radio.zumaque905.com/hls/`.

### Estrategia del reproductor de la landing
1. **Arranca por Icecast** en calidad Normal (menor retraso, más simple).
2. Si hay cortes repetidos, el modo ahorro de datos del teléfono está activo o la red es 2G/3G → **cambia a Ahorro**.
3. Si los cortes siguen → **cambia a HLS**, que resiste mucho mejor la señal intermitente.
4. **Reconexión automática** siempre, sin que el oyente toque nada.
5. **Búfer más grande** en modo Ahorro/HLS (15–30 s): si la señal se cae 10 s, el oyente no se entera.
6. Selector manual: "Calidad: Normal / Ahorro de datos".

**Bonus opcional:** con HLS se puede permitir **pausar y continuar** o **retroceder unos minutos** guardando más trozos.

**Plan:** empezar con Icecast + reproductor inteligente y **probar con teléfonos reales en Cabimas y Maracaibo** (3G, 4G débil). HLS queda generado desde el inicio, y se decide con esas pruebas si pasa a ser el modo principal en móviles.

---

## 8. Grabaciones completas de los últimos 7 días

### Cómo se garantiza que queden completas
- **La grabación la hace el servidor, no el navegador:** si el navegador del locutor se cierra o se cuelga, todo lo que ya llegó está guardado.
- **Formato AAC en ADTS (`.aac`):** se puede reproducir aunque el archivo se haya cortado de golpe (no se corrompe como un WAV o MP4 incompleto).
- **Ya procesada:** la grabación sale de ffmpeg con el mismo sonido de radio que escuchan los oyentes.
- **Reconexión automática:** si se cae el internet del locutor, el panel reintenta solo. Si vuelve en menos de ~3 minutos, **continúa en la misma grabación** del programa (los fragmentos se unen al cerrar con `ffmpeg`, sin recodificar).
- **Copia de respaldo local (opcional):** el navegador puede guardar en paralelo una copia del programa y subirla al final si hubo cortes de red.

### Dónde se guardan: VPS mientras se emite, Firebase Storage al terminar
1. Durante la emisión: el archivo se escribe en el VPS (`grabaciones/AAAA-MM-DD_HHMM_programa.aac`, calidad Normal 48 kbps mono).
2. Al cortar: el servidor lo **sube a Firebase Storage** y guarda su ficha (programa, locutor, duración, publicado sí/no).
3. Solo si la subida se confirma, se **borra la copia local**. Si falla, se reintenta sin perder el archivo.

**Ventajas:** el disco del VPS compartido no se llena, las escuchas de grabaciones publicadas no consumen ancho de banda del VPS, y no hace falta respaldarlas.

### Cómo se conservan 7 días
- **Regla de ciclo de vida** en el bucket (Google Cloud Storage): borra automáticamente los archivos con más de 7 días, sin código propio.
- Una tarea diaria del servidor limpia las fichas de grabaciones ya borradas.
- Desde el panel, el admin/locutor puede **descargar** cualquier grabación y marcarla como **publicada**: aparece en la sección de podcasts de la landing hasta que se cumplan sus 7 días.

### Opcional: más Firebase
- **Firebase Auth:** login de locutores.
- **Firestore:** fichas de grabaciones y estado "en vivo". La landing se actualiza al instante sin consultar la API.

### Espacio (48 kbps mono ≈ 22 MB por hora)

| Horas en vivo por día | 7 días de grabaciones |
| :--- | :--- |
| 4 h | ~0.6 GB |
| 8 h | ~1.2 GB |
| 12 h | ~1.8 GB |
| 24 h (máximo teórico) | ~3.6 GB |

Un programa de 3 horas pesa **~65 MB**.

---

## 9. Cómo funciona el ancho de banda

### kbps vs. Mbit/s
| | **48 kbps** | **200 Mbit/s** |
| :--- | :--- | :--- |
| Qué mide | Lo que consume **un oyente** | La capacidad **total** del puerto del servidor |
| Quién lo decide | **Nosotros** (configuración de ffmpeg, gratis) | **Contabo** (según el plan, cuesta dinero) |
| Analogía | El ancho de un coche | El ancho de la autopista |

`Oyentes máximos ≈ puerto ÷ bitrate` → 200.000 kbps ÷ 48 kbps ≈ 4.100 (≈ 3.700 con 10% de margen).

**Estrategia:** primero se ajustan los kbps (gratis); solo si no alcanza, se pagan más Mbit/s.

### Tráfico mensual
**Fórmula:** `tráfico mensual ≈ oyentes promedio × horas al aire al mes × MB por hora`

Ejemplo con **6 horas en vivo al día** (~180 h/mes), todos en Normal 48k (peor caso):

| Oyentes simultáneos | Velocidad sostenida | Tráfico mensual |
| :--- | :--- | :--- |
| 50 | ~2.4 Mbit/s | ~195 GB |
| 100 | ~4.8 Mbit/s | ~390 GB |
| 300 | ~14 Mbit/s | ~1.2 TB |
| 1.000 | ~48 Mbit/s | ~3.9 TB |

- **El locutor** sube un solo stream (~128 kbps): cualquier conexión de casa u oficina sirve.
- **HLS** consume prácticamente lo mismo que Icecast (unos pocos % extra por la división en trozos).
- **En Contabo** el tráfico es ilimitado (política de uso justo); el límite real es la **velocidad del puerto**: 200 Mbit/s en el Cloud VPS 4 (confirmar con `speedtest-cli`), compartida con la otra aplicación.

---

## 10. Servidor: compartido, ubicación y costos

### ✅ Se puede compartir el VPS actual

| Componente | RAM aprox. | CPU aprox. |
| :--- | :--- | :--- |
| Icecast | 30–50 MB | Mínima |
| Servicio Node (panel, API, WebSocket) | 80–150 MB | Mínima |
| ffmpeg (solo mientras hay alguien al aire) | 80–120 MB | ~15–25% de un núcleo |
| HLS (trozos en RAM) | < 5 MB | — |
| **Total** | **~250–350 MB** | **Bajo** |
| Disco (sin contar grabaciones en curso) | < 1 GB | — |

### Cómo se aísla de la otra aplicación
- Servicios propios (systemd o contenedores) **con límite de memoria y CPU**.
- Icecast y el servicio Node escuchan **solo en localhost**; el acceso público entra por el **Nginx existente** con un subdominio propio (`radio.zumaque905.com`) y HTTPS.
- No se tocan los puertos 80/443 ni la configuración de la otra aplicación; solo se añade un nuevo `server` en Nginx.
- **Tope de oyentes** en Icecast para reservar red a la otra aplicación (ver sección 11).
- Las grabaciones solo ocupan disco mientras se emiten y hasta que se suben a Firebase.

### Ubicación del servidor
La radio es de una sola dirección y con búfer, así que **no necesita ping muy bajo**: la diferencia entre EE. UU. (~80–120 ms desde Maracaibo) y Alemania (~180–250 ms) es una décima de segundo sobre un retraso de 3–10 s.

Lo que sí influye con **mala cobertura** es la distancia: el tráfico de Venezuela suele salir por Miami; hasta Alemania suma el cruce del Atlántico, más saltos y algo más de riesgo de cortes en conexiones que pierden paquetes.

| Opción | Costo extra | Para oyentes en Zulia |
| :--- | :--- | :--- |
| **Radio en el VPS actual** (ya en ubicación cercana) | **0** | ⭐⭐⭐ La mejor |
| VPS nuevo en EE. UU. solo para la radio | ~4.40 € + recargo de ubicación (~3 USD) | ⭐⭐⭐ |
| VPS nuevo en Alemania | ~4.40 € | ⭐⭐ Viable; algo más de riesgo de cortes con mala señal |

Firebase Storage: crear el bucket en **`us-east1`**.

### Planes de Contabo (precios orientativos sin IVA; confirmar en contabo.com)
VPS = CPU compartida con otros clientes del mismo servidor físico; VDS = núcleos reservados; dedicado = máquina física completa. Para esta radio **un VPS sobra**: Icecast casi no usa CPU y el límite es la red.

| Plan | vCPU / RAM | Puerto | Oyentes en Normal 48k | Oyentes en Ahorro 24k | Precio aprox. |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloud VPS 4** (actual) | 4 / 8 GB | 200 Mbit/s | **~3.700** | **~7.500** | ~4.40 €/mes |
| Cloud VPS 6 | 6 / 12 GB | 300 Mbit/s | ~5.600 | ~11.200 | ~6 €/mes |
| Cloud VPS 8 | 8 / 24 GB | 600 Mbit/s | ~11.200 | ~22.500 | ~11.20 €/mes |
| Cloud VPS 12 | 12 / 48 GB | 800 Mbit/s | ~15.000 | ~30.000 | ~20 €/mes |
| Cloud VPS 16 | 16 / 64 GB | 1 Gbit/s | ~18.700 | ~37.500 | ~29.60 €/mes |

### Costo mensual total

| Escenario | Qué incluye | Costo mensual |
| :--- | :--- | :--- |
| **A. VPS actual compartido** (recomendado para empezar) | Hasta ~1.000 oyentes reservando red para la otra app | **0 extra** |
| B. VPS solo para la radio | Cloud VPS 4 nuevo, ~3.700 oyentes, sin tocar la otra app | ~4.40 € (+ ~3 USD si es en EE. UU.) |
| C. Crecimiento fuerte | Cloud VPS 8, ~11.200 oyentes | ~11.20 € |
| Icecast, ffmpeg, FDK-AAC, Nginx | Software libre | 0 |
| Firebase Storage | ~1.2 GB almacenados (8 h/día); ~100 GB/mes de descarga incluidos (~1.500 escuchas completas de 3 h) | **~0** (luego ~0.12 USD/GB, ~1 céntimo por escucha de 3 h) |

### Cómo escalar si hace falta (en orden)
1. Medir oyentes reales (`vnstat`).
2. Más gente en calidad Ahorro (gratis).
3. Un **relay** de Icecast en otro VPS barato: suma su propio puerto y aísla la radio.
4. Subir de plan o usar una **CDN** para HLS (decenas de miles de oyentes).

### Cuándo pasar a un VPS solo para la radio
- La otra aplicación ya usa más de ~6 GB de RAM o CPU alta de forma constante.
- La radio afecta la red de la otra aplicación en horas pico.
- Se decide migrar a AzuraCast con música 24/7.

---

## 11. Capacidad estimada y pruebas de carga

Servidor: **4 vCPU, 8 GB RAM, 100 GB SSD**, puerto de **200 Mbit/s**. Cifras **estimadas por cálculo**; los valores reales salen de las pruebas.

**El cuello de botella es la red, no la RAM ni la CPU:** Icecast y Nginx solo copian bytes a cada oyente.

### Oyentes simultáneos

| Recurso | Consumo por oyente | Límite estimado |
| :--- | :--- | :--- |
| **Red (200 Mbit/s)** | 48 kbps (Normal) / 24 kbps (Ahorro) | **~3.700** en Normal, **~7.500** en Ahorro ← límite real |
| RAM | ~100–500 KB de búfer | 10.000+ (no limita) |
| CPU | Casi nula | 10.000+ (no limita) |

| Puerto | Todos en Normal (48k) | Mezcla 70% Normal / 30% Ahorro | Todos en Ahorro (24k) |
| :--- | :--- | :--- | :--- |
| 200 Mbit/s (actual) | **~3.700** | ~4.400 | ~7.500 |
| 1 Gbit/s | ~18.700 | ~22.000 | ~37.500 |

### Resto de piezas

| Pieza | Capacidad estimada | Nota |
| :--- | :--- | :--- |
| Locutores emitiendo | 1 a la vez (un canal) | Cada emisión: ~100 MB RAM y ~15–25% de un núcleo. Técnicamente soportaría varios canales. |
| Panel (locutores/admin) | Decenas | Carga despreciable. |
| API de estado | Miles de peticiones/s con caché | 3.700 oyentes consultando cada 15 s ≈ 250 peticiones/s. Con Firestore, ni llega al VPS. |
| HLS (Nginx) | Igual que Icecast | Archivos pequeños en RAM; Nginx los sirve muy eficientemente. |
| Firebase Storage | Sin límite práctico | El límite es de costo. |

### Ajustes obligatorios para superar ~500 oyentes
1. **Nginx `worker_connections`**: Ubuntu trae 768 por worker y cada oyente proxificado usa 2 conexiones. Subir a ~8192.
2. **Archivos abiertos (`ulimit -n` / `LimitNOFILE`)**: subir de 1024 a 65535 para Icecast y Nginx.
3. **Icecast `<clients>`**: tope acordado (ej. 1.000 ≈ 48 Mbit/s en Normal) para reservar red a la otra aplicación.

### Plan de pruebas
Se ejecutan **desde otra máquina** (VPS temporal por horas); desde el mismo servidor no se mide la red real.

| Prueba | Herramienta | Qué se mide |
| :--- | :--- | :--- |
| Carga de oyentes | Script Node que abre N conexiones (100 → 250 → 500 → 1.000), Icecast y HLS | Mbit/s de salida, RAM/CPU, cortes |
| Estrés | Subir N hasta que algo falle | Punto de ruptura y recuperación |
| API | `k6` o `autocannon` contra `/status` | Peticiones/s y latencia |
| Locutor bajo carga | Emitir durante la prueba | Audio sin cortes y grabación completa |
| Convivencia | Todo lo anterior con la otra app activa | Que la otra app no se degrade |
| **Campo** | Teléfonos reales en Cabimas y Maracaibo (3G, 4G débil) | Cortes, tiempo de arranque, cambio de calidad, Icecast vs. HLS |

Monitoreo: `htop`, `nload`, `vnstat -l`.

---

## 12. Comparativa de opciones

| Criterio | **Ligero a medida (recomendado)** | **AzuraCast** | **Zeno.fm** |
| :--- | :--- | :--- | :--- |
| Costo | 0 (usa el VPS actual) | 0 (VPS) | Plan gratis cerrado a cuentas nuevas; pago desde ~28–35 USD/mes |
| RAM en el VPS | ~250–350 MB | ~1.5–2 GB | 0 |
| Panel de locutor con marca propia | ✅ Hecho a medida | ⚠️ Web DJ de AzuraCast (solo CSS) o panel propio igualmente | ❌ Requiere BUTT/OBS |
| Transmitir desde el navegador | ✅ | ✅ | ❌ |
| Procesado "sonido de radio" | ✅ ffmpeg a medida | ⚠️ Liquidsoap (configurable con scripts) | ❌ |
| Calidad para poca cobertura (24k + HLS) | ✅ | ⚠️ Configurable; HLS incluido | ⚠️ Según plan |
| Grabación por programa + 7 días | ✅ Integrado | ⚠️ Graba sesiones; la limpieza hay que configurarla | ⚠️ Limitado según plan |
| Publicar grabaciones en la landing | ✅ Integrado | ⚠️ Vía API | ⚠️ Limitado |
| Música 24/7 / AutoDJ | ❌ No incluido (no se necesita) | ✅ | ✅ |
| Mantenimiento | Nuestro (código simple) | Actualizaciones de Docker | Ninguno |
| Riesgo para la otra app del VPS | Bajo | Medio (Docker, puertos, RAM) | Ninguno |

---

## 13. Requisitos adicionales

- **HTTPS obligatorio:** la landing es HTTPS, así que el stream y HLS también deben serlo. Además, el navegador **solo permite usar el micrófono en páginas HTTPS**.
- **Subdominios:** `radio.zumaque905.com` (audio) y `panel.zumaque905.com` (panel), con certificados Let's Encrypt.
- **CORS:** Nginx debe permitir que la landing lea HLS y la API desde su dominio.
- **Respaldos:** las grabaciones caducan a los 7 días; lo importante a respaldar es la base de datos (usuarios, programas, fichas) y la configuración, **fuera del VPS**.
- **Derechos de autor:** transmitir música por internet puede requerir licencias distintas a las de FM. Revisar si se emite música en los programas.
- **Locutores:** Chrome o Edge actualizados en PC, micrófono dinámico USB y audífonos.

---

## 14. Pendiente por confirmar

- [x] Plan de Contabo: 4 vCPU, 8 GB RAM, 100 GB SSD.
- [x] Calidad: 44.1 kHz, mono, 48 kbps (Normal) / 24 kbps (Ahorro).
- [ ] Velocidad real del puerto (`speedtest-cli`) y tráfico actual de la otra app (`vnstat -m`).
- [ ] Ubicación actual del VPS (¿EE. UU.?).
- [ ] Consumo actual de la otra aplicación (`free -h`, `df -h`, `docker ps`, `nproc`).
- [ ] ¿El VPS ya usa Nginx y Docker? ¿Sistema operativo?
- [ ] Subdominios a usar para la radio y el panel.
- [ ] Oyentes simultáneos esperados y horas en vivo por día.
- [ ] Número de locutores y si puede haber **dos programas a la vez** (por defecto: un solo canal al aire).
- [ ] ¿Las grabaciones **publicadas** también caducan a los 7 días o se conservan más tiempo?
- [ ] ¿Ya existe un proyecto Firebase (plan Blaze)? ¿Se usa también Firebase Auth / Firestore?
- [ ] Prueba de compatibilidad HE-AAC y HLS en teléfonos reales de la zona.
