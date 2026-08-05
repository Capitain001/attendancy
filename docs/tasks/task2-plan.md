# Tasks: Direction Dashboard V2 — Reproduction structure V1

**Spec**: `docs/tasks/task2.md`
**Status**: Not Started ⏳

---

## Contexte

La page V2 `src/app/(app)/[slug]/direction/page.tsx` existe déjà avec une structure partielle.
Objectif : la restructurer pour reproduire fidèlement la hiérarchie V1, en remplaçant les
sections complexes (anomalies, ActiveSessionsGrid) par des placeholders.

### Ce qui existe déjà en V2

| Composant | Chemin | Réutilisé ? |
|---|---|---|
| `MetricCard` | `src/components/stats/ui/MetricCard.tsx` | ✅ direct |
| `OrgMetricsCard` | `src/components/direction/dashboard/OrgMetricsCard.tsx` | ❌ remplacé par MetricCard × 4 dans CollapseSection |
| `DailyMetricsCard` | `src/components/direction/dashboard/DailyMetricsCard.tsx` | ❌ remplacé par MetricCard × 4 dans grid |
| `AcademicYearBanner` | `src/components/direction/dashboard/AcademicYearBanner.tsx` | ✅ gardé |
| `TodaySessionsWidget` | `src/components/direction/dashboard/TodaySessionsWidget.tsx` | ✅ placeholder "Séances en cours" |

### Actions V2 disponibles

| Action | Retour clé | Usage dans la page |
|---|---|---|
| `getOrgIdentityAction()` | `{ name, slug }` | nom org dans le header |
| `getOrgDailyMetricsAction()` | `{ activeSessions, todaySchedules, completedSchedules, todayAbsences }` | 4 MetricCards du jour |
| `getOrgResourcesCountsAction()` | `{ courses, classes, rooms, teachers, students }` | CollapseSection Ressources |
| `getOrgTodayAbsencesAction()` | tableau absences `{ id, student, schedule }` | CollapseSection Absences |
| `getCurrentYearAction()` | année courante | AcademicYearBanner |

### Ce qui manque en V2

- `CollapseSection` — à créer (port V1, `framer-motion` installé)
- `AlertCategoryCards` — à créer (port V1 direct)

---

## Phase 1: Composants partagés ⏳ (~30min)

**But**: Créer les deux composants manquants utilisés dans la page.

- [ ] T001 [P] Créer `src/components/layout/CollapseSection.tsx`
  - Port direct de V1 (`src/components/courses/pages/DirectionCoursePage/components/CollapseSection.tsx`)
  - Props : `label: string`, `children: ReactNode`, `defaultOpen?: boolean`, `count?: number`
  - `"use client"` + `useState` + `AnimatePresence` / `motion.div` de `framer-motion`
  - Exporter depuis `src/components/layout/index.ts` (créer si absent)

- [ ] T002 [P] Créer `src/components/direction/dashboard/AlertCategoryCards.tsx`
  - Port direct de V1 (`src/components/direction/alerts/AlertCategoryCards.tsx`)
  - Props : `missed: number`, `notStarted: number`, `incomplete: number`
  - Icônes : `AlertTriangle`, `Clock`, `AlertCircle` de `lucide-react`
  - Pas de `"use client"` (pur affichage)

**Checkpoint**: ✋ Deux composants compilent sans erreur TS

**Notes:**

---

## Phase 2: Page direction restructurée ⏳ (~45min)

**But**: Remplacer le contenu de `src/app/(app)/[slug]/direction/page.tsx` pour
reproduire la structure V1.

- [ ] T003 Restructurer `src/app/(app)/[slug]/direction/page.tsx`

  **Imports à ajouter / modifier :**
  ```ts
  import { format } from 'date-fns'
  import { connection } from 'next/server'
  import { Suspense } from 'react'
  import { getOrgIdentityAction, getOrgDailyMetricsAction, getOrgResourcesCountsAction } from '@/services/organization'
  import { getCurrentYearAction } from '@/services/academic-year'
  import { getOrgTodayAbsencesAction } from '@/services/attendance'
  import { MetricCard } from '@/components/stats/ui/MetricCard'
  import { AcademicYearBanner } from '@/components/direction/dashboard/AcademicYearBanner'
  import { AlertCategoryCards } from '@/components/direction/dashboard/AlertCategoryCards'
  import { TodaySessionsWidget } from '@/components/direction/dashboard/TodaySessionsWidget'
  import { CollapseSection } from '@/components/layout/CollapseSection'
  import { Loader } from '@/components/loaders/AppLoaders'
  ```

  **Params route :**
  ```ts
  export default async function DirectionDashboard({
    params,
  }: {
    params: Promise<{ slug: string }>
  }) {
    await connection()
    const { slug } = await params
    const base = `/${slug}/direction`
    // ...
  ```

  **Fetches parallèles :**
  ```ts
  const [identityRes, countsRes, metricsRes, yearRes, absencesRes] = await Promise.all([
    getOrgIdentityAction(),
    getOrgResourcesCountsAction(),
    getOrgDailyMetricsAction(),
    getCurrentYearAction(),
    getOrgTodayAbsencesAction(),
  ])
  const orgName  = 'data' in identityRes  ? identityRes.data?.name  ?? slug : slug
  const counts   = 'data' in countsRes    ? countsRes.data           : null
  const metrics  = 'data' in metricsRes   ? metricsRes.data          : null
  const year     = 'data' in yearRes      ? yearRes.data             : null
  const absences = 'data' in absencesRes  ? absencesRes.data ?? []   : []
  ```

  **Calculs :**
  ```ts
  const schedulesCount = (metrics?.todaySchedules ?? 0) === 0
    ? '0'
    : `${metrics?.completedSchedules ?? 0}/${metrics?.todaySchedules ?? 0}`
  ```

  **Structure JSX (reproduction V1) :**

  ```tsx
  <div className="scroll-smooth flex flex-col gap-y-4 pb-10">
    {year && <AcademicYearBanner year={year} />}

    {/* Header */}
    <header className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        Tableau de bord
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{orgName}</h1>
    </header>

    {/* Métriques du jour — 4 cards */}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="Anomalies" value="0" sub="retards + séances manquées"
        href={`${base}/sessions`} />
      <MetricCard label="Absences aujourd'hui"
        value={String(metrics?.todayAbsences ?? 0)} sub="présences marquées absentes" />
      <MetricCard label="Séances du jour" value={schedulesCount}
        sub="complétées aujourd'hui" href={`${base}/schedule`} />
      <MetricCard label="Sessions en cours"
        value={String(metrics?.activeSessions ?? 0)} sub="actuellement actives"
        href={`${base}/sessions`} />
    </section>

    {/* Anomalies — toujours masqué (placeholder 0) */}

    {/* Absences du jour */}
    <CollapseSection label="Absences du jour" count={absences.length}
      defaultOpen={absences.length > 0}>
      {absences.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          Aucune absence enregistrée aujourd'hui.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {absences.map((a) => {
            const name =
              [a.student.user.firstName, a.student.user.lastName]
                .filter(Boolean).join(' ') || 'Étudiant'
            return (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="size-2 shrink-0 rounded-full bg-red-500/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.schedule.course.name}
                    {' · '}
                    {a.schedule.group?.name ?? a.schedule.class.name}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {format(a.schedule.startTime, 'HH:mm')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </CollapseSection>

    {/* Séances en cours — placeholder TodaySessionsWidget */}
    <CollapseSection label="Séances en cours"
      count={metrics?.activeSessions ?? 0} defaultOpen>
      <Suspense fallback={<Loader />}>
        <TodaySessionsWidget />
      </Suspense>
    </CollapseSection>

    {/* Ressources */}
    <CollapseSection label="Ressources">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Cours" value={String(counts?.courses ?? 0)}
          sub="cours actifs" href={`${base}/courses`} />
        <MetricCard label="Classes" value={String(counts?.classes ?? 0)}
          sub="classes ouvertes" href={`${base}/classes`} />
        <MetricCard label="Salles" value={String(counts?.rooms ?? 0)}
          sub="salles disponibles" href={`${base}/rooms`} />
        <MetricCard label="Étudiants" value={String(counts?.students ?? 0)}
          sub={`${counts?.teachers ?? 0} enseignants`} href={`${base}/students`} />
      </div>
    </CollapseSection>
  </div>
  ```

**Checkpoint**: ✋ Page compile + structure V1 visible dans le navigateur

**Notes:**

---

## Phase 3: Vérification ⏳ (~15min)

**But**: Zéro erreur TS, export correct.

- [ ] T004 Vérifier TypeScript
  ```
  npx tsc --noEmit 2>&1 | grep -i "direction\|CollapseSection\|AlertCategory"
  ```
- [ ] T005 Vérifier barrel `src/components/layout/index.ts` exporte bien `CollapseSection`
- [ ] T006 Vérifier que `DailyMetricsCard` et `OrgMetricsCard` ne sont plus importés dans la page

**Checkpoint**: ✋ 0 erreur TS sur les fichiers modifiés

**Notes:**

---

## Résumé

| Phase | Fichiers touchés | Durée est. |
|---|---|---|
| 1 — Composants | `CollapseSection.tsx` (new), `AlertCategoryCards.tsx` (new) | ~30 min |
| 2 — Page | `direction/page.tsx` (refactor) | ~45 min |
| 3 — Vérif | TS check | ~15 min |

**Total : ~1h30**

### Placeholders intentionnels (hors périmètre task2)

| Section | Placeholder | Logique absente |
|---|---|---|
| Anomalies MetricCard | valeur fixe `"0"` | `bucketize` + `getDirectionSessionsAction` |
| AlertCategoryCards | non rendu (`anomalies.length === 0`) | `bucketize` retourne toujours 0 |
| "Séances en cours" | `TodaySessionsWidget` (séances du jour, pas sessions actives) | `ActiveSessionsGrid` non porté |
