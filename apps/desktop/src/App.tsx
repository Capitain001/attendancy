import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { idbPersister, PlanningView } from '@attendancy/planning'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
  },
})

const DEMO_CLASS_ID = 'b588e534-16b0-47e5-9bf8-8e7313fbdf7d'
const today = new Date().toISOString().slice(0, 10)
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: idbPersister }}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold">Attendancy</h1>
        </header>
        <main>
          <PlanningView classId={DEMO_CLASS_ID} from={today} to={nextWeek} />
        </main>
      </div>
    </PersistQueryClientProvider>
  )
}