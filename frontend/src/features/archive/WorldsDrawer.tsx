import { formatWhen } from '../../lib/formatWhen'
import { useAppShellContext } from '../../app/AppShellContext'

export function WorldsDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    summaries,
    selectedId,
    busy,
    arcadeRoute,
    refetchSummaries,
    loadBoard,
    setPreset,
    openForge,
    setArcadeRoute,
  } = useAppShellContext()

  if (!drawerOpen) return null

  return (
    <>
      <div className="drawer-scrim" role="presentation" onClick={() => setDrawerOpen(false)} />
      <aside className="drawer" aria-label="World archives">
        <div className="drawer__head">
          <h2>Realms</h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDrawerOpen(false)}>
            Close
          </button>
        </div>
        <div className="drawer__body">
          <button type="button" className="btn btn--ghost" style={{ width: '100%' }} onClick={() => void refetchSummaries()} disabled={busy}>
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
                      onClick={() => loadBoard(s.id)}
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
              <button type="button" className="btn btn--sm" onClick={() => setPreset('block')} disabled={busy}>
                Cube
              </button>
              <button type="button" className="btn btn--sm" onClick={() => setPreset('blinker')} disabled={busy}>
                Pulse
              </button>
              <button type="button" className="btn btn--sm" onClick={() => setPreset('glider')} disabled={busy}>
                Glide
              </button>
            </div>
            <button type="button" className="btn btn--primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={openForge} disabled={busy}>
              Custom forge
            </button>
          </div>

          <div className="drawer__section">
            <h3>Arcade</h3>
            <button
              type="button"
              className={`btn ${arcadeRoute.kind === 'meteor' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ width: '100%' }}
              onClick={() => {
                setArcadeRoute({ kind: 'meteor', screen: 'menu' })
                setDrawerOpen(false)
              }}
              disabled={busy}
            >
              Meteor shower
            </button>
            <button
              type="button"
              className={`btn ${arcadeRoute.kind === 'invaders' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => {
                setArcadeRoute({ kind: 'invaders', screen: 'menu' })
                setDrawerOpen(false)
              }}
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
