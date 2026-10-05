import { useState } from 'react'
import type { ApiOutput } from '@attendancy/types'
import { logout } from "../lib/auth/actions";

type CurrentUser = Extract<ApiOutput<'getCurrentUserAction'>, { data: unknown }>['data']

export function AccountView({ user }: { user: CurrentUser }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setError(null)
    setIsPending(true)
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'La déconnexion a échoué.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-lg space-y-4 rounded-lg border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-semibold">
          Bonjour{user.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.email ?? 'Votre session est active.'}
        </p>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
      </section>
    </main>
  )
}
