# prisma/post-migrate — SQL hors Prisma

Tout ce que Prisma ne sait pas exprimer dans le schéma vit ici, en `.sql`
versionnés, appliqués APRÈS les migrations :

- index avancés (GiST, GIN, partiels, spatiaux)
- contraintes d'exclusion (anti-conflit sur tstzrange…)
- triggers et fonctions Postgres
- extensions (PostGIS…)

## Structure interne des fichiers

```
post-migrate/
  indexes   *.sql — index avancés
  triggers/   *.sql — triggers et fonctions (créer au besoin)
```

## Application

- **Dev/prod** : `npx prisma db execute --file prisma/post-migrate/<fichier>.sql`
  après chaque `migrate deploy` qui l'exige.
- **Base de test** : automatique — `scripts/test-db-setup.js` applique tous les
  `.sql` du dossier (récursif, ordre alphabétique) après le reset.

## Règles

- Idempotent obligatoire : `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` —
  le script peut être rejoué.
- Un fichier par préoccupation, nommé par ce qu'il crée (`spatial_indexes.sql`).
- Toute erreur mappée côté app : enregistrer le message du trigger dans
  `TRIGGER_ERROR` (`src/config/constants.ts`).
