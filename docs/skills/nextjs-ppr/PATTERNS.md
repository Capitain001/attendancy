# PPR — Good Patterns (Next.js 16, `cacheComponents: true`)

Référence rapide des patterns validés dans ce projet. Voir `SKILL.md` pour le raisonnement complet.

---

## 1. Root layout — async component isolé dans `<Suspense>`

**Problème :** tout composant async dans le root layout qui accède à `cookies()` hors `<Suspense>` bloque PPR sur toutes les routes.

```tsx
// ✅ src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Suspense fallback={<HeaderSkeleton />}>
          <AsyncHeader />          {/* getUserInfo() isolé ici */}
        </Suspense>
        <main>
          <Suspense fallback={null}>
            {children}             {/* pages dynamiques streamées ici */}
          </Suspense>
        </main>
      </body>
    </html>
  )
}
```

```tsx
// ❌ AsyncHeader sans Suspense → blocking-route sur toutes les routes
<AsyncHeader />
<main><Suspense>{children}</Suspense></main>
```

Règle : **tout composant async accédant à cookies/headers dans le layout = dans `<Suspense>`**.

---

## 2. Page sans `getUserInfo()` — `connection()` en première ligne

```tsx
// ✅ src/app/(app)/[slug]/direction/academic/classes/page.tsx
import { connection } from 'next/server'

export default async function ClassesPage() {
  await connection()            // ← avant tout await
  const result = await getClassesAction()
  // ...
}
```

```tsx
// ❌ connection() après un premier await = trop tard
export default async function ClassesPage() {
  const result = await getClassesAction()
  await connection()            // ignoré par PPR
}
```

---

## 3. Layout intermédiaire avec fetch auth — pas besoin de `connection()`

Si le layout appelle `getUserInfo()` directement, toutes ses routes enfants sont déjà dynamiques.

```tsx
// ✅ src/app/(app)/[slug]/direction/layout.tsx
const Layout = async ({ children, params }) => {
  const [user, { slug }] = await Promise.all([getUserInfo(), params])
  // → toutes les pages /direction/* sont dynamiques via ce layout
  // → connection() dans chaque page enfant est redondant (mais non bloquant)
  return <SidebarProvider>...</SidebarProvider>
}
```

---

## 4. Composant async monté dans une page — toujours dans `<Suspense>`

Un composant serveur async monté directement dans la page doit être dans `<Suspense>` pour permettre le streaming.

```tsx
// ✅ src/app/(app)/[slug]/direction/attendance/sessions/page.tsx
export default async function SessionsPage() {
  await connection()
  return (
    <div>
      <h1>Sessions du jour</h1>
      <Suspense fallback={<Loader />}>
        <TodaySessionsWidget />    {/* async SC → dans Suspense */}
      </Suspense>
    </div>
  )
}
```

```tsx
// ❌ async SC sans Suspense → bloque le rendu de toute la page
export default async function SessionsPage() {
  await connection()
  return (
    <div>
      <TodaySessionsWidget />    {/* attend le fetch avant d'envoyer quoi que ce soit */}
    </div>
  )
}
```

---

## 5. Page avec `searchParams` — `connection()` couvre les deux

`searchParams` est aussi une source dynamique. `connection()` en tête suffit.

```tsx
// ✅ src/app/(app)/[slug]/direction/people/students/page.tsx
interface Props {
  searchParams: Promise<{ classId?: string }>
}

export default async function StudentsPage({ searchParams }: Props) {
  await connection()
  const { classId } = await searchParams    // sûr après connection()
  // ...
}
```

---

## 6. Parallélisme des fetches — `Promise.all` après `connection()`

```tsx
// ✅ src/app/(app)/[slug]/direction/page.tsx
export default async function DirectionDashboard() {
  await connection()

  const [countsResult, metricsResult, yearResult] = await Promise.all([
    getOrgResourcesCountsAction(),
    getOrgDailyMetricsAction(),
    getCurrentYearAction(),
  ])
  // ...
}
```

`connection()` n'a pas d'effet réseau — pas de pénalité à l'appeler avant `Promise.all`.

---

## Récapitulatif décisionnel

| Situation | Action |
|---|---|
| Root layout — composant async qui lit cookies | `<Suspense>` autour du composant |
| Page — appelle `getUserInfo()` directement | Rien (déjà dynamique) |
| Page — n'appelle pas `getUserInfo()` | `await connection()` en 1ère ligne |
| Layout intermédiaire — fetch auth direct | Rien (routes enfants = dynamiques) |
| Composant async monté dans une page | `<Suspense fallback={...}>` |
| Page avec `searchParams` | `await connection()` puis `await searchParams` |
| Plusieurs fetches indépendants | `await connection()` puis `Promise.all(...)` |

---

## Anti-patterns à ne jamais faire

```tsx
// ❌ 1 — connection() après un await
const data = await fetch(...)
await connection()          // trop tard

// ❌ 2 — composant async hors Suspense dans root layout
<AsyncHeader />             // getUserInfo() bloque PPR sur toutes les routes

// ❌ 3 — composant async sans Suspense dans la page
<TodaySessionsWidget />     // bloque le streaming de la page entière

// ❌ 4 — import mort d'une action dont le SC s'occupe lui-même
import { getDirectionSessionsAction } from '@/services/session'  // si TodaySessionsWidget le fait déjà
```
