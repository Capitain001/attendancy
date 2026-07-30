 # Checklist migration V1 → V2 — Services

**V1 source :** `C:\PROJECTS\ALL\attendancy\src\services\`  
**V2 cible :** `src\services\`  
**Dernière mise à jour :** 2026-07-29

## Légende

| Symbole | Sens |
|---------|------|
| ✅ | Analysé + traité (0 régression bloquante) |
| ⚠ | Analysé — régressions documentées, non traitées |
| 🔄 | En cours de traitement |
| ❌ | Non analysé |
| ➕ | Service V2-only (pas d'équivalent V1) |
| 🗑 | Service V1-only (supprimé ou fusionné) |

---

## Services communs V1 ↔ V2

| Service V2 | Equiv V1 | Statut | Gravité | Rapport | Régressions clés |
|------------|----------|--------|---------|---------|-------------------|
| `invite` | `invitation` | ✅ | — | [rapport](invitation-service-v1-v2.md) | D1–D5 traités · REG-01→05 traités |
| `notification` | `notification` | ✅ | — | — | Service recréé complet (VAPID + DB + cache) |
| `teacher` | `teacher` | ✅ | — | [rapport](services-v1-v2.md#1-teacher--haute-gravité) | REG-TEACH-01 ✅ · REG-TEACH-02 ✅ |
| `planning` | `planning` | ✅ | — | [rapport](services-v1-v2.md#2-planning--gravité-moyenne) | REG-PLAN-01/02 N/A — `ScheduleRule` supprimé en V2, architecture redessinée |
| `student` | `student` | ✅ | — | [rapport](services-v1-v2.md#3-student--gravité-faible) | REG-STU-01 ✅ — `averageGrade` + `totalEvaluations` restaurés |
| `chat` | `chat` | ✅ | — | [rapport](services-v1-v2.md#4-chat--aucune-régression) | Aucune régression |
| `auth` | `auth` | ✅ | — | — | `FunctionName` → `Functions` · `SUPER_ADMIN`/`MEMBER` hors Role V2 → `GUEST` · `function/` barrels créés · `event/` `SUPER_ADMIN` retiré de RoleEnum · `invite/` `createAdminClient` import manquant · `invite/` `resourceType Resource` type fix · `toDeleteFn` V2 pattern · composants `@types/user` → `user/types` |
| `class` | `class` | ✅ | — | — | Aucune régression · V2 améliore Level enum + _count + programTrack scope |
| `course` | `courses` | ✅ | — | — | Bug cache `deleteTeacherFromCourse` fix · `getCourse` + `removeCourse` ajoutés · `COURSE_REMOVED` graph |
| `direction` | `direction` | ✅ | — | — | `database/` créé · queries + mutations Prisma (orgId direct) · `CACHE.DIRECTION` + `DIRECTION_GRAPH` · actions complétées (V2 pattern) · hooks V2 pattern fixés |
| `fonctions` | `fonctions` | ✅ | — | — | V2 renommé → `function` · DB queries + mutations · cache + graphe · actions + types · barrels créés |
| `org` | `organization` | ✅ | — | — | Redesign délibéré V2 — service plus riche (identity, usage, details, metrics, resources) |
| `room` | `room` | ✅ | — | — | `updateRoom` db-layer ajouté · `removeRoomAction` ActionResponse fix · `'use cache'` queries |
| `schedule` | `schedule` | ✅ | — | — | V1 rule-based ops N/A · `restoreSchedule` db-layer ajouté · TS null fix `ct.teacher` |
| `subscription` | `subscription` | ✅ | — | — | DB queries + mutations · `SUBSCRIPTION_GRAPH` · actions complétées (V2 pattern) · `Plan` catalogue global (orgId N/A) |
| `user` | `user` | — | — | — | Bypass |
| `users` | `users` | ✅ | — | — | `database/` créé · `getUserRoleStats` implémenté · `getUserProfile` + `getUsersByRoles` + `getFunctionProfiles` + actions complétées · `UserRoleStats` type dérivé via `Awaited<ReturnType<>>` |
| `weekly-template` | — | ➕ | — | — | V2-only, pas d'équivalent V1 |

---

## Services V2-only (nouveaux)

| Service V2 | Notes |
|------------|-------|
| `academic-year` | V1 : `years` (renommé + restructuré) |
| `attendance` | Nouveau module |
| `department` | Nouveau module |
| `entity` | Utilitaire générique V2 |
| `event` | Nouveau module |
| `function` | V1 : `fonctions` (renommé, service complet créé en V2) |
| `group` | V1 : `sub-class` (renommé) |
| `program` | Nouveau module |
| `program-track` | Nouveau module |
| `program-ue` | Nouveau module |
| `session` | Extrait de `schedule` |
| `teacher-unavailability` | Nouveau module |
| `term` | Nouveau module |
| `ue` | Nouveau module |
| `ue-course` | Nouveau module |

---

## Services V1-only (supprimés / fusionnés)

| Service V1 | Sort en V2 | Notes |
|------------|-----------|-------|
| `cache` | fusionné | → `src/cache/server/` |
| `domain` | supprimé | Inconnu |
| `parent` | fusionné | → `services/invite/parent/` |
| `persmission` | fusionné | → `services/auth/persmission/` |
| `plans` | renommé | → `services/subscription/` |
| `presence` | supprimé/intégré | Probablement dans `chat/` ou Supabase realtime |
| `realtime` | supprimé/intégré | Supabase realtime direct |
| `rules` | inconnu | — |
| `schedule-rule` | fusionné | → `services/schedule/` ou `planning/` |
| `structure` | supprimé | — |
| `sub-class` | renommé | → `services/group/` |
| `validation` | fusionné | Validation Valibot dans chaque service |
| `years` | renommé | → `services/academic-year/` |

---

## Backlog régressions priorisé (cross-services)

| ID | Service | Description | Gravité | Priorité | Statut |
|----|---------|-------------|---------|----------|--------|
| REG-TEACH-01 | teacher | `getOrganizationTeacherStats` supprimée | 🔴 Haute | P1 | ✅ |
| REG-TEACH-02 | teacher | `ponctualite` hardcodé 100 (non calculé) | 🔴 Haute | P1 | ✅ |
| REG-PLAN-01 | planning | `recurrence/` RRule logic introuvable | 🟠 Moyenne | P2 | N/A — `ScheduleRule` supprimé V2 |
| REG-PLAN-02 | planning | `mergeGeneratedWithPersisted` + mapping disparus | 🟠 Moyenne | P2 | N/A — idem |
| REG-STU-01 | student | `averageGrade` + `totalEvaluations` absents | 🟡 Faible | P3 | ✅ |

---

## Progression

```
Analysés    : 18 / 18 services communs  (100%)
Traités     : 17 / 18 services communs  (94%)  [invite, notification, chat, teacher, planning, student, schedule, course, class, room, users, auth, fonctions(function), org, subscription, direction, weekly-template(V2-only)]
Bypass      :  1 / 18 services communs  [user — bypass explicite]
```
