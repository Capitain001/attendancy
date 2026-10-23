import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@attendancy/auth";
import { MobileNavMenu } from "@attendancy/ui";

type NavItem = {
  heading: string;
  to: "/home" | "/sessions";
};

const navItems: NavItem[] = [
  { heading: "Accueil", to: "/home" },
  { heading: "Séances", to: "/sessions" },
];

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <MobileNavMenu
        navItems={navItems}
        renderLink={({ to, onNavigate, className, children }) => (
          <Link
            to={to}
            onClick={onNavigate}
            className={className}
          >
            {children}
          </Link>
        )}
      />
    </div>
  );
}
