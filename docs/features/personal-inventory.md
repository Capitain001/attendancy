# Inventaire — Feature `personal`

> Répertoire de tous les fichiers et fonctions liés à l'espace personnel (prof indépendant).  
> **Objectif** : préparer la migration vers `apps/web/src/features/personal/`.  
> Chemin de base : `apps/web/src/` (sauf mention contraire).

---

## 1. Services

### 1.1 `services/personal/` — service orchestrateur

> Ne possède **aucun modèle Prisma**. Orchestre les services propriétaires.

| Fichier | Fonctions / Exports | Rôle |
|---|---|---|
| [`index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/index.ts) | re-export `./actions` + `./constants` | API publique du service |
| [`constants.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/constants.ts) | `PERSONAL_LABEL`, `PERSONAL_NAME`, `PERSONAL_ACADEMIC_YEAR`, `PERSONAL` | Constantes partagées (nom réservé `'PERSONNEL'`, année académique perpétuelle) |
| [`paths.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/paths.ts) | `personal` (objet routes), `getUserSlug()` | Chemins de navigation de l'espace perso |
| [`types.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/types.ts) | `CreatePersonalClassData`, `UpdatePersonalClassData` | DTOs Prisma typés |
| [`validation.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/validation.ts) | `createPersonalClassSchema`, `updatePersonalClassSchema`, `updatePersonalClassDataSchema` + types inférés | Validation Valibot pour les classes perso |
| [`auth.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/auth.ts) | _(à vérifier)_ | Auth helpers |
| [`utils.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/utils.ts) | _(à vérifier)_ | Utilitaires internes |
| [`CLAUDE.md`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/CLAUDE.md) | — | Documentation du service |

#### Actions (`services/personal/actions/`)

| Fichier | Fonctions | `'use server'` |
|---|---|---|
| [`actions/index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/actions/index.ts) | re-export `teacher.mutations` + `organization.mutations` | — |
| [`actions/teacher.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/actions/teacher.mutations.ts) | `createPersonalCourseAction(input)` | ✅ |
| [`actions/organization.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/actions/organization.mutations.ts) | `createPersonalOrgAction(role)`, `createPersonalProfileAction(orgId, role)` | ✅ |
| [`actions/classe.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/actions/classe.mutations.ts) | `resolveClassesData()` | ❌ helper RSC |

#### Database (`services/personal/database/`)

| Fichier | Fonctions | Modèles Prisma touchés |
|---|---|---|
| [`database/index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/database/index.ts) | re-export | — |
| [`database/classe.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/database/classe.mutations.ts) | `createPersonalClassTx(tx, {orgId, name})`, `invalidatePersonalClassEvents(orgId)`, `createPersonalClass(params)`, `updatePersonalClass(classId, orgId, data)` | `AcademicYear`, `Department`, `ProgramTrack`, `Class` |
| [`database/organization.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/database/organization.mutations.ts) | `createPersonalOrgWithProfile(params)`, `createPersonalProfile(params)` | `Organization`, `OrganizationSettings`, `OrganizationUsage`, `UserOrganization`, `Teacher`/`Student`/`Parent`, `User` |
| [`database/organization.queries.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/database/organization.queries.ts) | `findPersonalProfileId(userId, orgId, role)` | `Teacher`, `Student`, `Parent` (read-only) |

---

### 1.2 `services/class/personal/` — sous-domaine classe perso (service `class`)

> Propriétaire du modèle `Class` pour le contexte personal.

| Fichier | Fonctions / Exports | Rôle |
|---|---|---|
| [`index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/index.ts) | re-export `./actions` + `./types` | Barrel |
| [`types.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/types.ts) | `CreatePersonalClassData`, `UpdatePersonalClassData` | DTOs (Pick Prisma) |
| [`validation.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/validation.ts) | `createPersonalClassSchema`, `updatePersonalClassSchema`, `updatePersonalClassDataSchema` + types inférés | Validation Valibot (dupliquée — voir §6) |
| [`constants.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/constants.ts) | _(à vérifier)_ | Constantes locales |

#### Actions (`services/class/personal/actions/`)

| Fichier | Fonctions | `'use server'` |
|---|---|---|
| [`actions/index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/actions/index.ts) | re-export | — |
| [`actions/class.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/actions/class.mutations.ts) | `updatePersonalClassAction(input)` | ✅ |
| [`actions/class.queries.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/actions/class.queries.ts) | `getDefaultPersonalClassAction()` | ✅ |

#### Database (`services/class/personal/database/`)

| Fichier | Fonctions | Modèles Prisma touchés |
|---|---|---|
| [`database/index.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/database/index.ts) | re-export | — |
| [`database/class.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/database/class.mutations.ts) | `updatePersonalClass(classId, orgId, data)` | `Class` |
| [`database/class.queries.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/database/class.queries.ts) | `getDefaultPersonalClass(orgId)` — `'use cache'` | `Class` (read-only) |

---

## 2. Composants UI — `components/personal/teacher/`

| Fichier | Composants / Exports | Rôle |
|---|---|---|
| [`PersonalTeacherStart.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/PersonalTeacherStart.tsx) | `PersonalTeacherStart` | Écran de démarrage |
| [`PersonalTeacherWelcome.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/PersonalTeacherWelcome.tsx) | `PersonalTeacherWelcome` | Accueil espace perso |
| [`lib.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/lib.ts) | _(utilitaires UI)_ | Helpers locaux |
| **`class/`** | | |
| [`class/ClassOverviewCard.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/class/ClassOverviewCard.tsx) | `ClassOverviewCard` | Carte résumé de classe |
| [`class/CreateClassModal.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/class/CreateClassModal.tsx) | `CreateClassModal`, `CREATE_CLASS_MODAL_ID` | Modale création de classe |
| [`class/PersonalClassCard.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/class/PersonalClassCard.tsx) | `PersonalClassCard` | Carte classe perso |
| [`class/PersonalClassPlaceholder.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/class/PersonalClassPlaceholder.tsx) | `PersonalClassPlaceholder` | Placeholder ajout classe |
| [`class/StartPersonalClassButton.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/class/StartPersonalClassButton.tsx) | `StartPersonalClassButton` | CTA démarrage classe |
| **`courses/`** | | |
| [`courses/NewPersonalCourseForm.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/courses/NewPersonalCourseForm.tsx) | `NewPersonalCourseForm` | Formulaire nouveau cours |
| **`screen/`** | | |
| [`screen/TeacherDailyScreen.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/screen/TeacherDailyScreen.tsx) | `TeacherDailyScreen` (default) | Shell journalier principal |
| [`screen/TeacherDailyOverviewScreen.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/screen/TeacherDailyOverviewScreen.tsx) | `TeacherDailyOverviewScreen` | Vue résumé du jour |
| [`screen/TeacherDailyScheduleListScreen.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/screen/TeacherDailyScheduleListScreen.tsx) | `TeacherDailyScheduleListScreen` (default) | Vue liste des séances |
| **`section/`** | | |
| [`section/TeacherDailyOverview.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/section/TeacherDailyOverview.tsx) | `TeacherDailyOverview` | Section résumé journalier |
| [`section/TeacherDailyScheduleList.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/section/TeacherDailyScheduleList.tsx) | `TeacherDailyScheduleList` | Liste des séances du jour |
| [`section/TeacherScheduleDetailSheet.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/section/TeacherScheduleDetailSheet.tsx) | `TeacherScheduleDetailSheet` | Sheet détail d'une séance |
| **`ui/`** | | |
| [`ui/ScheduleCard.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/ui/ScheduleCard.tsx) | `ScheduleCard`, `ScheduleCardSchedule` (type) | Carte séance |
| [`ui/ScheduleCountdownLabel.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/ui/ScheduleCountdownLabel.tsx) | `ScheduleCountdownLabel` | Label compte à rebours |
| [`ui/ScheduleStatusIcon.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/ui/ScheduleStatusIcon.tsx) | `ScheduleStatusIcon`, `resolveScheduleIcon()`, `ScheduleIcon` (type) | Icône statut séance |
| [`ui/StartSessionButton.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/ui/StartSessionButton.tsx) | `StartSessionButton` | Bouton démarrer séance |
| **`ux/`** | | |
| [`ux/PersonalTeacherWelcome.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/components/personal/teacher/ux/PersonalTeacherWelcome.tsx) | `PersonalTeacherWelcome` | Version UX page d'accueil |

---

## 3. Pages RSC — `app/(app)/personal/[slug]/teacher/`

Layout partagé : [`[slug]/teacher/layout.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/layout.tsx)

| Route | Fichier page | Composant principal |
|---|---|---|
| `/personal/[slug]/teacher` | [`page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/page.tsx) | `TeacherDailyScreen` |
| `/personal/[slug]/teacher/start` | [`start/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/start/page.tsx) | `PersonalTeacherWelcome` |
| `/personal/[slug]/teacher/classes` | [`classes/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/classes/page.tsx) | `PersonalClassCard`, `CreateClassModal`, `PersonalClassPlaceholder` |
| `/personal/[slug]/teacher/classes/[id]` | [`classes/[id]/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/classes/%5Bid%5D/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/courses` | [`courses/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/courses/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/courses/new` | [`courses/new/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/courses/new/page.tsx) | `NewPersonalCourseForm` |
| `/personal/[slug]/teacher/planning` | [`planning/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/planning/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/attendance` | [`attendance/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/attendance/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/sessions` | [`sessions/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/sessions/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/students` | [`students/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/students/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/notifications` | [`notifications/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/notifications/page.tsx) | _(à vérifier)_ |
| `/personal/[slug]/teacher/unavailabilities` | [`unavailabilities/page.tsx`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/unavailabilities/page.tsx) | _(à vérifier)_ |

---

## 4. Hooks

| Fichier | Fonctions | Action server appelée |
|---|---|---|
| [`hooks/data/courses/useCreatePersonalCourse.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/hooks/data/courses/useCreatePersonalCourse.ts) | `useCreatePersonalCourse()` → `{ createCourse, isPending }` | `createPersonalCourseAction` |

---

## 5. Modules transverses consommés

| Import | Rôle dans la feature |
|---|---|
| `@/modules/personal/paths` | Alias/re-export de `services/personal/paths` |
| `@/modules/auth/constants` — `PersonalRole`, `PERSONAL_ROLES` | Rôles autorisés : `'TEACHER' \| 'STUDENT' \| 'PARENT'` |
| `@/modules/auth/members/utils` — `createRoleSpecificEntity` | Création Teacher / Student / Parent selon le rôle |
| `@/modules/user/access` — `setUserAccess` | Mise à jour du token session après bootstrap |
| `@/lib/slug` — `buildOrgSlug` | Génération du slug de l'org personnelle |
| `@/services/audit` — `logAuditAsync` | Log de création d'org |

---

## 6. Duplications identifiées (à résoudre lors de la migration)

| # | Problème | Fichiers concernés |
|---|---|---|
| D1 | `validation.ts` quasi-identique | [`services/personal/validation.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/validation.ts) vs [`services/class/personal/validation.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/validation.ts) |
| D2 | `updatePersonalClass` défini deux fois | [`services/personal/database/classe.mutations.ts#L78`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/database/classe.mutations.ts#L78) vs [`services/class/personal/database/class.mutations.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/database/class.mutations.ts) |
| D3 | `types.ts` identiques | [`services/personal/types.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/personal/types.ts) vs [`services/class/personal/types.ts`](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/services/class/personal/types.ts) |

---

## 7. Cible migration — `features/personal/`

```
apps/web/src/features/personal/
├── actions/
│   ├── org.mutations.ts        ← createPersonalOrgAction, createPersonalProfileAction
│   ├── teacher.mutations.ts    ← createPersonalCourseAction
│   ├── class.mutations.ts      ← updatePersonalClassAction, resolveClassesData
│   ├── class.queries.ts        ← getDefaultPersonalClassAction
│   └── index.ts
├── database/
│   ├── org.mutations.ts        ← createPersonalOrgWithProfile, createPersonalProfile
│   ├── org.queries.ts          ← findPersonalProfileId
│   ├── class.mutations.ts      ← createPersonalClassTx, createPersonalClass, updatePersonalClass (consolidé D2)
│   ├── class.queries.ts        ← getDefaultPersonalClass
│   └── index.ts
├── components/
│   └── teacher/                ← depuis components/personal/teacher/ (déjà déplacé ✅)
├── hooks/
│   └── useCreatePersonalCourse.ts
├── constants.ts                ← PERSONAL, PERSONAL_NAME, PERSONAL_LABEL, PERSONAL_ACADEMIC_YEAR
├── types.ts                    ← CreatePersonalClassData, UpdatePersonalClassData (D3 consolidé)
├── validation.ts               ← schemas consolidés (D1 résolu)
├── paths.ts                    ← personal routes + getUserSlug
└── index.ts
```
