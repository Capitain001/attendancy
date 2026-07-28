# prisma/schemas/ — découpage multi-schema

Un fichier `.prisma` par domaine métier. Prisma v7 fusionne tous les fichiers
de ce dossier au moment de `generate` / `migrate` (voir `prisma.config.ts`).

## Modèles minimum requis par le socle

Le code du template référence trois modèles — les définir avant le premier
`prisma generate`, sinon `lib/db.ts`, `utils/server/audit.ts`, `services/auth`
et `services/org` ne compilent pas :

| Modèle | Consommé par | Champs attendus (minimum) |
|---|---|---|
| `User` | `services/auth` | `id` (= id Supabase Auth), `email`, `status` |
| `Organization` | `services/org` | `id`, `name`, `slug` (unique), `logo?` |
| `AuditLog` | `utils/server/audit` | `userId`, `orgId?`, `action`, `resource?`, `resourceId?`, `details Json?`, `ipAddress?`, `userAgent?`, `createdAt` |

## Conventions de découpage

- `base.prisma` — datasource, generator, enums transverses
- `<domaine>.prisma` — un fichier par domaine (ex : `tenant.prisma`, `billing.prisma`)
- Chaque modèle vit dans le fichier de son domaine propriétaire — même règle
  d'ownership que `src/services/` (1 modèle = 1 domaine = 1 service).

## Conventions de modèle

- IDs : `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`
- Multi-tenant : le scope (`orgId` ou équivalent) est **dénormalisé** sur les
  tables chaudes — évite les jointures pour le filtrage tenant.
- Soft delete : `deletedAt DateTime?` — les queries filtrent `deletedAt: null`.
- Timestamps : `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`.

## Exemple minimaliste (référence — à adapter, pas à copier)

```prisma
// base.prisma
// generator client {
//   provider = "prisma-client"
//   output   = "../../src/generated/prisma"
// }
//
// datasource db {
//   provider  = "postgresql"
//   url       = env("DATABASE_URL")
//   directUrl = env("DIRECT_URL")
// }

// <domaine>.prisma — exemple d'un modèle scopé multi-tenant
// model Entity {
//   id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
//   orgId     String    @db.Uuid          // scope tenant dénormalisé
//   name      String
//   deletedAt DateTime?                    // soft delete
//   createdAt DateTime  @default(now())
//   updatedAt DateTime  @updatedAt
//
//   @@index([orgId])
// }
```

## Setup projet

1. Écrire les schémas du projet dans ce dossier
2. `npx prisma generate` → produit `src/generated/prisma/` (gitignored)
3. `npx prisma migrate dev` → migrations dans `prisma/migrations/`
4. Features SQL hors Prisma (index GiST, triggers, extensions) →
   `prisma/post-migrate/` (voir son README)
