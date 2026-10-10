import { Header } from "./Header";
import { Outlet } from "@tanstack/react-router";
import { useMe } from "@desktop/hooks/useMe";

/**
 * Layout principal Desktop reproduisant fidèlement le RootLayout web.
 */
export function DesktopLayout() {
  const me = useMe(true);
  const user = me.data ?? undefined;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header user={user} />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default DesktopLayout;
