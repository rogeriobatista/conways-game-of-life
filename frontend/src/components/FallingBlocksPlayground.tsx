import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as meteorScoreApi from '../api/meteorScoreApi'
import { BoardGrid } from './BoardGrid'
import {
  canPlace,
  clearFullRows,
  computeHardDropRow,
  countFullRows,
  countLiveCells,
  emptyGrid,
  mergePiece,
  rotateCw,
  spawnPiece,
} from '../play/fallingLogic'
import { queryKeys } from '../query/keys'

const PLAY_ROWS = 28
const PLAY_COLS = 16
const CELL_SIZE = 16
const AUTO_FALL_MS = 520
const HARD_DROP_ANIM_MS = 230
const LEADERBOARD_TOP = 30

type Piece = { cells: boolean[][]; row: number; col: number }

type GameState = {
  landed: boolean[][]
  piece: Piece
  locks: number
  score: number
  /** Cumulative live cells merged from locked pieces (drives +25 per 10 blocks). */
  placedCellTotal: number
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
  | { type: 'hardDrop' }

function initialGame(): GameState {
  const cleared = emptyGrid(PLAY_ROWS, PLAY_COLS)
  const { landed, piece } = spawnPiece(cleared, PLAY_ROWS, PLAY_COLS)
  return { landed, piece, locks: 0, score: 0, placedCellTotal: 0 }
}

function lockPieceAndSpawn(
  landed: boolean[][],
  piece: Piece,
  meta: Pick<GameState, 'locks' | 'score' | 'placedCellTotal'>,
): GameState {
  const merged = mergePiece(landed, piece.cells, piece.row, piece.col)
  const rowsCleared = countFullRows(merged)
  const afterLines = clearFullRows(merged)
  const spawned = spawnPiece(afterLines, PLAY_ROWS, PLAY_COLS)
  const pieceCells = countLiveCells(piece.cells)
  const placedCellTotal = meta.placedCellTotal + pieceCells
  const oldTiers = Math.floor(meta.placedCellTotal / 10)
  const newTiers = Math.floor(placedCellTotal / 10)
  const placementBonus = (newTiers - oldTiers) * 25
  return {
    landed: spawned.landed,
    piece: spawned.piece,
    locks: meta.locks + 1,
    score: meta.score + rowsCleared * 100 + placementBonus,
    placedCellTotal,
  }
}

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'stop') return null
  if (action.type === 'start' || action.type === 'reset') return initialGame()
  if (!state) return null

  const { landed, piece, locks, score, placedCellTotal } = state

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
      return lockPieceAndSpawn(landed, piece, { locks, score, placedCellTotal })
    }
    case 'hardDrop': {
      let row = piece.row
      while (canPlace(landed, piece.cells, row + 1, piece.col)) row += 1
      return lockPieceAndSpawn(landed, { ...piece, row }, { locks, score, placedCellTotal })
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

function formatScoreboardWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

type FallingBlocksPlaygroundProps = {
  busy?: boolean
  onUploadToApi: (cells: boolean[][]) => Promise<void>
}

export function FallingBlocksPlayground({ busy = false, onUploadToApi }: FallingBlocksPlaygroundProps) {
  const [game, dispatch] = useReducer(gameReducer, null)
  const [manualOpen, setManualOpen] = useState(false)
  const [hotDropY, setHotDropY] = useState(0)
  const [hotDropMotion, setHotDropMotion] = useState(false)
  const [impactFlash, setImpactFlash] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef(game)
  const hardDropAnimLockRef = useRef(false)
  const queryClient = useQueryClient()

  gameRef.current = game

  const leaderboardQuery = useQuery({
    queryKey: queryKeys.meteorScores(LEADERBOARD_TOP),
    queryFn: () => meteorScoreApi.listMeteorScores(LEADERBOARD_TOP),
    enabled: manualOpen,
  })

  const saveMeteorScore = useMutation({
    mutationFn: meteorScoreApi.createMeteorScore,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.meteorScores(LEADERBOARD_TOP) })
    },
    onError: () => {
      toast.error('Could not save score to the archive.')
    },
  })

  const playing = game !== null

  const { cells, hot } = useMemo(
    () => (game ? composite(game.landed, game.piece) : { cells: emptyGrid(PLAY_ROWS, PLAY_COLS), hot: emptyGrid(PLAY_ROWS, PLAY_COLS) }),
    [game],
  )

  const triggerImpactFlash = useCallback(() => {
    setImpactFlash(true)
    window.setTimeout(() => setImpactFlash(false), 420)
  }, [])

  const runHardDropAnimated = useCallback(() => {
    const g = gameRef.current
    if (!g || hardDropAnimLockRef.current) return
    const finalRow = computeHardDropRow(g.landed, g.piece)
    const dist = finalRow - g.piece.row
    if (dist === 0) {
      dispatch({ type: 'hardDrop' })
      triggerImpactFlash()
      return
    }
    hardDropAnimLockRef.current = true
    setHotDropMotion(false)
    setHotDropY(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setHotDropMotion(true)
        setHotDropY(dist * CELL_SIZE)
      })
    })
    window.setTimeout(() => {
      dispatch({ type: 'hardDrop' })
      setHotDropY(0)
      setHotDropMotion(false)
      hardDropAnimLockRef.current = false
      triggerImpactFlash()
    }, HARD_DROP_ANIM_MS)
  }, [triggerImpactFlash])

  useEffect(() => {
    if (!playing) {
      setHotDropY(0)
      setHotDropMotion(false)
      hardDropAnimLockRef.current = false
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), AUTO_FALL_MS)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
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
        case ' ':
          runHardDropAnimated()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, runHardDropAnimated])

  const start = useCallback(() => {
    dispatch({ type: 'start' })
    queueMicrotask(() => wrapRef.current?.focus())
  }, [])

  const stop = useCallback(() => {
    const g = gameRef.current
    if (g && g.score > 0) {
      saveMeteorScore.mutate({
        score: g.score,
        locks: g.locks,
        placedCellTotal: g.placedCellTotal,
      })
    }
    dispatch({ type: 'stop' })
  }, [saveMeteorScore])

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
          <div className="cascade__stats" aria-live="polite">
            <span className="cascade__score">
              Score <strong className="mono">{game.score}</strong>
            </span>
            <span className="cascade__score">
              Anchors <strong>{game.locks}</strong>
            </span>
          </div>
        ) : null}
      </div>

      <div className="cascade__toolbar">
        <button
          type="button"
          className={`btn btn--sm ${manualOpen ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setManualOpen((o) => !o)}
          aria-expanded={manualOpen}
        >
          {manualOpen ? 'Hide manual' : 'Manual'}
        </button>
      </div>

      {manualOpen ? (
        <div className="cascade-manual" id="meteor-manual">
          <div className="cascade-manual__section">
            <h3>Controls</h3>
            <ul>
              <li>
                <strong>← / →</strong> — Move the meteor sideways
              </li>
              <li>
                <strong>↓</strong> — Soft drop (one row)
              </li>
              <li>
                <strong>↑</strong> — Rotate
              </li>
              <li>
                <strong>Space</strong> — Hard drop (animated slam to the bottom of the well)
              </li>
            </ul>
          </div>
          <div className="cascade-manual__section">
            <h3>Scoring</h3>
            <ul>
              <li>
                <strong>+100</strong> for each full horizontal row you clear when a piece locks (multiple rows = multiple bonuses).
              </li>
              <li>
                <strong>+25</strong> each time your cumulative placed cells cross a multiple of <strong>10</strong> (every live cell in a locked piece counts toward that total).
              </li>
            </ul>
            <p className="cascade-manual__note">Score resets when you start a new storm or clear the sky.</p>
          </div>
          <div className="cascade-manual__section">
            <h3>Scoreboard (saved)</h3>
            <p className="cascade-manual__note" style={{ marginTop: 0 }}>
              When you <strong>Leave well</strong>, a run with score greater than zero is stored on the server. Open this manual to refresh the list.
            </p>
            {leaderboardQuery.isLoading ? (
              <p className="cascade-manual__note">Loading…</p>
            ) : leaderboardQuery.isError ? (
              <p className="cascade-manual__note">Could not load scores.</p>
            ) : leaderboardQuery.data?.length ? (
              <ol className="cascade-manual__leaderboard">
                {leaderboardQuery.data.map((row, i) => (
                  <li key={row.id}>
                    <span className="cascade-manual__rank">{i + 1}</span>
                    <span className="cascade-manual__lb-score mono">{row.score}</span>
                    <span className="cascade-manual__lb-meta">
                      {row.locks} locks · {formatScoreboardWhen(row.createdAtUtc)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="cascade-manual__note">No saved runs yet.</p>
            )}
          </div>
        </div>
      ) : null}

      <p className="cascade__hint">
        Arrows + Space. Full rows shatter. Click the well so keys stay here. Open <strong>Manual</strong> for scoring
        and leaderboard.
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
        aria-describedby={manualOpen ? 'meteor-manual' : undefined}
      >
        <div className="grid-shell">
          <BoardGrid
            cells={cells}
            hotMask={hot}
            cellSize={CELL_SIZE}
            hotTranslateY={hotDropY}
            hotMotion={hotDropMotion}
            impactFlash={impactFlash}
          />
        </div>
      </div>
    </section>
  )
}
