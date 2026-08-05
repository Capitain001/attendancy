# Tasks: Direction — CRUD Ressources Académiques

**Branch**: main
**Specs**: specs.md
**Architecture**: architecture.md
**Status**: In Progress ⏰

---

## Phase 1: Fondation ✅ (~1h)

**Purpose**: Pattern partagé qui débloque tous les US

- [x] T001 `src/components/ui/ConfirmDialog.tsx` — wrapper `AlertDialog` API simple (trigger, title, description, onConfirm, destructive)
- [x] T002 `src/components/ui/FormDialog.tsx` — wrapper `Dialog` pour formulaires (children render prop avec close())
- [x] T003 `src/components/direction/SectionHeader.tsx` — header standardisé (title, count, countLabel, action, meta)
- [x] T004 Toast : `customToast` confirmé à `@/lib/toast/custom-toast.tsx` — API `.success()` / `.error()`
- [x] T005 Pattern hook : `useCrudEntity` + `actionHelpers` (toFetchFn/toCreateFn/toUpdateFn/toDeleteFn) — hooks `useDepartments` + `useRooms` déjà présents et fonctionnels

**Checkpoint**: ✋ Patterns validés — les US peuvent commencer

**Notes:**
-

---

## Phase 2: US1 — Années académiques (P1) ✅ (~2h)

**Goal**: La direction peut créer une année académique, en définir une comme courante, et en archiver.

**Pourquoi P1**: Prérequis de la création de classes (US5). Sans année courante, aucun flux de création de classe ne fonctionne.

**Independent Test**: Naviguer sur une future page `/academic/years`, créer "2025-2026", la définir comme courante, vérifier l'indicateur visuel.

### Tasks

- [x] T004 [US1] `src/hooks/data/academic-year/useManageAcademicYears.ts`
- [x] T005 [US1] `src/components/direction/academic/AcademicYearForm.tsx` + `AcademicYearCreateButton`
- [x] T006 [US1] `src/components/direction/academic/AcademicYearList.tsx` — CollapseSection + badge Courante + ConfirmDialog archiver
- [x] T007 [US1] `src/app/(app)/[slug]/direction/academic/years/page.tsx` — MetricCard stats + AcademicYearList

**Checkpoint**: ✋ US1 testable — créer/définir/archiver une année depuis `/academic/years`

**Notes:**
-

---

## Phase 3: US2 — Départements (P1) ✅ (~2h)

**Goal**: La direction peut créer, renommer et supprimer des départements.

**Pourquoi P1**: Prérequis de US4 (filières) et US6 (UEs). La page et le composant de liste existent.

**Independent Test**: Page `/academic/departments` — bouton "+", créer "Informatique", renommer, supprimer (avec confirmation).

### Tasks

- [x] T008 [US2] `useDepartments` existant — fonctionnel (aliases V1 présents dans le service)
- [x] T009 [US2] `src/components/direction/academic/DepartmentForm.tsx` — `DepartmentCreateButton` + `DepartmentEditButton`
- [x] T010 [US2] `DepartmentList.tsx` refactorisé — CollapseSection + edit inline + ConfirmDialog suppression (guard FK _count)
- [x] T011 [US2] `departments/page.tsx` — MetricCard (depts, filières, UEs) + SectionHeader + DepartmentList client

**Checkpoint**: ✋ US2 testable — CRUD complet sur les départements

**Notes:**
-

---

## Phase 4: US3 — Salles (P2) ⏳ (~2h)

**Goal**: La direction peut ajouter et retirer des salles.

**Pourquoi P2**: Indépendant des autres US. Essentiel pour que le planning soit utilisable.

**Independent Test**: Page `/schedule/rooms` — bouton "+", créer salle "Amphi A" capacité 200, retirer.

### Tasks

- [ ] T012 [US3] Créer `src/hooks/data/room/useManageRooms.ts` — mutations `create`, `remove`, `update`
- [ ] T013 [US3] Créer `src/components/direction/rooms/RoomForm.tsx` — formulaire client (`name`, `capacity`, `equipment` tags)
- [ ] T014 [US3] Créer `src/components/direction/rooms/RoomActions.tsx` — bouton "Retirer" avec confirmation (soft delete)
- [ ] T015 [US3] Modifier `src/app/(app)/[slug]/direction/schedule/rooms/page.tsx` — passer de RSC inline à : bouton "+ Salle" + intégrer `RoomForm` + `RoomActions` dans les cards

**Checkpoint**: ✋ US3 testable — créer/retirer une salle

**Notes:**
-

---

## Phase 5: US4 — Filières / ProgramTrack (P2) ⏳ (~2h)

**Goal**: La direction peut créer des filières rattachées à un département.

**Prérequis**: US2 (départements) terminée pour alimenter le select.

**Independent Test**: Page `/academic/programs` — bouton "+", select "Informatique", nommer "Génie Logiciel", créer, archiver.

### Tasks

- [ ] T016 [US4] Lire les actions disponibles dans `src/services/program-track/.api/index.json` pour connaître les noms exacts
- [ ] T017 [US4] Créer `src/hooks/data/program-track/useManageProgramTracks.ts` — mutations `create`, `update`, `archive`
- [ ] T018 [US4] Créer `src/components/direction/academic/ProgramTrackForm.tsx` — formulaire (`name`, select `departmentId` depuis la liste des depts passée en props)
- [ ] T019 [US4] Créer `src/components/direction/academic/ProgramTrackActions.tsx` — boutons Edit / Archiver
- [ ] T020 [US4] Modifier `src/app/(app)/[slug]/direction/academic/programs/page.tsx` — fetch departments en parallèle, passer au formulaire + enrichir `ProgramList` avec actions

**Checkpoint**: ✋ US4 testable — créer/archiver une filière

**Notes:**
-

---

## Phase 6: US5 — Classes (P3) ⏳ (~2h)

**Goal**: La direction peut créer des classes pour l'année courante.

**Prérequis**: US1 (année courante) + US4 (filières). Ces données alimentent le formulaire.

**Independent Test**: Page `/academic/classes` — bouton "+", sélectionner filière, niveau L1, nommer "GL-L1-A", créer, archiver.

### Tasks

- [ ] T021 [US5] Créer `src/hooks/data/class/useManageClasses.ts` — mutations `create`, `remove`
- [ ] T022 [US5] Créer `src/components/direction/academic/ClassForm.tsx` — formulaire (`name`, select `programTrackId`, select `level` enum L1…D3, année courante affichée en readonly)
- [ ] T023 [US5] Créer `src/components/direction/academic/ClassActions.tsx` — bouton "Archiver" avec confirmation
- [ ] T024 [US5] Modifier `src/app/(app)/[slug]/direction/academic/classes/page.tsx` — fetch filières + année courante en parallèle, passer au formulaire + enrichir `ClassList` avec actions

**Checkpoint**: ✋ US5 testable — créer/archiver une classe

**Notes:**
-

---

## Phase 7: US6 — UEs (P3) ⏳ (~2h)

**Goal**: La direction peut créer et archiver des Unités d'Enseignement.

**Prérequis**: US2 (départements) pour le select optionnel.

**Independent Test**: Page `/academic/courses` — section UEs, bouton "+", code "INF101", nom "Algo 1", créer, archiver.

### Tasks

- [ ] T025 [US6] Créer `src/hooks/data/ue/useManageUEs.ts` — mutations `create`, `archive`
- [ ] T026 [US6] Créer `src/components/direction/academic/UEForm.tsx` — formulaire (`code`, `name`, `credits`, select `departmentId` optionnel)
- [ ] T027 [US6] Créer `src/components/direction/academic/UEList.tsx` — liste UEs avec badge département + bouton "Archiver"
- [ ] T028 [US6] Modifier `src/app/(app)/[slug]/direction/academic/courses/page.tsx` — intégrer section UEs avec `UEList` + bouton "+ UE"

**Checkpoint**: ✋ US6 testable — créer/archiver une UE

**Notes:**
-

---

## Phase 8: Polish ⏳ (~1h)

**Purpose**: Vérification des conventions et cohérence UX

- [ ] T029 Lancer `npx tsx scripts/generate/naming/check.ts academic-year` et corriger les ⚠
- [ ] T030 Lancer `npx tsx scripts/generate/naming/check.ts department` et corriger les ⚠
- [ ] T031 Lancer `npx tsx scripts/generate/api/api.ts room` si des actions ont été ajoutées au service
- [ ] T032 Vérifier les états vides sur toutes les pages (message + CTA "Créer le premier X")
- [ ] T033 Vérifier les messages d'erreur de contrainte unique (`CONSTRAINT_ERROR`) sur chaque formulaire

**Notes:**
-

---

## Dépendances & Ordre d'exécution

```
Phase 1: Fondation
    ↓
    ├─→ Phase 2: US1 (AcademicYear)   — aucune dépendance
    ├─→ Phase 3: US2 (Department)     — aucune dépendance
    ├─→ Phase 4: US3 (Room)           — aucune dépendance
    │
    ├─→ Phase 5: US4 (ProgramTrack)   — attend Phase 3 (US2 départements)
    │
    └─→ Phase 6: US5 (Class)          — attend Phase 2 (US1) + Phase 5 (US4)
        Phase 7: US6 (UE)             — attend Phase 3 (US2 départements)
    ↓
Phase 8: Polish
```

**Parallélisable** : US1 + US2 + US3 peuvent être travaillées simultanément.

---

## Résumé

| Métrique | Valeur |
|----------|--------|
| Total tâches | 33 |
| Phases | 8 |
| Durée estimée totale | ~14h |
| MVP (US1 + US2) | ~5h |
| Risque principal | Actions de `program-track` à vérifier (T016) |

**MVP** = US1 + US2 : année académique + départements. Suffit à débloquer toute la structure académique.

---

## Légende

- ⏳ Non démarré · ⏰ En cours · ✅ Terminé
- `[P]` = peut tourner en parallèle (fichiers différents)
- `[USx]` = appartient à la User Story x
