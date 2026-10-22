import { useEffect, useRef } from "react";
import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthProvider, useAuth, isAuthenticated } from "@attendancy/auth";
import { queryClient, queryPersister, CACHE_SCHEMA_VERSION } from "@attendancy/cache";
import { AuthLoading } from "./AuthLoading";

export function AppRouter({ router }: { router: AnyRouter }) {
  return (
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: Infinity, // sinon la restauration jette tout cache de plus de 24 h
          buster: CACHE_SCHEMA_VERSION, // changer la version vide le cache persisté
        }}
      >
        <RouterWithAuth router={router} />
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}

function RouterWithAuth({ router }: { router: AnyRouter }) {
  const auth = useAuth();
  const authenticated = isAuthenticated(auth);
  const previousAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!auth) return;
    if (previousAuthState.current === null) {
      previousAuthState.current = authenticated;
      return;
    }
    if (previousAuthState.current !== authenticated) {
      router.invalidate(); // rejoue les beforeLoad quand la session change
      previousAuthState.current = authenticated;
    }
  }, [router, authenticated, auth]);

  if (!auth) return <AuthLoading />;

  return (
    <RouterProvider
      router={router}
      context={{ auth: { ...auth, isAuthenticated: authenticated } }}
    />
  );
}
