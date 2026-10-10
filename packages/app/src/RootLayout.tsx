import { Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AppProvider, MainLayout, Header } from "@attendancy/ui";
import { useAuth, logout } from "@attendancy/auth";

export function RootLayout() {
  const auth = useAuth();
  const user = auth?.status === "signed-in" ? auth.session.user : undefined;

  return (
    <NuqsAdapter>
      <AppProvider>
        <MainLayout header={<Header user={user} onSignOut={logout} />}>
          <Outlet />
        </MainLayout>
      </AppProvider>
    </NuqsAdapter>
  );
}
