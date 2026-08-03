# Specs : Consolidation invite/ → invitation/

## Contexte

Deux modules coexistent et se dupliquent :
- `src/services/invite/` — V2, pattern service, actif
- `src/modules/invitation/` — V1, ancienne architecture

**Objectif** : identifier et migrer les fonctionnalités présentes uniquement dans `invite/` vers `invitation/`, puis supprimer `invite/`.

---

## Points de différence identifiés (rapport d'analyse)

### Présents dans `invite/` — ABSENTS de `invitation/`

| # | Fonctionnalité | Criticité |
|---|---|---|
| 1 | `acceptInviteAction` + `completeInvite` (transaction acceptation) | **CRITIQUE** |
| 2 | `completeInvite` : User upsert + UserOrganization + profils métier + UserFunction + usedAt + AuditLog | **CRITIQUE** |
| 3 | Sous-module `parent/` — invitation PARENT avec studentId guard + parentLink.relation | **CRITIQUE** |
| 4 | `validateInvitation` — fonction pure (existence/expiry/email match) | Haute |
| 5 | `roleToPath`, `roleToLabel`, `ROLE_LABELS` — helpers UI | Haute |
| 6 | `orgInvitationsQuery()` — React Query factory | Haute |
| 7 | Token dans URL `?token=xxx` vs metadata Supabase | Moyenne |
| 8 | Index API `.api/` + conformité scripts naming/types | Moyenne |

### Présents dans `invitation/` — ABSENTS de `invite/`

| # | Fonctionnalité | Action |
|---|---|---|
| 1 | `inviteTeacher` avec `resources: { courses, classes }` + `permissions[]` | À conserver dans `invitation/` |
| 2 | `supabaseInvitationError` — mapping erreurs Supabase → FR | À migrer vers `invite/` ou conserver |
| 3 | `getStatusBadgeInfo` — badge UI info | À migrer vers `invite/` |
| 4 | `deleteInvitationUserAction` avec suppression Supabase Auth | Aligner |
| 5 | `getInvitationStats` en DB (4 counts atomiques) | `invite/` calcule client-side |

---

## User Stories

### US1 (P1) — Flow d'acceptation d'invitation

**En tant que** invité qui clique le lien,  
**je veux** que mon compte soit créé et mon profil métier provisonné atomiquement,  
**afin de** rejoindre l'organisation sans étape manuelle.

**Acceptance criteria :**
- `acceptInviteAction(token, email)` présent dans `invitation/`
- Transaction `completeInvite` : User upsert + UserOrganization + Teacher/Student/Parent/Direction + UserFunction (si DIRECTION) + `invitation.usedAt` + AuditLog
- En cas d'erreur partielle → rollback complet
- Redirection vers le bon path selon le rôle (`roleToPath`)

---

### US2 (P1) — Invitation PARENT

**En tant que** direction/principal,  
**je veux** inviter un parent en liant son compte à un étudiant,  
**afin que** le parent puisse accéder au suivi de son enfant.

**Acceptance criteria :**
- `inviteParent(params)` présent dans `invitation/parent/`
- Guard : `studentId` appartient à l'org (Prisma check)
- `details.parentLink.relation` stocké dans l'Invitation
- `resourceType: 'STUDENT'`, `resourceId: studentId`

---

### US3 (P2) — Helpers validation et UI

**En tant que** page RSC d'acceptation,  
**je veux** valider une invitation sans I/O supplémentaire,  
**afin de** afficher les bonnes erreurs côté client.

**Acceptance criteria :**
- `validateInvitation(inviteRes, userEmail)` exporté depuis `invitation/`
- Retourne `{ ok: true, invitation, roleLabel }` ou `{ ok: false, reason }`
- `roleToPath(role)`, `roleToLabel(role)` exportés depuis `invitation/`

---

### US4 (P2) — React Query factory

**En tant que** composant client,  
**je veux** un `queryKey` + `queryFn` pour les invitations org,  
**afin de** m'abonner via `useQuery` sans appeler directement les server actions.

**Acceptance criteria :**
- `orgInvitationsQuery({ limit? })` exporté depuis `invitation/`
- `queryKey: ['invitations', 'org', { limit }]`
- `queryFn` appelle `getOrganizationInvitations` ou l'action équivalente

---

### US5 (P2) — Alignement `deleteInvitationUserAction`

**En tant que** admin,  
**je veux** que la suppression d'une invitation nettoie aussi l'auth Supabase,  
**afin de** ne pas laisser d'orphelins auth.

**Acceptance criteria :**
- `deleteInvitationUserAction` dans `invite/` : si user absent de `User` Prisma → supprimer l'auth user Supabase
- Comportement aligné avec `invitation/`

---

### US6 (P3) — Alignement stratégie token

**En tant que** développeur,  
**je veux** une seule stratégie de passage du token (URL vs metadata),  
**afin d'** avoir un seul flow de callback.

**Acceptance criteria :**
- Décision documentée : token dans `redirectTo` URL (stratégie `invite/`) ou dans `data` metadata (stratégie `invitation/`)
- Les deux sous-modules utilisent la même stratégie
- La page callback lit le token de la bonne source

---

### US7 (P3) — Suppression de `src/services/invite/`

**En tant que** développeur,  
**je veux** un seul module canonical pour les invitations,  
**afin d'** éliminer la duplication et les risques de divergence.

**Acceptance criteria :**
- Tous les imports de `src/services/invite/` remplacés par `src/modules/invitation/`
- `src/services/invite/` supprimé
- Aucune erreur TypeScript
- Scripts `naming/check`, `types/check`, `api.ts` passent sur `invitation/`

---

## Contraintes techniques

- Prisma uniquement dans `database/` — jamais dans actions
- Actions : retour `{ data } | { error: string }`, narrowing `if ('error' in result)`
- Valibot pour toute validation
- `getUserInfo()` pour l'orgId — jamais body/query
- Nommage : `get*` (pas `list*`), soft delete = `remove*`, hard delete = `delete*`
- Chaque service maintient son `CLAUDE.md`
