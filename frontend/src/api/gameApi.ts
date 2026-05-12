import { apiFetch, apiFetchNoContent } from './client'
import type { BoardCreated, BoardState, BoardSummary } from './types'

export function listBoards(): Promise<BoardSummary[]> {
  return apiFetch<BoardSummary[]>('/api/game/boards')
}

export function getBoard(id: string): Promise<BoardState> {
  return apiFetch<BoardState>(`/api/game/boards/${id}`)
}

export function createBoard(cells: boolean[][]): Promise<BoardCreated> {
  return apiFetch<BoardCreated>('/api/game/boards', {
    method: 'POST',
    body: JSON.stringify({ cells }),
  })
}

export function replaceBoard(id: string, cells: boolean[][]): Promise<BoardState> {
  return apiFetch<BoardState>(`/api/game/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ cells }),
  })
}

export function deleteBoard(id: string): Promise<void> {
  return apiFetchNoContent(`/api/game/boards/${id}`, { method: 'DELETE' })
}

export function nextGeneration(id: string): Promise<BoardState> {
  return apiFetch<BoardState>(`/api/game/boards/${id}/next`)
}

export function advance(id: string, steps: number): Promise<BoardState> {
  return apiFetch<BoardState>(`/api/game/boards/${id}/advance/${steps}`)
}

export function finalState(id: string, maxAttempts: number): Promise<BoardState> {
  const q = new URLSearchParams({ maxAttempts: String(maxAttempts) })
  return apiFetch<BoardState>(`/api/game/boards/${id}/final?${q}`)
}
