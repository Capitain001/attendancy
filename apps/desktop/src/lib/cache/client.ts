// apps/desktop/src/lib/query/client.ts
import { QueryClient } from '@tanstack/react-query'
import { NetworkError } from '@desktop/lib/error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity, // jamais d'expiration : le cache reste lisible tant que l'utilisateur n'est pas déconnecté
      staleTime: 60_000, // périmé = rafraîchi en arrière-plan quand le réseau est là, l'affichage n'est pas retiré
      retry: (count, error) => !(error instanceof NetworkError) && count < 2,
    },
  },
})