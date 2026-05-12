type BoardGridProps = {
  cells: boolean[][]
  /** Live cells belonging to the falling / controllable piece (different color) */
  hotMask?: boolean[][]
  editable?: boolean
  onToggleCell?: (row: number, column: number) => void
  cellSize?: number
}

export function BoardGrid({
  cells,
  hotMask,
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
        row.map((alive, c) => {
          const hot = hotMask?.[r]?.[c] ?? false
          const liveClass = hot ? 'board-cell--hot' : alive ? 'board-cell--live' : 'board-cell--dead'
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              role="gridcell"
              aria-pressed={alive}
              aria-label={`Cell row ${r + 1} column ${c + 1}, ${hot ? 'falling piece' : alive ? 'live' : 'dead'}`}
              disabled={!editable}
              className={`board-cell ${liveClass}`}
              style={{ width: cellSize, height: cellSize }}
              onClick={() => editable && onToggleCell?.(r, c)}
            />
          )
        }),
      )}
    </div>
  )
}
