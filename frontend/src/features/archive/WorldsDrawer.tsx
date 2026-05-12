import type { BoardSummary } from '../../api/types'
import type { ArcadeRoute } from '../../app/types'
import { formatWhen } from '../../lib/formatWhen'
import type { ForgePresetKey } from '../../lib/forge'

export type WorldsDrawerProps = {
  summaries: BoardSummary[]
  selectedId: string | null
  busy: boolean
  arcadeRoute: ArcadeRoute
  onClose: () => void
  onRefreshSummaries: () => void
  onLoadBoard: (id: string) => void
  onApplyPreset: (key: ForgePresetKey) => void
  onOpenForge: () => void
  onOpenMeteorMenu: () => void
  onOpenInvadersMenu: () => void
}

export function WorldsDrawer({
  summaries,
  selectedId,
  busy,
  arcadeRoute,
  onClose,
  onRefreshSummaries,
  onLoadBoard,
  onApplyPreset,
  onOpenForge,
  onOpenMeteorMenu,
  onOpenInvadersMenu,
}: WorldsDrawerProps) {
  return (
    <>
      <div className="drawer-scrim" role="presentation" onClick={onClose} />
      <aside className="drawer" aria-label="World archives">
        <div className="drawer__head">
          <h2>Realms</h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer__body">
          <button type="button" className="btn btn--ghost" style={{ width: '100%' }} onClick={() => void onRefreshSummaries()} disabled={busy}>
            Refresh archives
          </button>

          <div className="drawer__section">
            <h3>Saved worlds</h3>
            {summaries.length === 0 ? (
              <p className="drawer__empty">None yet—forge one below.</p>
            ) : (
              <ul className="world-list">
                {summaries.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={selectedId === s.id ? 'is-active' : ''}
                      onClick={() => onLoadBoard(s.id)}
                      disabled={busy}
                    >
                      <span className="world-list__name">Realm {i + 1}</span>
                      <span className="world-list__meta">
                        {s.rows}×{s.columns} · {formatWhen(s.updatedAtUtc)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="drawer__section">
            <h3>Quick shapes</h3>
            <div className="preset-grid">
              <button type="button" className="btn btn--sm" onClick={() => onApplyPreset('block')} disabled={busy}>
                Cube
              </button>
              <button type="button" className="btn btn--sm" onClick={() => onApplyPreset('blinker')} disabled={busy}>
                Pulse
              </button>
              <button type="button" className="btn btn--sm" onClick={() => onApplyPreset('glider')} disabled={busy}>
                Glide
              </button>
            </div>
            <button type="button" className="btn btn--primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onOpenForge} disabled={busy}>
              Custom forge
            </button>
          </div>

          <div className="drawer__section">
            <h3>Arcade</h3>
            <button
              type="button"
              className={`btn ${arcadeRoute.kind === 'meteor' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ width: '100%' }}
              onClick={onOpenMeteorMenu}
              disabled={busy}
            >
              Meteor shower
            </button>
            <button
              type="button"
              className={`btn ${arcadeRoute.kind === 'invaders' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={onOpenInvadersMenu}
              disabled={busy}
            >
              Meteor strike
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
