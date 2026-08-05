# src/utils/server — utilitaires serveur

Utilitaires server-only partagés entre tous les services.
Importés via `@/utils/server` (barrel `index.ts`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `prisma.ts` | Traduction erreurs Prisma → messages métier (`tryConstraint`, `uniqueError`) |
| `debug.ts` | Debugger dev-only des erreurs Prisma + bus d'événements (`prismaErrorBus`) |
| `audit.ts` | Journal d'audit (`logAudit`, `logAuditAsync`) |

---

## prisma.ts

### `tryConstraint<T>(promise)`
Wrapper principal autour d'un appel Prisma. Intercepte P2002/P2003/P2025 et
les convertit en `Error` à message utilisateur via `CONSTRAINT_ERROR` /
`TRIGGER_ERROR` / `ERRORS` (src/config/constants.ts).

```ts
// Usage dans database/ uniquement — jamais dans actions/ ou composants
return tryConstraint(prisma.academicYear.create({ data }))
```

**Forme réelle des erreurs Prisma 7 + `@prisma/adapter-pg` (capturée sur DB)**

```
P2002 — UniqueConstraintViolation
  error.code : 'P2002'
  error.meta : {
    modelName          : 'AcademicYear',
    target             : undefined,               // Prisma 6 : string[]
    driverAdapterError : {
      cause: {
        originalCode   : '23505',
        originalMessage: 'duplicate key value violates unique constraint "AcademicYear_name_orgId_key"',
        kind           : 'UniqueConstraintViolation',
        constraint     : { fields: ['name', '"orgId"'] }  // champs, PAS le nom de contrainte
      }
    }
  }
  → nom de contrainte extrait par regex sur originalMessage

P2003 — ForeignKeyConstraintViolation
  error.code : 'P2003'
  error.meta : {
    modelName          : 'AcademicYear',
    constraint         : undefined,               // Prisma 6 : string
    driverAdapterError : {
      cause: {
        originalCode   : '23503',
        originalMessage: 'insert or update on table "AcademicYear" violates foreign key constraint "AcademicYear_orgId_fkey"',
        kind           : 'ForeignKeyConstraintViolation',
        constraint     : { index: 'AcademicYear_orgId_fkey' }
      }
    }
  }
  → clé FK extraite via driverAdapterError.cause.constraint.index

P2025 — RecordNotFound
  error.code : 'P2025'
  error.meta : { modelName: 'Organization', operation: 'a delete' }
```

### `uniqueError(error)`
Sous-cas P2002 seul. Utilisé quand seule la contrainte unique est possible
(pas de FK, pas de P2025).

### `normalizeConstraintTarget(target?)`
Tri + join des champs → clé stable pour `CONSTRAINT_ERROR`.
Compatible Prisma 6 (où `meta.target` était un tableau) et Prisma 7 (fallback
vers `extractUniqueConstraintName`).

---

## debug.ts

### `debugPrismaError(error)` — dev uniquement
Log détaillé de l'erreur Prisma dans la console + émission sur `prismaErrorBus`.
No-op si `NODE_ENV !== 'development'`.

### `prismaErrorBus`
Event bus léger (Set de listeners) pour brancher un overlay debug UI.

```ts
const unsub = prismaErrorBus.subscribe((e) => console.log(e))
```

---

## audit.ts

### `logAudit(params)` / `logAuditAsync(params)`
Écrit dans `AuditLog` (Prisma). `logAuditAsync` utilise `setImmediate` pour
ne pas bloquer la Server Action.

**Invariant** : appeler uniquement APRÈS une mutation réussie.

### `getRequestMeta(headers)`
Extrait `ip` + `userAgent` depuis les headers HTTP pour enrichir le log.

```ts
const { ip, userAgent } = getRequestMeta(headers())
await logAuditAsync({ userId, orgId, action: 'CREATE', resource: 'Student', resourceId: id, ip, userAgent })
```
