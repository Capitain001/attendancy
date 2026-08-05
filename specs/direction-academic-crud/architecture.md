# Architecture : Direction — CRUD Ressources Académiques

## Stack

Next.js 16 (PPR, cacheComponents: true) · React 19 · Prisma v7 · Valibot · Tailwind v4 + shadcn/ui

## État actuel

### Ce qui existe déjà (ne pas recréer)

**Pages RSC (liste, lecture seule) :**
- `src/app/(app)/[slug]/direction/academic/departments/page.tsx`
- `src/app/(app)/[slug]/direction/academic/classes/page.tsx`
- `src/app/(app)/[slug]/direction/academic/programs/page.tsx`
- `src/app/(app)/[slug]/direction/academic/courses/page.tsx`
- `src/app/(app)/[slug]/direction/schedule/rooms/page.tsx`

**Composants liste (lecture seule) :**
- `src/components/direction/academic/DepartmentList.tsx`
- `src/components/direction/academic/ClassList.tsx`
- `src/components/direction/academic/ProgramList.tsx`

**Services (actions déjà disponibles) :**
- `@/services/academic-year` → `createAcademicYearAction`, `setCurrentYearAction`, `removeAcademicYearAction`, `getAcademicYearsAction`, `getCurrentYearAction`
- `@/services/department` → `createDepartmentAction`, `updateDepartmentAction`, `deleteDepartmentAction`, `getDepartmentsAction`
- `@/services/room` → `createRoomAction`, `removeRoomAction`, `updateRoomAction`, `getRoomsAction`
- `@/services/program-track` → actions CRUD à vérifier
- `@/services/class` → `createClassAction`, `removeClassAction`, `getClassesAction`
- `@/services/ue` → `createUEAction`, `archiveUEAction`, `getUEsAction`

---

## Ce qui est à créer

### Pattern par ressource

Chaque ressource suit exactement ce pattern :

```
src/hooks/data/<domain>/useManage<Resource>.ts   ← React Query mutations hook
src/components/direction/academic/<Resource>Form.tsx  ← Formulaire (client)
src/components/direction/academic/<Resource>Actions.tsx ← Boutons edit/delete (client)
```

Les pages RSC existantes sont modifiées pour ajouter le bouton "+ <Resource>" et passer les données aux nouveaux composants clients.

### Composant modal partagé

Un seul modal de confirmation/formulaire réutilisable pour éviter la duplication :

```
src/components/ui/ConfirmDialog.tsx   ← Dialog de confirmation destructive
```

(Si un composant Dialog shadcn/ui existe déjà dans le projet, l'utiliser directement.)

---

## Fichiers à créer par User Story

### US1 — AcademicYear

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/academic-year/useManageAcademicYears.ts` | Hook client | create, setCurrent, remove |
| `src/components/direction/academic/AcademicYearList.tsx` | Composant | Liste avec actions |
| `src/components/direction/academic/AcademicYearForm.tsx` | Composant | Formulaire création |
| `src/app/(app)/[slug]/direction/academic/years/page.tsx` | Page RSC | Nouvelle page /years |

### US2 — Department

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/department/useManageDepartments.ts` | Hook client | create, update, delete |
| `src/components/direction/academic/DepartmentForm.tsx` | Composant | Formulaire création/édition |
| `src/components/direction/academic/DepartmentActions.tsx` | Composant | Boutons edit/delete par item |
| `src/app/(app)/[slug]/direction/academic/departments/page.tsx` | Modifier | Ajouter bouton "+" + composants action |

### US3 — Room

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/room/useManageRooms.ts` | Hook client | create, remove, update |
| `src/components/direction/rooms/RoomForm.tsx` | Composant | Formulaire création |
| `src/components/direction/rooms/RoomActions.tsx` | Composant | Bouton retirer par salle |
| `src/app/(app)/[slug]/direction/schedule/rooms/page.tsx` | Modifier | Ajouter bouton "+" + actions |

### US4 — ProgramTrack (Filière)

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/program-track/useManageProgramTracks.ts` | Hook client | create, update, archive |
| `src/components/direction/academic/ProgramTrackForm.tsx` | Composant | Formulaire (select département) |
| `src/components/direction/academic/ProgramTrackActions.tsx` | Composant | Boutons edit/archive |
| `src/app/(app)/[slug]/direction/academic/programs/page.tsx` | Modifier | Ajouter bouton "+" + actions |

### US5 — Class

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/class/useManageClasses.ts` | Hook client | create, remove |
| `src/components/direction/academic/ClassForm.tsx` | Composant | Formulaire (select filière, niveau) |
| `src/components/direction/academic/ClassActions.tsx` | Composant | Bouton archiver |
| `src/app/(app)/[slug]/direction/academic/classes/page.tsx` | Modifier | Ajouter bouton "+" + actions |

### US6 — UE

| Fichier | Type | Rôle |
|---------|------|------|
| `src/hooks/data/ue/useManageUEs.ts` | Hook client | create, archive |
| `src/components/direction/academic/UEForm.tsx` | Composant | Formulaire (code, name, credits, département) |
| `src/components/direction/academic/UEList.tsx` | Composant | Liste UEs avec actions |
| `src/app/(app)/[slug]/direction/academic/courses/page.tsx` | Modifier | Ajouter section UEs + bouton "+" |

---

## Pattern hook mutations (référence)

```ts
// src/hooks/data/department/useManageDepartments.ts
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDepartmentAction, updateDepartmentAction, deleteDepartmentAction } from '@/services/department'
import { toast } from '@/lib/toast/custom-toast'

export function useManageDepartments() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: createDepartmentAction,
    onSuccess: (result) => {
      if ('error' in result) { toast.error(result.error); return }
      qc.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Département créé')
    },
  })

  const update = useMutation({ /* ... */ })
  const remove = useMutation({ /* ... */ })

  return { create, update, remove }
}
```

## Pattern formulaire (référence)

```tsx
// Client component, appelle le hook — jamais l'action directement
'use client'
import { useManageDepartments } from '@/hooks/data/department/useManageDepartments'

export function DepartmentForm({ onSuccess }: { onSuccess: () => void }) {
  const { create } = useManageDepartments()
  // submit → create.mutate({ name }) → toast → onSuccess()
}
```

## Pattern page RSC modifiée

```tsx
// Page RSC = fetch données + passe en props aux composants clients
export default async function DepartmentsPage() {
  await connection()
  const result = await getDepartmentsAction()
  if ('error' in result) return <ErrorMessage />

  return (
    <div>
      <header>
        <h1>Départements</h1>
        <CreateDepartmentButton /> {/* client component */}
      </header>
      <DepartmentList departments={result.data} /> {/* composant enrichi avec actions */}
    </div>
  )
}
```

---

## Règles d'implémentation

1. Jamais d'appel direct à une server action depuis un composant client — passer par le hook
2. Toast = `@/lib/toast/custom-toast` uniquement
3. Validation Valibot côté client (même schéma que le service) avant l'envoi
4. Narrowing ActionResponse : `'error' in result` — jamais `result.error`
5. Confirmation avant toute suppression (ConfirmDialog ou window.confirm en V1)
6. Pages RSC : `await connection()` en tête si pas de `getUserInfo()` direct
7. Composants liste enrichis : garder le composant de liste pur (données), wrapper client pour les actions
