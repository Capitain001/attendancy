# Agent d'audit de service

Agent autonome pour analyser et corriger les violations de convention dans `src/services/**`.

## Outils disponibles

| Outil | Commande |
|-------|----------|
| Vérification naming | `npx tsx scripts/generate/naming/check.ts <service>` |
| Mise à jour index API | `npx tsx scripts/generate/api/api.ts <service>` |
| Vérification TS | `npx tsc --noEmit 2>&1 \| grep "src/services/<service>"` |

## Workflow d'audit (par service)

```
1. Lire src/services/<service>/CLAUDE.md
2. Lancer check.ts → noter tous les ⚠
3. Lancer tsc --noEmit → noter les erreurs du service
4. Classer les bugs par lot (naming / schema Prisma / pattern safeParse / autre)
5. Fixer lot par lot — valider avec l'utilisateur entre chaque lot
6. Lancer api.ts pour mettre à jour l'index
7. Relancer check.ts + tsc pour confirmer 0 erreur
```

## Règles de naming à enforcer

### Suppressions
- Soft delete (`deletedAt`) → `remove*` / `*_REMOVED`
- Hard delete (row physique) → `delete*` / `*_DELETED`

### Lecture
- Toujours `get*` — jamais `list*`

### ActionResponse
- `{ data: T } | { error: string }` discriminé
- Narrowing via `if ('error' in result)` — jamais `if (result.error)`

## Patterns Prisma courants à corriger

| Modèle | Champ soft-delete |
|--------|-------------------|
| `StudentEnrollment` | `endedAt: null` (pas `deletedAt`) |
| `Attendance` | immutable — pas de soft delete |
| `Session` | immutable — pas de soft delete |
| `Student` | `deletedAt: null` ✅ |
| `Group`, `Class`, `Course`, `Room`… | `deletedAt: null` ✅ |

## Pattern safeParse (remplace let + v.parse + try/catch)

```ts
// ❌ Ancien
let parsed: v.InferOutput<typeof schema>
try { parsed = v.parse(schema, input) } catch { return { error: 'Données invalides' } }

// ✅ Nouveau
const result = v.safeParse(schema, input)
if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }
// Utiliser result.output.xxx
```

## Pattern auth-guard-first

Auth + validation hors du bloc try — seules les opérations DB sont dans try.

```ts
export async function myAction(input: unknown) {
  const user = await getUserInfo()
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  const orgId = user.organization?.id
  if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
  const auth = getAuthorization(user, 'DIRECTION')
  if (!auth.success) return { error: auth.error }

  const result = v.safeParse(schema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Données invalides' }

  try {
    const data = await dbFn(result.output)
    return { data }
  } catch {
    return { error: ERRORS.SERVER }
  }
}
```
