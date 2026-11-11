<!-- Path: docs/skills/good-practices/MAP.md -->

# Carte du code : où chercher avant de créer

Tous les chemins ci-dessous sont relatifs à `apps/web/`.

| Besoin | Emplacement | Contenu |
| :-- | :-- | :-- |
| Clés de cache | `src/cache/client/key.ts` | Registre `CACHE_KEYS` ; ajouter une entrée sans remplacer les clés existantes. |
| Durées et presets | `src/cache/client/engine.ts` | `CACHE_TIME`, `QUERY_PRESETS`, `entityKeys`, `subKey`. |
| Query factories | `src/services/planning/queries.ts` | `planningSchedulesQuery`, `scheduleDaysQuery`, `orgPlanningResourcesQuery`, `teacherDaySchedulesQuery`. |
| Utilitaires planning | `src/services/planning/utils.ts` | `getPlanningRange`, `mapScheduleToEvent`, `statusToColor`. |
| Actions serveur | `src/services/schedule/actions/`, `src/services/student/actions/`, `src/services/planning/actions.ts` | Actions de lecture et mutation par domaine. Vérifier les exports avant d'ajouter une action. |
| Filtre date en URL | `src/hooks/data/planning/use-planning-date-filter.ts` | `usePlanningDateFilter`, clé `?date=`, configuration nuqs (`shallow: false`). |
| Préchargement SSR | `src/app/**/page.tsx`, `src/lib/react-query.ts` | `connection()` + `getQueryClient()` + `prefetchQuery` + `HydrationBoundary` (voir CACHE-002). |
| Règles d'ingénierie | `docs/skills/good-practices/` | Registre dans `index.yaml` et règles par domaine dans `rules/`. |
