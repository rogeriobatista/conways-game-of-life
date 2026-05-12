type BoardGridProps = {
  cells: boolean[][]
  /** Live cells belonging to the falling / controllable piece (different color) */
  hotMask?: boolean[][]
  /** Vertical slide for hot cells only (e.g. hard-drop animation), in pixels */
  hotTranslateY?: number
  /** When true, hot cells animate `transform` changes */
  hotMotion?: boolean
  /** Brief full-grid impact flash after a slam */
  impactFlash?: boolean
  className?: string
  editable?: boolean
  onToggleCell?: (row: number, column: number) => void
  cellSize?: number
}

export function BoardGrid({
  cells,
  hotMask,
  hotTranslateY = 0,
  hotMotion = false,
  impactFlash = false,
  className,
  editable = false,
  onToggleCell,
  cellSize = 16,
}: BoardGridProps) {
  const gridClass = ['board-grid', impactFlash ? 'board-grid--impact' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={gridClass}
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
          const ty = hot ? hotTranslateY : 0
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              role="gridcell"
              aria-pressed={alive}
              aria-label={`Cell row ${r + 1} column ${c + 1}, ${hot ? 'falling piece' : alive ? 'live' : 'dead'}`}
              disabled={!editable}
              className={`board-cell ${liveClass}`}
              style={{
                width: cellSize,
                height: cellSize,
                transform: hot ? `translateY(${ty}px)` : undefined,
                transition: hot && hotMotion ? 'transform 0.22s cubic-bezier(0.18, 0.9, 0.24, 1)' : undefined,
                willChange: hot && hotMotion ? 'transform' : undefined,
              }}
              onClick={() => editable && onToggleCell?.(r, c)}
            />
          )
        }),
      )}
    </div>
  )
}
