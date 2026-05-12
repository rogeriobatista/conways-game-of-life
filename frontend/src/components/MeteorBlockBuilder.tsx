import { useCallback, useMemo, useState } from 'react'
import { BoardGrid } from './BoardGrid'
import { countLiveCells, trimShape } from '../play/fallingLogic'
import { loadMeteorCustomBlocks, saveMeteorCustomBlocks } from '../lib/gameStorage'

const EDIT_ROWS = 10
const EDIT_COLS = 10

function empty(): boolean[][] {
  return Array.from({ length: EDIT_ROWS }, () => Array(EDIT_COLS).fill(false))
}

type MeteorBlockBuilderProps = {
  onBack: () => void
  onSaved?: () => void
}

export function MeteorBlockBuilder({ onBack, onSaved }: MeteorBlockBuilderProps) {
  const [cells, setCells] = useState<boolean[][]>(() => empty())
  const [savedCount, setSavedCount] = useState(() => loadMeteorCustomBlocks().length)

  const toggle = useCallback((row: number, col: number) => {
    setCells((prev) => {
      const copy = prev.map((r) => [...r])
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const clear = useCallback(() => setCells(empty()), [])

  const addPiece = useCallback(() => {
    const trimmed = trimShape(cells)
    if (!trimmed || countLiveCells(trimmed) === 0) return
    const next = [...loadMeteorCustomBlocks(), trimmed.map((row) => [...row])]
    saveMeteorCustomBlocks(next)
    setSavedCount(next.length)
    clear()
    onSaved?.()
  }, [cells, clear, onSaved])

  const removeAllCustom = useCallback(() => {
    saveMeteorCustomBlocks([])
    setSavedCount(0)
    onSaved?.()
  }, [onSaved])

  const hint = useMemo(
    () => 'Paint a single meteor shape. It is trimmed to a tight box and added to your custom pool (in addition to the built-in pieces).',
    [],
  )

  return (
    <section className="cascade cascade--builder">
      <div className="cascade__head">
        <h2>Meteor block builder</h2>
        <p className="cascade__hint" style={{ margin: 0 }}>
          Custom pieces in pool: <strong>{savedCount}</strong>
        </p>
      </div>
      <p className="cascade__hint">{hint}</p>
      <div className="cascade__actions">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Meteor menu
        </button>
        <button type="button" className="btn" onClick={clear}>
          Clear canvas
        </button>
        <button type="button" className="btn btn--primary" onClick={addPiece}>
          Add piece to pool
        </button>
        <button type="button" className="btn btn--ghost" onClick={removeAllCustom}>
          Remove all custom pieces
        </button>
      </div>
      <div className="grid-shell" style={{ marginTop: '0.75rem' }}>
            <BoardGrid cells={cells} editable onToggleCell={toggle} cellSize={20} />
      </div>
    </section>
  )
}
