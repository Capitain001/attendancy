# Composants `invitation`

Écrans Direction de gestion des invitations (hub org + par classe). Câblés sur le backend
`modules/invitation/` (dormant) via `hooks/data/invitation/` — **jamais d'action serveur en direct**.

## Point d'entrée

Deux pages RSC instancient ce domaine :
- `app/(app)/[slug]/direction/invitations/page.tsx` → `<DirectionInvitationsPage functions={...} />`
- `app/(app)/[slug]/direction/academic/classes/[classId]/invitations/page.tsx` → `<ClassInvitationsPage classId className groups />`

Les pages RSC : `await connection()`, prefetch parallèle, `HydrationBoundary` (seed `INVITATIONS.ORG`/`STATS`/`BY_CLASS`).

## Composants

| Composant | Rôle | Props clés |
|---|---|---|
| `DirectionInvitationsPage` | Hub org : stats + historique + dialog | `functions: {id,name}[]` |
| `ClassInvitationsPage` | Écran classe : inviter étudiants + liste | `classId`, `className`, `groups: {id,name}[]` |
| `InviteDialog` | Dialog staff multi-rôle (Enseignant/Direction) | `functions`, `onInviteTeacher`, `onInviteDirection` |
| `InviteStudentDialog` | Dialog invitation étudiant (groupes, parent) | `groups`, `onSubmit` |
| `InvitationTable` | Historique + badge statut + relance/révocation | `invitations`, `onResend`, `onRevoke`, `pending?` |

## Hooks consommés (`hooks/data/invitation/`)

- `useOrgInvitations(limit?)` → `{ invitations, inviteTeacher, inviteDirection, resend, revoke }` (mutations React Query).
- `useInvitationStats()` → `{ stats }` (Total/En attente/Acceptées/Expirées).
- `useClassInvitations(classId)` → `{ invitations, inviteStudent, resend, revoke }`.

Les hooks **normalisent** les retours hétérogènes du module (`{success,error}` / `{data}` / `{success,stats}`).

## Règles d'usage

- Statut d'invitation résolu via `@/modules/invitation/status` (`resolveInvitationStatus`, `getStatusBadgeInfo`,
  `filterInvitationsByStatus`) — jamais recalculé dans l'UI.
- Import via le barrel `@/components/invitation` ; toast via `@/lib/toast/custom-toast`.
- Révocation : confirm **inline** (pas d'`alert()` — bloquerait l'extension navigateur).
- Backend = `modules/invitation/` **conservé** ; le refactor module→service est un ticket différé
  (voir `specs/invitations-v2/`).
