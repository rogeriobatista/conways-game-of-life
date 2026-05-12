import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createLogger } from '../lib/logger'
import { BoardGrid } from './BoardGrid'
import {
  INVADERS_COLS,
  INVADERS_ROWS,
  SHIP_ROW,
  initialInvadersState,
  moveShip,
  tickInvaders,
  tryFire,
  type InvadersState,
} from '../play/invadersLogic'

const log = createLogger('invaders')

const CELL_SIZE = 22
const TICK_MS = 48

type Game = InvadersState | null

type Action =
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'reset' }
  | { type: 'tick' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'fire' }

function reducer(state: Game, action: Action): Game {
  switch (action.type) {
    case 'stop':
      return null
    case 'start':
    case 'reset':
      return initialInvadersState()
    case 'tick':
      return state ? tickInvaders(state) : state
    case 'left':
      return state ? moveShip(state, -1) : state
    case 'right':
      return state ? moveShip(state, 1) : state
    case 'fire':
      return state ? tryFire(state) : state
    default:
      return state
  }
}

function emptyMask(): boolean[][] {
  return Array.from({ length: INVADERS_ROWS }, () => Array(INVADERS_COLS).fill(false))
}

function composite(state: InvadersState): { cells: boolean[][]; hot: boolean[][] } {
  const cells = state.aliens.map((row) => [...row])
  const hot = emptyMask()
  hot[SHIP_ROW][state.shipCol] = true
  for (const b of state.bullets) {
    if (b.r >= 0 && b.r < INVADERS_ROWS && b.c >= 0 && b.c < INVADERS_COLS) {
      hot[b.r][b.c] = true
    }
  }
  return { cells, hot }
}

type InvadersPlaygroundProps = {
  busy?: boolean
  onExitToMain?: () => void
}

export function InvadersPlayground({ busy = false, onExitToMain }: InvadersPlaygroundProps) {
  const [game, dispatch] = useReducer(reducer, null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  const playing = game !== null
  const activePlay = game?.status === 'playing'

  const { cells, hot } = useMemo(
    () => (game ? composite(game) : { cells: emptyMask(), hot: emptyMask() }),
    [game],
  )

  useEffect(() => {
    if (game?.status === 'won') {
      log.info('Meteor strike: skies cleared!', { score: game.score })
    } else if (game?.status === 'lost') {
      log.info('Meteor strike: formation breached.', { score: game.score })
    }
  }, [game?.status, game?.score])

  useEffect(() => {
    if (!activePlay) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS)
    return () => window.clearInterval(id)
  }, [activePlay])

  useEffect(() => {
    if (!activePlay) return
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
      switch (e.key) {
        case 'ArrowLeft':
          dispatch({ type: 'left' })
          break
        case 'ArrowRight':
          dispatch({ type: 'right' })
          break
        case ' ':
          if (!e.repeat) dispatch({ type: 'fire' })
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePlay])

  const start = useCallback(() => {
    log.info('Meteor strike: launching.')
    dispatch({ type: 'start' })
    queueMicrotask(() => wrapRef.current?.focus())
  }, [])

  const stop = useCallback(() => {
    const g = gameRef.current
    log.info('Meteor strike: leaving battle.', { score: g?.score ?? 0, status: g?.status ?? 'none' })
    dispatch({ type: 'stop' })
  }, [])

  const exitToMain = useCallback(() => {
    dispatch({ type: 'stop' })
    onExitToMain?.()
  }, [onExitToMain])

  const scoreHud = game && (game.status === 'playing' || game.status === 'won' || game.status === 'lost') ? game.score : null

  return (
    <section className="cascade cascade--invaders">
      <div className="cascade__head">
        <h2>Meteor strike</h2>
        {playing && scoreHud !== null ? (
          <div className="cascade__stats" aria-live="polite">
            <span className="cascade__score">
              Score <strong className="mono">{scoreHud}</strong>
            </span>
          </div>
        ) : null}
      </div>

      <p className="cascade__hint">
        Clear the formation before it reaches your ship. <strong>← / →</strong> to slide, <strong>Space</strong> to fire (up to two shots in flight).
      </p>

      <div className="cascade__actions">
        {!playing ? (
          <button type="button" className="btn btn--primary meteor-prelude__start" onClick={start} disabled={busy}>
            Launch
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--ghost" onClick={stop} disabled={busy}>
              Leave battle
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => dispatch({ type: 'reset' })}
              disabled={busy || game?.status !== 'playing'}
            >
              Reset field
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
          aria-label="Meteor strike"
        >
          <div className="grid-shell">
            <BoardGrid cells={cells} hotMask={hot} cellSize={CELL_SIZE} />
          </div>
        </div>

        {game?.status === 'won' ? (
          <div className="meteor-game-over" role="dialog" aria-modal="true" aria-labelledby="invaders-win-title">
            <div className="meteor-game-over__card">
              <h2 id="invaders-win-title">Skies cleared</h2>
              <p className="meteor-game-over__lead">Every target is gone — you held the line.</p>
              <p className="meteor-game-over__scoreline">
                Final score <strong className="mono">{game.score}</strong>
              </p>
              <div className="meteor-game-over__actions">
                <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'reset' })}>
                  Fly again
                </button>
                <button type="button" className="btn btn--ghost" onClick={exitToMain}>
                  Main screen
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {game?.status === 'lost' ? (
          <div className="meteor-game-over" role="dialog" aria-modal="true" aria-labelledby="invaders-lose-title">
            <div className="meteor-game-over__card">
              <h2 id="invaders-lose-title">Breached</h2>
              <p className="meteor-game-over__lead">The formation reached your deck — this sortie is over.</p>
              <p className="meteor-game-over__scoreline">
                Score <strong className="mono">{game.score}</strong>
              </p>
              <div className="meteor-game-over__actions">
                <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'reset' })}>
                  Retry
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
