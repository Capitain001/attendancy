# Rapport de régression : Services V1 → V2

**Date :** 2026-07-29  
**Périmètre :** `planning`, `student`, `teacher`, `chat`  
**V1 source :** `C:\PROJECTS\ALL\attendancy\src\services\`  
**V2 cible :** `src\services\`

---

## Table de priorité

| Service | Gravité | Impact principal | Statut |
|---------|---------|-----------------|--------|
| **teacher** | 🔴 Haute | `getOrganizationTeacherStats` disparu + `ponctualite` hardcodé à 100 | ⏳ À traiter |
| **planning** | 🟠 Moyenne | `recurrence/` (RRule logic) + `utils.ts` (merge/mapping) disparus | ⏳ À traiter |
| **student** | 🟡 Faible | `averageGrade` + `totalEvaluations` absents des stats | ⏳ À traiter |
| **chat** | 🟢 Aucune | 100% compatible | ✅ OK |

---

## 1. `teacher` — Haute gravité

### Régressions

#### `stats.database.ts` disparu

V1 avait deux fonctions de stats :

```ts
getTeacherStats(teacherId)           // stats individuelles
getOrganizationTeacherStats(orgId)   // stats globales org (active/inactive/withCourses)
```

V2 conserve `getTeacherStats` dans `database/teacher.queries.ts` mais avec :
- `ponctualite` hardcodé à `100` au lieu d'être calculé depuis les sessions
- `getOrganizationTeacherStats` **entièrement supprimée** (counts actifs/inactifs pour dashboard admin)

#### `utils.ts` disparu

- `getTeacherIdByUserId()` → remplacé par `user.organization?.teacherId` (V2 pattern)
- `getCurrentTeacherId()` → idem

### Améliorations V2

- Stats scoped par `orgId` (invariant multi-tenant)
- Cache `"use cache"` + `cacheTag(CACHE.TEACHER(orgId))` vs `unstable_cache` V1

### Actions recommandées

1. Réimplémenter `getTeacherOrganizationStats(orgId)` dans `database/teacher.queries.ts`  
   Données : `{ total, active, inactive, withCourses }` depuis `prisma.teacher.count/groupBy`
2. Corriger `ponctualite` : calculer depuis les sessions (taux = sessions à l'heure / total)
3. Ajouter `getTeacherOrganizationStatsAction()` dans `actions/`

### Fichiers concernés

- `src/services/teacher/database/teacher.queries.ts` → ajouter `getTeacherOrganizationStats`
- `src/services/teacher/actions/teacher.queries.ts` → ajouter action

---

## 2. `planning` — Gravité moyenne

### Régressions

#### Dossier `recurrence/` entièrement supprimé

V1 contenait toute la logique RRule (récurrence calendrier) :

```ts
// recurrence/rules.ts
createRRuleFromScheduleRule(rule)
createRRuleSetWithExclusions(rules, excluded)
validateScheduleRule(rule)

// recurrence/occurrence.ts
generateOccurrences(rule, range)
generateOccurrencesForRules(rules, range)

// recurrence/utils.ts
toOrganizationTimezone(date, tz)
combineDateAndTime(date, time)
convertDayOfWeek(day)
prepareExcludedDates(dates)
```

En V2, ces fonctions sont **absentes** de `src/services/planning/`. Soit elles ont migré vers `services/schedule-rule/` (à vérifier), soit elles sont perdues.

#### `utils.ts` appauvri

V1 avait `mergeGeneratedWithPersisted()` et `mapOccurrenceToCalendarEvent()` / `mapScheduleToCalendarEvent()`.  
V2 `utils.ts` ne contient pas ces fonctions — migration côté client possible.

#### `validation.ts` absent

V2 n'a pas de fichier `validation.ts` pour planning (V1 non plus — fichier vide).

### Améliorations V2

- Conflit simulation via `$transaction` + `SAVEPOINT` (robuste)
- `policy.ts` : séparation logique métier
- Valibot dans `conflict/validation.ts`

### Actions recommandées

1. Vérifier si `recurrence/` a migré dans `services/schedule-rule/` ou `services/schedule/`
2. Si absent → réimplémenter avec RRule (lib `rrule`) et patterns V2
3. Confirmer que merge/mapping occurrence est géré côté composant ou hook

### Fichiers concernés

- `src/services/planning/` → vérifier `recurrence/` migration
- `src/services/schedule-rule/` → candidat migration de `recurrence/`

---

## 3. `student` — Gravité faible

### Régressions

#### Stats appauvries

V1 `stats.database.ts` exposait :
```ts
interface StudentStats {
  totalCourses: number
  averageGrade: number        // ❌ absent en V2
  attendanceRate: number
  totalEvaluations: number    // ❌ absent en V2
}
```

V2 `getStudentStats()` retourne `{ attendanceRate, totalCourses, todayCount }`.  
`averageGrade` et `totalEvaluations` sont perdus.

#### `utils.ts` disparu

- `getStudentIdByUserId()` → remplacé par `user.organization?.studentId` (V2 OK)
- `getCurrentStudentId()` → idem

### Améliorations V2

- Stats scoped `{ studentId, orgId, classId, groupIds }` — plus précis
- Cache V2 standard

### Actions recommandées

1. Si `averageGrade` est affiché dans l'UI → ajouter calcul depuis les évaluations
2. Si `totalEvaluations` nécessaire → ajouter count dans `getStudentStats()`

### Fichiers concernés

- `src/services/student/database/student.queries.ts` → enrichir `getStudentStats`

---

## 4. `chat` — Aucune régression

Service 100% compatible. V1 `validation.ts` était vide. Actions et database identiques.

---

## Backlog priorisé

| ID | Service | Description | Gravité | Effort | Priorité |
|----|---------|-------------|---------|--------|----------|
| REG-TEACH-01 | teacher | `getOrganizationTeacherStats` supprimée | Haute | ~1h | P1 |
| REG-TEACH-02 | teacher | `ponctualite` hardcodé à 100 | Haute | ~30min | P1 |
| REG-PLAN-01 | planning | `recurrence/` (RRule) introuvable en V2 | Moyenne | ~4h | P2 |
| REG-PLAN-02 | planning | `mergeGeneratedWithPersisted` et mapping disparus | Moyenne | ~1h | P2 |
| REG-STU-01 | student | `averageGrade` + `totalEvaluations` absents | Faible | ~30min | P3 |
