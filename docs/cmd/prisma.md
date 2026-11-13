
# Prisma avec Bun

## Installation

### Dépendances

```bash
bun add @prisma/client
```

### Dépendance de développement

```bash
bun add -d prisma
```

---

# Initialisation

Créer Prisma dans le projet :

```bash
bunx prisma init
```

Créer Prisma avec SQLite :

```bash
bunx prisma init --datasource-provider sqlite
```

Créer Prisma avec PostgreSQL :

```bash
bunx prisma init --datasource-provider postgresql
```

---

# Génération du client

Après chaque modification du `schema.prisma` :

```bash
bunx prisma generate
```

---

# Migrations

Créer une migration et l'appliquer :

```bash
bunx prisma migrate dev --name init
```

Créer une nouvelle migration :

```bash
bunx prisma migrate dev --create-only --name update-teacher-unavailabilities-fields-types
```
bunx prisma migrate dev --create-only --name add_notifications_resources 

Créer une nouvelle migration :

```bash
bunx prisma migrate dev --name add_users
```

Appliquer les migrations existantes (production) :

```bash
bunx prisma migrate deploy
```

Réinitialiser complètement la base :

```bash
bunx prisma migrate reset
```

---

# Post-Migrations (SQL hors Prisma)

Exécuter tous les scripts SQL personnalisés situés dans `apps/web/prisma/post-migrate/` (extensions, triggers, contraintes d'exclusion, index avancés...) :

```bash
# Depuis apps/web :
bun run db:post-migrate

# Depuis la racine du monorepo :
bun --filter @attendancy/web run db:post-migrate

# Exécuter un fichier SQL manuellement :
bunx prisma db execute --file prisma/post-migrate/<fichier>.sql
```

---

# Diagnostic & Vérification (`db-verify.ts`)

Vérifier la bonne conformité de la base de données après migration (extensions, triggers, fonctions, index manuels, contraintes CHECK/EXCLUDE, vues, doublons, buckets & policies Supabase) via `scripts/database/db-verify.ts` :

```bash
# Depuis apps/web :
bun run db:verify

# Depuis la racine du monorepo :
bun --filter @attendancy/web run db:verify

# Directement avec tsx :
npx tsx --env-file=.env scripts/database/db-verify.ts
```

---

# Push du schéma (sans migration)

Synchroniser le schéma avec la base :

```bash
bunx prisma db push
```

---

# Pull du schéma

Générer le schéma Prisma depuis une base existante :

```bash
bunx prisma db pull
```

---

# Seed

Exécuter le script de seed :

```bash
bunx prisma db seed
```

---

# Prisma Studio

Ouvrir l'interface graphique :

```bash
bunx prisma studio
bun --cwd apps/web prisma studio // depuis workspace
```

---

# Validation

Vérifier la validité du schéma :

```bash
bunx prisma validate
```

Formater le schéma :

```bash
bunx prisma format
```

---

# Introspection

Afficher les informations de la base :

```bash
bunx prisma db pull
```

---

# Bonnes pratiques

Après chaque modification du schéma :

```bash
bunx prisma format
bunx prisma validate
bunx prisma generate
```

Après une évolution du modèle de données :

```bash
bunx prisma migrate dev --name description_de_la_modification
```

Après avoir appliqué ou mis à jour du SQL hors Prisma (`post-migrate`) :

```bash
# Appliquer les scripts SQL et vérifier la conformité
bun run db:post-migrate
bun run db:verify
```
