import { MeteorLeaderboard } from '../../components/MeteorLeaderboard'
import { useAppShellContext } from '../../app/AppShellContext'

export function MeteorArcadeMenu() {
  const { busy, setArcadeRoute } = useAppShellContext()

  return (
    <div className="stage__arena games-submenu">
      <div className="games-submenu__head">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setArcadeRoute({ kind: 'hub' })}>
          ← All games
        </button>
        <h2 className="games-submenu__title">Meteor shower</h2>
      </div>
      <p className="cascade__hint">Stack meteors, clear full rows, and climb the saved scoreboard.</p>
      <div className="games-submenu__actions">
        <button type="button" className="btn btn--primary" onClick={() => setArcadeRoute({ kind: 'meteor', screen: 'play' })} disabled={busy}>
          Start game
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setArcadeRoute({ kind: 'meteor', screen: 'builder' })} disabled={busy}>
          Block builder
        </button>
      </div>
      <MeteorLeaderboard top={12} className="games-submenu__lb" title="Meteor hall of fame" />
    </div>
  )
}
