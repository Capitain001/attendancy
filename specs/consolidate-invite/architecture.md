# Architecture : Consolidation invite/ → invitation/

## Décision

`src/modules/invitation/` devient le module canonical. `src/services/invite/` est supprimé après migration.

## Stratégie token

**Décision** : token dans `redirectTo` URL (`?token=xxx`) — stratégie `invite/`.  
**Raison** : le token dans l'URL est accessible sans décoder la metadata Supabase dans le callback. Plus simple et plus robuste.  
**Impact** : `invitation/invitation.ts` (`sendSupabaseInvitation`) doit passer le token dans `redirectTo` au lieu de `data`.

## Structure cible de `src/modules/invitation/`

```
invitation/
├── CLAUDE.md                    ← mettre à jour
├── invitation.ts                ← sendSupabaseInvitation (+ fix token strategy)
├── user.ts                      ← inviteUser()
├── token.ts
├── metadata.ts
├── database.ts                  ← + getInvitationStats DB (already ok)
├── supabase.ts                  ← resend, magicLink, getClaims
├── status.ts                    ← + getStatusBadgeInfo
├── notifications.ts
├── utils.ts                     ← supabaseInvitationError
├── validation.ts
├── helpers.ts                   ← NEW : validateInvitation, roleToPath, roleToLabel
├── queries.ts                   ← NEW : orgInvitationsQuery (React Query)
├── accept/                      ← NEW sous-module
│   ├── index.ts
│   ├── actions.ts               ← acceptInviteAction
│   └── database.ts              ← completeInvite (transaction)
├── direction/                   ← existant
├── student/                     ← existant
├── teacher/                     ← existant
└── parent/                      ← NEW sous-module
    ├── index.ts
    ├── actions.ts               ← inviteParentAction
    ├── database.ts
    ├── types.ts
    └── validation.ts
```

## Fichiers à créer

| Fichier | Source | Contenu |
|---|---|---|
| `invitation/helpers.ts` | `invite/helpers.ts` | `validateInvitation`, `roleToPath`, `roleToLabel` |
| `invitation/queries.ts` | `invite/queries.ts` | `orgInvitationsQuery` React Query factory |
| `invitation/accept/actions.ts` | `invite/actions/invite.mutations.ts` | `acceptInviteAction` |
| `invitation/accept/database.ts` | `invite/database/invite.mutations.ts` | `completeInvite` |
| `invitation/parent/` | `invite/parent/` | Flow complet invitation PARENT |

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `invitation/invitation.ts` | Passer token dans `redirectTo` URL |
| `invitation/supabase.ts` | Aligner `deleteInvitationUserAction` (+ suppression auth Supabase) |
| `invitation/status.ts` | Ajouter `getStatusBadgeInfo` (déjà présent) |
| Tous consommateurs de `invite/` | Remplacer imports |

## Modèles Prisma concernés

- `Invitation` — CRUD dans `accept/database.ts`
- `User` — upsert dans `completeInvite`
- `UserOrganization` — upsert dans `completeInvite`
- `Teacher`, `Student`, `Parent`, `Direction` — upsert dans `completeInvite`
- `UserFunction` — upsert dans `completeInvite` (si DIRECTION)
- `AuditLog` — dans `completeInvite`

## User story mapping

| User Story | Fichiers |
|---|---|
| US1 | `accept/actions.ts`, `accept/database.ts` |
| US2 | `parent/actions.ts`, `parent/database.ts`, `parent/types.ts`, `parent/validation.ts` |
| US3 | `helpers.ts` |
| US4 | `queries.ts` |
| US5 | `supabase.ts` (deleteInvitationUserAction) |
| US6 | `invitation.ts` (token strategy) |
| US7 | Suppression `src/services/invite/`, update imports |

## Dépendances

- US1 dépend de US6 (token strategy doit être fixée avant l'acceptation)
- US7 dépend de toutes les autres US (dernier)
- US2, US3, US4, US5 sont indépendants entre eux
