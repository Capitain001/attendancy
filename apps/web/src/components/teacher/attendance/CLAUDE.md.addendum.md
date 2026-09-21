<!-- À reporter dans src/services/attendance/CLAUDE.md -->

## Vue d'ensemble enseignant

| Fichier | Rôle |
|---|---|
| `database/analytics.ts` → `getTeacherAttendanceOverview(userId, orgId, sinceDays?)` | Une lecture `prisma.attendance.findMany` scopée `schedule.orgId` + `schedule.teacher.userId`, séances effectives (`session.status = COMPLETED`, `deletedAt: null`), agrégée en mémoire : totaux, taux par cours, tendance hebdo, étudiants en absentéisme, dernières séances. |
| `actions/analytics.ts` → `getTeacherAttendanceOverviewAction({ period })` | `authAccess({ requiredRole: 'TEACHER' })`, l'enseignant vient du token. `period` → `sinceDays` via `TEACHER_OVERVIEW_PERIOD_DAYS`. |
| `validation.ts` → `getTeacherAttendanceOverviewSchema` | `period` : `'30d' \| '90d' \| 'all'`, défaut `'90d'`. |
| `constants.ts` | Périodes, tailles de listes. Les règles de taux et le seuil d'absentéisme restent dans `policy.ts`. |

### Invariants

- **Taux** : `ATTENDANCE_NUMERATOR_STATUSES` / `ATTENDANCE_DENOMINATOR_STATUSES` de `policy.ts`, pourcentage entier, `null` si dénominateur = 0. Le taux d'un cours est **poolé** (somme des numérateurs / somme des dénominateurs), pas la moyenne des taux par séance.
- Absentéisme : `isAbsenteeism` de `policy.ts`, appliqué sur les seuls pointages de cet enseignant (≠ rapport direction, calculé sur toute la classe).
- Pas de compteur « à confirmer » : une séance COMPLETED n'a plus de PENDING (`markScheduleAbsences`).
- Caché (`"use cache"`, `cacheTag(CACHE.ATTENDANCES(orgId))`, `cacheLife('minutes')`) selon le pattern des services. ⚠ Les mutations qui modifient une présence ou clôturent une séance (`markScheduleAbsences` via `completeSession`, `createAttendance`, justification → EXCUSED) doivent invalider ce tag via `invalidateEvent`, sinon la vue reste périmée jusqu'à l'expiration.
- ⚠ Point d'extension : le filtre enseignant (`schedule.teacher.userId`) vit uniquement dans le `where` de `getTeacherAttendanceOverview`.
