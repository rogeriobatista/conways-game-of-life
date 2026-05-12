import { useCallback, useEffect, useState } from 'react'
import { INVADERS_SCORES_KEY, loadInvadersScores, type InvadersScoreEntry } from '../lib/gameStorage'

function formatWhen(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

type InvadersLeaderboardProps = {
  top?: number
  className?: string
  title?: string
}

export function InvadersLeaderboard({ top = 10, className, title = 'Strike hall of fame' }: InvadersLeaderboardProps) {
  const [rows, setRows] = useState<InvadersScoreEntry[]>(() => loadInvadersScores().slice(0, top))

  const refresh = useCallback(() => {
    setRows(loadInvadersScores().slice(0, top))
  }, [top])

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === INVADERS_SCORES_KEY) refresh()
    }
    const onCustom = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('invaders-scores-changed', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('invaders-scores-changed', onCustom as EventListener)
    }
  }, [refresh])

  return (
    <div className={`meteor-lb ${className ?? ''}`.trim()}>
      <h3 className="meteor-lb__title">{title}</h3>
      {rows.length ? (
        <ol className="meteor-lb__list">
          {rows.map((row, i) => (
            <li key={row.id}>
              <span className="meteor-lb__rank">{i + 1}</span>
              <span className="meteor-lb__score mono">{row.score}</span>
              <span className="meteor-lb__meta">
                {row.status === 'won' ? 'cleared' : 'breached'} · {formatWhen(row.savedAt)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="meteor-lb__muted">No local runs yet.</p>
      )}
    </div>
  )
}
