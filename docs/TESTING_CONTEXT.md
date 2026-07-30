# Contexte Tests — flow et conventions

Source de vérité du **comment tester** dans Attendancy. CLAUDE.md ne garde que la
règle absolue ; le détail vit ici.

## Règle absolue (rappel)
- Tests sur **`TEST_DATABASE_URL` uniquement**. **Jamais** `migrate reset` /
  `db push --force-reset` sur `DATABASE_URL` (prod/dev).

## Projets vitest
- `unit` → `src/**/*.unit.test.ts` (logique pure, pas de DB). Rapide.
- `integration` → `src/**/*.integration.test.ts` (DB réelle = `TEST_DATABASE_URL`).
- Commandes : `pnpm test` (tout), `pnpm test:unit`, `pnpm test:integration`,
  `pnpm test:coverage`.

## Flow d'un test d'intégration (obligatoire)
1. **Préparer la DB test** : `pnpm test:db:setup` (= `node scripts/test-db-setup.js`).
   Il fait, sur `TEST_DATABASE_URL` : `prisma migrate reset --force --skip-seed
   --skip-generate` (DB **pure**) → réapplique **toutes** les migrations →
   ré-exécute les **index post-migrate** (`prisma/post-migrate/indexes/spatial_indexes.sql` :
   GIST/PostGIS, B-tree custom, index unique partiel `parent_relation_active_unique_idx`).
   → Objectif : **base propre repartant des migrations**, jamais un état accumulé.
2. **Lancer les tests** : `pnpm test:integration` (ou un fichier ciblé via `vitest run
   --project integration <path>`).
3. Ne **jamais** lancer l'intégration sur une DB test non préparée.

> `test:db:setup` lance `migrate reset` (destructif sur la DB **test**) → le harness
> demande un consentement explicite. C'est **attendu** (cf. OPERATOR_ACTIONS OP-02),
> pas une erreur.

## Pattern des seeds de test
- Un helper `seedX(prisma)` crée une **org isolée** par appel (pas de collision entre
  tests) + les entités nécessaires ; retourne les ids.
- `cleanupX(ids, prisma)` supprime dans l'**ordre FK strict**.
- Attention aux **profils scopés org** (A-07) : `Teacher`/`Student`/`Parent`/`Direction`
  créés avec `orgId`. `Parent.user` n'a **pas** `onDelete: Cascade` → supprimer les
  `Parent` avant les `User`.
- Effets de bord (triggers à l'enrôlement : `ChannelMember`/`Message`/`Notification`)
  à nettoyer si l'org en génère.

## Quand écrire un test
- **Mutations sensibles / scope org / atomicité** → test d'intégration obligatoire
  (ex. `setMemberStatusWithAudit`, relations parent, présence).
- **Logique pure** (policy, mappers, calculs de taux) → test unitaire.
- **Lecture seule / UI** → non bloquant au MVP, mais le **noter** (cf. TECH_DEBT D-04)
  pour ne pas créer un faux sentiment de couverture.

## Situations DB hors scope
DB injoignable, advisory lock, migration `failed` → voir
[OPERATOR_ACTIONS.md](OPERATOR_ACTIONS.md). L'agent signale, ne boucle pas.
