import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../api/config.js'
import { useRadio } from '../context/RadioContext.jsx'
import { useStation } from '../context/StationContext.jsx'

export default function BoothWidget() {
  const { apiUrl: ctxApiUrl, deviceToken } = useRadio()
  const apiUrl = ctxApiUrl || API_URL
  const station = useStation()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('voice') // 'voice' | 'text' | 'whatsapp'

  // Grabador de voz
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [voiceSender, setVoiceSender] = useState('')
  const [voiceSending, setVoiceSending] = useState(false)
  const [voiceSuccess, setVoiceSuccess] = useState(false)
  const [voiceError, setVoiceError] = useState('')

  // Mensaje de texto
  const [textSender, setTextSender] = useState('')
  const [textPhone, setTextPhone] = useState('')
  const [textContent, setTextContent] = useState('')
  const [textSending, setTextSending] = useState(false)
  const [textSuccess, setTextSuccess] = useState(false)
  const [textError, setTextError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Iniciar grabación de audio
  const startRecording = async () => {
    setVoiceError('')
    setVoiceSuccess(false)
    setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      // Usar audio/webm o audio/mp4 según soporte
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordDuration(0)

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 59) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.warn('[Booth] Error micrófono:', err)
      setVoiceError('No se pudo acceder al micrófono. Por favor verifica los permisos del navegador.')
    }
  }

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }

  // Enviar nota de voz al servidor
  const submitVoice = async (e) => {
    e.preventDefault()
    if (!audioBlob) return
    setVoiceSending(true)
    setVoiceError('')

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice_note.webm')
      formData.append('sender_name', voiceSender.trim() || 'Oyente Web')
      formData.append('device_token', deviceToken)

      const res = await fetch(`${apiUrl}/api/public/booth/voice`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setVoiceSuccess(true)
        setAudioBlob(null)
        setAudioUrl(null)
        setVoiceSender('')
        setTimeout(() => {
          setVoiceSuccess(false)
          setIsOpen(false)
        }, 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setVoiceError(data.error || 'No se pudo enviar la nota de voz. Intenta nuevamente.')
      }
    } catch {
      setVoiceError('Error de conexión con la emisora.')
    } finally {
      setVoiceSending(false)
    }
  }

  // Enviar mensaje de texto
  const submitText = async (e) => {
    e.preventDefault()
    if (!textContent.trim()) return
    setTextSending(true)
    setTextError('')

    try {
      const res = await fetch(`${apiUrl}/api/public/booth/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: textSender.trim() || 'Oyente Web',
          sender_name: textSender.trim() || 'Oyente Web',
          senderPhone: textPhone.trim(),
          sender_phone: textPhone.trim(),
          text: textContent.trim(),
          deviceToken,
          device_token: deviceToken,
        }),
      })

      if (res.ok) {
        setTextSuccess(true)
        setTextContent('')
        setTimeout(() => {
          setTextSuccess(false)
          setIsOpen(false)
        }, 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setTextError(data.error || 'No se pudo enviar el mensaje.')
      }
    } catch {
      setTextError('Error de red al conectar con el servidor.')
    } finally {
      setTextSending(false)
    }
  }

  const formatTimer = (sec) => {
    const s = sec % 60
    return `00:${s < 10 ? '0' : ''}${s}`
  }

  const whatsappLink = `https://wa.me/${station.whatsapp}?text=Hola%20Zumaque%2090.5%20FM,%20estoy%20escuchando%20la%20radio...`

  return (
    <>
      {/* Botón flotante siempre visible */}
      <div className="booth-fab-container">
        <button
          className="booth-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Contactar cabina de locución"
          title="Habla con cabina en vivo"
        >
          <span className="booth-fab__icon">🎙️</span>
          <span className="booth-fab__text">Cabina Directa</span>
          <span className="booth-fab__pulse" />
        </button>
      </div>

      {/* Modal / Panel de Cabina Directa */}
      {isOpen && (
        <div className="booth-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="booth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="booth-modal__header">
              <div>
                <span className="booth-modal__badge">🔴 Monitor de Locución</span>
                <h3 className="booth-modal__title">Cabina Directa</h3>
                <p className="booth-modal__subtitle">Envía tu voz o mensaje directo al locutor en vivo.</p>
              </div>
              <button
                className="booth-modal__close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {/* Pestañas */}
            <div className="booth-modal__tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'voice'}
                className={`booth-tab ${activeTab === 'voice' ? 'booth-tab--active' : ''}`}
                onClick={() => setActiveTab('voice')}
              >
                🎙️ Nota de Voz
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'text'}
                className={`booth-tab ${activeTab === 'text' ? 'booth-tab--active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                💬 Mensaje Texto
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'whatsapp'}
                className={`booth-tab ${activeTab === 'whatsapp' ? 'booth-tab--active' : ''}`}
                onClick={() => setActiveTab('whatsapp')}
              >
                📱 WhatsApp
              </button>
            </div>

            <div className="booth-modal__body">
              {/* Tab 1: Nota de voz web */}
              {activeTab === 'voice' && (
                <div className="booth-voice-panel">
                  {voiceSuccess ? (
                    <div className="booth-success">
                      <div className="booth-success__icon">🎉</div>
                      <h4>¡Nota de voz recibida!</h4>
                      <p>Tu audio está listo en el monitor del locutor para salir al aire.</p>
                    </div>
                  ) : (
                    <form onSubmit={submitVoice}>
                      <div className="voice-recorder">
                        {!isRecording && !audioBlob && (
                          <div className="voice-recorder__idle">
                            <button
                              type="button"
                              className="voice-record-btn"
                              onClick={startRecording}
                              title="Iniciar grabación de audio"
                            >
                              <span className="voice-record-btn__mic">🎙️</span>
                            </button>
                            <p className="voice-recorder__hint">
                              Toca el micrófono para grabar tu saludo (máximo 60 segundos).
                            </p>
                          </div>
                        )}

                        {isRecording && (
                          <div className="voice-recorder__active">
                            <div className="voice-waveform-animation">
                              <span /><span /><span /><span /><span />
                            </div>
                            <div className="voice-timer">{formatTimer(recordDuration)} / 01:00</div>
                            <button
                              type="button"
                              className="voice-stop-btn"
                              onClick={stopRecording}
                              title="Detener grabación"
                            >
                              ⏹ Detener y Escuchar
                            </button>
                          </div>
                        )}

                        {audioBlob && !isRecording && (
                          <div className="voice-recorder__preview">
                            <p className="voice-preview-title">Escucha tu mensaje antes de enviar:</p>
                            <audio controls src={audioUrl} className="voice-preview-audio" />
                            <div className="voice-preview-actions">
                              <button
                                type="button"
                                className="btn-re-record"
                                onClick={startRecording}
                              >
                                🔄 Grabar de nuevo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {audioBlob && (
                        <div className="booth-fields">
                          <label className="booth-label">
                            Tu nombre o apodo:
                            <input
                              type="text"
                              value={voiceSender}
                              onChange={(e) => setVoiceSender(e.target.value)}
                              placeholder="Ej. Carmen desde Lagunillas"
                              className="booth-input"
                              maxLength={60}
                            />
                          </label>
                          <button
                            type="submit"
                            className="booth-submit-btn"
                            disabled={voiceSending}
                          >
                            {voiceSending ? 'Enviando a cabina...' : '🚀 Enviar Nota de Voz a Cabina'}
                          </button>
                        </div>
                      )}

                      {voiceError && <p className="booth-error">{voiceError}</p>}
                    </form>
                  )}
                </div>
              )}

              {/* Tab 2: Mensaje de texto */}
              {activeTab === 'text' && (
                <div className="booth-text-panel">
                  {textSuccess ? (
                    <div className="booth-success">
                      <div className="booth-success__icon">🎉</div>
                      <h4>¡Mensaje enviado con éxito!</h4>
                      <p>El locutor ya tiene tu mensaje en pantalla.</p>
                    </div>
                  ) : (
                    <form onSubmit={submitText} className="booth-fields">
                      <label className="booth-label">
                        Tu nombre:
                        <input
                          type="text"
                          required
                          value={textSender}
                          onChange={(e) => setTextSender(e.target.value)}
                          placeholder="Tu nombre o apodo"
                          className="booth-input"
                          maxLength={60}
                        />
                      </label>

                      <label className="booth-label">
                        Teléfono o WhatsApp (opcional):
                        <input
                          type="tel"
                          value={textPhone}
                          onChange={(e) => setTextPhone(e.target.value)}
                          placeholder="+58 412 000 0000"
                          className="booth-input"
                          maxLength={25}
                        />
                      </label>

                      <label className="booth-label">
                        Mensaje para el locutor:
                        <textarea
                          required
                          rows={4}
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Pide una canción, envía un saludo a la familia o participa en el debate..."
                          className="booth-textarea"
                          maxLength={300}
                        />
                      </label>

                      <button
                        type="submit"
                        className="booth-submit-btn"
                        disabled={textSending || !textContent.trim()}
                      >
                        {textSending ? 'Enviando...' : '💬 Enviar al Monitor de Cabina'}
                      </button>

                      {textError && <p className="booth-error">{textError}</p>}
                    </form>
                  )}
                </div>
              )}

              {/* Tab 3: WhatsApp Directo */}
              {activeTab === 'whatsapp' && (
                <div className="booth-whatsapp-panel">
                  <div className="whatsapp-info-box">
                    <div className="whatsapp-logo-icon">📱</div>
                    <h4>WhatsApp Oficial de Zumaque</h4>
                    <p>
                      Comunícate directamente con la cabina a través de nuestra línea oficial de WhatsApp para mensajes, audios y fotos.
                    </p>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-launch-btn"
                    >
                      Abrir chat en WhatsApp ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
