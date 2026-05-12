import { QueryClient } from '@tanstack/react-query'

export function createQueryClient(): QueryClient {
  return new QueryClient({
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
