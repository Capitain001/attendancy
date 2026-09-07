# Service : schedule

Gère les séances concrètes (`Schedule`) : création manuelle, mise à jour, suppression logique.

## Particularités multi-tenant

- `Schedule` a `orgId` direct — scoping standard
- `classId` est dénormalisé sur `Schedule` — utilisé dans cacheTag pour invalidation fine

## Anti-conflit (GiST)

Contraintes d'exclusion Postgres garantissent zéro double-réservation salle/prof/classe/groupe.
Les violations remontent via `tryConstraint` → `TRIGGER_ERROR` dans `constants.ts`.
Noms des contraintes : `no_room_overlap`, `no_teacher_overlap`, `no_class_overlap_global`, `no_group_overlap`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/schedule.mutations.ts` | `createScheduleAction`, `updateScheduleAction`, `removeScheduleAction`, `cancelScheduleAction` |
| `actions/schedule.queries.ts` | `getClassSchedulesAction`, `getSchedulesAction`, `getClassScheduleOptionsAction` |
| `cache.ts` | `SCHEDULE_GRAPH` — events CREATED/UPDATED/REMOVED |
| `constants.ts` | Constantes du domaine |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/schedule.mutations.ts` | `createSchedule`, `updateSchedule`, `removeSchedule` |
| `database/schedule.queries.ts` | `getSchedulesByClass`, `getSchedules` — "use cache" |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `policy.ts` | Règles d'autorisation métier |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | `createScheduleSchema`, `updateScheduleSchema` |
## Invariants

- Séance COMPLETED/CANCELED/MISSED non modifiable sur champs structurants (trigger DB)
- `status` CANCELED/MISSED libère la ressource (exclus des contraintes GiST)
- `groupId` NULL = séance pour la CLASSE ENTIÈRE (contrainte `no_class_overlap_global`)
- `removeSchedule` = soft delete (`deletedAt`), pas hard delete
- `teacherId` optionnel à la création (peut être assigné plus tard)

## Points d'extension (⚠)

- Récurrence via `WeeklyTemplate` + `WeekRecurence` (Phase 2.3)
- Vue planning enseignant (Phase 2.4)
- Indisponibilités (`TeacherUnavailability`) (Phase 2.5)
