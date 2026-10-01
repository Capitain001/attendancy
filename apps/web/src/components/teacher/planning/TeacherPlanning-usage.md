# `TeacherPlanning` — usage

Planning mensuel de l'enseignant connecté : un calendrier dont le **mois affiché
est piloté par l'URL**, avec un indicateur visuel sur les jours qui ont des
séances et un drawer de détail au clic.

---

## Point d'entrée

Page RSC : `src/app/(app)/[slug]/teacher/planning/page.tsx`

```tsx
<HydrationBoundary state={dehydrate(queryClient)}>
  <TeacherPlanning teacherId={teacherId} />
</HydrationBoundary>
```

| Prop | Type | Rôle |
|---|---|---|
| `teacherId` | `string` | Enseignant connecté (`getCurrentTeacherId()`). Scoping de toutes les requêtes. |

Le composant est `"use client"` (calendrier interactif + hooks React Query).

---

## Fonctionnalités UI

| Fonctionnalité | Détail |
|---|---|
| Navigation par mois | Boutons prev/next du calendrier ; le mois choisi est écrit dans l'URL (`?month=yyyy-MM`). |
| Indicateur de séance | Les jours ayant ≥ 1 séance reçoivent un fond + anneau (`HAS_SCHEDULE_DECORATION`) et un point sous le numéro (`HAS_SCHEDULE_FOOTER`). |
| Sélection d'un jour | Clic sur un jour → ouvre le drawer avec les séances de ce jour. |
| Drawer de détail | `TeacherPlanningDrawer` : horaires, cours, salle, classe/groupe, statut, confirmation. |
| Deep-link | Une URL `?month=2026-11` recharge directement novembre. |

**Statut affiché** : le drawer n'utilise jamais `schedule.status` (statut DB brut).
Il dérive le statut via `resolveScheduleUiStatus(schedule, now)`
(`services/schedule/policy.ts`) et lit le libellé dans `SCHEDULE_UI_STATUS_LABEL`
(source unique). Un `PENDING` dans sa fenêtre s'affiche donc **En cours**, et un
`PENDING` dont la fenêtre est passée s'affiche **Manquée** (latence DB non encore
actée). `now` vient de `useScheduleClock`, qui ne se réveille qu'aux frontières de
transition — pas de re-render inutile.

---

## Fonctionnement

### 1. Mois piloté par l'URL

`usePlanningMonth()` (`hooks/data/planning/use-planning-month.ts`, nuqs) :

- clé d'URL : `PLANNING_MONTH_KEY = "month"`, format `yyyy-MM` ;
- param absent **ou invalide** → mois courant ;
- `setMonth(null)` retire le paramètre de l'URL ;
- le `Calendar` est **contrôlé** : `month={visibleMonth}` + `onMonthChange={setVisibleMonth}`.

La mise à jour est *shallow* (pas de navigation serveur) : le changement de mois
est instantané côté client, et l'URL reste partageable.

### 2. Chargement des données

Deux hooks, tous deux alimentés par React Query :

| Hook | Query | Retour |
|---|---|---|
| `useScheduleDays({ visibleMonth, filters: { teacherId } })` | `scheduleDaysQuery` → `getScheduleDaysAction` | `Set<"yyyy-MM-dd">` — jours du mois ayant des séances (indicateur) |
| `useTeacherDaySchedules({ teacherId, date: selectedDate })` | `teacherDaySchedulesQuery` → `getTeacherSchedulesAction` | `GetSchedulesDto` — séances du jour sélectionné (drawer) |

`useScheduleDays` **prefetch silencieusement les mois adjacents** (précédent /
suivant) : c'est le mécanisme « le mois choisi et ses bords ». Naviguer d'un
mois à l'autre est donc fluide et sans écran de chargement.

Clés de cache :

```
["schedules", "days", "2026-09", { teacherId }]        // CACHE_KEYS.SCHEDULES.DAYS
["schedules", "teacher-day", teacherId, "2026-09-13"]  // CACHE_KEYS.SCHEDULES.TEACHER_DAY
```

> ⚠️ La clé `["schedules","days",…]` est un **identifiant de requête**, pas une
> donnée. La valeur associée est un tableau de jours `"yyyy-MM-dd"` ; `[]` =
> aucune séance ce mois-là.

**Rétention du détail du jour** : `teacherDaySchedulesQuery` utilise le preset
`QUERY_PRESETS.RETAINED` (`staleTime` 5 min, `gcTime` 30 min). Le détail d'un jour
reste donc en cache après avoir changé de jour — revenir sur un jour déjà visité
ne refait pas de requête. Sans ce `gcTime` long, l'entrée serait collectée au bout
de 5 min (défaut) et le retour déclencherait un refetch.

### 3. Préchargement SSR

La page serveur précharge **le mois demandé**, avec exactement la même factory de
query que le hook client — l'hydratation est donc garantie (pas de fetch
redondant au premier rendu) :

```ts
await queryClient.prefetchQuery(
  scheduleDaysQuery({ month: monthKey, filters: { teacherId } })
)
```

`monthKey` est lu depuis `searchParams.month` (repli : mois courant).

Le **jour sélectionné** n'est pas préchargé côté serveur : c'est un état client
(`startOfDay(new Date())`) dont la clé dépend du fuseau du navigateur. Le laisser
au client évite un désalignement de timezone serveur/client (hydratation ratée
puis refetch) et une requête spéculative — le détail complet du jour n'est utile
qu'à l'ouverture du drawer.

---

## Indicateurs visuels (isolés de la logique métier)

Les styles sont des constantes module-level ; le composant ne décide que *si* un
jour est marqué :

```ts
const HAS_SCHEDULE_DECORATION: DayDecoration = {
  fillClassName: "bg-primary/10",
  ringClassName: "ring-2 ring-primary/80",
};
const HAS_SCHEDULE_FOOTER = "•";
```

Appliqués via `dayDecoration` / `dayFooter` du `Calendar`
(`@/components/ui/custom/calendar`, wrapper DayPicker).

---

## Fichiers liés

| Fichier | Rôle |
|---|---|
| `src/app/(app)/[slug]/teacher/planning/page.tsx` | Page RSC — prefetch + hydratation |
| `src/components/teacher/planning/TeacherPlanning.tsx` | Composant racine (ce document) |
| `src/components/teacher/planning/ui/TeacherPlanningDrawer.tsx` | Drawer de détail du jour |
| `src/hooks/data/planning/use-planning-month.ts` | Mois d'URL (`?month=`) |
| `src/hooks/data/planning/useScheduleDays.ts` | Jours du mois + prefetch des mois adjacents |
| `src/hooks/data/planning/useTeacherDaySchedules.ts` | Séances d'un jour |
| `src/services/planning/queries.ts` | `scheduleDaysQuery`, `teacherDaySchedulesQuery` |

---

## Règles d'usage

- Le mois visible est **toujours** lu depuis l'URL — ne pas réintroduire de state
  local de mois, sinon la navigation et le deep-link divergent.
- Le préchargement serveur doit utiliser **les mêmes** factories de query que les
  hooks client, sinon l'hydratation échoue.
- Le composant ne fait aucun appel direct à une server action : tout passe par
  `hooks/data/planning/`.
- Le scoping enseignant est porté par `teacherId` ; les actions utilisées sont en
  `authAccess` simple (pas de rôle `DIRECTION`).
