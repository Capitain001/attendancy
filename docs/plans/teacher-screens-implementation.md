# Plan d'implémentation : Écrans Enseignant dans `apps/teacher`

> **Statut :** ⚠️ EN COURS DE RÉVISION — NON ENCORE VALIDÉ  
> **Source :** `apps/web/src/app/(app)/personal/[slug]/teacher/page.tsx` et `apps/web/src/app/(app)/[slug]/teacher/sessions/page.tsx`  
> **Cible :** `apps/teacher/src`  

---

## 1. Contexte & Architecture cible

L'application `apps/teacher` est une application cliente (Vite + React 19 + TanStack Router).
Elle consomme le backend Next.js (`apps/web`) à travers :
1. **Le système RPC Web → Client (`docs/techs/rpc-systeme.md`)** :
   - Route unique Next.js : `POST /api/rpc/[action]` avec Bearer token Supabase.
   - Registre allowlist serveur : `apps/web/src/lib/rpc/actions.ts`.
   - Génération déterministe des stubs : `bun --filter @attendancy/rpc gen`.
2. **Le système de hooks partagés (`docs/techs/hooks-partages.md` / `task31.md`)** :
   - Les hooks restent dans `apps/web/src/hooks/**`.
   - Les hooks consomment leurs Server Actions via `@/services/<service>` ou `@/services/<service>/actions`.
   - Côté client (Vite), l'alias intercepte l'import et le redirige vers le stub RPC généré.
   - L'alias `@rpc-api` résout le client HTTP `api` (`@attendancy/auth`).

---

## 2. Dépendances & Actions RPC nécessaires

### A. Server Actions à inscrire dans `ACTIONS` (`apps/web/src/lib/rpc/actions.ts`)

| Action | Service source | Usage écran | Format d'entrée (règle argument unique) |
|---|---|---|---|
| `getTeacherDailyScheduleAction` | `schedule` | Écran Journalier | `{ dayKey?: string }` |
| `getTeacherNextScheduleAction` | `schedule` | Écran Session | `{ teacherId: string }` |
| `startSessionAction` | `session` | Écran Session | **Adapté :** payload unique `{ scheduleId: string; coords?: { lat: number; lng: number } \| null }` |
| `completeSessionAction` | `session` | Écran Session | `{ scheduleId: string }` |
| `getScheduleAttendancesAction` | `attendance` | Écran Session (Présences) | `{ scheduleId: string }` |
| `confirmAttendanceAction` | `attendance` | Écran Session (Présences) | `{ attendanceId: string }` |
| `confirmAllAttendancesAction` | `attendance` | Écran Session (Présences) | `{ scheduleId: string }` |

### B. Séparation stricte Actions RPC (`@attendancy/rpc`) et Types (`@attendancy/types`)
- **Stubs RPC purs :** `packages/rpc` ne contient et ne génère **strictement que les stubs d'actions** (`export const fn = api.fn`). Aucun type n'y est réexporté, garantissant l'absence de dépendance superflue.
- **Types DTOs partagés :** Tous les DTOs consommés par les hooks et composants proviennent de `@attendancy/types`.
- **Imports dans les hooks :**
  - Les actions sont importées depuis `@/services/<service>/actions`.
  - Les types sont importés depuis `@attendancy/types`.
- L'alias Vite dans les clients (`apps/desktop`, `apps/teacher`) cible :
  ```ts
  {
    find: /^@\/services\/([^/]+)\/actions$/,
    replacement: path.resolve(__dirname, '../../packages/rpc/src/generated/$1.ts'),
  }
  ```

### C. Découplage de `next/navigation`
- `TeacherDailyOverviewScreen` utilise actuellement `useParams()` de `next/navigation` pour calculer l'URL de redirection.
- **Action :** Découpler ce composant pour recevoir `sessionsHref` ou un callback `onStartSession` en prop, le rendant compatible à la fois avec Next.js et TanStack Router.

### D. Reconversion des Dates (Reviver ISO)
- Le transport RPC sérialise les dates en chaînes ISO.
- Le client `@attendancy/auth/api` gère la réinstanciation via regex ISO `reviver`. Les hooks reçoivent ainsi directement des instances de `Date`.

---

## 3. Configuration de `apps/teacher`

### A. Dépendances `apps/teacher/package.json`
- `@attendancy/rpc: "workspace:*"`
- `@attendancy/types: "workspace:*"`
- `framer-motion` (pour `SwipeNavigator`, `Carousel`, `AttendanceList`)
- `lucide-react` (icônes)
- `date-fns` (manipulation de dates et durées)
- `sonner` (toasts de confirmation et erreurs)

### B. Configuration `apps/teacher/vite.config.ts`
Mettre en place les alias de résolution :
```ts
resolve: {
  alias: [
    {
      find: 'next/link',
      replacement: path.resolve(__dirname, './src/components/ui/Link.tsx'),
    },
    {
      find: /^@\/services\/([^/]+)(\/actions)?$/,
      replacement: path.resolve(__dirname, '../../packages/rpc/src/generated/$1.ts'),
    },
    { find: '@rpc-api', replacement: path.resolve(__dirname, '../../packages/auth/src/api.ts') },
    { find: '@ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
    { find: '@', replacement: path.resolve(__dirname, '../web/src') },
  ],
}
```

### C. Configuration `apps/teacher/tsconfig.json`
Ajouter les `paths` TypeScript correspondants pour le typecheck strict (`check-types`).

---

## 4. Implémentation des Routes dans `apps/teacher/src/routes`

### Route 1 : Vue Journalière (`routes/_app/home.tsx`)
- Composant racine : `TeacherDailyScreen`.
- Panneau 1 : `TeacherDailyOverviewScreen` (cours en cours/prochain, décompte, jauge de cours restants, bouton "Démarrer la séance").
- Panneau 2 : `TeacherDailyScheduleListScreen` (timeline chronologique de la journée + drawer détail `TeacherScheduleDetailSheet`).
- Navigation : Clic sur "Démarrer la séance" redirige vers `/sessions` via TanStack Router `navigate({ to: '/sessions' })`.

### Route 2 : Vue Session & Pointage (`routes/_app/sessions.tsx`)
- Composant racine : `TeacherSessionPage`.
- Panneau 1 : `SessionPageInner` (titre, carrousel 3 slides : infos UE/salle/note, jauge durée restante, QR Code, bouton principal Démarrer/Clôturer).
- Panneau 2 : `AttendanceList` (liste des étudiants, sélection multiple, confirmation présent/absent).
- Préservation de la stabilité tactile : maintien du `onPointerDown stopPropagation`, `touch-pan-x` sur le carrousel, et `dragDirectionLock` sur `SwipeNavigator`.

---

## 5. Étapes de validation

1. Génération RPC : `bun --filter @attendancy/rpc gen`.
2. Typecheck Web : `bun --filter @attendancy/web check:ts`.
3. Typecheck Teacher : `bun --filter @attendancy/teacher check-types`.
4. Test d'exécution Vite : lancement du dev server de `apps/teacher` et vérification de la navigation entre l'écran journalier et la session.
