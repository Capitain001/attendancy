# Hooks — Conventions

## Règle fondamentale

Tout hook **lié à un modèle Prisma** (lecture, mutation, invalidation) → obligatoirement dans :

```
hooks/data/<entity-name>/
```

`<entity-name>` = nom de l'entité Prisma en **kebab-case**, au singulier (ex. `program-track`, `academic-year`, `schedule`).

Les hooks hors `hooks/data/` ne doivent **jamais** importer depuis `@/services/*/actions/` ni `@/services/*/database/`.

---

## Structure des dossiers

```
hooks/
├── data/                  ← hooks liés au schéma Prisma (non réutilisables cross-projet)
│   ├── academic-year/     ← useManageAcademicYears.ts
│   ├── attendances/
│   ├── chat/
│   ├── classes/
│   ├── courses/
│   ├── departments/       ← useDepartments.ts
│   ├── groups/
│   ├── planning/          ← useAvailability, useCalendarView, useScheduleDays, ...
│   ├── program/           ← useManagePrograms.ts
│   ├── program-track/     ← useManageProgramTracks.ts
│   ├── rooms/
│   ├── schedule/
│   ├── sessions/
│   ├── teachers/
│   ├── userFunctions/
│   └── years/
├── utils/                 ← hooks utilitaires génériques (non liés au schéma)
│   ├── use-debounce.ts
│   ├── use-mobile.ts
│   ├── use-local-storage.ts
│   └── ...
├── auth/                  ← hooks d'authentification et profil
├── forms/                 ← hooks de formulaire génériques
├── entity/                ← infrastructure useCrudEntity / useEntity (framework interne)
├── chat/                  ← hooks temps réel spécifiques au chat (scroll, realtime)
├── realtime/              ← abonnements Supabase temps réel
└── webhook/               ← listeners webhook
```

---

## Pattern de référence : hook data

Calquer sur `useManageProgramTracks` :

```typescript
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get<Entity>sAction, create<Entity>Action, ... } from '@/services/<entity>'
import { customToast } from '@/lib/toast/custom-toast'

const QK = ['<entity>s'] as const

export function useManage<Entity>s(params: { ... } = {}) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: items = [], isLoading } = useQuery({
    queryKey: [...QK, params],
    queryFn: async () => {
      const r = await get<Entity>sAction(params)
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({ mutationFn: create<Entity>Action, onSuccess: (r) => { ... } })
  const update = useMutation({ ... })
  const remove = useMutation({ ... })

  return { items, isLoading, create, update, remove }
}
```

---

## Invariants (toujours enforced)

- `'use client'` sur tous les hooks (React Query est client-side).
- Toast : `customToast` depuis `@/lib/toast/custom-toast` — jamais `sonner` directement.
- Narrowing ActionResponse : `if ('error' in r)` — jamais `if (r.error)`.
- Nommage : `useManage<Entity>s` pour les hooks CRUD, `use<Entity>` pour les hooks lecture seule.
- Un hook ne duplique pas de données gérées par React Query dans un store Zustand.
- Un composant client n'appelle jamais une server action directement — toujours via un hook `hooks/data/<entity>/`.

---

## Nommage des dossiers `hooks/data/`

| Modèle Prisma   | Dossier                      |
|-----------------|------------------------------|
| `ProgramTrack`  | `hooks/data/program-track/`  |
| `AcademicYear`  | `hooks/data/academic-year/`  |
| `Schedule`      | `hooks/data/schedule/`       |
| `UECourse`      | `hooks/data/courses/`        |
| `Department`    | `hooks/data/departments/`    |

Règle : toujours kebab-case, jamais camelCase comme dossier.
