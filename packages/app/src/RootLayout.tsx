//packages\app\src\RootLayout.tsx
import { Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AppProvider, MainLayout, Header } from "@attendancy/ui";
import { useAuthUser, useIsOffline, logout } from "@attendancy/auth";

export function RootLayout() {
  // Session locale : immédiate, sans réseau. L'en-tête a toujours un utilisateur (donc le
  // menu et le bouton de déconnexion), même serveur éteint ou hors ligne.
  const user = useAuthUser();
  const isOffline = useIsOffline();

  return (
    <NuqsAdapter>
      <AppProvider>
        <MainLayout
          header={
            <Header
              user={user ?? undefined}
              onSignOut={logout}
              isOffline={isOffline}
            />
          }
        >
          <Outlet />
        </MainLayout>
      </AppProvider>
    </NuqsAdapter>
  );
}
