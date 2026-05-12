import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { BoardState } from './api/types'
import { BoardGrid } from './components/BoardGrid'
import { FallingBlocksPlayground } from './components/FallingBlocksPlayground'
import { MeteorLeaderboard } from './components/MeteorLeaderboard'
import { toastConfirm } from './lib/toastConfirm'
import { useBoardDetailQuery } from './query/useBoardDetailQuery'
import { useBoardSummariesQuery } from './query/useBoardSummariesQuery'
import { useGameBoardMutations } from './query/useGameBoardMutations'
import './App.css'

function emptyGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false))
}

const PRESETS = {
  block: (): boolean[][] => [
    [true, true],
    [true, true],
  ],
  blinker: (): boolean[][] => [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ],
  glider: (): boolean[][] => [
    [false, true, false, false, false],
    [false, false, true, false, false],
    [true, true, true, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
} as const

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [draftRows, setDraftRows] = useState(12)
  const [draftCols, setDraftCols] = useState(16)
  const [draftCells, setDraftCells] = useState<boolean[][]>(() => emptyGrid(12, 16))
  const [advanceSteps, setAdvanceSteps] = useState(5)
  const [finalAttempts, setFinalAttempts] = useState(500)
  const [showArcade, setShowArcade] = useState(false)
  const [lifeTicks, setLifeTicks] = useState(0)

  const boardIdForQuery = !createMode ? selectedId : null
  const boardDetailQuery = useBoardDetailQuery(boardIdForQuery)
  const { data: summaries = [], refetch: refetchSummaries, isError: listError, error: listQueryError } =
    useBoardSummariesQuery()

  const { createBoard, replaceBoard, deleteBoard, nextGeneration, advance, finalState } = useGameBoardMutations()

  const board: BoardState | null =
    !createMode && selectedId ? (boardDetailQuery.data ?? null) : null

  useEffect(() => {
    setLifeTicks(0)
  }, [board?.id])

  useEffect(() => {
    if (!listError || !listQueryError) return
    toast.error(listQueryError instanceof Error ? listQueryError.message : 'Could not reach the archives.')
  }, [listError, listQueryError])

  useEffect(() => {
    if (!boardDetailQuery.isError || !selectedId || createMode) return
    toast.error(
      boardDetailQuery.error instanceof Error
        ? boardDetailQuery.error.message
        : 'That realm could not be opened.',
    )
    setSelectedId(null)
  }, [boardDetailQuery.isError, boardDetailQuery.error, selectedId, createMode])

  const isMutating = useIsMutating() > 0
  const isBoardInitialLoad = Boolean(selectedId) && !createMode && boardDetailQuery.isPending
  const busy = isMutating || isBoardInitialLoad

  const loadBoard = useCallback((id: string) => {
    setSelectedId(id)
    setCreateMode(false)
    setDrawerOpen(false)
  }, [])

  const applyDraftSize = useCallback(() => {
    const r = Math.max(1, Math.min(200, draftRows))
    const c = Math.max(1, Math.min(200, draftCols))
    setDraftRows(r)
    setDraftCols(c)
    setDraftCells((prev) => {
      const next = emptyGrid(r, c)
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          next[i][j] = prev[i]?.[j] ?? false
        }
      }
      return next
    })
  }, [draftRows, draftCols])

  const setPreset = useCallback((key: keyof typeof PRESETS) => {
    const cells = PRESETS[key]()
    setDraftRows(cells.length)
    setDraftCols(cells[0].length)
    setDraftCells(cells.map((row) => [...row]))
    setCreateMode(true)
    setSelectedId(null)
    setDrawerOpen(true)
  }, [])

  const toggleDraft = useCallback((row: number, col: number) => {
    setDraftCells((prev) => {
      const copy = prev.map((r) => [...r])
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const anchorDraft = useCallback(async () => {
    try {
      const created = await createBoard.mutateAsync(draftCells)
      setSelectedId(created.id)
      setCreateMode(false)
      toast.success('Realm anchored')
    } catch {
      /* toast from mutation onError */
    }
  }, [createBoard, draftCells])

  const handleStep = useCallback(() => {
    if (!board) return
    nextGeneration.mutate(board.id, {
      onSuccess: () => setLifeTicks((t) => t + 1),
    })
  }, [board, nextGeneration])

  const handleSprint = useCallback(() => {
    if (!board) return
    const steps = Math.max(1, advanceSteps)
    advance.mutate(
      { id: board.id, steps },
      { onSuccess: () => setLifeTicks((t) => t + steps) },
    )
  }, [board, advance, advanceSteps])

  const handleStillness = useCallback(() => {
    if (!board) return
    finalState.mutate(
      { id: board.id, maxAttempts: finalAttempts },
      {
        onSuccess: () => {
          setLifeTicks((t) => t + 1)
          toast.success('Stillness found')
        },
      },
    )
  }, [board, finalState, finalAttempts])

  const clearBoard = useCallback(() => {
    if (!board) return
    const id = board.id
    const rows = board.rows
    const cols = board.columns
    toastConfirm({
      title: 'Erase every living cell?',
      description: 'The save remains—only the canvas is wiped.',
      confirmLabel: 'Erase all',
      cancelLabel: 'Keep',
      onConfirm: async () => {
        try {
          const empty = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))
          await replaceBoard.mutateAsync({ id, cells: empty })
          setLifeTicks(0)
          toast.success('Canvas cleared')
        } catch {
          /* toast from mutation onError */
        }
      },
    })
  }, [board, replaceBoard])

  const deleteBoardHandler = useCallback(() => {
    if (!board) return
    const id = board.id
    toastConfirm({
      title: 'Destroy this realm?',
      description: 'All memory of it will be gone. This cannot be undone.',
      confirmLabel: 'Destroy',
      cancelLabel: 'Keep',
      onConfirm: async () => {
        try {
          await deleteBoard.mutateAsync(id)
          setSelectedId(null)
          toast.success('Realm destroyed')
        } catch {
          /* toast from mutation onError */
        }
      },
    })
  }, [board, deleteBoard])

  const displayCells = useMemo(() => {
    if (createMode) return draftCells
    return board?.cells ?? []
  }, [createMode, draftCells, board])

  const uploadPlaygroundToApi = useCallback(
    async (cells: boolean[][]) => {
      try {
        const created = await createBoard.mutateAsync(cells)
        setSelectedId(created.id)
        setShowArcade(false)
        toast.success('Storm saved as a realm')
      } catch {
        /* toast from mutation onError */
      }
    },
    [createBoard],
  )

  const openForge = () => {
    setCreateMode(true)
    setSelectedId(null)
    setDrawerOpen(true)
  }

  return (
    <div className="game">
      <header className="game__top">
        <div className="game__brand">
          <h1 className="game__title">Life</h1>
          <p className="game__tagline">Worlds in motion</p>
        </div>

        <div className="game__hud">
          {showArcade ? (
            <span className="hud-pill hud-pill--live">Meteor shower</span>
          ) : board ? (
            <>
              <span className="hud-pill">
                Grid <strong>{board.rows}×{board.columns}</strong>
              </span>
              <span className="hud-pill hud-pill--live">
                Ticks <strong>{lifeTicks}</strong>
              </span>
            </>
          ) : createMode ? (
            <span className="hud-pill hud-pill--live">Forging</span>
          ) : (
            <span className="hud-pill">No realm open</span>
          )}
        </div>

        <div className="game__top-actions">
          {showArcade ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowArcade(false)}>
              ← Realms
            </button>
          ) : null}
          <button
            type="button"
            className={`btn btn--icon ${drawerOpen ? 'btn--primary' : ''}`}
            onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? 'Close archives' : 'Open archives'}
            title="Worlds"
          >
            ◇
          </button>
        </div>
      </header>

      {drawerOpen && (
        <>
          <div className="drawer-scrim" role="presentation" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer" aria-label="World archives">
            <div className="drawer__head">
              <h2>Realms</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDrawerOpen(false)}>
                Close
              </button>
            </div>
            <div className="drawer__body">
              <button type="button" className="btn btn--ghost" style={{ width: '100%' }} onClick={() => void refetchSummaries()} disabled={busy}>
                Refresh archives
              </button>

              <div className="drawer__section">
                <h3>Saved worlds</h3>
                {summaries.length === 0 ? (
                  <p className="drawer__empty">None yet—forge one below.</p>
                ) : (
                  <ul className="world-list">
                    {summaries.map((s, i) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={selectedId === s.id ? 'is-active' : ''}
                          onClick={() => loadBoard(s.id)}
                          disabled={busy}
                        >
                          <span className="world-list__name">Realm {i + 1}</span>
                          <span className="world-list__meta">
                            {s.rows}×{s.columns} · {formatWhen(s.updatedAtUtc)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="drawer__section">
                <h3>Quick shapes</h3>
                <div className="preset-grid">
                  <button type="button" className="btn btn--sm" onClick={() => setPreset('block')} disabled={busy}>
                    Cube
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setPreset('blinker')} disabled={busy}>
                    Pulse
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setPreset('glider')} disabled={busy}>
                    Glide
                  </button>
                </div>
                <button type="button" className="btn btn--primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={openForge} disabled={busy}>
                  Custom forge
                </button>
              </div>

              <div className="drawer__section">
                <h3>Side mode</h3>
                <button
                  type="button"
                  className={`btn ${showArcade ? 'btn--primary' : ''}`}
                  style={{ width: '100%' }}
                  onClick={() => {
                    setShowArcade(true)
                    setDrawerOpen(false)
                  }}
                  disabled={busy}
                >
                  Meteor shower
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="stage">
        {showArcade ? (
          <div className="stage__arena">
            <FallingBlocksPlayground
              busy={busy}
              onUploadToApi={uploadPlaygroundToApi}
              onExitToMain={() => setShowArcade(false)}
            />
          </div>
        ) : createMode ? (
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
                <input type="number" min={1} max={200} value={draftRows} onChange={(e) => setDraftRows(Number(e.target.value))} />
              </label>
              <label>
                Width
                <input type="number" min={1} max={200} value={draftCols} onChange={(e) => setDraftCols(Number(e.target.value))} />
              </label>
              <button type="button" className="btn" onClick={applyDraftSize}>
                Resize
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setCreateMode(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void anchorDraft()} disabled={busy}>
                Anchor world
              </button>
            </div>
            <div className="grid-shell">
              <BoardGrid cells={displayCells} editable onToggleCell={toggleDraft} cellSize={18} />
            </div>
          </div>
        ) : board ? (
          <div className="stage__arena">
            <div className="grid-shell">
              <BoardGrid cells={displayCells} cellSize={18} />
            </div>
          </div>
        ) : (
          <div className="stage__void">
            <h2>The silence is wide</h2>
            <p>Open the archives and choose a saved realm, forge a fresh canvas, or chase the meteor shower.</p>
            <div className="stage__void-actions">
              <button type="button" className="btn btn--primary" onClick={() => setDrawerOpen(true)}>
                Open archives
              </button>
              <button type="button" className="btn" onClick={openForge}>
                Begin forging
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setShowArcade(true)
                }}
              >
                Meteor shower
              </button>
            </div>
            <MeteorLeaderboard top={12} className="stage__meteor-lb" title="Meteor hall of fame" />
          </div>
        )}
      </main>

      {!showArcade && (board || createMode) ? (
        <footer className="dock">
          {board ? (
            <>
              <div className="dock__group">
                <button type="button" className="btn btn--primary" disabled={busy} onClick={handleStep}>
                  Step
                </button>
                <div className="dock__sep" />
                <label>
                  Burst
                  <input type="number" min={1} max={10000} value={advanceSteps} onChange={(e) => setAdvanceSteps(Number(e.target.value))} />
                </label>
                <button type="button" className="btn" disabled={busy} onClick={handleSprint}>
                  Sprint
                </button>
                <div className="dock__sep" />
                <label>
                  Patience
                  <input type="number" min={1} max={100000} value={finalAttempts} onChange={(e) => setFinalAttempts(Number(e.target.value))} />
                </label>
                <button type="button" className="btn" disabled={busy} onClick={handleStillness}>
                  Seek stillness
                </button>
              </div>
              <div className="dock__sep" />
              <div className="dock__group">
                <button type="button" className="btn btn--ghost" disabled={busy} onClick={clearBoard}>
                  Erase canvas
                </button>
                <button type="button" className="btn btn--danger" disabled={busy} onClick={deleteBoardHandler}>
                  Destroy realm
                </button>
              </div>
            </>
          ) : (
            <div className="dock__group">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void anchorDraft()}>
                Anchor world
              </button>
            </div>
          )}
        </footer>
      ) : null}

      {busy ? (
        <div className="busy-curtain" aria-busy="true">
          <div className="busy-curtain__inner">Channeling…</div>
        </div>
      ) : null}
    </div>
  )
}
