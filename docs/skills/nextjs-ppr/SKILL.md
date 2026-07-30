---
name: nextjs-ppr
description: >
  Prévenir l'erreur "Runtime data accessed outside of <Suspense>" (blocking-route)
  dans ce projet Next.js 16 avec cacheComponents: true (PPR actif). Utiliser avant
  toute création ou modification de page RSC, layout, ou composant serveur accédant
  à des cookies/headers/params — et chaque fois que cette erreur apparaît dans les logs.
---

# PPR — Partial Pre-rendering (`cacheComponents: true`)

## Pourquoi cette erreur existe

`cacheComponents: true` dans `next.config.ts` active le PPR : Next.js tente de
prerendre statiquement les routes qui ne signalent pas de rendu dynamique.

Dès qu'un composant dans le rendu accède à `cookies()`, `headers()`, `params`,
ou `searchParams` **hors d'une `<Suspense>`**, Next.js lève :

```
Error: Route "/foo": Runtime data such as `cookies()`, `headers()`, `params`,
or `searchParams` was accessed outside of <Suspense>.
```

Dans ce projet, l'accès cookies vient quasi-systématiquement de la chaîne :
`getUserInfo()` → `createClient()` → `cookies()` (Supabase).

---

## Règle de décision — arbre à suivre pour chaque page RSC

```
La page (ou un composant qu'elle monte directement) appelle getUserInfo() ?
│
├── OUI → Déjà dynamique. Rien à ajouter. Pas de connection().
│
└── NON → La page sera tentée en statique par PPR.
          Le root layout accède aux cookies (getUserInfo dans Header).
          → Ajouter `await connection()` en 1ère ligne du composant page.
```

### Cas concrets

| Page / composant | getUserInfo direct ? | Action |
|---|---|---|
| Page qui lit les données métier de l'utilisateur | OUI | rien |
| Page auth (login, register) | NON | `await connection()` |
| Page admin système | NON | `await connection()` |
| Page publique (marketing, CGU) | NON | `await connection()` |
| Layout intermédiaire sans fetch auth | NON | `await connection()` |

---

## Pattern — page sans `getUserInfo()`

```tsx
// src/app/admin/page.tsx
import { connection } from "next/server";

export default async function AdminPage() {
  await connection(); // ← 1ère ligne, avant tout fetch

  // ... contenu de la page
}
```

`connection()` signale à PPR que cette route est dynamique. Aucune donnée
n'est lue — c'est un marqueur pur, sans effet réseau.

---

## Pattern — layout intermédiaire sans fetch auth

```tsx
// src/app/(public)/layout.tsx
import { connection } from "next/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return <>{children}</>;
}
```

Si le layout gère lui-même un fetch dynamique (ex. org courante), il devient
automatiquement dynamique — pas besoin de `connection()`.

---

## Pattern recommandé pour le root layout (refactor long terme)

Le root layout actuel (`src/app/layout.tsx`) appelle `getUserInfo()` directement,
ce qui rend TOUTES les routes dynamiques depuis le layout.
Fix propre : extraire le fetch dans un composant serveur isolé, enveloppé dans `<Suspense>`.

```tsx
// src/components/layout/Header/AsyncHeader.tsx — Server Component
import { getUserInfo } from "@/services/user/userInfo";
import Header from "./Header";

export async function AsyncHeader() {
  const user = await getUserInfo();
  return <Header user={user ?? undefined} />;
}
```

```tsx
// src/app/layout.tsx — root layout sans fetch direct
import { Suspense } from "react";
import { AsyncHeader } from "@/components/layout/Header/AsyncHeader";
import HeaderSkeleton from "@/components/layout/Header/HeaderSkeleton";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {/* ... providers ... */}
        <div className="flex h-screen flex-col">
          <Suspense fallback={<HeaderSkeleton />}>
            <AsyncHeader />
          </Suspense>
          {/* Suspense obligatoire — PPR doit pouvoir déférer les pages dynamiques */}
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </main>
        </div>
        {/* ... */}
      </body>
    </html>
  );
}
```

**Pourquoi `<Suspense fallback={null}>` autour de `{children}` ?**
Sans ce wrapper, les pages qui accèdent aux cookies (`getUserInfo()`) ne sont pas
dans une Suspense boundary côté layout. PPR ne peut pas déférer leur rendu et
lève `blocking-route` → "unexpected response" côté client.
`fallback={null}` : pas de skeleton visible — Next.js gère les transitions
client-side sans flash. S'affiche uniquement au premier rendu serveur, brièvement.

---

## Anti-patterns à éviter

```tsx
// ❌ Page sans getUserInfo() et sans connection() → blocking-route
export default async function MyPage() {
  const data = await getPublicData(); // pas de cookies, mais root layout en lit
  return <div>{data}</div>;
}

// ❌ connection() après un premier await → trop tard, le rendu a déjà commencé
export default async function MyPage() {
  const data = await fetch("/api/...");
  await connection(); // ← n'a aucun effet ici
  return <div>{data}</div>;
}

// ✅ connection() avant tout await
export default async function MyPage() {
  await connection();
  const data = await fetch("/api/...");
  return <div>{data}</div>;
}
```

---

## Checklist avant commit d'une nouvelle page RSC

- [ ] La page appelle `getUserInfo()` directement → rien à faire
- [ ] La page n'appelle pas `getUserInfo()` → `await connection()` en 1ère ligne
- [ ] Aucune `<Suspense>` manquante autour de composants async montés dans un layout statique
- [ ] Le root layout ne fait pas de fetch cookie hors Suspense (refactor cible)

---

## Référence

- `next.config.ts` — commentaire sur `cacheComponents: true`
- `src/services/user/userInfo.ts` — commentaire "Effet Next.js 16 (cacheComponents/PPR)"
- `CLAUDE.md` projet — règle "Pages RSC sans `getUserInfo()` direct → `await connection()`"
- [Next.js docs — blocking-route](https://nextjs.org/docs/messages/blocking-route)
