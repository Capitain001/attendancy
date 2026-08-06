// URL de base de l'API Next.js
// Web  : '' (même origine, NEXT_PUBLIC_API_URL absent)
// Tauri: VITE_API_URL = URL de l'instance Next.js déployée
function getApiBase(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL as string
  }
  return ''
}

const API_BASE = getApiBase()

// Token JWT injecté par le shell Tauri après login Supabase
let _authToken: string | null = null

export function setAuthToken(token: string | null) {
  _authToken = token
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }

  // Tauri (cross-origin) : Bearer token plutôt que cookie
  if (API_BASE && _authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...(API_BASE ? {} : { credentials: 'include' }),
    headers,
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}
