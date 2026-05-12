import { useQuery } from '@tanstack/react-query'
import * as meteorScoreApi from '../api/meteorScoreApi'
import { queryKeys } from '../query/keys'

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

type MeteorLeaderboardProps = {
  top?: number
  className?: string
  title?: string
}

export function MeteorLeaderboard({ top = 10, className, title = 'Meteor hall of fame' }: MeteorLeaderboardProps) {
  const q = useQuery({
    queryKey: queryKeys.meteorScores(top),
    queryFn: () => meteorScoreApi.listMeteorScores(top),
    staleTime: 30_000,
  })

  return (
    <div className={`meteor-lb ${className ?? ''}`.trim()}>
      <h3 className="meteor-lb__title">{title}</h3>
      {q.isLoading ? <p className="meteor-lb__muted">Loading…</p> : null}
      {q.isError ? <p className="meteor-lb__muted">Could not load scores.</p> : null}
      {!q.isLoading && !q.isError && q.data?.length ? (
        <ol className="meteor-lb__list">
          {q.data.map((row, i) => (
            <li key={row.id}>
              <span className="meteor-lb__rank">{i + 1}</span>
              <span className="meteor-lb__score mono">{row.score}</span>
              <span className="meteor-lb__meta">
                {row.locks} locks · {formatWhen(row.createdAtUtc)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {!q.isLoading && !q.isError && !q.data?.length ? <p className="meteor-lb__muted">No saved runs yet.</p> : null}
    </div>
  )
}
