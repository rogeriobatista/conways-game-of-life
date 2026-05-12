import { InvadersLeaderboard } from '../../components/InvadersLeaderboard'
import { MeteorLeaderboard } from '../../components/MeteorLeaderboard'
import { useAppShellContext } from '../../app/AppShellContext'

export function GamesHub() {
  const { busy, setArcadeRoute, setDrawerOpen, openForge } = useAppShellContext()

  return (
    <div className="stage__void games-hub">
      <h2 className="games-hub__title">Choose a game</h2>
      <p className="games-hub__lead">
        Meteor shower is a falling-block well. Meteor strike is a compact shooter. Conway's Life lives in the archives.
      </p>
      <div className="games-hub__cards">
        <button type="button" className="games-hub__card" onClick={() => setArcadeRoute({ kind: 'meteor', screen: 'menu' })} disabled={busy}>
          <span className="games-hub__card-kicker">Stack &amp; clear</span>
          <span className="games-hub__card-title">Meteor shower</span>
          <span className="games-hub__card-sub">Lines, anchors, and a shared scoreboard.</span>
        </button>
        <button type="button" className="games-hub__card" onClick={() => setArcadeRoute({ kind: 'invaders', screen: 'menu' })} disabled={busy}>
          <span className="games-hub__card-kicker">Defend the deck</span>
          <span className="games-hub__card-title">Meteor strike</span>
          <span className="games-hub__card-sub">Custom formations and ship — scores on this device.</span>
        </button>
      </div>
      <div className="games-hub__life-row">
        <button type="button" className="btn btn--ghost" onClick={() => setDrawerOpen(true)}>
          Life realms
        </button>
        <button type="button" className="btn" onClick={openForge}>
          Forge a board
        </button>
      </div>
      <div className="games-hub__scoreboards">
        <MeteorLeaderboard top={8} title="Meteor hall of fame" />
        <InvadersLeaderboard top={8} title="Strike hall of fame (device)" />
      </div>
    </div>
  )
}
