type BoardGridProps = {
  cells: boolean[][]
  editable?: boolean
  onToggleCell?: (row: number, column: number) => void
  cellSize?: number
}

export function BoardGrid({
  cells,
  editable = false,
  onToggleCell,
  cellSize = 16,
}: BoardGridProps) {
  return (
    <div
      className="board-grid"
      style={{
        gridTemplateColumns: `repeat(${cells[0]?.length ?? 0}, ${cellSize}px)`,
      }}
      role="grid"
      aria-readonly={!editable}
    >
      {cells.map((row, r) =>
        row.map((alive, c) => (
          <button
            key={`${r}-${c}`}
            type="button"
            role="gridcell"
            aria-pressed={alive}
            aria-label={`Cell row ${r + 1} column ${c + 1}, ${alive ? 'live' : 'dead'}`}
            disabled={!editable}
            className={`board-cell ${alive ? 'board-cell--live' : 'board-cell--dead'}`}
            style={{ width: cellSize, height: cellSize }}
            onClick={() => editable && onToggleCell?.(r, c)}
          />
        )),
      )}
    </div>
  )
}
