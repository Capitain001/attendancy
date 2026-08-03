# Tasks: Extraction invite/ → suppression

**Branch**: v1-pattern-sync
**Specs**: [specs.md](./specs.md)
**Architecture**: [architecture.md](./architecture.md)
**Status**: Not Started ⏳

> **Périmètre révisé** : extraire les éléments à valeur positive de `src/services/invite/`
> avant sa suppression. US1 (completeInvite/acceptInviteAction) exclu — déjà géré ailleurs.

---

## Phase 1: US3 — Helpers purs ⏳ (~30min)

- [ ] T001 [P] Créer `src/modules/invitation/helpers.ts` — copier depuis `invite/helpers.ts` :
  - `validateInvitation(inviteRes, userEmail): ValidateInvitationResult`
  - `roleToPath(role?): string`
  - `roleToLabel(role?): string`
- [ ] T002 [P] Exporter depuis le barrel `src/modules/invitation/index.ts`

**Checkpoint**: ✋ helpers disponibles dans `invitation/`

---

## Phase 2: US4 — React Query factory ⏳ (~20min)

- [ ] T003 Créer `src/modules/invitation/queries.ts` — copier `orgInvitationsQuery` depuis `invite/queries.ts`
- [ ] T004 Exporter depuis le barrel `src/modules/invitation/index.ts`

**Checkpoint**: ✋ `orgInvitationsQuery` disponible dans `invitation/`

---

## Phase 3: US6 — Stratégie token URL ⏳ (~30min)

- [ ] T005 Modifier `src/modules/invitation/invitation.ts` — `sendSupabaseInvitation` : passer token dans `redirectTo` (`?token=xxx`) plutôt que dans `data`
- [ ] T006 Vérifier que la page callback lit `searchParams.token`

**Checkpoint**: ✋ Token accessible via URL au callback

---

## Phase 4: Suppression ⏳ (~20min)

- [ ] T007 Supprimer `src/services/invite/`
- [ ] T008 `npx tsc --noEmit` → 0 erreur
- [ ] T009 `npx tsx scripts/generate/api/api.ts invitation`

---

## Résumé

| Métrique | Valeur |
|---|---|
| Tâches | 9 |
| Temps total | ~1h30 |
| Fichiers créés | 2 |
| Fichiers modifiés | 2 |
| Dossier supprimé | `src/services/invite/` |
