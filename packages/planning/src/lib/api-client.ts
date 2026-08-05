// URL de base de l'API Next.js
// Web  : '' (même origine)
// Tauri: variable d'env VITE_API_URL (ex: https://app.attendancy.io)
const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : ''

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
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
