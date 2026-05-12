import { useCallback, useMemo, useState } from 'react'
import { BoardGrid } from './BoardGrid'
import {
  INVADERS_COLS,
  INVADERS_ROWS,
  SHIP_ROW,
  alienGridHasLive,
  emptyAlienGrid,
  shipOffsetsFromMask,
} from '../play/invadersLogic'
import { loadInvadersSetup, saveInvadersSetup, type InvadersStoredSetup } from '../lib/gameStorage'

const SHIP_EDIT_ROWS = 7

function emptyShipCanvas(): boolean[][] {
  return Array.from({ length: SHIP_EDIT_ROWS }, () => Array(INVADERS_COLS).fill(false))
}

/** Bottom row of this canvas maps to deck row `SHIP_ROW` in play. */
function emptyAlienCanvas(): boolean[][] {
  return emptyAlienGrid()
}

type InvadersSetupBuilderProps = {
  onBack: () => void
  onSaved?: () => void
}

export function InvadersSetupBuilder({ onBack, onSaved }: InvadersSetupBuilderProps) {
  const initial = useMemo(() => loadInvadersSetup(), [])
  const [aliens, setAliens] = useState<boolean[][]>(() => {
    if (initial.aliens && alienGridHasLive(initial.aliens)) return initial.aliens.map((r) => [...r])
    return emptyAlienCanvas()
  })
  const [ship, setShip] = useState<boolean[][]>(() => {
    if (initial.shipMask?.length) return initial.shipMask.map((r) => [...r])
    return emptyShipCanvas()
  })

  const toggleAlien = useCallback((row: number, col: number) => {
    setAliens((prev) => {
      const copy = prev.map((r) => [...r])
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const toggleShip = useCallback((row: number, col: number) => {
    setShip((prev) => {
      const copy = prev.map((r) => [...r])
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const resetFormation = useCallback(() => setAliens(emptyAlienCanvas()), [])
  const resetShip = useCallback(() => setShip(emptyShipCanvas()), [])

  const shipPreview = useMemo(() => shipOffsetsFromMask(ship), [ship])

  const save = useCallback(() => {
    const setup: InvadersStoredSetup = {
      aliens: alienGridHasLive(aliens) ? aliens : undefined,
      shipMask: shipPreview ? ship : undefined,
    }
    saveInvadersSetup(setup)
    onSaved?.()
  }, [aliens, ship, shipPreview, onSaved])

  return (
    <section className="cascade cascade--builder">
      <div className="cascade__head">
        <h2>Invaders setup</h2>
        <p className="cascade__hint" style={{ margin: 0 }}>
          Paint the alien field and your craft. The <strong>bottom row</strong> of the ship grid is the deck on row {SHIP_ROW + 1} in play.
          {!shipPreview ? (
            <>
              {' '}
              <span className="cascade__warn">Ship needs at least one live cell on its bottom row after trimming.</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="cascade__actions">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Strike menu
        </button>
        <button type="button" className="btn btn--primary" onClick={save}>
          Save setup
        </button>
        <button type="button" className="btn btn--ghost" onClick={resetFormation}>
          Clear formation
        </button>
        <button type="button" className="btn btn--ghost" onClick={resetShip}>
          Clear ship
        </button>
      </div>

      <div className="builder-split">
        <div>
          <h3 className="builder-split__title">Formation ({INVADERS_ROWS}×{INVADERS_COLS})</h3>
          <p className="cascade__hint" style={{ marginTop: 0 }}>
            Leave empty to use the classic staggered wave when you save.
          </p>
          <div className="grid-shell">
            <BoardGrid cells={aliens} editable onToggleCell={toggleAlien} cellSize={16} />
          </div>
        </div>
        <div>
          <h3 className="builder-split__title">Ship ({SHIP_EDIT_ROWS}×{INVADERS_COLS})</h3>
          <p className="cascade__hint" style={{ marginTop: 0 }}>
            Omit or clear to use the default single-cell ship.
          </p>
          <div className="grid-shell">
            <BoardGrid cells={ship} editable onToggleCell={toggleShip} cellSize={20} />
          </div>
        </div>
      </div>
    </section>
  )
}
