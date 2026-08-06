import { useEffect, useState } from 'react'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from '@tanstack/react-router'
import { idbPersister, setAuthToken } from '@attendancy/planning'
import { useAuth } from './hooks/useAuth'
import { useTraySync } from './hooks/useTraySync'
import { LoginView } from './views/LoginView'
import { AppContextProvider } from './context/AppContext'
import { router } from './router'
import { supabase } from './lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
  },
})

const API_BASE = import.meta.env.VITE_API_URL as string

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: idbPersister }}>
      <AppShell />
    </PersistQueryClientProvider>
  )
}

function AppShell() {
  const { session, loading, logout } = useAuth()
  const qc = useQueryClient()
  useTraySync()
  const [classId, setClassId]     = useState<string | null>(null)
  const [meLoading, setMeLoading] = useState(false)

  // Sync token + classId
  useEffect(() => {
    setAuthToken(session?.access_token ?? null)
    if (!session) { setClassId(null); return }

    setMeLoading(true)
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((body: { data?: { classId?: string | null } }) => {
        setClassId(body.data?.classId ?? null)
      })
      .catch(() => setClassId(null))
      .finally(() => setMeLoading(false))
  }, [session])

  // Realtime Supabase → invalide le planning sur changement de Schedule
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('desktop-schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Schedule' }, () => {
        qc.invalidateQueries({ queryKey: ['planning'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session, qc])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <svg className="animate-spin text-muted-foreground" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    )
  }

  if (!session) return <LoginView />

  if (meLoading || !classId) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeader email={session.user.email} onLogout={logout} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {meLoading ? 'Chargement du planning…' : 'Aucune classe associée à ce compte.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <AppContextProvider value={{ classId }}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeader email={session.user.email} onLogout={logout} />
        <div className="flex-1">
          <RouterProvider router={router} />
        </div>
      </div>
    </AppContextProvider>
  )
}

function AppHeader({ email, onLogout }: { email?: string | null; onLogout: () => void }) {
  return (
    <header className="z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/20 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded border border-border/30 bg-muted text-xs font-bold">
          A
        </span>
        <span className="text-sm font-medium">Attendancy</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full border border-border/40 bg-muted text-xs font-medium">
          {email ? email[0].toUpperCase() : '?'}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
