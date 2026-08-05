# Feature: direction-class-detail

## Description
Port V1 → V2 de la page détail d'une classe pour la direction.  
Affiche : bannière navigation, liste des cours, liste des étudiants (avec filtres),
planning du jour, bouton feuille d'appel PDF/XLSX.

Source V1 :
- Page : `C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\direction\classes\[classId]\page.tsx`
- Composant : `C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\components\classes\direction\DirectionClassDetailPage.tsx`

## User Story
En tant que direction  
Je veux consulter la fiche détail d'une classe  
Afin de voir les cours, étudiants, planning du jour et exporter la feuille d'appel

## Services concernés

| Service | Raison |
|---------|--------|
| `student` | `getEnrolledStudentsAction` + types `ClassEnrollmentRow` manquants + champs DB incomplets |
| `course` | `getCoursesAction(classId)` — OK, mais mapping `durationDone/durationTotal` → `[done,total]` |
| `attendance` | `getClassAttendanceRatesAction` — déjà présent V2 |
| `schedule` | `getTodayClassSchedulesAction` — déjà présent V2 |
| `class` | `getClassAction` — déjà présent V2 |

---

## Fichiers à créer / modifier

### Service layer
| Fichier | Action |
|---------|--------|
| `apps/web/src/services/student/database/student.queries.ts` | **Modifier** `getEnrolledStudents` : ajouter `sex`, `phone`, `dateOfBirth`, `status`, `createdAt` |
| `apps/web/src/services/student/types.ts` | **Modifier** : ajouter `ClassEnrollmentRows`, `ClassEnrollmentRow` |

### Helpers direction
| Fichier | Action |
|---------|--------|
| `apps/web/src/components/direction/students/ui/studentDirectory.helpers.tsx` | **Modifier** : ajouter `initials()`, `sexLabel()`, `computeAge()` |

### Composants attendance
| Fichier | Action |
|---------|--------|
| `apps/web/src/components/attendance/AttendanceBar.tsx` | **Créer** : `AttendanceBar` + `AttendanceTableBar` |

### Composants student/sections
| Fichier | Action |
|---------|--------|
| `apps/web/src/components/student/sections/StudentsSection.tsx` | **Créer** : table étudiants avec filtres/tri |
| `apps/web/src/components/student/sections/StudentDetailModal.tsx` | **Créer** : modale fiche étudiant |
| `apps/web/src/components/student/sections/index.ts` | **Créer** |

### Composants classes/direction
| Fichier | Action |
|---------|--------|
| `apps/web/src/components/classes/direction/section/ui/types.ts` | **Créer** : `ClassProfileData`, `StudentData`, etc. |
| `apps/web/src/components/classes/direction/section/ui/helpers.ts` | **Créer** : `getInitials`, `formatTime`, `SCHEDULE_STATUS_CONFIG`, etc. |
| `apps/web/src/components/classes/direction/section/ui/GridDeco.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/section/ui/EmptyPlanning.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/section/ui/CollapseSection.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/section/ui/CoursesSection.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/section/ui/ScheduleSection.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/section/ui/index.ts` | **Créer** |
| `apps/web/src/components/classes/direction/mapClassProfile.ts` | **Créer** : mappers V2 (durationDone/Total) |
| `apps/web/src/components/classes/direction/AttendanceSheetButton.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/DirectionClassDetailPage.tsx` | **Créer** |
| `apps/web/src/components/classes/direction/index.ts` | **Créer** |

### Page RSC
| Fichier | Action |
|---------|--------|
| `apps/web/src/app/(attendancy)/[slug]/direction/classes/[classId]/page.tsx` | **Créer** |

---

## Plan d'implémentation

### Phase 1 — Service student : champs DB + types

**1a. Modifier `getEnrolledStudents`** — ajouter champs manquants dans le `select` :
```ts
// student.queries.ts
user: {
  select: {
    firstName: true, lastName: true, email: true, avatar_url: true,
    sex: true, phone: true, dateOfBirth: true, status: true,   // ← ajouts
  },
},
createdAt: true,  // ← ajout sur l'enrollment
```

**1b. Modifier `student/types.ts`** — ajouter alias V1 → V2 :
```ts
import type { GetEnrolledStudentsDto } from './generated.types'
export type ClassEnrollmentRows = NonNullable<GetEnrolledStudentsDto>
export type ClassEnrollmentRow  = ClassEnrollmentRows[number]
```

**1c. Post-service** :
```bash
cd apps/web
bun run generate:api:svc -- student
bun run api:check
```

### Phase 2 — Helpers manquants

**2a. `studentDirectory.helpers.tsx`** — ajouter :
```ts
export function initials(u: { firstName?: string|null; lastName?: string|null }): string
export function sexLabel(sex: 'MALE'|'FEMALE'|'OTHER'|null|undefined): string
export function computeAge(dob: Date|string|null|undefined): number|null
```

**2b. `AttendanceBar.tsx`** — copier V1 verbatim (composants purs, zéro dépendance service) :
```
AttendanceBar      : barre de progression horizontale
AttendanceTableBar : barre inline pour table (+ % centré)
```

### Phase 3 — Composants section/ui (classes/direction)

Copier V1 sans changement de logique ; seuls les imports s'adaptent :

| Composant | Adaptation V2 |
|-----------|--------------|
| `types.ts` | Aucune (types locaux, pas de Prisma) |
| `helpers.ts` | Aucune |
| `GridDeco.tsx` | Aucune |
| `EmptyPlanning.tsx` | Vérifier import `Link` next/link |
| `CollapseSection.tsx` | Aucune |
| `CoursesSection.tsx` | Importer `GridDeco` + `helpers` locaux |
| `ScheduleSection.tsx` | `UserIcon` → `@/components/users/UserIcon` |

### Phase 4 — mapClassProfile (adaptation clé V1→V2)

`mapCoursesForClassSection` : V2 retourne `durationDone` / `durationTotal` au lieu de `duration[]` :
```ts
// V1 attendait : c.duration[0], c.duration[1]
// V2 retourne  : c.durationDone, c.durationTotal
duration: [c.durationDone ?? 0, c.durationTotal ?? 0] as [number, number],
```

`mapSchedulesForClassSection` : inchangé (même shape V1/V2).

### Phase 5 — Composants student/sections

**`StudentsSection.tsx`** :
- Importe `ClassEnrollmentRows`, `ClassEnrollmentRow` depuis `@/services/student`
- Importe `AttendanceTableBar` depuis `@/components/attendance/AttendanceBar`
- Importe `fullName`, `initials`, `sexLabel` depuis `@/components/direction/students/ui/studentDirectory.helpers`
- Importe `StudentDetailModal` en local

**`StudentDetailModal.tsx`** :
- Remplacer import `classNames` tiptap → `cn` de `@/lib/utils`
- Importe `AttendanceBar`, `AttendanceTableBar` depuis `@/components/attendance/AttendanceBar`
- Importe `fullName`, `initials`, `sexLabel`, `computeAge` depuis helpers
- Importe `BackgroundPattern` depuis `@/components/design/BackgroundPattern`

### Phase 6 — AttendanceSheetButton + DirectionClassDetailPage + index

**`AttendanceSheetButton.tsx`** :
- Import `ExportColumn` depuis `@/lib/export` ✓ (V2 exporte depuis index.ts)
- Import `ExportButton` depuis `@/components/ui/ExportButton` ✓

**`DirectionClassDetailPage.tsx`** — adaptations imports :
```ts
// V1                                          → V2
getCoursesWithTeachersAction({ classId })      → getCoursesAction(classId)          // @/services/course
getClassEnrollmentRowsAction({ classId })      → getEnrolledStudentsAction(classId)  // @/services/student
getClassAttendanceRatesAction({ classId })     → inchangé                           // @/services/attendance
getTodayClassSchedulesAction(classId)          → inchangé                           // @/services/schedule
getClassAction(classId)                        → inchangé                           // @/services/class
StudentsSection                                → @/components/student/sections
```

Logique `attendanceRates` :
```ts
// V2 retourne Map<studentId, number> — Object.fromEntries() fonctionne sur Map
const attendanceRates = ratesRes.data ? Object.fromEntries(ratesRes.data) : {}
```

**`index.ts`** :
```ts
export { DirectionClassDetailPage } from './DirectionClassDetailPage'
```

### Phase 7 — Page RSC

```ts
// src/app/(attendancy)/[slug]/direction/classes/[classId]/page.tsx
import { DirectionClassDetailPage } from "@/components/classes/direction"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { classId, slug } = await params
  if (!classId) notFound()
  return <DirectionClassDetailPage classId={classId} slug={slug} />
}
```

> Pas de `getUserInfo()` direct → pas besoin de `await connection()` car
> `DirectionClassDetailPage` appelle ses propres actions (qui font `authAccess()`).

---

## Validation

```bash
cd apps/web

# Service student
bun run check:naming:svc -- student
bun run check:types:svc -- student
bun run generate:api:svc -- student
bun run api:check
```

## Critères d'acceptation

- [ ] Page `/[slug]/direction/classes/[classId]` accessible sans erreur TS
- [ ] Section Cours affiche les cours avec barre de progression (durationDone/Total)
- [ ] Section Étudiants affiche la table avec filtre groupe/genre/tri
- [ ] Section Planning du jour affiche les séances ou `EmptyPlanning`
- [ ] Bouton feuille d'appel génère un PDF/XLSX imprimable
- [ ] Modale étudiant s'ouvre au clic avec taux d'assiduité
- [ ] `bun run api:check` passe sans erreur
- [ ] `bun run check:types:svc -- student` passe sans erreur
