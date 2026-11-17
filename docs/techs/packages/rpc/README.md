# `@attendancy/rpc`

## Role

Adaptateur client genere pour appeler les Server Actions web exposees par le
RPC. Il ne contient pas les implementations des actions, ne fait pas lui-meme
de requete HTTP et ne remplace pas le client `api`.

## Generation et exports

- `scripts/gen.mjs` lit les imports et le registre `ACTIONS` de
  `apps/web/src/lib/rpc/actions.ts`, puis ecrit un stub `src/generated/<service>.ts`
  par service.
- Chaque stub mappe le nom d'action vers `api.<action>` importe depuis
  `@rpc-api`. L'alias est fourni par la configuration de l'application cliente.
- L'export `@attendancy/rpc/*` pointe vers les stubs generes.
- `@attendancy/rpc/error` expose `NetworkError`, utilise par les transports et
  le cache pour distinguer une panne reseau d'un resultat applicatif.

Les fichiers `src/generated/*.ts` sont des artefacts: les modifier a la main
sera annule par la prochaine generation. Pour exposer une action, l'inscrire
dans `apps/web/src/lib/rpc/actions.ts`, puis regenerer les wrappers.

## Commandes

```powershell
bun --filter @attendancy/rpc gen
```

Les commandes `dev` et `build` de `apps/web` executent deja ce generateur.
Le protocole HTTP, l'allowlist et les regles d'authentification sont decrits
dans [`rpc-systeme.md`](../../rpc-systeme.md).
