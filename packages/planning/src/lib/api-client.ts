// URL de base de l'API Next.js
// Web  : '' (même origine, NEXT_PUBLIC_API_URL absent)
// Tauri: VITE_API_URL = URL de l'instance Next.js déployée
declare const __VITE_API_URL__: string | undefined

function getApiBase(): string {
  // Vite remplace import.meta.env.VITE_API_URL au build
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL as string
  }
  return ''
}

const API_BASE = getApiBase()

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...(API_BASE ? {} : { credentials: 'include' }),
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}
