# Plan Technique Validé : Cache Mois Planning Étudiant

- **Cible** : `apps/web/src/app/(app)/[slug]/student/planning` & `apps/web/src/components/student/planning`
- **Objectif** : Navigation journalière instantanée (0 ms de latence réseau, zéro requête serveur) via la mise en cache client du mois complet.
- **Principe d'architecture** : Le modèle `Schedule` est orchestré par le module **`planning`** (`services/planning/queries.ts`). Toutes les queries planning y sont centralisées (`planningSchedulesQuery`, `scheduleDaysQuery`, `teacherDaySchedulesQuery`). Le module `student` ne possède pas le modèle `Schedule` mais expose l'action sécurisée `getStudentScheduleAction` et le DTO généré `GetStudentSchedulesDto`.

---

## 1. Architecture Cible & Flux de Données

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Serveur / SSR (Page)                            │
│  apps/web/src/app/(app)/[slug]/student/planning/page.tsx               │
│  - Récupère classId et groupIds du profil étudiant                     │
│  - Calcule la plage mensuelle via getPlanningRange(date)               │
│  - Prefetch React Query : studentMonthSchedulesQuery(...)              │
│  - Hydratation SSR via <HydrationBoundary>                             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Hydratation
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   TanStack Query Client Cache                          │
│   Clé : ['schedules', 'student-month', classId, groupIdsKey, monthKey] │
│   Preset : QUERY_PRESETS.RETAINED (staleTime: 5 min, gcTime: 30 min)  │
│   Contenu : Séances complètes du mois (~60-80 séances, ~18 Ko)         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Composant : StudentPlanning                          │
│  apps/web/src/components/student/planning/StudentPlanning.tsx          │
│                                                                        │
│  - Directive "use client"                                              │
│  - State URL : ?date=YYYY-MM-DD via usePlanningDateFilter (nuqs)       │
│  - Navigation (← / →) : setDate(d, { shallow: true }) (0 appel serveur)│
│  - Rendu : schedules.filter(s => isSameDay(s.startTime, date)) [0 ms]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Inventaire des Briques du Codebase

| Brique | Statut | Emplacement / Rôle |
| :--- | :--- | :--- |
| **Orchestrateur Planning (Queries)** | **À enrichir** | [`apps/web/src/services/planning/queries.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/planning/queries.ts) — ajout de `studentMonthSchedulesQuery` |
| **Registre Central des Clés de Cache** | **À enrichir** | [`apps/web/src/cache/client/key.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/cache/client/key.ts) — ajout de `CACHE_KEYS.SCHEDULES.STUDENT_MONTH` |
| **Preset de Cache Retained (30 min)** | **Existant** | `QUERY_PRESETS.RETAINED` dans [`apps/web/src/cache/client/engine.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/cache/client/engine.ts#L35) |
| **Calcul Plage Mensuelle** | **Existant** | [`getPlanningRange(date)`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/planning/utils.ts#L42) (`startOfMonth` -> `endOfMonth`) |
| **Action & DTO Étudiant** | **Existant** | [`getStudentScheduleAction`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/student/actions/student.queries.ts#L107) & [`GetStudentSchedulesDto`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/student/generated.types.ts#L13) |
| **Synchronisation URL Date** | **Existant** | [`usePlanningDateFilter`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/hooks/data/planning/use-planning-date-filter.ts) (`nuqs` avec clé `date`) |
| **Server Component** | **À adapter** | [`apps/web/src/app/(app)/[slug]/student/planning/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/[slug]/student/planning/page.tsx) |
| **Client Component** | **À adapter** | [`apps/web/src/components/student/planning/StudentPlanning.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/student/planning/StudentPlanning.tsx) |

---

## 3. Spécifications Techniques Exactes du Code

### 3.1 Registre des clés : `apps/web/src/cache/client/key.ts`

Ajout sous `CACHE_KEYS.SCHEDULES` :

```ts
export const CACHE_KEYS = {
  SCHEDULES: {
    PLANNING: (filters: Record<string, unknown>) => ["schedules", "planning", filters] as const,
    DAYS: (month: string, filters?: Record<string, unknown>) =>
      filters ? (["schedules", "days", month, filters] as const) : (["schedules", "days", month] as const),
    NEXT: (teacherId: string) => ["schedules", "next", teacherId] as const,
    BY_TEACHER: {
      BY_DAY: ({ teacherId, dayKey }: { teacherId?: string; dayKey?: string } = {}) =>
        ["schedules", "by-teacher", teacherId ?? "me", dayKey ?? "today"] as const,
    },
    TEACHER_DAY: ({ teacherId, dayKey }: { teacherId: string; dayKey: string }) =>
      ["schedules", "teacher-day", teacherId, dayKey] as const,
    STUDENT_MONTH: ({ classId, groupIdsKey, monthKey }: { classId: string; groupIdsKey: string; monthKey: string }) =>
      ["schedules", "student-month", classId, groupIdsKey, monthKey] as const,
  },
  // ...
};
```

### 3.2 Query Factory : `apps/web/src/services/planning/queries.ts`

Intégration directe dans l'orchestrateur `planning`, typée par `GetStudentSchedulesDto` (déjà généré dans [`apps/web/src/services/student/generated.types.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/student/generated.types.ts#L13)) et configurée avec `QUERY_PRESETS.RETAINED` :

```ts
import { format } from "date-fns/format";
import { getPlanningRange } from "./utils";
import { getStudentScheduleAction, type GetStudentSchedulesDto } from "@/services/student";
import { CACHE_KEYS, QUERY_PRESETS } from "@/cache/client/key";

export type StudentMonthScheduleFilters = {
  classId: string;
  groupIds: string[];
  date: string | null; // ISO YYYY-MM-DD ou YYYY-MM
};

/**
 * Séances complètes d'un étudiant pour le mois entier (déduit de filters.date).
 * Orchestré par le domaine planning via getPlanningRange et conservé avec QUERY_PRESETS.RETAINED (30 min).
 */
export function studentMonthSchedulesQuery(filters: StudentMonthScheduleFilters) {
  const { rangeStart, rangeEnd } = getPlanningRange(filters.date);
  const monthKey = format(rangeStart, "yyyy-MM");
  const groupIdsKey = [...filters.groupIds].sort().join(",");

  return {
    queryKey: CACHE_KEYS.SCHEDULES.STUDENT_MONTH({
      classId: filters.classId,
      groupIdsKey,
      monthKey,
    }),
    queryFn: async (): Promise<GetStudentSchedulesDto> => {
      const res = await getStudentScheduleAction({
        classId: filters.classId,
        groupIds: filters.groupIds,
        rangeStart,
        rangeEnd,
      });
      if ("error" in res && res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    ...QUERY_PRESETS.RETAINED,
  };
}
```

### 3.3 Server Component : `apps/web/src/app/(app)/[slug]/student/planning/page.tsx`

Paramètre d'URL en anglais (`date`), préchargement SSR du mois complet et hydratation :

```tsx
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { format } from "date-fns/format";

import { getQueryClient } from "@/lib/react-query";
import { getStudentProfileAction } from "@/services/student";
import { studentMonthSchedulesQuery } from "@/services/planning/queries";
import { StudentPlanning } from "@/components/student/planning/StudentPlanning";
import { BackpackIllustration, StudentEmpty } from "@/components/student/ui/illustrations";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function StudentPlanningPage({ searchParams }: Props) {
  await connection();
  const { date: dateParam } = await searchParams;

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{profileRes.error}</p>
      </div>
    );
  }

  const { classId, groupIds } = profileRes.data;
  if (!classId) {
    return (
      <StudentEmpty
        illustration={<BackpackIllustration />}
        title="Aucune classe associée"
        hint="Contacte ta direction pour être inscrit dans une classe — ton planning apparaîtra ici."
        className="h-full"
      />
    );
  }

  const activeDate = dateParam ?? format(new Date(), "yyyy-MM-dd");
  const queryClient = getQueryClient();

  // Préchargement SSR du mois complet
  await queryClient.prefetchQuery(
    studentMonthSchedulesQuery({
      classId,
      groupIds,
      date: activeDate,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentPlanning classId={classId} groupIds={groupIds} initialDate={activeDate} />
    </HydrationBoundary>
  );
}
```

### 3.4 Client Component : `apps/web/src/components/student/planning/StudentPlanning.tsx`

- Directive `"use client"`.
- Inférence directe du type des séances depuis `useQuery(studentMonthSchedulesQuery(...))` (`GetStudentSchedulesDto`), sans type local ni import superflu.
- Utilisation de `setDate(..., { shallow: true })` pour empêcher toute réexécution du Server Component Next.js lors des clics `←` et `→`.
- Filtrage instantané en mémoire synchrone (`0 ms`).

```tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isSameDay, isToday, isTomorrow, isYesterday, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";

import { usePlanningDateFilter } from "@/hooks/data/planning/use-planning-date-filter";
import { studentMonthSchedulesQuery } from "@/services/planning/queries";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";
import { cn, formatTime } from "@/lib/utils";

type Props = {
  classId: string;
  groupIds: string[];
  initialDate: string;
};

function relativeLabel(day: Date) {
  if (isToday(day)) return "Aujourd'hui";
  if (isTomorrow(day)) return "Demain";
  if (isYesterday(day)) return "Hier";
  return format(day, "EEEE", { locale: fr });
}

export function StudentPlanning({ classId, groupIds, initialDate }: Props) {
  const [dateParam, setDate] = usePlanningDateFilter();
  const activeDate = dateParam ?? parseISO(initialDate);
  const activeDateIso = format(activeDate, "yyyy-MM-dd");

  const now = new Date();

  // Données mensuelles (immédiates au SSR, en cache mémoire client ensuite)
  const { data: monthSchedules = [] } = useQuery(
    studentMonthSchedulesQuery({
      classId,
      groupIds,
      date: activeDateIso,
    })
  );

  // Filtrage local synchrone : 0 ms de latence
  const daySchedules = useMemo(() => {
    return monthSchedules.filter((s) => isSameDay(new Date(s.startTime), activeDate));
  }, [monthSchedules, activeDate]);

  // shallow: true impératif pour empêcher tout rechargement de page Next.js
  const handlePrevDay = () => setDate(subDays(activeDate, 1), { shallow: true });
  const handleNextDay = () => setDate(addDays(activeDate, 1), { shallow: true });
  const handleToday = () => setDate(new Date(), { shallow: true });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-between px-2 py-1">
        <button
          type="button"
          onClick={handlePrevDay}
          aria-label="Jour précédent"
          className="p-2 text-muted-foreground transition hover:text-foreground"
        >
          ←
        </button>

        <button
          type="button"
          onClick={handleToday}
          aria-label={isToday(activeDate) ? "Afficher la date du jour" : "Revenir à aujourd'hui"}
          className="flex min-w-0 flex-col items-center leading-tight text-center"
        >
          <p className="text-xs text-muted-foreground">{relativeLabel(activeDate)}</p>
          <h1 className="-mr-[0.2em] text-2xl font-semibold uppercase tracking-[0.2em]">
            {format(activeDate, "EEEE", { locale: fr })}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {format(activeDate, "d MMMM yyyy", { locale: fr })}
          </p>
        </button>

        <button
          type="button"
          onClick={handleNextDay}
          aria-label="Jour suivant"
          className="p-2 text-muted-foreground transition hover:text-foreground"
        >
          →
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-14">
        {daySchedules.length === 0 ? (
          <p className="pt-12 text-center text-2xl font-medium">Pas de séance ce jour-là.</p>
        ) : (
          <ul className="divide-y">
            {daySchedules.map((s) => {
              const ui = resolveScheduleUiStatus(s, now);
              const done = ui === "COMPLETED" || ui === "MISSED";
              const canceled = s.status === "CANCELED";
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-baseline gap-4 py-3.5",
                    (done || canceled) && "opacity-50",
                    canceled && "line-through",
                  )}
                >
                  <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatTime(new Date(s.startTime))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.course.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[s.teacher.user.firstName, s.teacher.user.lastName].filter(Boolean).join(" ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.room.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Plan de Déploiement & Validation

1. **Étape 1 : Clé de cache** (`apps/web/src/cache/client/key.ts`)
   - Déclarer `CACHE_KEYS.SCHEDULES.STUDENT_MONTH`.
2. **Étape 2 : Query Factory** (`apps/web/src/services/planning/queries.ts`)
   - Exporter `studentMonthSchedulesQuery` typée par `GetStudentSchedulesDto` (déjà exporté par `@/services/student`) et configurée avec `QUERY_PRESETS.RETAINED`.
3. **Étape 3 : Client Component** (`apps/web/src/components/student/planning/StudentPlanning.tsx`)
   - Passer en `"use client"`.
   - Brancher `useQuery(studentMonthSchedulesQuery(...))` et `usePlanningDateFilter`.
   - Remplacer les `<Link>` de navigation par des boutons appelant `setDate(..., { shallow: true })`.
   - Filtrer `daySchedules` en local avec `isSameDay(new Date(s.startTime), activeDate)`.
4. **Étape 4 : Server Component** (`apps/web/src/app/(app)/[slug]/student/planning/page.tsx`)
   - Lire `{ date: dateParam }` depuis `searchParams`.
   - Précharger le mois via `queryClient.prefetchQuery(studentMonthSchedulesQuery(...))`.
   - Envelopper dans `<HydrationBoundary state={dehydrate(queryClient)}>`.
5. **Étape 5 : Vérification technique**
   - Contrôler `npx tsc --noEmit` (0 erreur).
   - Vérifier au runtime :
     - Premier affichage instantané (SSR hydraté).
     - Clics `←` et `→` : transition immédiate à 0 ms, aucune requête réseau (inspecter l'onglet Network).
     - Transition inter-mois (ex: 30 nov -> 01 déc) : un seul fetch du nouveau mois, puis retour instantané en nov sans refetch grâce à `QUERY_PRESETS.RETAINED`.
