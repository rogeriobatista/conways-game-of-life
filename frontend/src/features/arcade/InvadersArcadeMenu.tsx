import { InvadersLeaderboard } from '../../components/InvadersLeaderboard'
import { useAppShellContext } from '../../app/AppShellContext'

export function InvadersArcadeMenu() {
  const { busy, setArcadeRoute } = useAppShellContext()

  return (
    <div className="stage__arena games-submenu">
      <div className="games-submenu__head">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setArcadeRoute({ kind: 'hub' })}>
          ← All games
        </button>
        <h2 className="games-submenu__title">Meteor strike</h2>
      </div>
      <p className="cascade__hint">Clear the formation before it reaches your ship. Scores are kept on this device.</p>
      <div className="games-submenu__actions">
        <button type="button" className="btn btn--primary" onClick={() => setArcadeRoute({ kind: 'invaders', screen: 'play' })} disabled={busy}>
          Start game
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setArcadeRoute({ kind: 'invaders', screen: 'builder' })} disabled={busy}>
          Spaceship &amp; formation builder
        </button>
      </div>
      <InvadersLeaderboard top={12} className="games-submenu__lb" title="Strike hall of fame (device)" />
    </div>
  )
}
