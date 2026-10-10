import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  RouterProvider,
  Outlet,
  Navigate,
} from "@tanstack/react-router";
import { useAuth } from "@desktop/hooks/useAuth";
import { AccountPage } from "@desktop/pages/AccountPage";
import { LoginPage } from "@desktop/pages/LoginPage";
import { SignupPage } from "@desktop/pages/SignupPage";

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      Chargement…
    </main>
  );
}

// 1. Root Component avec Outlet
function RootComponent() {
  const auth = useAuth();

  if (!auth) return <AuthLoading />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}

// 2. Définition de la racine
const rootRoute = createRootRoute({
  component: RootComponent,
});

// 3. Définition des routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const auth = useAuth();
    const isAuthenticated = auth?.status === "signed-in" || auth?.status === "offline-stale";
    return <Navigate to={isAuthenticated ? "/account" : "/login"} replace />;
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => {
    const auth = useAuth();
    const isAuthenticated = auth?.status === "signed-in" || auth?.status === "offline-stale";
    return isAuthenticated ? <Navigate to="/account" replace /> : <LoginPage />;
  },
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: () => {
    const auth = useAuth();
    const isAuthenticated = auth?.status === "signed-in" || auth?.status === "offline-stale";
    return isAuthenticated ? <Navigate to="/account" replace /> : <SignupPage />;
  },
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: () => {
    const auth = useAuth();
    const isAuthenticated = auth?.status === "signed-in" || auth?.status === "offline-stale";
    return isAuthenticated ? <AccountPage /> : <Navigate to="/login" replace />;
  },
});

// 4. Assemblage de l'arbre de routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  accountRoute,
]);

// 5. Création de l'instance du routeur TanStack avec HashHistory pour Tauri
const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
