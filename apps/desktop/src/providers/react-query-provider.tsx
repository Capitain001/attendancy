// apps/desktop/src/providers/react-query-provider.tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { queryClient } from '../lib/cache/client'
import { queryPersister } from '../lib/cache/persister'
import { CACHE_SCHEMA_VERSION } from '../lib/cache/config'

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: Infinity,
        buster: CACHE_SCHEMA_VERSION,
      }}
    >
      {children}
      <ReactQueryDevtools buttonPosition="top-left" initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}