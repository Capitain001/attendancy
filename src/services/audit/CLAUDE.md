# Service `audit`

## Rôle

Journal immuable de traçabilité des actions métier critiques. Écrit dans
`AuditLog` (Prisma) — jamais lu depuis les actions métier, seulement depuis
des queries admin dédiées.

## Fichiers

| Fichier | Rôle |
|---|---|
| `logger.ts` | `logAudit` (async) + `logAuditAsync` (fire-and-forget) |

## Usage

Toujours `logAuditAsync` dans les server actions — ne bloque pas la réponse :

```ts
import { logAuditAsync } from '@/services/audit'

logAuditAsync({
  userId,
  action: 'CREATE',
  resource: 'USER',
  resourceId: createdId,
  orgId,
  details: { role, invitationId },
})
```

## Invariants

- `logAudit` ne throw jamais — échec loggé en console, jamais propagé.
- `resource` est un `string` en DB (pas l'enum) : l'historique reste lisible
  même si l'enum évolue. `AuditResource` offre l'autocomplete sans contraindre.
- Les queries de lecture (par étudiant, planning, enseignant…) sont
  **à créer dans ce service** — jamais dans les services métier.
  ⚠ À ÉTENDRE PAR PROJET — ajouter `queries.ts` selon les besoins de reporting.
