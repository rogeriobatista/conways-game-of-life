import { useCallback, useEffect, useMemo, useState } from 'react'
import * as gameApi from './api/gameApi'
import type { BoardState, BoardSummary } from './api/types'
import { BoardGrid } from './components/BoardGrid'
import { FallingBlocksPlayground } from './components/FallingBlocksPlayground'
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

export default function App() {
  const [summaries, setSummaries] = useState<BoardSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardState | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [draftRows, setDraftRows] = useState(12)
  const [draftCols, setDraftCols] = useState(16)
  const [draftCells, setDraftCells] = useState<boolean[][]>(() => emptyGrid(12, 16))
  const [advanceSteps, setAdvanceSteps] = useState(5)
  const [finalAttempts, setFinalAttempts] = useState(500)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArcade, setShowArcade] = useState(false)

  const refreshList = useCallback(async () => {
    setError(null)
    try {
      setSummaries(await gameApi.listBoards())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to list boards')
    }
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  const loadBoard = useCallback(
    async (id: string) => {
      setError(null)
      setBusy(true)
      try {
        const state = await gameApi.getBoard(id)
        setBoard(state)
        setSelectedId(id)
        setCreateMode(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load board')
      } finally {
        setBusy(false)
      }
    },
    [],
  )

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
    setBoard(null)
    setSelectedId(null)
  }, [])

  const toggleDraft = useCallback((row: number, col: number) => {
    setDraftCells((prev) => {
      const copy = prev.map((r) => [...r])
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const uploadDraft = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      const created = await gameApi.createBoard(draftCells)
      await refreshList()
      await loadBoard(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }, [draftCells, loadBoard, refreshList])

  const run = useCallback(
    async (fn: () => Promise<BoardState>) => {
      if (!selectedId) return
      setError(null)
      setBusy(true)
      try {
        const next = await fn()
        setBoard(next)
        await refreshList()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setBusy(false)
      }
    },
    [selectedId, refreshList],
  )

  const clearBoard = useCallback(async () => {
    if (!board) return
    if (!window.confirm('Clear every cell on this board? The board id stays the same.')) return
    setError(null)
    setBusy(true)
    try {
      const empty = Array.from({ length: board.rows }, () => Array<boolean>(board.columns).fill(false))
      const next = await gameApi.replaceBoard(board.id, empty)
      setBoard(next)
      await refreshList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear board')
    } finally {
      setBusy(false)
    }
  }, [board, refreshList])

  const deleteBoardHandler = useCallback(async () => {
    if (!board) return
    if (!window.confirm(`Delete this board from the server? This cannot be undone.\n\n${board.id}`)) return
    setError(null)
    setBusy(true)
    try {
      await gameApi.deleteBoard(board.id)
      setBoard(null)
      setSelectedId(null)
      await refreshList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete board')
    } finally {
      setBusy(false)
    }
  }, [board, refreshList])

  const displayCells = useMemo(() => {
    if (createMode) return draftCells
    return board?.cells ?? []
  }, [createMode, draftCells, board])

  const displayEditable = createMode

  const onToggle = useCallback(
    (r: number, c: number) => {
      if (createMode) toggleDraft(r, c)
    },
    [createMode, toggleDraft],
  )

  const uploadPlaygroundToApi = useCallback(
    async (cells: boolean[][]) => {
      setError(null)
      setBusy(true)
      try {
        const created = await gameApi.createBoard(cells)
        await refreshList()
        await loadBoard(created.id)
        setShowArcade(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setBusy(false)
      }
    },
    [loadBoard, refreshList],
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Conway&apos;s Game of Life</h1>
        <p className="app-sub">
          Visual client for the monorepo API — evolve patterns stored on the server.
        </p>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-head">
            <h2>Boards</h2>
            <button type="button" className="btn btn--ghost" onClick={() => void refreshList()} disabled={busy}>
              Refresh
            </button>
          </div>
          <ul className="board-list">
            {summaries.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`board-list__item ${selectedId === s.id ? 'board-list__item--active' : ''}`}
                  onClick={() => void loadBoard(s.id)}
                  disabled={busy}
                >
                  <span className="mono">{s.id.slice(0, 8)}…</span>
                  <span className="muted">
                    {s.rows}×{s.columns}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {summaries.length === 0 && <p className="muted small">No boards yet. Create one below.</p>}

          <div className="sidebar-section">
            <h3>New board</h3>
            <button type="button" className="btn" onClick={() => setCreateMode(true)} disabled={busy}>
              Draw custom…
            </button>
            <div className="preset-row">
              <button type="button" className="btn btn--small" onClick={() => setPreset('block')} disabled={busy}>
                Block
              </button>
              <button type="button" className="btn btn--small" onClick={() => setPreset('blinker')} disabled={busy}>
                Blinker
              </button>
              <button type="button" className="btn btn--small" onClick={() => setPreset('glider')} disabled={busy}>
                Glider
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Keyboard</h3>
            <button
              type="button"
              className={`btn ${showArcade ? 'btn--primary' : ''}`}
              onClick={() => setShowArcade((v) => !v)}
              disabled={busy}
            >
              {showArcade ? 'Close falling game' : 'Falling patterns (arrows)'}
            </button>
          </div>
        </aside>

        <main className="main">
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          {showArcade && <FallingBlocksPlayground busy={busy} onUploadToApi={uploadPlaygroundToApi} />}

          {!showArcade && createMode && (
            <section className="panel">
              <h2>Editor</h2>
              <p className="muted small">Toggle cells, then upload to register with the API.</p>
              <div className="form-row">
                <label>
                  Rows
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={draftRows}
                    onChange={(e) => setDraftRows(Number(e.target.value))}
                  />
                </label>
                <label>
                  Cols
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={draftCols}
                    onChange={(e) => setDraftCols(Number(e.target.value))}
                  />
                </label>
                <button type="button" className="btn" onClick={applyDraftSize}>
                  Apply size
                </button>
                <button type="button" className="btn btn--primary" onClick={() => void uploadDraft()} disabled={busy}>
                  Upload board
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setCreateMode(false)}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {!showArcade && !createMode && board && (
            <section className="panel">
              <div className="panel-head">
                <h2>Board</h2>
                <span className="mono muted small">{board.id}</span>
              </div>
              <div className="toolbar">
                <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => gameApi.nextGeneration(board.id))}>
                  Next generation
                </button>
                <label className="toolbar-inline">
                  Steps
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={advanceSteps}
                    onChange={(e) => setAdvanceSteps(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => run(() => gameApi.advance(board.id, advanceSteps))}
                >
                  Advance
                </button>
                <label className="toolbar-inline">
                  Max attempts
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={finalAttempts}
                    onChange={(e) => setFinalAttempts(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => run(() => gameApi.finalState(board.id, finalAttempts))}
                >
                  Run to stable
                </button>
                <span className="toolbar-spacer" aria-hidden />
                <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void clearBoard()}>
                  Clear board
                </button>
                <button type="button" className="btn btn--danger" disabled={busy} onClick={() => void deleteBoardHandler()}>
                  Delete board
                </button>
              </div>
              <p className="muted small">
                &quot;Run to stable&quot; calls <code>/final</code> — still lifes succeed; oscillators usually error
                unless the limit is huge.
              </p>
            </section>
          )}

          {!showArcade && (createMode || board) && (
            <div className="grid-wrap">
              <BoardGrid cells={displayCells} editable={displayEditable} onToggleCell={onToggle} cellSize={18} />
            </div>
          )}

          {!showArcade && !createMode && !board && (
            <p className="muted">Select a board from the list or create a new pattern.</p>
          )}

          {busy && <p className="muted small">Working…</p>}
        </main>
      </div>
    </div>
  )
}
