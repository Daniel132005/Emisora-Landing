import { useState } from 'react'
import { useRadio } from '../context/RadioContext.jsx'

export default function PollWidget() {
  const { activePoll, pollVotes, submitPollVote, votePoll } = useRadio()
  const [submittingId, setSubmittingId] = useState(null)

  if (!activePoll || !activePoll.id || !activePoll.question) return null

  const userVotedOptionId = pollVotes ? pollVotes[activePoll.id] : null
  const hasVoted = userVotedOptionId !== undefined && userVotedOptionId !== null
  const totalVotes =
    activePoll.totalVotes ??
    (activePoll.options || []).reduce((acc, o) => acc + (o.votes ?? o.votes_count ?? 0), 0)

  const handleVote = async (optionId) => {
    if (hasVoted || submittingId) return
    setSubmittingId(optionId)
    const doVote = submitPollVote || votePoll
    try {
      if (typeof doVote === 'function') {
        await doVote(optionId)
      }
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <section className="poll-widget" aria-label="Encuesta en vivo">
      <div className="poll-widget__card">
        <div className="poll-widget__header">
          <div className="poll-widget__live-tag">
            <span className="poll-widget__live-dot" />
            <span>ENCUESTA EN VIVO • CABINA</span>
          </div>
          <span className="poll-widget__total" aria-live="polite">
            🗳️ {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
          </span>
        </div>

        <h3 className="poll-widget__question">{activePoll.question}</h3>

        <div className="poll-widget__options">
          {(activePoll.options || []).map((opt) => {
            const isSelected = String(userVotedOptionId) === String(opt.id)
            const count = opt.votes ?? opt.votes_count ?? 0
            const pct =
              opt.percent !== undefined
                ? opt.percent
                : totalVotes > 0
                ? Math.round((count / totalVotes) * 100)
                : 0

            if (hasVoted) {
              // Vista con barras de resultados en tiempo real
              return (
                <div
                  key={opt.id}
                  className={`poll-result-bar ${isSelected ? 'poll-result-bar--selected' : ''}`}
                >
                  <div
                    className="poll-result-bar__fill"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                  <div className="poll-result-bar__label">
                    <span className="poll-result-bar__text">
                      {isSelected && <span className="poll-result-bar__check">✓ </span>}
                      {opt.text}
                    </span>
                    <span className="poll-result-bar__pct">{pct}% ({count})</span>
                  </div>
                </div>
              )
            }

            // Vista de votación interactiva
            return (
              <button
                key={opt.id}
                className="poll-vote-btn"
                onClick={() => handleVote(opt.id)}
                disabled={Boolean(submittingId)}
              >
                <span className="poll-vote-btn__circle" />
                <span className="poll-vote-btn__text">{opt.text}</span>
              </button>
            )
          })}
        </div>

        <div className="poll-widget__footer">
          {hasVoted ? (
            <p className="poll-widget__voted-notice">
              ✓ ¡Gracias por participar! Los resultados se actualizan en vivo con los votos de los oyentes.
            </p>
          ) : (
            <p className="poll-widget__hint">
              Haz clic en tu opción favorita para votar al instante sin registro.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
