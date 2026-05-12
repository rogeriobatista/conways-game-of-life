import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as meteorScoreApi from '../api/meteorScoreApi'
import { BoardGrid } from './BoardGrid'
import { MeteorLeaderboard } from './MeteorLeaderboard'
import {
  canPlace,
  clearFullRows,
  computeHardDropRow,
  countFullRows,
  countLiveCells,
  emptyGrid,
  mergePiece,
  rotateCw,
  trySpawnPiece,
} from '../play/fallingLogic'
import { queryKeys } from '../query/keys'

const PLAY_ROWS = 28
const PLAY_COLS = 16
const CELL_SIZE = 16
const AUTO_FALL_MS = 520
const HARD_DROP_ANIM_MS = 230
const LEADERBOARD_TOP = 30

type Piece = { cells: boolean[][]; row: number; col: number }

type PlayingState = {
  status: 'playing'
  landed: boolean[][]
  piece: Piece
  locks: number
  score: number
  placedCellTotal: number
}

type OverState = {
  status: 'over'
  landed: boolean[][]
  locks: number
  score: number
  placedCellTotal: number
}

type GameState = PlayingState | OverState

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
  const spawned = trySpawnPiece(cleared, PLAY_ROWS, PLAY_COLS)
  if (!spawned) {
    throw new Error('Empty well must accept a spawn.')
  }
  return {
    status: 'playing',
    landed: spawned.landed,
    piece: spawned.piece,
    locks: 0,
    score: 0,
    placedCellTotal: 0,
  }
}

function lockPieceAndSpawn(
  landed: boolean[][],
  piece: Piece,
  meta: Pick<PlayingState, 'locks' | 'score' | 'placedCellTotal'>,
): GameState {
  const merged = mergePiece(landed, piece.cells, piece.row, piece.col)
  const rowsCleared = countFullRows(merged)
  const afterLines = clearFullRows(merged)
  const pieceCells = countLiveCells(piece.cells)
  const placedCellTotal = meta.placedCellTotal + pieceCells
  const oldTiers = Math.floor(meta.placedCellTotal / 10)
  const newTiers = Math.floor(placedCellTotal / 10)
  const placementBonus = (newTiers - oldTiers) * 25
  const nextScore = meta.score + rowsCleared * 100 + placementBonus
  const nextLocks = meta.locks + 1

  const spawned = trySpawnPiece(afterLines, PLAY_ROWS, PLAY_COLS)
  if (!spawned) {
    return {
      status: 'over',
      landed: afterLines,
      locks: nextLocks,
      score: nextScore,
      placedCellTotal,
    }
  }

  return {
    status: 'playing',
    landed: spawned.landed,
    piece: spawned.piece,
    locks: nextLocks,
    score: nextScore,
    placedCellTotal,
  }
}

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'stop') return null
  if (action.type === 'start' || action.type === 'reset') return initialGame()
  if (!state) return null
  if (state.status === 'over') return state

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

function getComposite(game: GameState): { cells: boolean[][]; hot: boolean[][] } {
  if (game.status === 'over') {
    return { cells: game.landed.map((r) => [...r]), hot: emptyGrid(PLAY_ROWS, PLAY_COLS) }
  }
  const rows = game.landed.length
  const cols = game.landed[0]?.length ?? 0
  const cells = game.landed.map((row) => [...row])
  const hot = emptyGrid(rows, cols)
  const piece = game.piece
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
  /** Called after user leaves from game-over (main realms UI). */
  onExitToMain?: () => void
}

export function FallingBlocksPlayground({ busy = false, onUploadToApi, onExitToMain }: FallingBlocksPlaygroundProps) {
  const [game, dispatch] = useReducer(gameReducer, null)
  const [manualOpen, setManualOpen] = useState(false)
  const [hotDropY, setHotDropY] = useState(0)
  const [hotDropMotion, setHotDropMotion] = useState(false)
  const [impactFlash, setImpactFlash] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef(game)
  const hardDropAnimLockRef = useRef(false)
  const overSaveDoneRef = useRef(false)
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
      void queryClient.invalidateQueries({ queryKey: ['game', 'meteor-scores'] })
    },
    onError: () => {
      toast.error('Could not save score to the archive.')
    },
  })

  useEffect(() => {
    if (game?.status !== 'over') {
      overSaveDoneRef.current = false
      return
    }
    if (overSaveDoneRef.current) return
    overSaveDoneRef.current = true
    if (game.score <= 0) return
    saveMeteorScore.mutate({
      score: game.score,
      locks: game.locks,
      placedCellTotal: game.placedCellTotal,
    })
  }, [game, saveMeteorScore])

  const playing = game !== null
  const activePlay = game?.status === 'playing'

  const { cells, hot } = useMemo(() => (game ? getComposite(game) : { cells: emptyGrid(PLAY_ROWS, PLAY_COLS), hot: emptyGrid(PLAY_ROWS, PLAY_COLS) }), [game])

  const triggerImpactFlash = useCallback(() => {
    setImpactFlash(true)
    window.setTimeout(() => setImpactFlash(false), 420)
  }, [])

  const runHardDropAnimated = useCallback(() => {
    const g = gameRef.current
    if (!g || g.status !== 'playing' || hardDropAnimLockRef.current) return
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
    if (!activePlay) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), AUTO_FALL_MS)
    return () => window.clearInterval(id)
  }, [activePlay])

  useEffect(() => {
    if (!activePlay) return
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
  }, [activePlay, runHardDropAnimated])

  const start = useCallback(() => {
    dispatch({ type: 'start' })
    queueMicrotask(() => wrapRef.current?.focus())
  }, [])

  const stop = useCallback(() => {
    const g = gameRef.current
    if (g && g.status === 'playing' && g.score > 0) {
      saveMeteorScore.mutate({
        score: g.score,
        locks: g.locks,
        placedCellTotal: g.placedCellTotal,
      })
    }
    dispatch({ type: 'stop' })
  }, [saveMeteorScore])

  const exitToMain = useCallback(() => {
    dispatch({ type: 'stop' })
    onExitToMain?.()
  }, [onExitToMain])

  const upload = useCallback(async () => {
    if (!game) return
    const snapshot =
      game.status === 'over'
        ? clearFullRows(game.landed)
        : clearFullRows(mergePiece(game.landed, game.piece.cells, game.piece.row, game.piece.col))
    await onUploadToApi(snapshot)
  }, [game, onUploadToApi])

  const scoreHud = game && (game.status === 'playing' || game.status === 'over') ? game.score : null
  const locksHud = game && (game.status === 'playing' || game.status === 'over') ? game.locks : null

  return (
    <section className="cascade cascade--meteor">
      <div className="cascade__head">
        <h2>Meteor shower</h2>
        {playing && scoreHud !== null ? (
          <div className="cascade__stats" aria-live="polite">
            <span className="cascade__score">
              Score <strong className="mono">{scoreHud}</strong>
            </span>
            <span className="cascade__score">
              Anchors <strong>{locksHud}</strong>
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
            <h3>Game over</h3>
            <p className="cascade-manual__note" style={{ marginTop: 0 }}>
              When the well is full and the next meteor cannot spawn, the run ends. Your score is saved automatically (if above zero). Choose <strong>New storm</strong> or return to the <strong>main screen</strong>.
            </p>
          </div>
          <div className="cascade-manual__section">
            <h3>Scoreboard (saved)</h3>
            <p className="cascade-manual__note" style={{ marginTop: 0 }}>
              Scores are stored when you <strong>Leave well</strong> during play or when a run <strong>ends</strong>. Open this manual to refresh.
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
                      {row.locks} locks · {new Date(row.createdAtUtc).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        Arrows + Space. Fill the well ends the run. Click the well so keys stay here. Open <strong>Manual</strong> for details.
      </p>
      <div className="cascade__actions">
        {!playing ? (
          <button type="button" className="btn btn--primary" onClick={start} disabled={busy}>
            Enter storm
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--ghost" onClick={stop} disabled={busy || game?.status === 'over'}>
              Leave well
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => dispatch({ type: 'reset' })}
              disabled={busy || game?.status === 'over'}
            >
              Clear sky
            </button>
            <button type="button" className="btn" onClick={() => void upload()} disabled={busy}>
              Save as realm
            </button>
          </>
        )}
      </div>
      <div className="cascade__playfield">
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

        {game?.status === 'over' ? (
          <div className="meteor-game-over" role="dialog" aria-modal="true" aria-labelledby="meteor-go-title">
            <div className="meteor-game-over__card">
              <h2 id="meteor-go-title">Well sealed</h2>
              <p className="meteor-game-over__lead">The stack blocked the spawn — this run is over.</p>
              <p className="meteor-game-over__scoreline">
                Final score <strong className="mono">{game.score}</strong>
              </p>
              {game.score > 0 ? (
                <p className="meteor-game-over__saved">Score saved to the hall of fame.</p>
              ) : (
                <p className="meteor-game-over__saved">Score was zero — nothing written to the archive.</p>
              )}
              <div className="meteor-game-over__mini-lb">
                <MeteorLeaderboard top={8} title="Latest top runs" />
              </div>
              <div className="meteor-game-over__actions">
                <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'reset' })}>
                  New storm
                </button>
                <button type="button" className="btn btn--ghost" onClick={exitToMain}>
                  Main screen
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
