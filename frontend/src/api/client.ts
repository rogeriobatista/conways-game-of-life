import type { ApiErrorBody } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  const text = await response.text()

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      if (text) {
        const err = JSON.parse(text) as ApiErrorBody
        if (err?.message) message = err.message
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (response.status === 204 || !text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

/** DELETE / 204 No Content */
export async function apiFetchNoContent(path: string, init?: RequestInit): Promise<void> {
  await apiFetch<void>(path, init)
}
