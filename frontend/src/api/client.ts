import type { ApiErrorBody } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    throw new Error(`Empty response (${response.status})`)
  }
  return JSON.parse(text) as T
}

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

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const err = (await parseJson<ApiErrorBody>(response)) as ApiErrorBody
      if (err?.message) message = err.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return parseJson<T>(response)
}
