import { skipToken, useQuery } from '@tanstack/react-query'
import { getBoard } from '../api/gameApi'
import { queryKeys } from './keys'

/** Loads a single board when `boardId` is set. Uses `skipToken` so no fetch runs when id is absent. */
export function useBoardDetailQuery(boardId: string | null) {
  return useQuery({
    queryKey: boardId ? queryKeys.board(boardId) : ['game', 'board', 'idle'],
    queryFn: boardId ? () => getBoard(boardId) : skipToken,
  })
}
