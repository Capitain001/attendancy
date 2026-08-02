# Audit des services — `src/services/**`

> Date : 2026-08-02 | Branch : v1-pattern-sync  
> Scope : 33 services audités | Règles : SKILL.md + CLAUDE.md projet

---

## Légende

- ✅ Conforme — aucune violation
- ⚠ Avertissements — violations mineures / style
- ❌ Erreurs — violations de conventions obligatoires

---

## Violations systémiques (présentes dans de nombreux services)

Ces deux patterns sont présents dans ~25 services. Ils ont un héritage commun (code V1 non migré) et peuvent être corrigés par script.

### VS-1 — `v.parse` au lieu de `v.safeParse` (règle 9)

`v.parse` lève une exception au lieu de retourner `{ success, issues }`. Les `try/catch` environnants rattrapent l'exception, mais le message d'erreur Valibot est non contrôlé et le pattern viole la convention.

**Correction** : remplacer `v.parse(schema, input)` → `v.safeParse(schema, input)` + adapter la consommation du résultat (`parsed.output` au lieu de la valeur directe + guard `if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }`).

Services impactés : academic-year, class, course, department, event, function, group, invite (actions racine), room, student, subscription, teacher, teacher-unavailability, term, ue, ue-course, users/profile, weekly-template.

### VS-2 — `authAccess` non utilisé / auth manuelle (règle 15)

La majorité des services utilise `getUserInfo` + `getAuthorization` manuellement au lieu d'`authAccess` de `@/services/auth`. C'est le pattern standard prescrit par le SKILL.md.

Par ailleurs, certains services importent depuis `@/modules/user/userInfo` ou `@/modules/auth/authorization` au lieu des aliases publics `@/services/user/userInfo` et `@/services/auth`. La règle prescrit l'import via `@/services/auth`.

Note : `getAuthorization` retourne `{ error: string | null }` — le narrowing correct est donc `if (auth.error)` et non `if (!auth.success)`. Cette confusion est présente dans plusieurs services (class, course, department, function, group...).

---

## Rapport par service

---

### 1. `academic-year` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/academic-year.mutations.ts` | 3–4 | Import depuis `@/modules/user/userInfo` et `@/modules/auth/authorization` — doit être `@/services/user/userInfo` et `@/services/auth` |
| ❌ | `actions/academic-year.mutations.ts` | 20, 39 | `v.parse(createAcademicYearSchema, ...)` et `v.parse(setCurrentYearSchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `actions/academic-year.mutations.ts` | 77 | `export { removeAcademicYearAction as deleteYearAction }` — le préfixe `delete*` est réservé au hard delete ; l'alias doit être `removeYearAction` |
| ❌ | `actions/academic-year.queries.ts` | 2 | Import `getUserInfo` depuis `@/services/user/userInfo` (chemin différent des mutations qui utilisent `@/modules/...`) — incohérence interne + non-utilisation de `authAccess` |
| ⚠ | `types.ts` | 12–13 | Aliases V1 `addYearData` (casse minuscule non conforme) et `UpdateYearData` — à supprimer |
| ⚠ | `database/academic-year.mutations.ts` | 42 | `export type UpdateAcademicYearData` défini dans `database/` et re-exporté dans `types.ts` — la définition source devrait être dans `types.ts` |

**Ce qui reste à faire** : corriger les imports (externe : `@/modules/*` → `@/services/*`), remplacer `v.parse` → `v.safeParse`, renommer l'alias.

---

### 2. `attendance` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, policy.ts, types.ts) | ⚠ cache.ts, validation.ts, utils.ts vides

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/attendance.mutations.ts` | 13 | `import { validateSessionToken } from "../../session/database/token.mutations"` — import direct depuis le `database/` interne d'un autre service. Doit passer par l'index public de `@/services/session` |
| ⚠ | `cache.ts`, `validation.ts`, `utils.ts` | — | Fichiers vides (1 ligne). Supprimer ou remplir. `cache.ts` vide = pas de graphe d'invalidation alors que `confirmAttendance` invalide du cache |
| ⚠ | `database/attendance.queries.ts` | ~190 | Imports `Prisma` et `filter` positionnés au milieu du fichier — doivent être en tête |
| ⚠ | `CLAUDE.md` | — | Contenu minimaliste — ne documente pas l'invariant cross-service (`validateSessionToken`) ni les règles métier d'attendance |

**Conforme sur** : `"use server"` dans actions/ uniquement, Prisma dans database/ uniquement, `authAccess` de `@/services/auth` utilisé, préfixe `get*`, narrowing `if (!auth.data)`, `v.safeParse` absent (pas de validation propre au service).

**Ce qui reste à faire** : corriger l'import cross-service (dépendance externe : `@/services/session` doit exposer `validateSessionToken` via son index public ou via une action).

---

### 3. `audit` — ❌ Erreurs

**Structure** : ❌ `src/services/audit/` = stub vide (1 fichier `index.ts` qui re-exporte `@/modules/audit`). CLAUDE.md **supprimé** (git status : `D src/services/audit/CLAUDE.md`).

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `index.ts` | — | CLAUDE.md absent dans `src/services/audit/` — il existait et a été supprimé |
| ⚠ | `@/modules/audit/usage.ts` | — | Fichier entièrement commenté — code mort à supprimer |
| ⚠ | `@/modules/audit/index.ts` | — | `getRequestMeta` de `logger.ts` non re-exporté — intentionnel ou oubli ? |

**Note** : `audit` est un service infrastructure sans modèle propre. La structure stub est acceptable mais doit être documentée dans un CLAUDE.md.

**Ce qui reste à faire** : recréer `src/services/audit/CLAUDE.md` (minimal : rôle + pointer vers `@/modules/audit`).

---

### 4. `auth` — ❌ Erreurs

**Structure** : ❌ `src/services/auth/` = stub vide. CLAUDE.md **supprimé** (git status : `D src/services/auth/CLAUDE.md`). Implémentation dans `@/modules/auth/`.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `src/services/auth/` | — | CLAUDE.md absent — supprimé |
| ❌ | `@/modules/auth/persmission/acces.ts` | 91–99 | Code exécuté au top-level du module (`const auth = await authAccess(...)`) — s'exécute à chaque import. **Bug critique.** Semble être du code d'exemple non supprimé |
| ❌ | `@/modules/auth/persmission/acces.ts` | 2 | `"use server"` sur un utilitaire helper (non un fichier `actions/`) — viole la règle "use server uniquement dans actions/" |
| ❌ | `@/modules/auth/persmission/acces.ts` | 6 | Import `UserInfo` de `@/types` non utilisé |
| ⚠ | `@/modules/auth/persmission/` | — | Typos : `persmission/` (permission), `acces.ts` (access), `autorization.ts` (authorization) |
| ⚠ | `@/modules/auth/persmission/acces.ts` | ~52 | Commentaire JSDoc avec exemple `if (auth.error)` — doit être `if (!auth.data)` |

**Ce qui reste à faire** : recréer `src/services/auth/CLAUDE.md`, supprimer le code top-level dans `acces.ts` (lignes 91–99), retirer `"use server"` du fichier helper, supprimer l'import inutilisé `UserInfo`.

---

### 5. `chat` — ❌ Erreurs

**Structure** : ⚠ CLAUDE.md **absent**. Pas de `cache.ts`. Structure actions/database correcte.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `src/services/chat/` | — | CLAUDE.md absent |
| ❌ | `actions/message.queries.ts` | 2 | `import { getUserInfo } from '@/services/user/userInfo'` |
| ❌ | `actions/message.mutations.ts` | 2 | `import { getUserInfo } from '@/modules/user/userInfo'` — deux chemins différents pour le même import dans le même service |
| ⚠ | `actions/*` | — | Aucun des deux fichiers n'utilise `authAccess` — auth manuelle sans `orgId` scope explicite (le chat scope par `channelId` uniquement — à documenter si intentionnel) |
| ⚠ | `database/message.mutations.ts` | 3–4 | `export interface AddMessageData` et `export type UpdateMessageData` définis dans `database/` — les types d'input devraient être dans `types.ts` ou `validation.ts` |

**Conforme sur** : `"use server"` dans actions/ uniquement, Prisma dans database/ uniquement, `get*` respecté, `remove*` pour soft delete, retour `{ data } | { error }`, `Awaited<ReturnType<typeof fn>>` dans types.ts, index.ts n'exporte pas database/.

**Ce qui reste à faire** : créer CLAUDE.md, harmoniser les imports (un seul chemin), migrer vers `authAccess`.

---

### 6. `class` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/ avec 3 fichiers, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/class.group-actions.ts` | 5 | `import { prisma } from '@/lib/prisma'` dans `actions/` — Prisma doit rester dans `database/` uniquement. Le fichier contient des requêtes Prisma directes (getClassGroups, deleteClassGroup, etc.) |
| ❌ | `actions/class.mutations.ts` | 19 | `v.parse(createClassSchema, input)` → `v.safeParse` (VS-1) |
| ❌ | `actions/class.group-actions.ts` | ~110 | `deleteClassGroupAction` = soft delete (`deletedAt`) mais nommé `delete*` → doit être `removeClassGroupAction` |
| ⚠ | `actions/class.mutations.ts` | 17, 33 | `if (!auth.success)` — `getAuthorization` retourne `{ error: string \| null }`, narrowing correct = `if (auth.error)` |
| ⚠ | `actions/class.group-actions.ts` | 76, 96, 117, 137 | Même problème narrowing `if (!auth.success)` |
| ⚠ | `actions/class.group-actions.ts` | 8–11 | `type GroupRow` déclaré localement dans un fichier `actions/` — devrait être dans `types.ts` |

**Ce qui reste à faire** : extraire la logique DB de `class.group-actions.ts` vers `database/class.group.mutations.ts`, remplacer `v.parse` → `v.safeParse`, renommer `deleteClassGroupAction` → `removeClassGroupAction`.

---

### 7. `course` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/course.mutations.ts` | 19, 35 | `v.parse(createCourseSchema, ...)` et `v.parse(assignTeacherSchema, ...)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/course.mutations.ts` | 17, 33, 49, 64 | `if (!auth.success)` — narrowing incorrect (VS-2) |
| ⚠ | `actions/course.mutations.ts` | 72–73 | Aliases redondants `assignCourseTeacherAction` et `unassignCourseTeacherAction` — polluent l'API publique |

---

### 8. `course-teacher` — ❌ Service inexistant

Le répertoire `src/services/course-teacher/` **n'existe pas**. La logique `CourseTeacher` est internalisée dans le service `course`. Si ce service était listé dans les specs, il est manquant. Si la logique est intentionnellement dans `course`, mettre à jour les specs.

---

### 9. `department` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/department.mutations.ts` | 3–4 | Imports depuis `@/modules/user/userInfo` et `@/modules/auth/authorization` — doit être `@/services/*` |
| ❌ | `actions/department.mutations.ts` | 19, 35 | `v.parse(createDepartmentSchema, ...)` et `v.parse(updateDepartmentSchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `actions/department.mutations.ts` | ~59 | `removeDepartmentAction` retourne `{ success: boolean; error?: string }` — non conforme au pattern `{ data: T } \| { error: string }` |
| ⚠ | `actions/department.mutations.ts` | 17, 33, 49 | `if (!auth.success)` — narrowing incorrect (VS-2) |
| ⚠ | `CLAUDE.md` | — | Ne mentionne pas les aliases V1 `addDepartmentAction`, `removeDepartmentAction`, `updateDepartmentByIdAction` |

---

### 10. `direction` — ⚠ Avertissements

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/direction.mutations.ts` | ~55 | `deleteDirectionMemberAction` = soft delete (`deletedAt`) → doit être `removeDirectionMemberAction` |
| ⚠ | `actions/direction.mutations.ts` | tout | Aucune des mutations ne vérifie le rôle DIRECTION avant d'agir |
| ⚠ | `validation.ts` | — | `assignFunctionsSchema`, `revokeFunctionsSchema`, `directionIdSchema` déclarés mais jamais utilisés dans les mutations |

---

### 11. `entity` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, constants.ts, types.ts, validation.ts)

**Violation principale** : actions commentées (`//` en tête des lignes avec `if (!auth.data)`) — les guards d'auth sont désactivés dans `entity.queries.ts` et `entity.mutations.ts`. Le service `entity` est le service exemple du SKILL.md — ses guards doivent être actifs.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/entity.queries.ts` | 32, 46 | Guards `if (!auth.data)` commentés (`//`) |
| ❌ | `actions/entity.mutations.ts` | 35, 50 | Guards `if (!auth.data)` commentés (`//`) |
| ❌ | `actions/entity.mutations.ts` | ~30 | `v.parse(createEntitySchema, input)` → `v.safeParse` (VS-1) |

---

### 12. `event` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/event.mutations.ts` | 19, 35 | `v.parse(createEventSchema, ...)` et `v.parse(updateEventSchema, ...)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/event.mutations.ts` | 17, 33, 49 | `if (!auth.success)` — narrowing incorrect pour `getAuthorization` (VS-2) |

---

### 13. `function` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/function.mutations.ts` | 25, 40 | `v.parse(createFunctionSchema, ...)` et `v.parse(updateFunctionSchema, ...)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/function.mutations.ts` | 24, 39, 54, 72, 91 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 14. `group` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/group.mutations.ts` | 19 | `v.parse(createGroupSchema, input)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/group.mutations.ts` | 17, 33 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 15. `invite` — ✅ Exclu de l'audit

> **Note** : Le service `invite` est exclu du périmètre de cet audit — les violations éventuelles sont connues et non actionnables dans le contexte actuel.

---

### 16. `organization` — ⚠ Avertissements

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts, utils.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `utils.ts` | 4, 44 | `import { prisma } from '@/lib/prisma'` et `prisma.organization.findUnique(...)` dans un utilitaire hors `database/` — Prisma doit rester dans `database/` |
| ⚠ | `utils.ts` | 6 | `import { getUserInfo } from '@/services/user'` dans un utilitaire partagé — contourne le pattern `authAccess` |
| ⚠ | `CLAUDE.md` | 13–14 | Deux lignes `actions/org.mutations.ts` (copier-coller) — la deuxième devrait être `actions/org.queries.ts` |

Exception `orgId` manquant pour la création d'organisation documentée dans CLAUDE.md — conforme.

---

### 17. `planning` — ❌ Erreurs

**Structure** : ❌ Non conforme — `actions.ts` et `database.ts` à la racine du service au lieu des dossiers `actions/` et `database/`. Sous-module `conflict/` avec ses propres fichiers plats.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `planning/actions.ts` | — | `actions.ts` à la racine du service (doit être `actions/planning.queries.ts`) — **violation structurelle** |
| ❌ | `planning/database.ts` | — | `database.ts` à la racine (doit être `database/planning.queries.ts`) |
| ❌ | `planning/` | — | Pas de CLAUDE.md à la racine du service `planning/` (il existe un `planning/conflict/CLAUDE.md` uniquement) |
| ❌ | `planning/actions.ts` | 3–4 | Imports depuis `@/services/user/userInfo` et `@/services/auth/authorization` au lieu de `authAccess` de `@/services/auth` |
| ⚠ | `planning/conflict/actions.ts` | — | Même structure plate (fichier action à la racine du sous-module) |
| ⚠ | `planning/queries.ts` | — | Fichier `queries.ts` à la racine — statut incertain (cache ? utilitaire ?) |

---

### 18. `program` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts) | ⚠ `struture.md` (typo, fichier de notes)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `utils.ts` | 1 | `import { groupByRelation } from "../resources/utils"` — module `src/services/resources/utils.ts` inexistant — **import cassé** |
| ❌ | `actions/program.mutations.ts` | ~14 | `v.parse(createProgramSchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `database/program.mutations.ts` | 8, 11 | Types `AddProgramData` et `UpdateProgramData` définis dans `database/` — doivent être dans `types.ts` |
| ❌ | `database/program.mutations.ts` | — | `removeProgram` fait un soft delete (`deletedAt`) mais `invalidateEvent("PROGRAM_DELETED", ...)` — l'événement doit être `PROGRAM_REMOVED` (convention : `DELETED` = hard delete) |
| ⚠ | `program/struture.md` | — | Fichier de notes mal nommé — ne devrait pas exister dans `src/services/` |

---

### 19. `program-track` — ❌ Erreurs critiques

**Structure** : ✅ (CLAUDE.md, actions/, database/, types.ts) | ⚠ `validation.ts` vide, pas de `cache.ts`

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `database/programTrack.queries.ts` | 4 | `import { CACHE } from "@/config/cache"` — fichier `src/config/cache.ts` inexistant — **import cassé** (compile error) |
| ❌ | `database/programTrack.mutations.ts` | 2 | `import { invalidateCache } from "@/config/cache"` — même import cassé |
| ❌ | `database/programTrack.queries.ts` | — | `unstable_cache` de Next.js 14 utilisé au lieu de `'use cache'` + `cacheTag` + `cacheLife` (stack Next.js 16 PPR) |
| ❌ | `utils.ts` | 1 | `import { groupByRelation } from "../resources/utils"` — module inexistant — **import cassé** |
| ❌ | `actions/programTrack.queries.ts` | ~11 | `if (!user) throw new Error(...)` dans une action — doit être `return { error: ... }` |
| ⚠ | Naming fichiers | — | `programTrack.mutations.ts` et `programTrack.queries.ts` (camelCase) — convention : `program-track.mutations.ts` (kebab-case) |
| ⚠ | `validation.ts` | — | Vide (`export {}`) — `createProgramTrack` et `updateProgramTrack` non validés |

---

### 20. `program-ue` — ❌ Erreurs critiques

**Structure** : ✅ (CLAUDE.md, actions/, database/) | ⚠ `types.ts` vide, `validation.ts` vide

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `database/program-ue.mutations.ts` | 2 | `import { invalidateCache } from "@/config/cache"` — fichier inexistant — **import cassé** |
| ❌ | `database/program-ue.queries.ts` | ~3 | `getProgramUEs` filtre uniquement par `programId` sans `orgId` dans le `where` — **fuite multi-tenant** |
| ❌ | `database/program-ue.mutations.ts` | 54 | `removeUEFromProgram` appelle `prisma.programUE.deleteMany(...)` (hard delete) alors que le préfixe `remove*` implique un soft delete — incohérence de convention |
| ❌ | `actions/index.ts` | — | `getProgramUEs`, `addUEToProgram`, `updateProgramUE` existent en DB mais n'ont pas d'actions correspondantes |
| ❌ | `types.ts` | — | Vide (`export {}`) — aucun DTO défini |
| ⚠ | `validation.ts` | — | Vide — aucune validation des inputs |

---

### 21. `room` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/room.mutations.ts` | 17, 66 | `v.parse(createRoomSchema, ...)` et `v.parse(createLocationSchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `actions/room.mutations.ts` | 45 | `export const addRoomAction = createRoomAction` — alias `add*` non conforme |
| ❌ | `database/room.queries.ts` | ~24 | `getRoomById(id: string, orgId: string)` — paramètre `id` interdit → `roomId` |
| ❌ | `database/room.mutations.ts` | ~26 | `removeRoom(id: string, orgId: string)` → `roomId` |
| ❌ | `database/room.mutations.ts` | ~62 | `updateRoom(id: string, orgId: string, ...)` → `roomId` |
| ❌ | `database/room.mutations.ts` | ~84 | `toggleLocationActive(id: string, orgId: string)` → `locationId` |
| ⚠ | `types.ts` | 7 | `RoomDTo` — faute de casse → `RoomDto` |

---

### 22. `schedule` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/ avec 3 fichiers, database/, cache.ts, policy.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/schedule.mutations.ts` | ~69–71 | `deleteScheduleAction` alias vers une action de soft delete — le préfixe `delete*` est réservé au hard delete |
| ❌ | `types.ts` | ~1 | `import ... from '@/services/session/database'` — import direct du `database/` interne d'un autre service |
| ❌ | `actions/schedule.teacher.ts` | 4 | `import { getTeacherNextSchedule } from '@/services/session/database'` — même violation |
| ⚠ | `actions/schedule.queries.ts` | 5 | `getAuthorization` importé de `@/services/auth/authorization` — doit utiliser `authAccess` de `@/services/auth` |

---

### 23. `session` — ❌ Erreurs critiques

**Structure** : ❌ CLAUDE.md **absent**. Fichier `token.actions.ts` **à la racine** du service (doublon avec `actions/token.actions.ts`).

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `session/` | — | CLAUDE.md absent |
| ❌ | `session/token.actions.ts` (racine) | 1 | `"use server"` sur un fichier à la racine du service — violation structurelle. Ce fichier contient une `generateTokenAction` qui génère un token local (`crypto.randomUUID()`) sans le persister en DB. **Bug fonctionnel** : le token généré ici n'est jamais sauvegardé. Le vrai `generateTokenAction` est dans `actions/token.actions.ts` |
| ❌ | `actions/index.ts` | — | `token.actions` n'est pas exporté depuis `actions/index.ts` — `generateTokenAction` inaccessible via le barrel |
| ❌ | `database/session.mutations.ts` | — | `import { markScheduleAbsences } from '@/services/attendance/database/attendance.mutations'` — import direct du `database/` interne du service `attendance` |
| ⚠ | `actions/session.mutations.ts` | 19, 31 | `invalidateEvent(...)` appelé sans `await` — peut rater l'invalidation silencieusement |

---

### 24. `student` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/student.mutations.ts` | 9 | `import { prisma } from '@/lib/prisma'` dans `actions/` |
| ❌ | `actions/student.mutations.ts` | 68 | `prisma.user.updateMany(...)` dans `bulkSetStudentStatusAction` — Prisma dans une action |
| ❌ | `actions/student.mutations.ts` | 21, 52 | `v.parse(enrollStudentSchema, ...)` et `v.parse(assignStudentGroupSchema, ...)` → `v.safeParse` (VS-1) |
| ⚠ | `cache.ts` | ~17 | `deleteStudentGroup` invalide `STUDENT_GROUP_ASSIGNED` — l'événement ne reflète pas l'opération (suppression vs assignation) |

---

### 25. `subscription` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/subscription.mutations.ts` | 15 | `v.parse(createSubscriptionSchema, input)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/subscription.mutations.ts` | 12–16 | Guards auth avec `throw new Error(...)` dans le `try` — incohérent (l'exception est rattrapée et retournée comme `{ error }` mais c'est un anti-pattern) |
| ⚠ | `validation.ts` | — | `CreateSubscriptionOutput` (InferOutput) absent — seul `CreateSubscriptionInput` (InferInput) est exporté |

---

### 26. `teacher` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/teacher.mutations.ts` | 31 | `v.parse(updateTeacherDepartmentSchema, input)` → `v.safeParse` (VS-1) |
| ❌ | `actions/teacher.queries.ts` | ~43–46 | `getTeacherCoursesAction` retourne un tableau brut `[]` en cas d'erreur au lieu de `{ error: string }` — non conforme au pattern ActionResponse |
| ⚠ | `actions/teacher.mutations.ts` | 29 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 27. `teacher-unavailability` — ❌ Erreurs

**Structure** : ✅ (actions/, database/, cache.ts, types.ts, validation.ts) | ❌ CLAUDE.md **absent**

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `teacher-unavailability/` | — | CLAUDE.md absent |
| ❌ | `actions/teacher-unavailability.mutations.ts` | 29, 45 | `v.parse(createWeeklyUnavailabilitySchema, ...)` et `v.parse(createDateRangeUnavailabilitySchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `actions/teacher-unavailability.mutations.ts` | 52 | Paramètre nommé `id` → doit être `unavailabilityId` |
| ❌ | `database/teacher-unavailability.mutations.ts` | 49 | `deleteTeacherUnavailability(id: string, ...)` → `unavailabilityId` |
| ⚠ | `actions/teacher-unavailability.mutations.ts` | 27, 43, 59 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 28. `term` — ⚠ Avertissements

**Structure** : ✅ (CLAUDE.md, actions/, database/, cache.ts, types.ts) | ⚠ pas de `validation.ts`

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/term.mutations.ts` | 3, 22 | `import { parse } from 'valibot'` + `parse(classIdSchema, classId)` → `v.safeParse` |
| ❌ | `actions/term.mutations.ts` | 14 | `throw new Error(...)` dans les guards au lieu de `return { error: ... }` — anti-pattern (exception rattrapée par le catch mais style incorrect) |
| ⚠ | `actions/term.mutations.ts` | 2–5 | Imports depuis `@/services/user/userInfo` et `@/services/auth/authorization` au lieu de `authAccess` de `@/services/auth` |
| ⚠ | — | — | `classIdSchema` inliné dans l'action — devrait être dans un `validation.ts` dédié |

---

### 29. `ue` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/ue.mutations.ts` | 25 | `v.parse(...)` → `v.safeParse` (VS-1) (pattern détecté via `import { ..., parse, ... } from 'valibot'` |
| ⚠ | `actions/ue.mutations.ts` | 25, 53, 68, 87, 112 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 30. `ue-course` — ❌ Erreurs

**Structure** : ✅ complète (CLAUDE.md, actions/, database/, cache.ts, types.ts, validation.ts)

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `actions/ue-course.mutations.ts` | 20 | `v.parse(createUECourseSchema, input)` → `v.safeParse` (VS-1) |
| ⚠ | `actions/ue-course.mutations.ts` | 18, 34, 49 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

### 31. `user` — ⚠ Avertissements

**Structure** : ✅ stub `src/services/user/index.ts` re-exporte vers `@/modules/user`. Pas de CLAUDE.md dans `src/services/user/`.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ⚠ | `src/services/user/` | — | CLAUDE.md absent (stub infra sans modèle propre — acceptable si documenté) |

---

### 32. `users` — ❌ Erreurs

**Structure** : ⚠ `actions.ts` à la racine du service + sous-module `profile/` avec `profile/actions.ts` plat. Pas de dossier `actions/` au sens pattern-service. CLAUDE.md présent ✅.

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `users/actions.ts` | — | `actions.ts` à la racine du service (doit être dans `actions/`) — violation structurelle |
| ❌ | `users/actions.ts` | 7 | Retour avec type explicite `Promise<{ data: UserRoleStats } \| { error: string }>` — jamais de `Promise<>` explicite sur les actions |
| ❌ | `users/profile/database/index.ts` | 1 | `export { ... } from './users.queries'` — `users.queries.ts` n'existe pas dans `profile/database/`. Les fonctions sont dans `database/users.queries.ts`. **Chemin cassé** |
| ❌ | `users/index.ts` | 2 | `export { getUserRoleStats, ... } from './stats'` — `stats.ts` re-exporte une fonction DB directement — l'index racine expose ainsi `database/` indirectement |
| ❌ | `users/profile/actions.ts` | 14, 30, 44 | `v.parse(userIdSchema, ...)`, `v.parse(rolesSchema, ...)`, `v.parse(functionIdSchema, ...)` → `v.safeParse` (VS-1) |
| ⚠ | `users/actions.ts` | 2 | `import { getUserInfo } from '@/services/user/userInfo'` — auth manuelle sans `authAccess` |
| ⚠ | `users/profile/actions.ts` | 4 | Même problème — auth manuelle sans vérification de rôle |

---

### 33. `weekly-template` — ❌ Erreurs

**Structure** : ✅ (actions/, database/, cache.ts, types.ts, validation.ts) | ❌ CLAUDE.md **absent**

| # | Fichier | Ligne | Violation |
|---|---------|-------|-----------|
| ❌ | `weekly-template/` | — | CLAUDE.md absent |
| ❌ | `actions/weekly-template.mutations.ts` | ~15 | `v.parse(createWeeklyTemplateSchema, ...)` → `v.safeParse` (VS-1) |
| ❌ | `database/weekly-template.mutations.ts` | 17, 26 | `prisma.weeklyTemplate.update({ where: { id } })` sans `orgId` dans le `where` — **faille multi-tenant** |
| ❌ | `database/weekly-template.mutations.ts` | 55 | `prisma.weeklySlot.update({ where: { id: slotId } })` sans `orgId` — même faille |
| ❌ | `actions/weekly-template.queries.ts` | 20 | Paramètre `id: string` → `templateId` |
| ❌ | `actions/weekly-template.mutations.ts` | 41, 61 | Paramètres `id: string` → `templateId` |
| ❌ | `database/weekly-template.queries.ts` | 31 | `getWeeklyTemplate(id: string, orgId)` → `templateId` |
| ❌ | `database/weekly-template.mutations.ts` | 13, 25 | `updateWeeklyTemplate(id: string, ...)` et `removeWeeklyTemplate(id: string, ...)` → `templateId` |
| ⚠ | `actions/weekly-template.mutations.ts` | ~10, ~28 | `if (!auth.success)` — narrowing incorrect (VS-2) |

---

## Tableau récapitulatif

| Service | CLAUDE.md | Structure | v.parse | Prisma/actions | Naming | Retour | Cross-service DB | Statut |
|---------|-----------|-----------|---------|----------------|--------|--------|------------------|--------|
| academic-year | ✅ | ✅ | ❌ | ✅ | ❌ alias `delete*` | ✅ | ✅ | ❌ |
| attendance | ✅ | ⚠ | ✅ | ✅ | ✅ | ✅ | ❌ session/database | ❌ |
| audit | ❌ | ❌ stub | n/a | ✅ | n/a | n/a | n/a | ❌ |
| auth | ❌ | ❌ stub | n/a | n/a | n/a | n/a | n/a | ❌ |
| chat | ❌ | ⚠ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| class | ✅ | ✅ | ❌ | ❌ group-actions | ❌ delete→remove | ✅ | ✅ | ❌ |
| course | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| course-teacher | — | ❌ ABSENT | — | — | — | — | — | ❌ |
| department | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| direction | ✅ | ✅ | ✅ | ✅ | ❌ delete→remove | ✅ | ✅ | ⚠ |
| entity | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| event | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| function | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| group | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| invite | — | — | — | — | — | — | — | exclu |
| organization | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| planning | ❌ | ❌ plat | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| program | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| program-track | ✅ | ✅ | ❌ | ✅ | ⚠ camelCase | ✅ | ✅ | ❌ |
| program-ue | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| room | ✅ | ✅ | ❌ | ✅ | ❌ `id` params + `add*` | ✅ | ✅ | ❌ |
| schedule | ✅ | ✅ | ✅ | ✅ | ❌ `delete*` soft | ✅ | ❌ session/database | ❌ |
| session | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ attendance/database | ❌ |
| student | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| subscription | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| teacher | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| teacher-unavailability | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| term | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ue | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ue-course | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| user | ⚠ | ✅ stub | n/a | n/a | n/a | n/a | n/a | ⚠ |
| users | ✅ | ❌ plat | ❌ | ✅ | ✅ | ❌ Promise<> | ✅ | ❌ |
| weekly-template | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |

**Résumé** : 1 ✅ (organization) · 2 ⚠ (direction, user) · 29 ❌ · 1 exclu (invite)

---

## Violations non gérées (dépendances externes manquantes)

Ces erreurs ne peuvent pas être fixées sans modifier d'autres modules. Elles sont référencées ici avec précision.

### Cross-service database imports — à corriger par le service propriétaire

| Fichier | Ligne | Import interdit | Solution |
|---------|-------|-----------------|----------|
| `src/services/attendance/actions/attendance.mutations.ts` | 13 | `import { validateSessionToken } from "../../session/database/token.mutations"` | `@/services/session` doit exporter `validateSessionToken` via son `index.ts` (ou via une action dédiée) |
| `src/services/session/database/session.mutations.ts` | — | `import { markScheduleAbsences } from '@/services/attendance/database/attendance.mutations'` | `@/services/attendance` doit exporter `markScheduleAbsences` via son `index.ts` ou via une action |
| `src/services/schedule/types.ts` | ~1 | `import ... from '@/services/session/database'` | `@/services/session` doit exporter le type nécessaire via son `index.ts` |
| `src/services/schedule/actions/schedule.teacher.ts` | 4 | `import { getTeacherNextSchedule } from '@/services/session/database'` | Idem — exposer via `@/services/session` |

### CLAUDE.md à créer / restaurer

| Service | Fichier cible | Action requise |
|---------|---------------|----------------|
| `auth` | `src/services/auth/CLAUDE.md` | Restaurer (supprimé — voir git status) |
| `audit` | `src/services/audit/CLAUDE.md` | Restaurer (supprimé — voir git status) |
| `chat` | `src/services/chat/CLAUDE.md` | Créer (jamais existé) |
| `session` | `src/services/session/CLAUDE.md` | Créer (jamais existé) |
| `teacher-unavailability` | `src/services/teacher-unavailability/CLAUDE.md` | Créer (jamais existé) |
| `weekly-template` | `src/services/weekly-template/CLAUDE.md` | Créer (jamais existé) |

---

## Priorités de correction

### P0 — Bugs fonctionnels / critiques

1. **`auth/modules/persmission/acces.ts` lignes 91–99** — Code exécuté au top-level (s'exécute à chaque import). Supprimer ces lignes immédiatement.
2. **`session/token.actions.ts` (racine)** — Fichier fantôme avec `"use server"` qui génère un token sans le persister. Supprimer ce fichier. Vérifier que `actions/token.actions.ts` est exporté depuis `actions/index.ts`.
3. **Cross-service DB** — `attendance` importe `session/database`, `session` importe `attendance/database`, `schedule` importe `session/database`. Ces imports cassent l'isolation des services.

### P1 — Violations structurelles

4. **`planning`** — Restructurer `actions.ts` + `database.ts` plats en `actions/planning.queries.ts` + `database/planning.queries.ts`. Créer CLAUDE.md.
5. **`users`** — Restructurer `actions.ts` plat + `profile/actions.ts` en dossiers `actions/`. Corriger le chemin cassé `profile/database/index.ts`.
6. **`class/actions/class.group-actions.ts`** — Extraire toutes les requêtes Prisma vers `database/class.group.mutations.ts` et `database/class.group.queries.ts`.
7. **`student/actions/student.mutations.ts`** — Extraire `bulkSetStudentStatusAction` vers `database/` (le `prisma.user.updateMany` doit aller dans `database/`).
8. **`program-track`** — Corriger l'import cassé `@/config/cache` → `@/cache/server/key`, migrer `unstable_cache` → `'use cache'` + `cacheTag` + `cacheLife`.
9. **`program-ue`** — Corriger l'import cassé `@/config/cache`, ajouter `orgId` dans le `where` de `getProgramUEs`, créer les actions manquantes, remplir `types.ts`.
10. **`organization/utils.ts`** — Retirer Prisma de l'utilitaire (le déplacer dans `database/`).

### P2 — Multi-tenant (failles `orgId` manquant dans `where`)

11. **`weekly-template/database/weekly-template.mutations.ts`** — Ajouter `orgId` dans les `where` de `updateWeeklyTemplate` et `removeWeeklyTemplate` + slot.
12. **`program-ue/database/program-ue.queries.ts`** — Ajouter `orgId` dans le `where` de `getProgramUEs`.

### P3 — Naming (soft delete / hard delete)

13. **`academic-year`** — Renommer alias `deleteYearAction` → `removeYearAction`
14. **`class`** — `deleteClassGroupAction` → `removeClassGroupAction`
15. **`direction`** — `deleteDirectionMemberAction` → `removeDirectionMemberAction`
16. **`schedule`** — Supprimer ou renommer l'alias `deleteScheduleAction`
17. **`program`** — `invalidateEvent("PROGRAM_DELETED", ...)` → `"PROGRAM_REMOVED"` dans `removeProgram`
18. **`room`** — Supprimer alias `addRoomAction`, renommer paramètres `id` → `roomId`/`locationId` dans `database/`
19. **`weekly-template`** — Renommer paramètres `id` → `templateId` dans actions/ et database/
20. **`teacher-unavailability`** — Paramètre `id` → `unavailabilityId`

### P4 — `v.parse` → `v.safeParse` (systémique)

Impacte 18 services. Correction mécanique possible service par service. Après chaque correction : `npx tsx scripts/generate/naming/check.ts <service>`.

Services : academic-year, class, course, department, event, function, group, room, student, subscription, teacher, teacher-unavailability, term, ue, ue-course, users/profile, weekly-template.

### P5 — Retours non conformes

21. **`department`** — `removeDepartmentAction` retourne `{ success: boolean; error?: string }` → `{ data: true } | { error: string }`
22. **`teacher`** — `getTeacherCoursesAction` retourne `[]` brut en cas d'erreur → `{ error: string }`
23. **`users/actions.ts`** — Supprimer le type de retour explicite `Promise<...>`

### P6 — CLAUDE.md manquants (voir liste ci-dessus)

---

*Généré par audit automatique + vérification manuelle — 2026-08-02*
