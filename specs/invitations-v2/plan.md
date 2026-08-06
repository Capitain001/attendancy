# Plan — Invitations Direction V2 (UX/UI, structure conservée)

**Branch** : `ue-national-templates` (ou dédiée) · **Spec** : [spec.md](./spec.md) · **Archi** : [architecture.md](./architecture.md)
**Statut** : Not Started ⏳

> ⚠️ **Hors périmètre** : refactor `modules/invitation/` → `services/invitation/`. On **conserve la
> structure actuelle** et on consomme `modules/invitation/` tel quel. Le refactor (module=core /
> service=usage métier : `direction`/`student`/`teacher`) est un **ticket ultérieur**, non traité ici.
>
> Avant de coder : lire `modules/invitation/CLAUDE.md` (surface backend), `hooks/CLAUDE.md`,
> `components/CLAUDE.md`, `docs/skills/nextjs-ppr/SKILL.md`.

---

## Phase 0 — Mon workflow pour CETTE tâche 📌 RELIRE À CHAQUE SESSION

> Comment j'exécute task7 concrètement (durable, survit aux compactions).
> Docs de référence à **relire** (sans recopier) : `CLAUDE.md` racine · `SKILL.md` ·
> `docs/cmd/generators.md` · `docs/skills/nextjs-ppr/SKILL.md` · `hooks/CLAUDE.md` · `components/CLAUDE.md`.

### 0.1 Retrouver une fonction existante (avant d'écrire)
- **Backend invitation = `modules/invitation/`, PAS un service `src/services/*`** → il n'a **ni
  `.api/` ni `summary/`**. Pour l'explorer : lire `modules/invitation/CLAUDE.md` (inventaire à jour)
  puis ouvrir le fichier ciblé. Fonctions à réutiliser telles quelles → voir architecture §2.
- **Services consommés** (function, class, group, course) → là j'utilise le réflexe index :
  `apps/web/summary/<service>.json` d'abord, puis `.api/<fn>.json` (source de vérité) pour la signature
  de `getFunctionsAction`, `getClassesAction`, `getGroupsByClassAction`, `getClassGroupsAction`.

### 0.2 Séquence d'exécution
P1 wrapper action (backend, 1 seul ajout) → P2 hooks (normalisation des retours) → P3 hub →
P4 écran classe → P5 finition. Après chaque phase : `npx tsc --noEmit` **ciblé** sur les fichiers touchés.

### 0.3 Outils/patterns effectivement utilisés ici (frontend)
- Hooks React Query dans `hooks/data/invitation/` ; **composant client → jamais d'action directe**, via hook.
- Retours hétérogènes du module normalisés dans les hooks (`success===false → throw` / `if ('error' in r)`).
- Pages RSC : `await connection()` en tête (PPR) + `HydrationBoundary`.
- Toast `@/lib/toast/custom-toast` ; imports via barrels ; réutiliser `MetricCard` + `CollapseSection`.
- **Aucun générateur de service** (pas de nouveau service `src/services/*`) → `service/api/types/naming` non lancés.

### 0.4 Renvoi (uniquement si on fait le refactor différé)
Le workflow générateurs+pattern complet (`scripts/generate/service/service.ts`, `generate:types:svc`,
`generate:api:svc`, `api:check`, couches `actions/`+`database/`, `{data}|{error}`, Valibot…) est dans
`docs/cmd/generators.md` + `SKILL.md` — à appliquer **là seulement**, pas dans ce plan. Ne pas recopier ici.

---

## Phase 1 — Combler le manque backend (~30 min) ⏳

**But** : rendre l'historique org exploitable sans restructurer.

- [ ] T001 `modules/invitation/actions.ts` : ajouter `getOrgInvitationsAction(limit = 50)`
      → `getUserInfo()` → `orgId` → `getOrganizationInvitations(orgId, limit)` → `{ data } | { error }`
      (même style que `getInvitationStatsAction` déjà présent). **Aucune autre écriture backend.**
- [ ] T002 (si utile) exposer un barrel léger `modules/invitation/index.ts` ré-exportant les actions
      consommées (évite les imports profonds). Sinon importer par chemin explicite.

**Checkpoint** : hub peut lister + compter les invitations.

---

## Phase 2 — Hooks data (~1h30) ⏳

**But** : normaliser les retours hétérogènes du module (cf. archi §4) derrière React Query.

- [ ] T003 `hooks/data/invitation/use-org-invitations.ts` :
      - `useOrgInvitations(limit?)` → `getOrgInvitationsAction` (queryKey `CACHE_KEYS.INVITATIONS.ORG`)
      - `useInvitationStats()` → `getInvitationStatsAction` (map `.stats`)
      - mutations : `inviteTeacher`, `inviteDirection` (throw si `success===false`), `resend`, `revoke`
        (`deleteInvitationUserAction`) — invalidation `INVITATIONS.ORG` + `STATS`, toast `custom-toast`.
- [ ] T004 `hooks/data/invitation/use-class-invitations.ts` :
      - `useClassInvitations(classId)` → `getClassInvitationsAction` (queryKey `INVITATIONS.BY_CLASS(classId)`)
      - mutation `inviteStudent` (throw si `success===false`) + invalidation.
- [ ] T005 `cache/client/key.ts` : ajouter `INVITATIONS.{ORG, BY_CLASS(classId), STATS}` si absents.

**Checkpoint** : hooks testables, retours uniformisés (`if ('error' in r)` / throw).

---

## Phase 3 — Écran Hub Direction (~3h) 🎯 MVP ⏳

**But** : `/[slug]/direction/invitations` retravaillé (UX3/UX4/UX2).

- [ ] T006 `components/invitation/InviteDialog.tsx` (`"use client"`) — staff multi-rôle
      (segment Enseignant / Direction) ; pour Direction : sélection fonction(s) (via `getFunctionsAction` prefetch) ;
      submit délégué au hook (jamais d'action directe).
- [ ] T007 `components/invitation/InvitationTable.tsx` — table + badge statut via `status.ts`
      (`resolveInvitationStatus`/`getStatusBadgeInfo`), filtre par statut (`filterInvitationsByStatus`),
      actions Relancer/Révoquer (confirm **inline**, pas d'`alert()`).
- [ ] T008 `components/invitation/DirectionInvitationsPage.tsx` — 4 `MetricCard`
      (Total/En attente/Acceptées/Expirées depuis `useInvitationStats`) + `CollapseSection` historique + `InviteDialog`.
- [ ] T009 Page RSC `app/(app)/[slug]/direction/invitations/page.tsx` :
      `await connection()`, prefetch parallèle (`getOrgInvitationsAction`, `getInvitationStatsAction`, `getFunctionsAction`),
      `HydrationBoundary` (seed `INVITATIONS.ORG` + `STATS`).

**Checkpoint** ✋ : inviter enseignant/direction + lister + relancer/révoquer en réel.

---

## Phase 4 — Écran Classe (~2h) ⏳

**But** : `/[slug]/direction/academic/classes/[classId]/invitations`.

- [ ] T010 `components/invitation/InviteStudentDialog.tsx` (`"use client"`) — email(s),
      sélection groupes (`getGroupsByClassAction`), option `parentEmail` ; submit via hook.
- [ ] T011 `components/invitation/ClassInvitationsPage.tsx` — `ClassBanner` + `MetricCard`
      (Invités/Acceptés) + `InviteStudentDialog` + liste (statut serveur).
- [ ] T012 Page RSC `.../classes/[classId]/invitations/page.tsx` :
      `await connection()`, `validateUUID(classId)`, prefetch (`getClassInvitationsAction`, `getGroupsByClassAction`),
      `HydrationBoundary` (seed `INVITATIONS.BY_CLASS`).

**Checkpoint** ✋ : inviter étudiant avec groupes + lister par classe.

---

## Phase 5 — Finition (~1h) ⏳

- [ ] T013 `components/invitation/index.ts` (barrel) + `components/invitation/CLAUDE.md`
      (point d'entrée RSC, props clés, hooks, règles — cf. `components/CLAUDE.md`).
- [ ] T014 Vérif : `npx tsc --noEmit` (0 nouvelle erreur) ; navigation liée depuis le dashboard Direction.
- [ ] T015 `docs/tasks/task7.md` : cocher livraison ; noter le refactor module→service comme ticket suivant.

---

## Dépendances & ordre

```
P1 wrapper backend ─▶ P2 hooks ─▶ P3 hub (MVP) ─▶ P4 classe ─▶ P5 finition
```
- **MVP = P1→P3** (hub org fonctionnel). L'écran classe (P4) est un incrément.
- Aucun générateur de service (pas de nouveau service).

## Ce qu'on NE fait PAS (garde-fous périmètre)
- ❌ Créer `services/invitation/` · ❌ déplacer `direction/student/teacher` · ❌ supprimer `modules/invitation/`.
- ❌ Modifier `auth/members/complete-signup.ts` · ❌ changer le contrat `details` · ❌ réécrire les sous-modules rôle.

## Risques
| Risque | Mitigation |
|---|---|
| Retours module hétérogènes cassent React Query | Normalisation centralisée en Phase 2 (throw / `'error' in r`) |
| `getClassInvitationsAction` exige `PRINCIPAL` | Vérifier le rôle courant ; documenter si accès refusé |
| `inviteDirection` stocke `additionalFunctions` en 2e écriture (findFirst+update) | Comportement existant conservé ; ne pas « améliorer » ici (hors périmètre) |
| Dette : formes de retour non conformes `{data}|{error}` | Documentée → résolue lors du refactor module→service différé |
