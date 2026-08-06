# Architecture — Invitations Direction V2 (UX/UI, structure conservée)

> Prérequis lecture (fait) : `CLAUDE.md` racine · `docs/skills/service-module-pattern/SKILL.md`
> · `docs/cmd/generators.md` · `src/components/CLAUDE.md` · `src/hooks/CLAUDE.md`
> · `docs/skills/nextjs-ppr/SKILL.md`.
>
> **Principe directeur** : on **n'ajoute pas de service**. On construit la couche
> **frontend** (pages → composants → hooks) au-dessus du backend **existant**
> `modules/invitation/`, en n'y ajoutant que les wrappers d'action manquants.

## 1. Décisions

| ID | Décision | Justification |
|---|---|---|
| A-1 | **Conserver** `modules/invitation/` (core + `direction/`+`student/`+`teacher/`) | Périmètre task7 = UX/UI, pas refactor. |
| A-2 | Nouveaux wrappers d'action **dans `modules/invitation/actions.ts`** | Cohérent avec l'emplacement des actions de gestion déjà présentes. |
| A-3 | Toute la logique React Query dans `hooks/data/invitation/` | Convention `hooks/CLAUDE.md` ; normalise les retours hétérogènes du module. |
| A-4 | Composants regroupés sous `components/invitation/` (barrel + CLAUDE.md) | Corrige UX1 (4 dossiers → 1 domaine). |
| A-5 | Statut résolu via `modules/invitation/status.ts` (pas de recalcul UI) | Corrige UX2. |
| A-6 | Refactor module→service **différé** (ticket séparé) | Décision prise, hors task7. |

## 2. Inventaire backend réutilisable (`modules/invitation/`)

### Core (générique)
| Fichier | Fonctions exploitées |
|---|---|
| `token.ts` | `generateInvitationToken(expiresInDays?)` |
| `metadata.ts` | `generateInvitationMetadata(...)` |
| `invitation.ts` / `supabase.ts` | `sendSupabaseInvitation`, `resendInvitation`, `generateMagicLink` |
| `notifications.ts` | `notifyInvitationStakeholders(...)` (fire-and-forget) |
| `status.ts` | `resolveInvitationStatus`, `getStatusBadgeInfo`, `filterInvitationsByStatus`, `calculateInvitationStats` |
| `database.ts` | `getOrganizationInvitations`, `getInvitationStats`, `saveInvitationWithAudit`, `updateInvitationToken` |
| `user.ts` | `inviteUser(params)` — orchestrateur (auth + token + metadata + send + save+audit) |
| `actions.ts` | `resendInvitationAction`, `generateMagicLinkAction`, `deleteInvitationUserAction`, `getInvitationStatsAction` |

### Sous-modules rôle (usage métier — consommés tels quels)
| Module | Fonctions |
|---|---|
| `direction/actions.ts` | `inviteDirection({ email, name?, functions[], permissions? })` |
| `direction/database.ts` | `checkFunctionsExist`, `getFunctionsByNames` |
| `student/actions.ts` | `inviteStudent({ email, firstName?, lastName?, classId, groupIds?, parentEmail?, expiresInDays? })`, `getClassInvitationsAction({classId})` |
| `student/database.ts` | `checkInvitationResources`, `getClassInvitations` |
| `teacher/invite.ts` | `inviteTeacher({ email, ..., resources? })` |

## 3. Manques backend à combler (minimes — dans `modules/invitation/actions.ts`)

| Ajout | Signature | Détail |
|---|---|---|
| `getOrgInvitationsAction` | `(limit?=50) => { data } \| { error }` | Résout `orgId` (getUserInfo), appelle `getOrganizationInvitations(orgId, limit)`. **Seul manque bloquant** pour le hub. |
| (option) `getFunctionsForInviteAction` | — | Sinon réutiliser `getFunctionsAction` (service function) directement dans la page RSC. |

> Aucune autre écriture backend. On **ne** modifie **pas** les sous-modules rôle ni le contrat `details`.

## 4. Normalisation des retours (couche hooks)

Le module renvoie des formes incohérentes → les hooks les uniformisent :

| Action module | Retour brut | Normalisation hook |
|---|---|---|
| `inviteDirection` / `inviteStudent` / `inviteTeacher` | `{ success, error?, message? }` | `success===false → throw new Error(error)` |
| `resend/generateMagicLink/deleteInvitationUser` | `{ success, error?, message?, link? }` | idem |
| `getInvitationStatsAction` | `{ success, stats }` | `stats` |
| `getClassInvitationsAction` | `{ data } \| { error }` | `if ('error' in r) throw` |
| `getOrgInvitationsAction` (nouveau) | `{ data } \| { error }` | idem |

## 5. Couche frontend cible

```
src/hooks/data/invitation/
  use-org-invitations.ts     # useOrgInvitations(), useInvitationStats(), invite(staff)/resend/revoke
  use-class-invitations.ts   # useClassInvitations(classId), inviteStudent

src/components/invitation/
  index.ts                   # barrel
  CLAUDE.md                  # composant UI critique (point d'entrée RSC)
  DirectionInvitationsPage.tsx   # hub : 4 MetricCard + CollapseSection historique + InviteDialog
  InviteDialog.tsx               # staff multi-rôle (Enseignant/Direction), fonction conditionnelle
  InvitationTable.tsx            # badge statut (status.ts), actions Relancer/Révoquer (confirm inline)
  ClassInvitationsPage.tsx       # écran classe : MetricCard + InviteStudentDialog + liste
  InviteStudentDialog.tsx        # email, groupes (getGroupsByClassAction), option parent

src/app/(app)/[slug]/direction/invitations/page.tsx                     # RSC hub
src/app/(app)/[slug]/direction/academic/classes/[classId]/invitations/page.tsx  # RSC classe
```

Règles UI (rappel `components/CLAUDE.md` / `hooks/CLAUDE.md` / PPR) :
- Pages RSC : `await connection()` en tête, prefetch parallèle, `HydrationBoundary`.
- `"use client"` seulement sur dialogs/tables interactifs.
- Actions serveur uniquement via hooks ; toast `custom-toast` ; imports via barrels.
- `MetricCard` → `@/components/stats/ui/MetricCard` ; `CollapseSection` → `@/components/layout/CollapseSection`.

## 6. Générateurs

**Aucun** générateur de service (pas de nouveau service). Les scripts `api/types/naming`
ne s'appliquent pas ici (le backend n'est pas un service `src/services/*`).
Lecture rapide du backend : `modules/invitation/CLAUDE.md` (déjà à jour sur les fonctions).

## 7. Refactor différé (documenté, hors task7)

Cible future : `modules/invitation/` = **core** (token, metadata, supabase, notifications, status) ;
`services/invitation/` = **usage métier** (`direction`/`student`/`teacher`/parent + persistance + queries),
consommant le core. Voir note en tête de `plan.md`. **Ne pas exécuter dans ce plan.**
