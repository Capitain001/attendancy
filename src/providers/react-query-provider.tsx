// src/providers/react-query-provider.tsx
// Provider React Query — requis par la couche hooks/data (useEntity/useCrudEntity).
// Le QueryClient est créé dans un useState pour survivre aux re-renders sans
// être partagé entre requêtes SSR.
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

export default function ReactQueryProvider({
  children,
}: {
  children: ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
