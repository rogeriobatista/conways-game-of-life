import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ArcadeRoute } from '../app/types'
import type { BoardState } from '../api/types'
import { emptyGrid, FORGE_PRESETS, type ForgePresetKey } from '../lib/forge'
import { loadInvadersSetup, loadMeteorCustomBlocks } from '../lib/gameStorage'
import { createLogger } from '../lib/logger'
import { toastConfirm } from '../lib/toastConfirm'
import { useBoardDetailQuery } from '../query/useBoardDetailQuery'
import { useBoardSummariesQuery } from '../query/useBoardSummariesQuery'
import { useGameBoardMutations } from '../query/useGameBoardMutations'

const log = createLogger('app')

export function useAppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [draftRows, setDraftRows] = useState(12)
  const [draftCols, setDraftCols] = useState(16)
  const [draftCells, setDraftCells] = useState<boolean[][]>(() => emptyGrid(12, 16))
  const [advanceSteps, setAdvanceSteps] = useState(5)
  const [finalAttempts, setFinalAttempts] = useState(500)
  const [arcadeRoute, setArcadeRoute] = useState<ArcadeRoute>({ kind: 'hub' })
  const [meteorCustomKey, setMeteorCustomKey] = useState(0)
  const [invadersSetupKey, setInvadersSetupKey] = useState(0)
  const meteorCustomBlocks = useMemo(() => loadMeteorCustomBlocks(), [meteorCustomKey])
  const invadersSetup = useMemo(() => loadInvadersSetup(), [invadersSetupKey])
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
    log.info('Board selected:', id)
    setSelectedId(id)
    setCreateMode(false)
    setDrawerOpen(false)
    setArcadeRoute({ kind: 'hub' })
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

  const setPreset = useCallback((key: ForgePresetKey) => {
    log.debug('Preset applied:', key)
    const cells = FORGE_PRESETS[key]()
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
    log.info('Anchoring draft board:', { rows: draftRows, cols: draftCols })
    try {
      const created = await createBoard.mutateAsync(draftCells)
      log.info('Board anchored:', created.id)
      setSelectedId(created.id)
      setCreateMode(false)
      toast.success('Realm anchored')
    } catch {
      /* toast from mutation onError */
    }
  }, [createBoard, draftCells, draftRows, draftCols])

  const handleStep = useCallback(() => {
    if (!board) return
    log.debug('Step →', board.id)
    nextGeneration.mutate(board.id, {
      onSuccess: () => setLifeTicks((t) => t + 1),
    })
  }, [board, nextGeneration])

  const handleSprint = useCallback(() => {
    if (!board) return
    const steps = Math.max(1, advanceSteps)
    log.debug('Sprint →', { id: board.id, steps })
    advance.mutate(
      { id: board.id, steps },
      { onSuccess: () => setLifeTicks((t) => t + steps) },
    )
  }, [board, advance, advanceSteps])

  const handleStillness = useCallback(() => {
    if (!board) return
    log.info('Seeking stillness →', { id: board.id, maxAttempts: finalAttempts })
    finalState.mutate(
      { id: board.id, maxAttempts: finalAttempts },
      {
        onSuccess: () => {
          log.info('Stillness reached for board:', board.id)
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
        log.info('Erasing canvas for board:', id)
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
        log.info('Destroying board:', id)
        try {
          await deleteBoard.mutateAsync(id)
          log.info('Board destroyed:', id)
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
      log.info('Uploading arcade board to API:', { rows: cells.length, cols: cells[0]?.length ?? 0 })
      try {
        const created = await createBoard.mutateAsync(cells)
        log.info('Arcade board saved as realm:', created.id)
        setSelectedId(created.id)
        setArcadeRoute({ kind: 'hub' })
        toast.success('Storm saved as a realm')
      } catch {
        /* toast from mutation onError */
      }
    },
    [createBoard],
  )

  const openForge = useCallback(() => {
    log.debug('Opening forge (create mode)')
    setCreateMode(true)
    setSelectedId(null)
    setDrawerOpen(true)
  }, [])

  const arcadePlayOpen =
    (arcadeRoute.kind === 'meteor' || arcadeRoute.kind === 'invaders') && arcadeRoute.screen === 'play'

  return {
    drawerOpen,
    setDrawerOpen,
    selectedId,
    createMode,
    setCreateMode,
    draftRows,
    setDraftRows,
    draftCols,
    setDraftCols,
    advanceSteps,
    setAdvanceSteps,
    finalAttempts,
    setFinalAttempts,
    arcadeRoute,
    setArcadeRoute,
    meteorCustomKey,
    setMeteorCustomKey,
    invadersSetupKey,
    setInvadersSetupKey,
    meteorCustomBlocks,
    invadersSetup,
    lifeTicks,
    board,
    busy,
    summaries,
    refetchSummaries,
    loadBoard,
    applyDraftSize,
    setPreset,
    toggleDraft,
    anchorDraft,
    handleStep,
    handleSprint,
    handleStillness,
    clearBoard,
    deleteBoardHandler,
    displayCells,
    uploadPlaygroundToApi,
    openForge,
    arcadePlayOpen,
  }
}

export type AppShellSnapshot = ReturnType<typeof useAppShell>
