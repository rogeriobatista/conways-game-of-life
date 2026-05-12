import { useQuery } from '@tanstack/react-query'
import { listBoards } from '../api/gameApi'
import { queryKeys } from './keys'

export function useBoardSummariesQuery() {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: listBoards,
  })
}
