import { Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AppProvider, MainLayout, Header } from "@attendancy/ui";
import { useCurrentUser, logout } from "@attendancy/auth";

export function RootLayout() {
  const { data: user } = useCurrentUser();

  return (
    <NuqsAdapter>
      <AppProvider>
        <MainLayout header={<Header user={user ?? undefined} onSignOut={logout} />}>
          <Outlet />
        </MainLayout>
      </AppProvider>
    </NuqsAdapter>
  );
}
