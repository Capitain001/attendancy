# Tasks: Invite Role Modules (D1–D5)

**Spec**: `specs/invite-role-modules.md`  
**Status**: Not Started ⏳

---

## Phase 1: Fondations ⏳ (~45min)

**Purpose**: Étendre les types et créer le helper partagé — bloque tout le reste.

⚠️ **CRITIQUE**: Aucun sous-module ni D4/D5 ne peut démarrer sans cette phase.

- [ ] T001 Étendre `CreateInvitationParams` dans `src/services/invite/database/invite.mutations.ts` — ajouter `details?: Record<string, unknown>`, `resourceId?: string`, `resourceType?: string` · merger dans `createInvitation` : `details: { role, ...params.details }`
- [ ] T002 Étendre `InviteDetails` dans `src/services/invite/types.ts` — union discriminée par rôle (`TEACHER | STUDENT | PARENT | DIRECTION`) avec champs `enrollment`, `parentLink`, `function`, `additionalFunctions`, `invited_by`
- [ ] T003 Créer `src/services/invite/core.ts` — `generateInviteToken(expiresInDays?: number)` et `sendSupabaseInviteEmail(email, token)` (extrait de `sendInviteAction`)

**Checkpoint**: ✋ Types cohérents, core.ts compilé — passer à Phase 2

**Notes:**

---

## Phase 2: Flow générique — D4 + D5 ⏳ (~30min)

**Purpose**: D5 `expiresInDays` + D4 `invited_by` sur `sendInviteAction`.

- [ ] T004 `src/services/invite/validation.ts` — ajouter `expiresInDays: optional(picklist([1, 3, 7, 14, 30]))` dans `sendInviteSchema` · mettre à jour `SendInviteInput` / `SendInviteOutput`
- [ ] T005 `src/services/invite/actions/invite.mutations.ts` · `sendInviteAction` — lire `expiresInDays` du payload · passer `invitedBy = { id, name, email }` dans `details` · remplacer token gen + Supabase call par `core.ts`

**Checkpoint**: ✋ `sendInviteAction({ email, role: 'TEACHER', expiresInDays: 14 })` → `expiresAt = now+14j` + `details.invited_by` présent

**Notes:**

---

## Phase 3: Guard deleteInvitationUserAction — D2 ⏳ (~20min)

**Purpose**: Empêcher la suppression d'une invitation déjà acceptée (utilisateur actif).

- [ ] T006 `src/services/invite/actions/invite.mutations.ts` · `deleteInvitationUserAction` — avant `deleteInvitation(invitation.id)`, lire `userId` depuis le record invitation DB · vérifier `UserOrganization` actif → retourner `{ success: false, error: '...' }` si trouvé

**Checkpoint**: ✋ Suppression d'invitation acceptée → erreur explicite

**Notes:**

---

## Phase 4: Notifications — D3 ⏳ (~20min)

**Purpose**: Créer `notifications.ts` fire-and-forget — nécessaire pour `student/actions.ts`.

- [ ] T007 Créer `src/services/invite/notifications.ts` — port de V1 adapté V2 : `notifyInvitationStakeholders({ invitationId, orgId, actorId, event, invitedEmail, classId? })` · importer `sendPushNotificationToUserById` depuis `@/services/notification/user` · `Promise.allSettled` + absorption erreurs · type `InvitationNotifyEvent = 'CREATED' | 'RESENT' | 'LINK_GENERATED'`

**Checkpoint**: ✋ Fonction importable, pas d'erreur TypeScript

**Notes:**

---

## Phase 5: direction/ ⏳ (~45min)

**Purpose**: D1 — sous-module DIRECTION avec validation fonctions + stockage `details` enrichis.

- [ ] T008 [P] Créer `src/services/invite/direction/types.ts` — `InviteDirectionParams { email, name?, functions: string[], expiresInDays? }`
- [ ] T009 [P] Créer `src/services/invite/direction/validation.ts` — `inviteDirectionSchema` Valibot : email, name?, functions array non vide, expiresInDays? picklist
- [ ] T010 Créer `src/services/invite/direction/database.ts` — `checkFunctionsExist(names, orgId): Promise<{ valid: string[]; invalid: string[] }>` · Prisma direct sans cache (TODO: brancher `invite/cache.ts` V2)
- [ ] T011 Créer `src/services/invite/direction/actions.ts` — `inviteDirectionAction(params)` : auth `getAuthorization(user, 'DIRECTION')` · `checkFunctionsExist` · `createInvitation` avec `details: { role: 'DIRECTION', function: valid[0], additionalFunctions: valid.slice(1), invited_by }` · `sendSupabaseInviteEmail` via `core.ts`
- [ ] T012 Créer `src/services/invite/direction/index.ts` — barrel exports

**Checkpoint**: ✋ `inviteDirectionAction({ email, functions: ['PRINCIPAL', 'SECRETARY'] })` → `details.function = 'PRINCIPAL'`, `details.additionalFunctions = ['SECRETARY']`

**Notes:**

---

## Phase 6: student/ ⏳ (~45min)

**Purpose**: D1 — sous-module STUDENT avec vérification classe/groupes + notification.

- [ ] T013 [P] Créer `src/services/invite/student/types.ts` — `InviteStudentParams { email, firstName?, lastName?, classId, groupIds?, parentEmail?, expiresInDays? }`
- [ ] T014 [P] Créer `src/services/invite/student/validation.ts` — `inviteStudentSchema` Valibot : email, firstName?, lastName?, classId nonEmpty, groupIds? array, parentEmail? email, expiresInDays? picklist
- [ ] T015 Créer `src/services/invite/student/database.ts` — `checkInvitationResources({ classId, orgId, groupIds? })` vérifie classe via `AcademicYear.orgId` + count groupes · `getClassInvitations(classId, orgId)` · pas de `DatabaseInvitationDetails` (type local)
- [ ] T016 Créer `src/services/invite/student/actions.ts` — `inviteStudentAction(params)` : valide ressources · `createInvitation` avec `details: { role: 'STUDENT', enrollment: { classId, groupIds?, parentEmail? }, invited_by }`, `resourceId: classId`, `resourceType: 'CLASS'` · `void notifyInvitationStakeholders(...)` fire-and-forget · `getClassInvitesAction({ classId })` avec auth DIRECTION
- [ ] T017 Créer `src/services/invite/student/index.ts` — barrel exports

**Checkpoint**: ✋ `inviteStudentAction({ email, classId })` → `details.enrollment.classId` en DB + `resourceId = classId`

**Notes:**

---

## Phase 7: parent/ ⏳ (~30min)

**Purpose**: D1 — sous-module PARENT avec vérification étudiant + stockage `parentLink`.

- [ ] T018 [P] Créer `src/services/invite/parent/validation.ts` — `inviteParentSchema` Valibot : email, firstName?, lastName?, studentId nonEmpty, relation string minLength(1) maxLength(60), expiresInDays? picklist
- [ ] T019 Créer `src/services/invite/parent/actions.ts` — `inviteParentAction(params)` : vérif `student` actif dans org (RULE-USR-001) · `createInvitation` avec `details: { role: 'PARENT', parentLink: { studentId, relation }, invited_by }`, `resourceId: studentId`, `resourceType: 'STUDENT'`
- [ ] T020 Créer `src/services/invite/parent/index.ts` — barrel exports

**Checkpoint**: ✋ `inviteParentAction({ email, studentId, relation: 'Père' })` → `details.parentLink` en DB + `completeSignup` crée `ParentRelation`

**Notes:**

---

## Phase 8: Polish ⏳ (~30min)

**Purpose**: Documentation + checkers.

- [ ] T021 Mettre à jour `src/services/invite/CLAUDE.md` — ajouter `direction/`, `student/`, `parent/` dans la table Fichiers · documenter invariant DIRECTION (bypass `INVITABLE_ROLES`) · noter stub notifications
- [ ] T022 Lancer les checkers post-session :
  ```bash
  npx tsx scripts/generate/naming/check.ts invite
  npx tsx scripts/generate/types/check.ts invite
  npx tsx scripts/generate/api/api.ts invite
  ```

**Notes:**

---

## Dépendances & Ordre d'exécution

```
Phase 1 (Fondations)
    ↓
    ├─→ Phase 2 (D4+D5 flow générique)
    ├─→ Phase 3 (D2 guard)          ← indépendant
    └─→ Phase 4 (D3 notifications)
            ↓
            ├─→ Phase 5 (direction/)  ← [P] avec phase 6 et 7
            ├─→ Phase 6 (student/)    ← dépend Phase 4 (notifications)
            └─→ Phase 7 (parent/)     ← [P] avec phase 5 et 6
                    ↓
                Phase 8 (Polish)
```

**Opportunités parallèles** :
- Phases 2, 3, 4 peuvent démarrer en parallèle dès Phase 1 terminée
- Phases 5, 6, 7 peuvent se faire en parallèle (fichiers distincts)
- Dans chaque phase : tâches `[P]` (types + validation) parallélisables

---

## Suivi

| Phase | Tâches | Durée est. | Statut |
|---|---|---|---|
| 1 Fondations | T001–T003 | ~45min | ⏳ |
| 2 D4+D5 | T004–T005 | ~30min | ⏳ |
| 3 D2 | T006 | ~20min | ⏳ |
| 4 D3 | T007 | ~20min | ⏳ |
| 5 direction/ | T008–T012 | ~45min | ⏳ |
| 6 student/ | T013–T017 | ~45min | ⏳ |
| 7 parent/ | T018–T020 | ~30min | ⏳ |
| 8 Polish | T021–T022 | ~30min | ⏳ |
| **Total** | **22 tâches** | **~4h15** | ⏳ |
