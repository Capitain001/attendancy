# Services hors pattern standard

Catalogue des services qui dévient du pattern `1 modèle Prisma = 1 service owner`.
À lire avant toute modification sur ces services.

---

## 1. Services orchestrateurs (aucun modèle Prisma propre)

### `planning` — cœur métier du planning

**Rôle :** Agrège les ressources de plusieurs domaines (class, course, room, teacher)
pour alimenter la vue planning. Pas de `prisma.planning`. Pas de mutations.

**Structure particulière :**
```
planning/
  database.ts     # getPlanningResources, getOrgPlanningResources — "use cache"
  actions.ts      # getPlanningResourcesAction, getOrgPlanningResourcesAction
  queries.ts      # planningSchedulesQuery, scheduleDaysQuery (React Query / packages/planning)
  policy.ts       # règles métier pures partagées client ⇄ serveur
  utils.ts        # mapScheduleToEvent, statusToColor, getPlanningRange
  types.ts        # PlanningResources, OrgPlanningResources
  conflict/       # détection conflits (phase 2)
```

**`policy.ts` — règles métier (source de vérité) :**
- `isSlotElapsed(slot)` — R1 : interdit de planifier sur créneau passé (fin ≤ now)
- `isValidTimeOrder(start, end)` — R2 : début < fin (contrainte DB `check_schedule_time_order`)
- `PAST_SLOT_ERROR` — message utilisateur partagé actions + UI

Appliquées dans : `createScheduleAction`, `updateScheduleAction`, `ClassPlanning` (drag), `CoursePlanningDialog`.

**Invalidation cache :** hérite des caches `CACHE.CLASS(orgId)` + `CACHE.ROOM(orgId)` — pas de graphe propre.

---

## 2. Services à `policy.ts` riche (règles métier partagées client ⇄ serveur)

Ces services **ont** un modèle Prisma mais leur `policy.ts` est la source de vérité
pour des règles métier complexes partagées entre UI et serveur.

### `attendance` — présence et absentéisme

Modèle owner : `Attendance`. Mais `policy.ts` définit le domaine métier complet.

**`policy.ts` :**
- Flow global teacher → student (8 étapes : check-in GPS → QR → scan → confirmation → clôture)
- Statuts `AttendanceStatus` + transitions autorisées (PENDING → PRESENT / ABSENT à clôture)
- Calcul du taux : `(PRESENT + LATE) / (PRESENT + LATE + ABSENT + EXCUSED)` — PENDING exclu
- Seuils absentéisme : `ABSENTEEISM_RATE_THRESHOLD = 75%`, `ABSENTEEISM_MIN_SESSIONS = 4`
- `isAbsenteeism({ rate, denominator })` — pilotage direction (P-23)
- Règles QR token : `TOKEN_DURATION_MINUTES = 15`, auto-refresh 30s avant expiry
- Règles GPS : teacher bloquant (PostGIS), student best-effort
- Architecture fichiers complète du domaine session/attendance/location

**Services liés :** `session` (startSession, completeSession), `notification` (notif ABSENCE à clôture).

### `schedule` — statut UI des séances

Modèle owner : `Schedule`.

**`policy.ts` :**
- `ScheduleUiStatus` : PENDING | ONGOING | COMPLETED | CANCELED | MISSED
- `resolveScheduleUiStatus(schedule, now)` — résout le statut UI depuis le statut DB + l'heure courante
  (ex. Schedule PENDING + heure dépassée = MISSED côté UI)
- `SCHEDULE_UI_STATUS_LABEL` — labels FR partagés

**Particularité :** contraintes GiST anti-conflit (`no_room_overlap`, `no_teacher_overlap`, etc.) gérées DB-side, remontées via `tryConstraint` → `TRIGGER_ERROR`.

---

## 3. Services infrastructure (structure non standard, pas de database/ Prisma)

Ces services ne suivent pas la structure `actions/ + database/`. Exception documentée.

### `audit`

**Délègue à `@/modules/audit`** — pas de couche `database/` Prisma directe.
`actions.ts` appelle `getOrgAuditLogs` du module. Modèle Prisma : `AuditLog` (owned par le module).

### `auth`

**Wraps Supabase auth.** Fournit `authAccess()`, `getUserInfo()`, `getAuthorization()`.
Pas de structure actions/database standard. Modèle Prisma indirect : `User`, `UserOrganization`, `Admin`.
Source : `@/modules/auth` + Supabase client.

### `user`

**Wraps User/UserOrganization.** Pas de structure actions/database standard visible.
À documenter dans son CLAUDE.md.

---

## Récapitulatif

| Service | Modèle Prisma propre | policy.ts | Structure standard |
|---------|---------------------|-----------|-------------------|
| `planning` | ✗ (orchestration) | ✓ | partielle |
| `attendance` | ✓ `Attendance` | ✓ riche | ✓ |
| `schedule` | ✓ `Schedule` | ✓ | ✓ |
| `audit` | ✗ (module) | ✗ | ✗ |
| `auth` | ✗ (Supabase) | ✗ | ✗ |
| `user` | indirect | ✗ | ✗ |
