import { BoardGrid } from '../../components/BoardGrid'

export type ForgeWorkspaceProps = {
  busy: boolean
  draftRows: number
  draftCols: number
  displayCells: boolean[][]
  onDraftRowsChange: (rows: number) => void
  onDraftColsChange: (cols: number) => void
  onApplyDraftSize: () => void
  onCancel: () => void
  onAnchor: () => void
  onToggleCell: (row: number, col: number) => void
}

export function ForgeWorkspace({
  busy,
  draftRows,
  draftCols,
  displayCells,
  onDraftRowsChange,
  onDraftColsChange,
  onApplyDraftSize,
  onCancel,
  onAnchor,
  onToggleCell,
}: ForgeWorkspaceProps) {
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
          <input type="number" min={1} max={200} value={draftRows} onChange={(e) => onDraftRowsChange(Number(e.target.value))} />
        </label>
        <label>
          Width
          <input type="number" min={1} max={200} value={draftCols} onChange={(e) => onDraftColsChange(Number(e.target.value))} />
        </label>
        <button type="button" className="btn" onClick={onApplyDraftSize}>
          Resize
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" onClick={() => void onAnchor()} disabled={busy}>
          Anchor world
        </button>
      </div>
      <div className="grid-shell">
        <BoardGrid cells={displayCells} editable onToggleCell={onToggleCell} cellSize={18} />
      </div>
    </div>
  )
}
