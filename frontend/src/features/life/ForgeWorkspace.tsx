import { BoardGrid } from '../../components/BoardGrid'
import { useAppShellContext } from '../../app/AppShellContext'

export function ForgeWorkspace() {
  const {
    busy,
    draftRows,
    draftCols,
    displayCells,
    setDraftRows,
    setDraftCols,
    applyDraftSize,
    setCreateMode,
    anchorDraft,
    toggleDraft,
  } = useAppShellContext()

  return (
    <div className="stage__arena">
      <div className="stage__forge-banner">
        <h2>Forge</h2>
        <p className="cascade__hint" style={{ margin: 0 }}>
          Tap cells to wake or silence them, then anchor your design.
        </p>
      </div>
      <div className="forge-tools">
        <label>
          Height
          <input type="number" min={1} max={200} value={draftRows} onChange={(e) => setDraftRows(Number(e.target.value))} />
        </label>
        <label>
          Width
          <input type="number" min={1} max={200} value={draftCols} onChange={(e) => setDraftCols(Number(e.target.value))} />
        </label>
        <button type="button" className="btn" onClick={applyDraftSize}>
          Resize
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setCreateMode(false)}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" onClick={() => void anchorDraft()} disabled={busy}>
          Anchor world
        </button>
      </div>
      <div className="grid-shell">
        <BoardGrid cells={displayCells} editable onToggleCell={toggleDraft} cellSize={18} />
      </div>
    </div>
  )
}
