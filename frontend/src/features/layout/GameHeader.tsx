import type { BoardState } from '../../api/types'
import type { ArcadeRoute } from '../../app/types'

export type GameHeaderProps = {
  arcadeRoute: ArcadeRoute
  board: BoardState | null
  createMode: boolean
  lifeTicks: number
  drawerOpen: boolean
  onToggleDrawer: () => void
  onArcadeHome: () => void
}

export function GameHeader({
  arcadeRoute,
  board,
  createMode,
  lifeTicks,
  drawerOpen,
  onToggleDrawer,
  onArcadeHome,
}: GameHeaderProps) {
  const showArcadeBack = !board && !createMode && arcadeRoute.kind !== 'hub'

  return (
    <header className="game__top">
      <div className="game__brand">
        <h1 className="game__title">Life</h1>
        <p className="game__tagline">Worlds in motion</p>
      </div>

      <div className="game__hud">
        {arcadeRoute.kind === 'meteor' && arcadeRoute.screen === 'play' ? (
          <span className="hud-pill hud-pill--live">Meteor shower</span>
        ) : arcadeRoute.kind === 'invaders' && arcadeRoute.screen === 'play' ? (
          <span className="hud-pill hud-pill--live">Meteor strike</span>
        ) : board ? (
          <>
            <span className="hud-pill">
              Grid <strong>{board.rows}×{board.columns}</strong>
            </span>
            <span className="hud-pill hud-pill--live">
              Ticks <strong>{lifeTicks}</strong>
            </span>
          </>
        ) : createMode ? (
          <span className="hud-pill hud-pill--live">Forging</span>
        ) : arcadeRoute.kind !== 'hub' ? (
          <span className="hud-pill hud-pill--live">Arcade</span>
        ) : (
          <span className="hud-pill">Arcade home</span>
        )}
      </div>

      <div className="game__top-actions">
        {showArcadeBack ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onArcadeHome}>
            ← Arcade home
          </button>
        ) : null}
        <button
          type="button"
          className={`btn btn--icon ${drawerOpen ? 'btn--primary' : ''}`}
          onClick={onToggleDrawer}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'Close archives' : 'Open archives'}
          title="Worlds"
        >
          ◇
        </button>
      </div>
    </header>
  )
}
