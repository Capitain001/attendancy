# Service : function

Gère les fonctions RBAC d'une organisation (`Function`) et leur assignation aux utilisateurs (`UserFunction`).
Une fonction regroupe des permissions fines et complète le rôle grossier de `UserOrganization.role`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `database/function.queries.ts` | `getFunctions`, `getFunctionByName`, `getFunctionsByNames` |
| `database/function.mutations.ts` | `createFunction`, `updateFunction`, `removeFunction`, `assignFunctionToUser`, `removeFunctionFromUser` |
| `actions/function.queries.ts` | `getFunctionsAction` |
| `actions/function.mutations.ts` | `createFunctionAction`, `updateFunctionAction`, `removeFunctionAction`, `assignFunctionToUserAction`, `removeFunctionFromUserAction` |
| `cache.ts` | `FUNCTION_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `createFunctionSchema`, `updateFunctionSchema` |
| `types.ts` | `FunctionItem`, `UserFunctionItem` |

## Modèles Prisma propriétaires

- `Function` — `@@unique([name, orgId])`
- `UserFunction` — `@@unique([userId, functionId])`
- `Permission` — scopée par `orgId`, portée par `Function` ou `User`

## Invariants

- `@@unique([name, orgId])` → contrainte mappée dans `CONSTRAINT_ERROR`
- Seule la DIRECTION peut créer / modifier / supprimer des fonctions
- `assignFunctionToUser` est idempotent (upsert)
- La suppression d'une `Function` cascade sur `UserFunction` et `Permission` (Prisma onDelete: Cascade)

## Cross-service

- `invite/direction/database.ts` → `checkFunctionsExist` lit `prisma.function` — owner : ce service
- `auth/members/utils.ts` → `assignFunctionToUser` dans tx — à migrer vers ce service quand refactor auth/members

## Points d'extension (⚠)

- `getFunctionsByNames` utilisé par `invite/direction/database.ts` (cache branché Phase REG-02)
- `FUNCTION_GRAPH` → étendre si d'autres services invalident lors de mutations Function
