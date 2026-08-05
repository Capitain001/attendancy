# Tasks: Direction — CRUD Ressources Académiques

**Branch**: main
**Specs**: specs.md
**Architecture**: architecture.md
**Status**: Terminé ✅

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

## Phase 4: US3 — Salles (P2) ✅ (~2h)

**Goal**: La direction peut ajouter et retirer des salles.

**Pourquoi P2**: Indépendant des autres US. Essentiel pour que le planning soit utilisable.

**Independent Test**: Page `/schedule/rooms` — bouton "+", créer salle "Amphi A" capacité 200, retirer.

### Tasks

- [x] T012 [US3] `useRooms` existant réutilisé — mutations `create`, `delete` disponibles
- [x] T013 [US3] `src/components/direction/rooms/RoomForm.tsx` — `RoomCreateButton` (name + capacity)
- [x] T014 [US3] `src/components/direction/rooms/RoomList.tsx` — CollapseSection + ConfirmDialog retirer
- [x] T015 [US3] `src/app/(app)/[slug]/direction/schedule/rooms/page.tsx` — MetricCard + SectionHeader + RoomList

**Checkpoint**: ✋ US3 testable — créer/retirer une salle

**Notes:**
-

---

## Phase 5: US4 — Filières / ProgramTrack (P2) ✅ (~2h)

**Goal**: La direction peut créer des filières rattachées à un département.

**Prérequis**: US2 (départements) terminée pour alimenter le select.

**Independent Test**: Page `/academic/programs` — bouton "+", select "Informatique", nommer "Génie Logiciel", créer, archiver.

### Tasks

- [x] T016 [US4] Actions vérifiées dans `src/services/program-track/actions/`
- [x] T017 [US4] `src/hooks/data/program-track/useManageProgramTracks.ts` — create, update, remove
- [x] T018 [US4] `src/components/direction/academic/ProgramTrackForm.tsx` — `ProgramTrackCreateButton` + `ProgramTrackEditButton`
- [x] T019 [US4] `ProgramList.tsx` refactorisé — CollapseSection + edit + ConfirmDialog (guard `_count.classes > 0`)
- [x] T020 [US4] `programs/page.tsx` — MetricCard + fetch deps parallèle + ProgramTrackCreateButton + ProgramList

**Checkpoint**: ✋ US4 testable — créer/archiver une filière

**Notes:**
-

---

## Phase 6: US5 — Classes (P3) ✅ (~2h)

**Goal**: La direction peut créer des classes pour l'année courante.

**Prérequis**: US1 (année courante) + US4 (filières). Ces données alimentent le formulaire.

**Independent Test**: Page `/academic/classes` — bouton "+", sélectionner filière, niveau L1, nommer "GL-L1-A", créer, archiver.

### Tasks

- [x] T021 [US5] `src/hooks/data/class/useManageClasses.ts` — create, remove
- [x] T022 [US5] `src/components/direction/academic/ClassForm.tsx` — `ClassCreateButton` (name + programTrackId select + level select + année readonly)
- [x] T023 [US5] `src/components/direction/academic/ClassList.tsx` — CollapseSection + ConfirmDialog archiver
- [x] T024 [US5] `classes/page.tsx` — MetricCard + fetch tracks+year parallèle + ClassCreateButton + ClassList

**Checkpoint**: ✋ US5 testable — créer/archiver une classe

**Notes:**
-

---

## Phase 7: US6 — UEs (P3) ✅ (~2h)

**Goal**: La direction peut créer et archiver des Unités d'Enseignement.

**Prérequis**: US2 (départements) pour le select optionnel.

**Independent Test**: Page `/academic/courses` — section UEs, bouton "+", code "INF101", nom "Algo 1", créer, archiver.

### Tasks

- [x] T025 [US6] `src/hooks/data/ue/useManageUEs.ts` — create, archive
- [x] T026 [US6] `src/components/direction/academic/UEForm.tsx` — `UECreateButton` (name + code + departmentId select)
- [x] T027 [US6] `src/components/direction/academic/UEList.tsx` — CollapseSection + badge code/dept + ConfirmDialog archiver
- [x] T028 [US6] `courses/page.tsx` — MetricCard + fetch deps parallèle + UECreateButton + UEList

**Checkpoint**: ✋ US6 testable — créer/archiver une UE

**Notes:**
-

---

## Phase 8: Polish ✅ (~1h)

**Purpose**: Vérification des conventions et cohérence UX

- [x] T029 `naming/check.ts academic-year` → ✓ 0 violation
- [x] T030 `naming/check.ts department` → ✓ 0 violation
- [x] T029b `naming/check.ts room|program-track|class|ue` → ✓ 0 violation
- [x] T031 `api.ts room` → index régénéré (16 fns)
- [x] T032 États vides présents sur toutes les pages (icône + message + libellé "Créez le premier X")
- [x] T033 `types/check.ts ue` → ⚠ non bloquant : `ProgramUEsDTO` pré-existant dans `types.ts` — hors scope de ces US

**Notes:**
- Seule violation types : `ProgramUEsDTO` dans `src/services/ue/types.ts` — antérieure à ces US, à corriger en scope UE séparé

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
