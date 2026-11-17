# `@attendancy/types`

## Role

Publie les types du contrat RPC web pour les applications et composants
partages. Il evite de faire importer aux clients des modules runtime ou des
implementations serveur.

## Source et distribution

- `src/index.ts` re-exporte les types depuis
  `apps/web/src/lib/rpc/contract.ts`; ce fichier du web reste la source de
  verite.
- Le contrat exporte notamment `ApiClient`, `ApiAction`, `ApiInput<K>` et
  `ApiOutput<K>`, ainsi que les DTO et schemas partages explicitement exportes.
- `tsup.config.ts` construit uniquement les declarations ESM (`dts: only`) dans
  `dist/contract.d.mts`. L'export racine du package est type-only; les exports
  sous-chemin `./*` ciblent les sources TypeScript correspondantes.

Les DTO doivent rester derives des signatures/actions ou des types de service
web, plutot que recopiees dans les applications clientes. Les types ne rendent
pas une action appelable: l'action doit aussi etre inscrite au registre RPC et
avoir son stub genere.

## Generation et verification

```powershell
bun --filter @attendancy/types build:types
bun --filter @attendancy/types check-types
```

Lorsqu'un DTO doit etre publie, ajouter son export au contrat web, reconstruire
les declarations et verifier les consommateurs.
