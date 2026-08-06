# Spec — Invitations Direction V2 (UX/UI)

> Driver : `docs/tasks/task7.md`. **Pas une reproduction** de la V1 — réécriture des écrans
> Direction avec meilleure UX/UI, **en conservant la structure backend actuelle**.
>
> ⚠️ **Hors périmètre** : le refactor `modules/invitation/` → `services/invitation/`
> (module = core / service = usage métier). Décision architecturale prise, mais **différée**
> (ticket séparé). Ce plan **consomme le module existant tel quel**.

## 1. Analyse V1 (source : `C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy`)

Deux écrans Direction :

| Page V1 | Rôle | Données |
|---|---|---|
| `/[slug]/direction/invitations/page.tsx` | Hub org : inviter staff + historique | `getFunctionsAction`, `getCoursesAction`, `getClassesAction`, `orgInvitationsQuery(50)` |
| `/[slug]/direction/invitations/classes/[classId]/page.tsx` | Inviter étudiants d'une classe | `getClassGroupsAction`, `getClassInvitationsAction` |

Composants V1 : `components/invite/{admin,direction,student,teachers}/**` + `components/invitation/direction/pages/InviteStudentPage`.

### Problèmes UX/UI V1 (à corriger — c'est le cœur de la tâche)
| # | Problème | Correction cible |
|---|---|---|
| UX1 | 4 dossiers de composants (`invite/admin`, `invite/direction`, `invite/student`, `invite/teachers`) + `invitation/direction` → duplication, hiérarchie floue | 1 domaine `components/invitation/` avec barrel |
| UX2 | Statut d'invitation calculé de façon dispersée côté client (rows dédiées Pending/Validated) | Statut résolu via helpers `status.ts` du module, badge unique |
| UX3 | Historique en table brute, pas de stats visibles | En-tête 4 `MetricCard` (Total/Attente/Acceptées/Expirées) + `CollapseSection` |
| UX4 | Dialogs séparés par rôle sans cohérence visuelle | `InviteDialog` unifié multi-rôle (Enseignant/Direction), champ fonction conditionnel |
| UX5 | Actions destructives sans garde visuelle | Confirm inline (jamais `alert()`), toast `custom-toast` |

## 2. État V2 actuel (à connaître avant de coder)

- **Acceptation = FAITE et canonique** : `src/modules/auth/members/complete-signup.ts` (contrat `details` gelé).
- **Backend d'envoi/gestion = présent mais DORMANT** : `src/modules/invitation/` (core + sous-modules
  `direction/`, `student/`, `teacher/`). **Quasi aucun consommateur** (`grep` : seul `types/invitation.ts`
  importe un type). Les 2 pages Direction V1 **n'ont aucun équivalent V2**.
- **Manque UI** : pas de hooks, pas de composants, pas de pages. `components/users/invite/AddUsers.tsx` vide.
- **Manque backend mineur** : `getOrganizationInvitations` existe en DB (`modules/invitation/database.ts`)
  mais **sans action wrapper** exploitable côté page.
- Réutilisable : `getFunctionsAction`, `getClassesAction`, `getCoursesAction`, `getGroupsByClassAction`,
  `getClassGroupsAction`, `MetricCard`, `CollapseSection`, `custom-toast`.

## 3. Objectif

Livrer les **2 écrans Direction invitations** avec une UX/UI retravaillée, **câblés sur
`modules/invitation/` existant** via des hooks `hooks/data/invitation/`, en ne créant côté backend
que les **rares wrappers d'action manquants** (aucune restructuration de couche).

Non-objectifs : refactor module→service · toucher `complete-signup.ts` · réécrire le contrat `details`
· réécrire les sous-modules rôle.

## 4. User Stories

### US1 (P1) — Hub Direction : inviter le staff + suivre
En tant que **DIRECTION**, je veux inviter un enseignant ou un membre de direction et suivre
l'historique (attente/acceptée/expirée), afin de piloter l'onboarding.
- Consomme `inviteTeacher` (teacher), `inviteDirection` (direction), `getInvitationStatsAction`,
  nouveau `getOrgInvitationsAction`, `resendInvitationAction`, `deleteInvitationUserAction`.
- Statut + badge via `status.ts` (`resolveInvitationStatus`, `getStatusBadgeInfo`).

### US2 (P1) — Inviter des étudiants d'une classe
En tant que **DIRECTION**, je veux inviter des étudiants rattachés à une classe (et groupes).
- Consomme `inviteStudent` (student) + `getClassInvitationsAction` (student) + `getGroupsByClassAction`.

### US3 (P2) — Relance / révocation depuis l'historique
En tant que **DIRECTION**, je veux relancer ou révoquer une invitation en attente.
- `resendInvitationAction` / `deleteInvitationUserAction` (existants) + garde UI (confirm inline).

## 5. Contraintes (structure actuelle)

- **Ne pas restructurer** `modules/invitation/`. Les wrappers manquants vont dans `modules/invitation/actions.ts`
  (où vivent déjà `resendInvitationAction`, `getInvitationStatsAction`), en suivant les conventions du module.
- Les actions du module renvoient des formes **hétérogènes** (`{success,error,message}`, `{data}`, `{success,stats}`) —
  **les hooks normalisent** vers un usage React Query propre. Ne pas réécrire le contrat (dette documentée, différée).
- Composant client → **jamais** d'action directe : via `hooks/data/invitation/`.
- Pages RSC → `await connection()` (PPR `cacheComponents`).
- Toast `@/lib/toast/custom-toast` ; imports via barrels ; `MetricCard`/`CollapseSection` réutilisés.

## 6. Critères de succès

- [ ] 2 écrans Direction fonctionnels (hub org + classe) avec la nouvelle UX (stats, badges statut, dialog unifié).
- [ ] Câblage **exclusivement** via `hooks/data/invitation/` — aucun appel action direct en composant client.
- [ ] Backend inchangé **sauf** ajout du wrapper `getOrgInvitationsAction` (+ éventuels wrappers manquants) dans `modules/invitation/actions.ts`.
- [ ] `modules/invitation/` **conservé** (non supprimé, non restructuré).
- [ ] 0 nouvelle erreur TS ; `components/invitation/CLAUDE.md` présent (règle UI critique).
- [ ] Refactor module→service **documenté comme différé**, non exécuté.
