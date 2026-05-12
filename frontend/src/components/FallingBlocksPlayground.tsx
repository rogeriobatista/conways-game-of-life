import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { BoardGrid } from './BoardGrid'
import {
  canPlace,
  clearFullRows,
  emptyGrid,
  mergePiece,
  rotateCw,
  spawnPiece,
} from '../play/fallingLogic'

const PLAY_ROWS = 28
const PLAY_COLS = 16
const AUTO_FALL_MS = 520

type Piece = { cells: boolean[][]; row: number; col: number }

type GameState = {
  landed: boolean[][]
  piece: Piece
  locks: number
}

type GameAction =
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'reset' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'down' }
  | { type: 'rotate' }
  | { type: 'tick' }

function initialGame(): GameState {
  const cleared = emptyGrid(PLAY_ROWS, PLAY_COLS)
  const { landed, piece } = spawnPiece(cleared, PLAY_ROWS, PLAY_COLS)
  return { landed, piece, locks: 0 }
}

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'stop') return null
  if (action.type === 'start' || action.type === 'reset') return initialGame()
  if (!state) return null

  const { landed, piece, locks } = state

  switch (action.type) {
    case 'left': {
      if (!canPlace(landed, piece.cells, piece.row, piece.col - 1)) return state
      return { ...state, piece: { ...piece, col: piece.col - 1 } }
    }
    case 'right': {
      if (!canPlace(landed, piece.cells, piece.row, piece.col + 1)) return state
      return { ...state, piece: { ...piece, col: piece.col + 1 } }
    }
    case 'down':
    case 'tick': {
      if (canPlace(landed, piece.cells, piece.row + 1, piece.col)) {
        return { ...state, piece: { ...piece, row: piece.row + 1 } }
      }
      const merged = mergePiece(landed, piece.cells, piece.row, piece.col)
      const afterLines = clearFullRows(merged)
      const spawned = spawnPiece(afterLines, PLAY_ROWS, PLAY_COLS)
      return { landed: spawned.landed, piece: spawned.piece, locks: locks + 1 }
    }
    case 'rotate': {
      const rotated = rotateCw(piece.cells)
      if (canPlace(landed, rotated, piece.row, piece.col)) {
        return { ...state, piece: { ...piece, cells: rotated } }
      }
      for (const dc of [-1, 1, -2, 2, 3, -3]) {
        if (canPlace(landed, rotated, piece.row, piece.col + dc)) {
          return { ...state, piece: { ...piece, cells: rotated, col: piece.col + dc } }
        }
      }
      return state
    }
    default:
      return state
  }
}

function composite(landed: boolean[][], piece: Piece): { cells: boolean[][]; hot: boolean[][] } {
  const rows = landed.length
  const cols = landed[0]?.length ?? 0
  const cells = landed.map((row) => [...row])
  const hot = emptyGrid(rows, cols)
  for (let r = 0; r < piece.cells.length; r++) {
    for (let c = 0; c < piece.cells[r].length; c++) {
      if (!piece.cells[r][c]) continue
      const gr = piece.row + r
      const gc = piece.col + c
      if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
        cells[gr][gc] = true
        hot[gr][gc] = true
      }
    }
  }
  return { cells, hot }
}

type FallingBlocksPlaygroundProps = {
  busy?: boolean
  onUploadToApi: (cells: boolean[][]) => Promise<void>
}

export function FallingBlocksPlayground({ busy = false, onUploadToApi }: FallingBlocksPlaygroundProps) {
  const [game, dispatch] = useReducer(gameReducer, null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const playing = game !== null

  const { cells, hot } = useMemo(
    () => (game ? composite(game.landed, game.piece) : { cells: emptyGrid(PLAY_ROWS, PLAY_COLS), hot: emptyGrid(PLAY_ROWS, PLAY_COLS) }),
    [game],
  )

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), AUTO_FALL_MS)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
      }
      switch (e.key) {
        case 'ArrowLeft':
          dispatch({ type: 'left' })
          break
        case 'ArrowRight':
          dispatch({ type: 'right' })
          break
        case 'ArrowDown':
          dispatch({ type: 'down' })
          break
        case 'ArrowUp':
          dispatch({ type: 'rotate' })
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  const start = useCallback(() => {
    dispatch({ type: 'start' })
    queueMicrotask(() => wrapRef.current?.focus())
  }, [])

  const stop = useCallback(() => dispatch({ type: 'stop' }), [])

  const upload = useCallback(async () => {
    if (!game) return
    const snapshot = clearFullRows(mergePiece(game.landed, game.piece.cells, game.piece.row, game.piece.col))
    await onUploadToApi(snapshot)
  }, [game, onUploadToApi])

  return (
    <section className="cascade">
      <div className="cascade__head">
        <h2>Meteor shower</h2>
        {playing ? (
          <span className="cascade__score">
            Anchors <strong>{game.locks}</strong>
          </span>
        ) : null}
      </div>
      <p className="cascade__hint">
        Arrows: move, soft drop, spin. Full rows shatter. Click the well first so the keys stay here.
      </p>
      <div className="cascade__actions">
        {!playing ? (
          <button type="button" className="btn btn--primary" onClick={start} disabled={busy}>
            Enter storm
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--ghost" onClick={stop} disabled={busy}>
              Leave well
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'reset' })} disabled={busy}>
              Clear sky
            </button>
            <button type="button" className="btn" onClick={() => void upload()} disabled={busy}>
              Save as realm
            </button>
          </>
        )}
      </div>
      <div
        ref={wrapRef}
        className="cascade-focus"
        tabIndex={0}
        role="application"
        aria-label="Meteor shower"
      >
        <div className="grid-shell">
          <BoardGrid cells={cells} hotMask={hot} cellSize={16} />
        </div>
      </div>
    </section>
  )
}
