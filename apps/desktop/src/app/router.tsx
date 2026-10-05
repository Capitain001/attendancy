import { Navigate, Route, Routes } from "react-router-dom";
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

export function AppRouter() {
  const auth = useAuth();

  if (!auth) return <AuthLoading />;

  const isAuthenticated =
    auth.status === "signed-in" || auth.status === "offline-stale";

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/account" : "/login"} replace />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/account" replace /> : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/account" replace /> : <SignupPage />
        }
      />
      <Route
        path="/account"
        element={
          isAuthenticated ? <AccountPage /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
