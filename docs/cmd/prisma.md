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