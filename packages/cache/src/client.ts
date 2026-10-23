import { QueryClient, onlineManager } from "@tanstack/react-query";
import { NetworkError } from "@attendancy/rpc/error";

// Selon la version, onlineManager se croit en ligne tant qu'il ne reçoit pas d'événement
// "offline". Si l'app est lancée sans réseau, aucun événement n'arrive : il se tromperait.
// On l'aligne donc sur l'état réel du navigateur au démarrage.
onlineManager.setOnline(navigator.onLine);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity, // jamais d'expiration : le cache reste lisible tant que l'utilisateur n'est pas déconnecté
      staleTime: 60_000, // périmé = rafraîchi en arrière-plan quand le réseau est là, l'affichage n'est pas retiré
      retry: (count, error) => !(error instanceof NetworkError) && count < 2,
    },
  },
});