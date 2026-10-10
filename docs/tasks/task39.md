

| Élément | Destination | Pourquoi |
|---|---|---|
| `api.ts`, `url.ts` | `auth` | Il dépend de `getToken` et `supabase`, qui sont dans `auth`. Dans `rpc`, on aurait un cycle `rpc → auth → cache → rpc`. Comme fichier d'`auth`, il n'y a aucun cycle. |
| `actions/` (login, logout, signup), `device-id.ts` | `auth` | Même raison, et `auth` dépend déjà de `cache`. |
| `LoginPage`, `SignupPage` | `ui` | Elles ne gardent que de l'état local. L'action est passée en props, comme tu le fais déjà pour tes composants serveur. |

Ordre des dépendances (inchangé) : `rpc ← cache ← auth ← app`, et `ui` ne dépend d'aucun d'eux

## 1. `packages/auth` : ajouter 4 choses

```
packages/auth/
├── (existant : index.ts, supabase.ts, session.ts, AuthProvider.tsx, guards.ts)
├── api.ts          ← nouveau
├── url.ts          ← copie de apps/desktop/src/config/url.ts
├── device-id.ts    ← copie de apps/desktop/src/lib/device-id.ts
└── actions/        ← copie de apps/desktop/src/lib/auth/actions/ (4 fichiers)
```

Si `url.ts` ou `device-id.ts` importent via `@desktop/...`, colle-les-moi.

`package.json` complet (deux dépendances en plus) :

```json
{
  "name": "@attendancy/auth",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  },
  "dependencies": {
    "@attendancy/cache": "workspace:*",
    "@attendancy/rpc": "workspace:*",
    "@attendancy/types": "workspace:*"
  },
  "peerDependencies": {
    "@tanstack/react-router": "*",
    "react": "*"
  }
}
```

`api.ts` :

```ts
import type { ApiClient } from "@attendancy/types";
import { NetworkError } from "@attendancy/rpc/error";
import { getToken } from "./session";
import { supabase } from "./supabase";
import { API_URL } from "./url";

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviver = (_: string, v: unknown) =>
  typeof v === "string" && ISO.test(v) ? new Date(v) : v;
// L'inscription est le seul appel RPC desktop accessible sans session.
const PUBLIC_ACTIONS = new Set(["signupPersonalDesktopAction"]);

function send(action: string, input: unknown, token?: string) {
  return fetch(`${API_URL}/api/rpc/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  }).catch(() => {
    throw new NetworkError("Réseau indisponible");
  });
}

export const api = new Proxy(
  {},
  {
    get: (_, action: string) => async (input?: unknown) => {
      const token = await getToken();
      if (!token && !PUBLIC_ACTIONS.has(action))
        return { error: "Not authenticated" };

      let res = await send(action, input, token ?? undefined);

      if (res.status === 401 && token) {
        // un seul refresh, un seul rejeu
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return { error: "Not authenticated" };
        res = await send(action, input, data.session.access_token);
      }

      return JSON.parse(await res.text(), reviver);
    },
  },
) as ApiClient;

/* Keep network failures as exceptions so React Query preserves its cached data. */
```

Dans les 4 fichiers de `actions/`, corrige les imports (chemins depuis `packages/auth/actions/`) :

| Ancien | Nouveau |
|---|---|
| `supabase` | `import { supabase } from "../supabase"` |
| `getToken`, `getSessionState` | `import { … } from "../session"` |
| `api` | `import { api } from "../api"` |
| `clearLocalData`, `claimLocalData` | `import { … } from "@attendancy/cache"` |
| `NetworkError` | `import { NetworkError } from "@attendancy/rpc/error"` |
| `device-id` | `import { … } from "../device-id"` |

Pour lister leurs imports actuels :

```powershell
Select-String -Path packages\auth\actions\*.ts, packages\auth\device-id.ts -Pattern "^import"
```

`index.ts` complet :

```ts
export { AuthProvider, useAuth } from "./AuthProvider";
export {
  getSessionState,
  getToken,
  isAuthenticated,
  type SessionState,
} from "./session";
export { requireAuth, requireGuest, type AuthRouterContext } from "./guards";
export { supabase } from "./supabase";
export { api } from "./api";
export { login, logout, signupPersonal } from "./actions";
```

Si ton script de stubs RPC importe `api` depuis un chemin de `apps/desktop`, fais-le pointer vers `@attendancy/auth`. Ce n'est pas bloquant pour cette étape.

## 2. `packages/ui` : deux pages, sans dépendance vers `auth`

Elles se placent à côté des formulaires, dans `packages/ui/src/components/`.

`login-page.tsx` :

```tsx
import { useState } from "react";
import { LoginForm, type LoginCredentials } from "./login-form";

export type LoginPageProps = {
  // Action injectée : renvoie le message d'erreur, ou null en cas de succès
  login: (credentials: LoginCredentials) => Promise<string | null>;
  onSignup: () => void;
};

export function LoginPage({ login, onSignup }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(credentials: LoginCredentials) {
    setError(null);
    setIsPending(true);

    try {
      setError(await login(credentials));
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "La connexion a échoué.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4 text-foreground">
      <LoginForm
        error={error}
        isPending={isPending}
        onSubmit={handleSubmit}
        onSignup={onSignup}
      />
    </div>
  );
}
```

`signup-page.tsx` :

```tsx
import { useState } from "react";
import { SignupForm, type SignupCredentials } from "./signup-form";

export type SignupResult =
  | { error?: string | null }
  | { data: { email: string } };

export type SignupPageProps = {
  // Action injectée
  signup: (email: string, password: string) => Promise<SignupResult>;
  onLogin: () => void;
};

export function SignupPage({ signup, onLogin }: SignupPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit({ email, password }: SignupCredentials) {
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const result = await signup(email, password);
      if ("data" in result) {
        setSuccess(
          `Un e-mail de confirmation a été envoyé à ${result.data.email}.`,
        );
      } else {
        setError(result.error ?? "L'inscription a échoué.");
      }
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "L'inscription a échoué.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4 text-foreground">
      <SignupForm
        error={error}
        success={success}
        isPending={isPending}
        onSubmit={handleSubmit}
        onLogin={onLogin}
      />
    </div>
  );
}
```

J'ai remplacé `<main className="min-h-screen …">` par `<div className="flex flex-1 …">` : dans le nouveau layout, la page est déjà dans le `<main>` sous le header, et `min-h-screen` ferait déborder.

Ajoute ces exports à l'index de `ui` :

```ts
export { LoginPage, type LoginPageProps } from "./components/login-page";
export { SignupPage, type SignupPageProps, type SignupResult } from "./components/signup-page";
```

## 3. `packages/app` : vraie déconnexion

Si ton `RootLayout.tsx` contient encore la fonction temporaire `signOut`, remplace le fichier par :

```tsx
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
```

## 4. `apps/teacher` : les deux routes

Les dépendances de l'app restent `@attendancy/app`, `@attendancy/auth` et `@attendancy/ui`.

`src/routes/auth/login.tsx` :

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginPage } from "@attendancy/ui";
import { login } from "@attendancy/auth";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <LoginPage
      login={login}
      onSignup={() => navigate({ to: "/auth/signup/personal" })}
    />
  );
}
```

`src/routes/auth/signup/personal.tsx` :

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignupPage } from "@attendancy/ui";
import { signupPersonal } from "@attendancy/auth";

export const Route = createFileRoute("/auth/signup/personal")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  return (
    <SignupPage
      signup={signupPersonal}
      onLogin={() => navigate({ to: "/auth/login" })}
    />
  );
}
```

Ces deux fichiers sont identiques d'une app à l'autre. Il n'y a pas d'`auth/signup/index.tsx`, car le web n'en a besoin que pour choisir entre compte personnel et compte principal.

## 5. Vérifier
//a adapter a bun
```powershell
pnpm install
pnpm --filter @attendancy/auth exec tsc --noEmit
pnpm --filter @attendancy/teacher dev
```

Ensuite, dans le navigateur :

| Test | Résultat attendu |
|---|---|
| Mauvais mot de passe | le message d'erreur s'affiche sous le formulaire |
| « Créez votre compte personnel » | ouvre `#/auth/signup/personal` |
| Inscription | message de confirmation par e-mail |
| Connexion correcte | arrive sur « Connecté » |
| « Déconnexion » dans le header | retour au login, cache vidé |

Si `tsc` signale un type incompatible sur `signup={signupPersonal}`, colle-moi `signup.ts` : ça voudrait dire que le type de retour de ton action est plus large que `SignupResult`, et j'ajuste ce type.