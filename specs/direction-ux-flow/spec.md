# Feature: Flux UX Direction

## Description

Interface complète de la section Direction sous `[slug]/direction/`.
La Direction est propriétaire de l'organisation (décision P-01) et dispose
d'une vue sur l'ensemble des données académiques, humaines et opérationnelles
de l'établissement.

7 sections + 1 dashboard. Chaque section consomme des services existants —
aucun nouveau schéma Prisma requis. Le service `direction` lui-même a besoin
d'une couche `database/` (stubs actuels → requêtes réelles).

---

## User Stories

**En tant que Direction**
- je veux un tableau de bord global → voir l'état de l'établissement en un coup d'œil
- je veux gérer la structure académique → créer/archiver classes, filières, départements
- je veux superviser les acteurs → consulter/inviter enseignants, étudiants, parents
- je veux suivre les présences → voir les sessions du jour et les rapports d'assiduité
- je veux piloter le planning → vue calendrier globale, gestion des salles
- je veux configurer l'organisation → paramètres, journal d'audit

---

## Services concernés

| Service | Rôle dans ce flux |
|---|---|
| `direction` | Membres direction + fonctions — DB layer à implémenter |
| `org` | Métriques, identité, usage — dashboard + administration |
| `academic-year` | Années académiques — dashboard + academic |
| `class` | Promotions — academic/classes |
| `department` | Départements — academic/departments |
| `program-track` | Filières — academic/programs |
| `course` | Cours/matières — academic/courses |
| `teacher` | Enseignants — people/teachers |
| `student` | Étudiants + inscriptions — people/students |
| `session` | Sessions de cours — attendance/sessions |
| `attendance` | Statistiques présences — attendance/reports |
| `schedule` | Séances planifiées — schedule/calendar |
| `room` | Salles — schedule/rooms |
| `invite` | Invitations — people/* (ajout acteurs) |

---

## Architecture des routes

```
src/app/(app)/[slug]/direction/
├── layout.tsx                        # Layout direction : sidebar nav + breadcrumb
├── page.tsx                          # Dashboard (RSC)
│
├── academic/
│   ├── layout.tsx                    # Sous-nav academic
│   ├── page.tsx                      # Redirect → classes
│   ├── classes/
│   │   ├── page.tsx                  # Liste classes (RSC)
│   │   └── [classId]/
│   │       ├── page.tsx              # Détail classe : étudiants, cours, groupes
│   │       └── students/
│   │           └── page.tsx          # Étudiants inscrits + groupes
│   ├── programs/
│   │   └── page.tsx                  # Filières + maquettes
│   ├── departments/
│   │   └── page.tsx                  # Départements + enseignants rattachés
│   └── courses/
│       └── page.tsx                  # Cours/matières (avec UE)
│
├── people/
│   ├── layout.tsx                    # Sous-nav people
│   ├── teachers/
│   │   ├── page.tsx                  # Liste enseignants
│   │   └── [teacherId]/
│   │       └── page.tsx              # Fiche enseignant
│   ├── students/
│   │   └── page.tsx                  # Liste étudiants (filtrable par classe)
│   └── parents/
│       └── page.tsx                  # Responsables légaux
│
├── attendance/
│   ├── sessions/
│   │   └── page.tsx                  # Sessions du jour / passées
│   └── reports/
│       └── page.tsx                  # Rapports et statistiques d'assiduité
│
├── schedule/
│   ├── calendar/
│   │   └── page.tsx                  # Vue calendrier globale (classe / enseignant)
│   ├── rooms/
│   │   └── page.tsx                  # Gestion salles
│   └── events/
│       └── page.tsx                  # Événements org
│
├── evaluation/
│   └── page.tsx                      # Vue globale évaluations par classe/terme
│
└── administration/
    ├── settings/
    │   └── page.tsx                  # Paramètres organisation
    └── audit/
        └── page.tsx                  # Journal d'activité (AuditLog)
```

---

## Fichiers à créer / modifier

### Service `direction` — DB layer (stubs → réel)

```
src/services/direction/
  CLAUDE.md                           # À créer (obligatoire avant commit)
  database/
    direction.queries.ts              # getDirectionMembers, getDirectionMember
    direction.mutations.ts            # assignFunctions, revokeFunctions, deleteMember
  cache.ts                            # DIRECTION_GRAPH
  validation.ts                       # assignFunctionsSchema
  types.ts                            # DirectionMemberDto (Awaited<ReturnType<...>>)
  actions/
    direction.queries.ts              # getDirectionMembersAction (remplace stub)
    direction.mutations.ts            # assignFunctions*, revoke*, delete* (remplace stubs)
  index.ts                            # barrel
```

### Layout & navigation

```
src/app/(app)/[slug]/direction/
  layout.tsx                          # Sidebar gauche avec 7 sections
  _components/
    DirectionNav.tsx                  # Liens de navigation (client)
    DirectionHeader.tsx               # En-tête section
```

### Dashboard

```
src/app/(app)/[slug]/direction/
  page.tsx                            # RSC — appel parallel : org metrics + year courante

src/components/direction/dashboard/
  OrgMetricsCard.tsx                  # Comptages (classes, teachers, students)
  AcademicYearBanner.tsx              # Année courante + dates
  TodaySessionsWidget.tsx             # Sessions du jour (RSC)
  AttendanceAlerts.tsx                # Alertes absentéisme (placeholder Phase 2)
```

### Academic

```
src/components/direction/academic/
  ClassList.tsx                       # Tableau classes + filtres (yearId)
  ClassDetail.tsx                     # Tabs : étudiants / cours / groupes / termes
  DepartmentList.tsx                  # Carte par département + counts
  ProgramList.tsx                     # Filières avec classes associées
  CourseList.tsx                      # Cours avec UE + enseignant principal
```

### People

```
src/components/direction/people/
  TeacherList.tsx                     # Tableau enseignants + département + charges
  TeacherDetail.tsx                   # Fiche : cours assignés, indisponibilités
  StudentList.tsx                     # Tableau étudiants + classe actuelle
  ParentList.tsx                      # Responsables + enfants liés
```

### Attendance

```
src/components/direction/attendance/
  SessionsTable.tsx                   # Sessions filtrables (date, classe, enseignant)
  AttendanceReportView.tsx            # Stats globales par classe / période
```

### Administration

```
src/components/direction/administration/
  OrgSettingsForm.tsx                 # Paramètres (identity, details) — client
  AuditLogTable.tsx                   # Journal filtrable (resource, action, date)
```

### Hooks

```
src/hooks/data/direction/
  useDirectionMembers.ts              # useQuery getDirectionMembersAction
  useAssignFunctions.ts               # useMutation assignFunctionsToMemberAction
```

---

## Plan d'implémentation

### Phase 1 — Direction service DB layer

**Priorité** : les actions sont des stubs — aucune page ne peut afficher de vraies données.

- `direction/database/direction.queries.ts`
  - `getDirectionMembers(orgId)` → Direction[] jointure User + UserOrganization.functions
  - `getDirectionMember(userId, orgId)` → Direction + User
- `direction/database/direction.mutations.ts`
  - `assignFunctions(userId, orgId, functionIds)` — lien UserOrganization ↔ Function
  - `revokeFunctions(userId, orgId, functionIds)`
  - `deleteDirectionMember(directionId, orgId)` — soft delete (`deletedAt`)
- `direction/cache.ts` — `DIRECTION_GRAPH` (events ASSIGNED / REVOKED / REMOVED)
- `direction/validation.ts` — `assignFunctionsSchema` (Valibot)
- `direction/types.ts` — `DirectionMemberDto`, `DirectionMemberListDto`
- Remplacer les 5 stubs dans `actions/` par les vraies implémentations
- `direction/CLAUDE.md` — à écrire avant commit

**Checkers post-phase :**
```bash
npx tsx scripts/generate/naming/check.ts direction
npx tsx scripts/generate/types/check.ts direction
npx tsx scripts/generate/api/api.ts direction
```

---

### Phase 2 — Layout Direction + navigation

- `[slug]/direction/layout.tsx` — layout avec sidebar (7 items)
- `DirectionNav.tsx` — client component, navigation active par pathname
- Pattern : RSC layout synchrone (pas de getUserInfo direct → pas de `connection()`)
- Breadcrumb par section

---

### Phase 3 — Dashboard

**Données RSC, fetches parallèles :**
```ts
const [metrics, year] = await Promise.all([
  getOrgResourcesCountsAction(),   // org service
  getCurrentYearAction(),           // academic-year service
])
```

- `OrgMetricsCard` — classes / enseignants / étudiants (depuis `getOrgResourcesCountsAction`)
- `AcademicYearBanner` — année courante + dates
- `TodaySessionsWidget` — RSC enfant avec Suspense (`getSchedulesAction` filtré date=today)
- Métriques org quotidiennes (`getOrgDailyMetricsAction`)

---

### Phase 4 — Academic

Ordre : **departments → programs → classes → courses**
(dependency : program dépend de department, class dépend de program)

Chaque page est un RSC qui appelle l'action correspondante :
- `getDepartmentsAction()` → `DepartmentList`
- `getProgramTracksAction()` → `ProgramList` (service program-track)
- `getClassesAction(yearId?)` → `ClassList` + sélecteur d'année
- `getClassAction(classId)` → `ClassDetail` (tabs RSC/Suspense)

**Mutations via modales côté client → hooks `useCrudEntity` pattern.**

---

### Phase 5 — People

- `getTeachersAction(deptId?)` → `TeacherList` + filtre département
- Invite enseignant → réutiliser le flux `invite` existant
- `getEnrolledStudentsAction(classId)` → `StudentList` + sélecteur classe
- Parents : `getParentsAction` (service parent — à vérifier si action existante)

---

### Phase 6 — Attendance

- `attendance/sessions/` — `getSchedulesAction` + `getSessionsAction` (service session)
  - Filtres : date, classe, enseignant, statut (PENDING / ACTIVE / COMPLETED)
- `attendance/reports/` — statistiques assiduité par classe/période
  - Consomme les actions du service `attendance`

---

### Phase 7 — Schedule

- `schedule/calendar/` — réutiliser le composant `event-calendar` existant
  - Données : `getClassSchedulesAction` ou `getSchedulesAction`
  - Sélecteur : par classe / par enseignant
- `schedule/rooms/` — CRUD salles (service `room`)
- `schedule/events/` — événements org (service `event` si disponible)

---

### Phase 8 — Administration

- `administration/settings/` — `getOrgIdentityAction` + `getOrgDetailsAction`
  → formulaires client (`OrgSettingsForm`) + mutations (`updateOrgIdentityAction`, `setOrgDetailsAction`)
- `administration/audit/` — `AuditLogTable` (RSC paginé, filtre resource/action)
  → nécessite une action `getAuditLogsAction` dans le service `audit`

---

## Validation

```bash
# Après chaque phase touchant src/services/direction/
npx tsx scripts/generate/naming/check.ts direction
npx tsx scripts/generate/types/check.ts direction
npx tsx scripts/generate/api/api.ts direction

# Run tests
npx vitest run
```

---

## Critères d'acceptation

### Phase 1 (service)
- [ ] `getDirectionMembersAction` retourne de vraies données (Direction + User)
- [ ] `assignFunctionsToMemberAction` persiste en DB
- [ ] Aucun stub `return { data: [] }` restant
- [ ] `direction/CLAUDE.md` présent

### Phase 2 (layout)
- [ ] Navigation entre les 7 sections fonctionne
- [ ] Item actif visible dans la sidebar
- [ ] Breadcrumb correct sur chaque route

### Phase 3 (dashboard)
- [ ] Métriques (classes, enseignants, étudiants) affichées
- [ ] Année académique courante visible
- [ ] Sessions du jour chargées en streaming (Suspense)

### Phase 4–8 (sections)
- [ ] Chaque liste affiche les vraies données DB
- [ ] Mutations (create/update/remove) fonctionnelles avec feedback toast
- [ ] Filtres (année, département, classe) opérationnels
- [ ] Erreurs d'action remontées correctement (`{ error: string }`)

---

## Dépendances et prérequis

| Prérequis | Statut |
|---|---|
| Schema Prisma `Direction` | ✅ en place |
| Services consommés (teacher, student, class…) | ✅ actions existantes |
| Composant `event-calendar` | ✅ existant (`src/components/event-calendar/`) |
| Service `session` — actions de lecture | ⚠️ à vérifier |
| Service `attendance` — actions stats | ⚠️ à vérifier |
| Service `audit` — `getAuditLogsAction` | ⚠️ à créer (Phase 8) |
| Service `parent` — actions lecture | ⚠️ à vérifier |
| Route `[slug]/direction/` inexistante | ❌ à créer (Phase 2) |
