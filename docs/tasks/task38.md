contexte: apps/desktop

La suite est : `ui` (le shell), `app` (le routeur partagé), puis `apps/teacher`, qu'on teste **dans le navigateur** avant d'y ajouter Tauri. Tout est ci-dessous.

Le but est d'atteindre le point de contrôle : connexion, redirection, déconnexion.

## 1. `packages/ui` : ajouter 3 fichiers

```powershell
pnpm --filter @attendancy/ui add next-themes sonner
```

`packages/ui/AppProvider.tsx` :

```tsx
"use client"; // ignoré par Vite, nécessaire quand le web (Next) importe ce fichier

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster position="top-right" expand duration={4000} />
    </ThemeProvider>
  );
}
```

`packages/ui/MainLayout.tsx` :

```tsx
import type { ReactNode } from "react";

export function MainLayout({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      {header}
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
```

`packages/ui/Header.tsx` (vue pure, sans appel serveur) :

```tsx
type HeaderProps = {
  user?: { email?: string | null };
  onSignOut?: () => void;
};

export function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <span className="font-semibold">Attendancy</span>
      {user && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{user.email}</span>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              Déconnexion
            </button>
          )}
        </div>
      )}
    </header>
  );
}
```

Dans l'index de `packages/ui` (ou son équivalent d'exports), ajoute :

```ts
export { AppProvider } from "./AppProvider";
export { MainLayout } from "./MainLayout";
export { Header } from "./Header";
```

## 2. `packages/app` : nouveau package

```
packages/app/
├── package.json
├── tsconfig.json
├── index.ts
├── AuthLoading.tsx
├── router-options.ts
├── AppRouter.tsx
└── RootLayout.tsx
```

`package.json` :

```json
{
  "name": "@attendancy/app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  },
  "dependencies": {
    "@attendancy/auth": "workspace:*",
    "@attendancy/cache": "workspace:*",
    "@attendancy/ui": "workspace:*"
  },
  "peerDependencies": {
    "@tanstack/react-query": "*",
    "@tanstack/react-query-persist-client": "*",
    "@tanstack/react-router": "*",
    "nuqs": "*",
    "react": "*"
  }
}
```

```powershell
pnpm --filter @attendancy/app add -D typescript vite @types/react react @tanstack/react-router @tanstack/react-query @tanstack/react-query-persist-client nuqs
```

`tsconfig.json` : identique à celui de `packages/auth`.

`AuthLoading.tsx` :

```tsx
export function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      Chargement…
    </main>
  );
}
```

`router-options.ts` :

```ts
import { createHashHistory } from "@tanstack/react-router";

export const baseRouterOptions = {
  history: createHashHistory(), // obligatoire avec Tauri
  defaultPreload: "intent" as const,
  context: { auth: undefined! }, // rempli à l'exécution par AppRouter
};
```

`AppRouter.tsx` :

```tsx
import { useEffect } from "react";
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

  useEffect(() => {
    router.invalidate(); // rejoue les beforeLoad quand la session change
  }, [router, authenticated]);

  if (!auth) return <AuthLoading />;

  return (
    <RouterProvider
      router={router}
      context={{ auth: { ...auth, isAuthenticated: authenticated } }}
    />
  );
}
```

`RootLayout.tsx` :

```tsx
import { Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AppProvider, MainLayout, Header } from "@attendancy/ui";
import { useAuth, supabase } from "@attendancy/auth";
import { clearLocalData } from "@attendancy/cache";

// Temporaire : sera remplacé par l'action logout quand actions/ rejoindra packages/auth
async function signOut() {
  await supabase.auth.signOut();
  await clearLocalData();
}

export function RootLayout() {
  const auth = useAuth();
  const user = auth?.status === "signed-in" ? auth.session.user : undefined;

  return (
    <NuqsAdapter>
      <AppProvider>
        <MainLayout header={<Header user={user} onSignOut={signOut} />}>
          <Outlet />
        </MainLayout>
      </AppProvider>
    </NuqsAdapter>
  );
}
```

`index.ts` :

```ts
export { RootLayout } from "./RootLayout";
export { AppRouter } from "./AppRouter";
export { baseRouterOptions } from "./router-options";
export type { AuthRouterContext as RouterContext } from "@attendancy/auth";
```

## 3. `apps/teacher` : nouvelle app

```
apps/teacher/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env                     ← copie celui de apps/desktop
└── src/
    ├── main.tsx
    ├── router.ts
    ├── index.css            ← copie du CSS de apps/desktop (voir plus bas)
    └── routes/
        ├── __root.tsx
        ├── index.tsx
        ├── auth/
        │   ├── route.tsx
        │   └── login.tsx
        └── _app/
            ├── route.tsx
            └── home.tsx
```

`package.json` :

```json
{
  "name": "@attendancy/teacher",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@attendancy/app": "workspace:*",
    "@attendancy/auth": "workspace:*",
    "@attendancy/ui": "workspace:*"
  }
}
```

```powershell
pnpm --filter @attendancy/teacher add react react-dom @tanstack/react-router @tanstack/react-query @tanstack/react-query-persist-client nuqs
pnpm --filter @attendancy/teacher add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite @tanstack/router-plugin
pnpm install
pnpm why react
```

Le `pnpm why react` doit afficher **une seule version**. Si tu en vois deux, aligne-les (même problème que pour React Query).

`tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`vite.config.ts` (le plugin du routeur doit être **avant** `react()`) :

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [TanStackRouterVite({ target: "react" }), react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
```

Si ton `vite.config.ts` actuel dans `apps/desktop` utilise d'autres plugins, garde les tiens et ajoute seulement `TanStackRouterVite` en premier.

`index.html` :

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Attendancy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css` : copie le fichier CSS que `apps/desktop/src/main.tsx` importe, puis ajoute à la fin (chemins relatifs à ce fichier) :

```css
@source "../../../packages/ui";
@source "../../../packages/app";
@source "../../../packages/auth";
```

Sans ces lignes, les classes Tailwind utilisées seulement dans `packages/*` ne sont pas générées. C'est la syntaxe de Tailwind 4 ; en version 3, ajoute ces dossiers dans `content` de `tailwind.config`.

`src/main.tsx` :

```tsx
import ReactDOM from "react-dom/client";
import { AppRouter } from "@attendancy/app";
import { router } from "./router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppRouter router={router} />,
);
```

`src/router.ts` :

```ts
import { createRouter } from "@tanstack/react-router";
import { baseRouterOptions } from "@attendancy/app";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree, ...baseRouterOptions });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

`src/routes/__root.tsx` :

```tsx
import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout, type RouterContext } from "@attendancy/app";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
```

`src/routes/index.tsx` :

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: context.auth.isAuthenticated ? "/home" : "/auth/login",
    });
  },
});
```

`src/routes/auth/route.tsx` :

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireGuest } from "@attendancy/auth";

export const Route = createFileRoute("/auth")({
  beforeLoad: requireGuest,
  component: Outlet,
});
```

`src/routes/auth/login.tsx` (**temporaire**, remplacé par ta vraie page à l'étape suivante) :

```tsx
import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@attendancy/auth";

export const Route = createFileRoute("/auth/login")({
  component: TemporaryLogin,
});

function TemporaryLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setError(error?.message ?? null);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
          Se connecter
        </button>
      </form>
    </div>
  );
}
```

`src/routes/_app/route.tsx` :

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@attendancy/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: Outlet,
});
```

`src/routes/_app/home.tsx` (marqueur temporaire, remplacé par la vraie destination) :

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/home")({
  component: () => <div className="p-6">Connecté</div>,
});
```

## 4. Lancer et vérifier

```powershell
pnpm --filter @attendancy/teacher dev
```

Au premier lancement, le plugin crée `src/routeTree.gen.ts`. Si l'éditeur signale que `./routeTree.gen` est introuvable avant ça, ignore-le : le fichier apparaît dès que Vite démarre. Ouvre `http://localhost:1420`.

| # | Test | Résultat attendu |
|---|---|---|
| 1 | Premier chargement | « Chargement… », puis le formulaire de login |
| 2 | Connexion | arrive sur « Connecté », avec l'email et « Déconnexion » dans le header |
| 3 | Recharger la page | tu restes connecté |
| 4 | Aller manuellement sur `#/auth/login` en étant connecté | renvoyé vers `/home` |
| 5 | Déconnexion | retour au login |
| 6 | Se déconnecter, puis aller sur `#/home` | renvoyé vers le login |
| 7 | Mode avion avec une session expirée | reste dans l'app (`offline-stale`) |

**Tant que ces 7 tests ne passent pas, n'ajoute aucune page.** Si quelque chose échoue, colle-moi l'erreur de la console du navigateur ou du terminal.

## 5. Ensuite

Quand les tests passent, envoie-moi :

- `LoginPage.tsx`, `SignupPage.tsx` et `AccountPage.tsx` de `apps/desktop/src/pages`,
- `lib/auth/actions/login.ts`, `logout.ts`, `signup.ts` et `index.ts`,
- les fichiers `ActiveThemeProvider` (`@/components/theme/ActiveTheme`), `NoiseFilterDefs` (`@/components/design/NoiseFilter`) et `@/providers/theme-provider` du web.

Avec les trois premiers groupes, je construis `packages/auth/actions` et `packages/auth/pages` (qui remplaceront la page temporaire). Avec les trois derniers, je complète `AppProvider` pour qu'il soit identique à ton layout web, puis on branche aussi le web dessus.