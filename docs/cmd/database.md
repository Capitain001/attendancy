# Commandes de base de données

Ce document regroupe les commandes utiles pour interagir avec la base de données, notamment l'exécution des scripts SQL post-migration.

## Exécuter les scripts `post-migrate`

Les scripts SQL situés dans `apps/web/prisma/post-migrate` contiennent tout ce que Prisma ne sait pas exprimer de manière native dans son schéma (index avancés, triggers, politiques de sécurité (RLS) pour Supabase Storage, etc.).

Ils doivent être appliqués **après** vos migrations Prisma classiques (`prisma migrate deploy` ou `prisma migrate dev`).

### 1. En Développement et Production (fichier par fichier)

Pour appliquer ou mettre à jour un script SQL spécifique, on utilise la commande `prisma db execute` en lui passant le chemin du fichier concerné. Ces commandes doivent être lancées depuis le dossier `apps/web`.

**Exemple 1 : Appliquer les règles de stockage Supabase (bucket, RLS) pour les avatars**
```bash
npx prisma db execute --file prisma/post-migrate/storage/avatar.sql
```

**Exemple 2 : Appliquer d'autres règles ou triggers (ex: communications)**
```bash
npx prisma db execute --file prisma/post-migrate/70_communication.sql
```

> **Note :** Tous les scripts présents dans `post-migrate` sont conçus pour être **idempotents**. Vous pouvez donc lancer ces commandes plusieurs fois de suite en toute sécurité sans provoquer d'erreurs (ils utilisent des clauses comme `CREATE OR REPLACE`, `CREATE INDEX IF NOT EXISTS`, ou `ON CONFLICT DO NOTHING`).

### 2. Vérification des objets Post-Migrate (`verify.sql`)

Le fichier `verify.sql` est un script en **lecture seule** utilisé comme diagnostic pour vérifier qu'aucun objet créé manuellement n'a été détruit par inadvertance par une migration Prisma générée automatiquement. 

Il est recommandé de l'exécuter après avoir passé toute la chaîne des `post-migrate` ou à la suite d'un `prisma migrate` pour valider l'intégrité (ex: extensions, triggers, etc.).

**Exemple : Lancer le diagnostic de vérification**
```bash
npx prisma db execute --file prisma/verify/verify.sql
```

### 3. Base de tests (Automatisé)

Dans l'environnement de test, vous n'avez pas besoin d'appliquer chaque script manuellement. Le script de préparation de la base de données s'occupe d'exécuter l'intégralité des fichiers du dossier de manière automatique (par ordre alphabétique).

Pour tout initialiser :

```bash
npm run test:db:setup
```

*(En interne, ce script fait appel à `scripts/test/apply-post-migrate.js` qui va chercher récursivement tous les fichiers `.sql` dans `post-migrate` et exécuter un `db execute` sur chacun d'eux).*
