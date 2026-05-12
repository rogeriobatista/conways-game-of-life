import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { log } from '../lib/logger'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        log.warn('[QueryCache] Query failed:', {
          queryKey: query.queryKey,
          error: error instanceof Error ? error.message : error,
        })
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        log.error('[MutationCache] Mutation failed:', {
          mutationKey: mutation.options.mutationKey ?? '(no key)',
          error: error instanceof Error ? error.message : error,
        })
      },
      onSuccess(_data, _variables, _context, mutation) {
        log.debug('[MutationCache] Mutation succeeded:', {
          mutationKey: mutation.options.mutationKey ?? '(no key)',
        })
      },
    }),
    defaultOptions: {
      queries: {
        /** Server list rarely needs second-by-second freshness; mutations invalidate explicitly. */
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

/** Single client for the SPA (TanStack recommends one instance per app). */
export const queryClient = createQueryClient()
