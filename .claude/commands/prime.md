# Prime — attendancy

> Override du /prime por-dev adapté aux conventions du projet.

## Run
git ls-files

## Read (obligatoire)
CLAUDE.md

## Read (si existant)
README.md

## Explore docs/
Run `tree docs` pour connaître les docs disponibles. Lire selon besoin.

## Conventions critiques à retenir
- `orgId` : extrait du token auth serveur UNIQUEMENT — jamais du body/query
- Prisma uniquement dans `services/*/database/` — jamais dans actions ou composants
- `"use server"` uniquement dans `actions/` — jamais sur les utilitaires
- Actions : préfixe `get*` (jamais `list*`), retour `{ data }` / `{ error: string }`
- Valibot pour toute validation — jamais Zod


## Post-session checklist (services/*)
```
npx tsx scripts/generate/naming/check.ts <service>
npx tsx scripts/generate/types/check.ts <service>
npx tsx scripts/generate/api/api.ts <service>
```
