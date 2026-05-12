import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as gameApi from '../api/gameApi'
import type { BoardState } from '../api/types'
import { queryKeys } from './keys'

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback
}

export function useGameBoardMutations() {
  const qc = useQueryClient()

  const invalidateSummaries = () => void qc.invalidateQueries({ queryKey: queryKeys.boards })

  const setBoardCache = (board: BoardState) => {
    qc.setQueryData(queryKeys.board(board.id), board)
  }

  const createBoard = useMutation({
    mutationFn: (cells: boolean[][]) => gameApi.createBoard(cells),
    onSuccess: () => {
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'The pattern refused to bind.')),
  })

  const replaceBoard = useMutation({
    mutationFn: ({ id, cells }: { id: string; cells: boolean[][] }) => gameApi.replaceBoard(id, cells),
    onSuccess: (data) => {
      setBoardCache(data)
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'The void would not clear.')),
  })

  const deleteBoard = useMutation({
    mutationFn: (id: string) => gameApi.deleteBoard(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: queryKeys.board(id) })
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'The realm clung on.')),
  })

  const nextGeneration = useMutation({
    mutationFn: (id: string) => gameApi.nextGeneration(id),
    onSuccess: (data) => {
      setBoardCache(data)
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'Time stuttered.')),
  })

  const advance = useMutation({
    mutationFn: ({ id, steps }: { id: string; steps: number }) => gameApi.advance(id, steps),
    onSuccess: (data) => {
      setBoardCache(data)
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'Time stuttered.')),
  })

  const finalState = useMutation({
    mutationFn: ({ id, maxAttempts }: { id: string; maxAttempts: number }) => gameApi.finalState(id, maxAttempts),
    onSuccess: (data) => {
      setBoardCache(data)
      void invalidateSummaries()
    },
    onError: (e) => toast.error(errMessage(e, 'The pattern never slept.')),
  })

  return {
    createBoard,
    replaceBoard,
    deleteBoard,
    nextGeneration,
    advance,
    finalState,
  }
}
