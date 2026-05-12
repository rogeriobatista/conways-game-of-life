/** Centralized query keys for cache reads, invalidation, and prefetch. */
export const queryKeys = {
  boards: ['game', 'boards'] as const,
  board: (id: string) => ['game', 'board', id] as const,
}
