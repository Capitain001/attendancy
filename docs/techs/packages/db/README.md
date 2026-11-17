# `@attendancy/db`

## Role

Contient le client Prisma et les types de modele generes pour le schema de
l'application. Les sources de ces fichiers sont les schemas
`apps/web/prisma/schemas/`; le generateur Prisma ecrit dans
`packages/db/src/generated`.

## Entrees generees

- `src/generated/client.ts` est l'entree serveur: `PrismaClient`, namespace
  `Prisma`, enums et types de modeles.
- `src/generated/browser.ts` expose les types Prisma utilisables cote navigateur,
  sans classe `PrismaClient` ni utilitaires exclusivement serveur.
- `src/generated/enums.ts`, `models.ts` et `models/*` sont des modules produits
  par Prisma et ne doivent pas etre modifies manuellement.

Les services de `apps/web` sont proprietaires des acces Prisma et doivent
utiliser le client dans leur couche `database/`. Les applications clientes
n'ouvrent pas la base avec ce package; elles consomment les contrats/actions
RPC.

## Generation et maintenance

Les schemas Prisma sont la source de verite. Apres leur modification, regenerer
le client depuis le package web:

```powershell
bun --filter @attendancy/web prisma
```

La commande de build racine execute egalement `prisma generate` avant Turbo.
Ne pas editer `packages/db/src/generated` a la main: toute modification doit
venir des schemas ou de la configuration du generateur.
