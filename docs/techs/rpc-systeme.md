# Système RPC Web → clients

## Objectif

Le RPC expose une sélection explicite de Server Actions du web sous forme d'API HTTP consommable par les applications clientes, notamment le desktop Tauri. Les actions continuent de s'exécuter sur le serveur Next.js : le client n'importe pas leur implémentation serveur et n'accède pas directement à Prisma.

Le web utilise habituellement les Server Actions directement. Le RPC est la couche de transport pour les clients séparés du runtime Next.js.

## Architecture

```text
Application cliente
  └─ api.<action>(input)
       └─ client RPC local (`apps/desktop/src/lib/api.ts`)
            └─ POST /api/rpc/<action> + JSON + Bearer token
                 └─ route Next.js (`apps/web/src/app/api/rpc/[action]/route.ts`)
                      └─ registre public (`apps/web/src/lib/rpc/actions.ts`)
                           └─ Server Action du service web
                                └─ auth, validation, services et Prisma côté serveur
```

Les fichiers générés de `packages/rpc` sont de petits wrappers de noms d'actions vers le client local. Ils ne contiennent ni logique métier, ni accès réseau autonome, ni copie des Server Actions.

## Rôle des fichiers

| Fichier                                      | Responsabilité                                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/rpc/actions.ts`            | Registre allowlist des Server Actions exposées. Une action n'est publiquement routable que si elle y est importée puis inscrite dans `ACTIONS`.                         |
| `apps/web/src/lib/rpc/contract.ts`           | Construit `ApiClient` à partir des signatures de `ACTIONS` et exporte les types d'entrées/sorties partagés.                                                             |
| `apps/web/src/app/api/rpc/[action]/route.ts` | Route HTTP générique `POST` et `OPTIONS`, sélection de l'action enregistrée, parsing JSON, contrôle d'authentification, CORS et conversion des erreurs en statuts HTTP. |
| `packages/rpc/scripts/gen.mjs`               | Lit les imports directs et le registre `ACTIONS`, puis génère les wrappers client par service.                                                                          |
| `packages/rpc/src/generated/*.ts`            | Wrappers générés, à ne pas éditer manuellement.                                                                                                                         |
| `apps/desktop/src/lib/api.ts`                | Proxy client typé `ApiClient`; ajoute le token Supabase, effectue le `fetch` et réessaie une fois après un `401` si le refresh de session réussit.                      |
| `packages/types`                             | Publie les types de contrat RPC réutilisables par les clients, notamment `ApiClient`, `ApiInput` et `ApiOutput`.                                                        |

`@rpc-api` est un alias de résolution, pas un endpoint ou un package réseau : le desktop le résout vers son propre client dans `apps/desktop/vite.config.ts` et `apps/desktop/tsconfig.json`.

## Ajouter ou retirer une action RPC

1. Implémenter l'action dans le service web, avec son contrôle d'accès et sa validation côté serveur.
2. L'importer et l'ajouter à `ACTIONS` dans `apps/web/src/lib/rpc/actions.ts`. Ce registre est l'allowlist serveur : une action non enregistrée retourne `404`.
3. Si le client doit référencer ses types de données directement, exporter les DTO nécessaires depuis `apps/web/src/lib/rpc/contract.ts` et reconstruire les déclarations du package `@attendancy/types` :

   ```powershell
   bun --filter @attendancy/types build:types
   ```

4. Générer les wrappers :

   ```powershell
   bun --filter @attendancy/rpc gen
   ```

5. Vérifier et committer les fichiers générés sous `packages/rpc/src/generated/`.
6. Pour autoriser l'appel sans session, ajouter explicitement le nom dans l'allowlist `PUBLIC_ACTIONS` de la route RPC web et du transport desktop. Par défaut, toute nouvelle action reste authentifiée.
7. Ajouter ou mettre à jour des tests de route et de transport client.

Les commandes `dev` et `build` de `apps/web` lancent déjà le générateur RPC avant Next.js. Relancer le générateur après toute modification du registre; ne pas éditer directement les fichiers générés.

## Protocole HTTP

- Méthode d'appel : `POST /api/rpc/<nomAction>`.
- Entrée : une valeur JSON optionnelle, transmise comme argument unique à la Server Action. Pour une action ayant plusieurs paramètres, regrouper les valeurs dans un objet d'entrée; le transport ne répartit pas un tableau d'arguments positionnels.
- Authentification : en-tête `Authorization: Bearer <access_token>` sauf action explicitement publique.
- Sortie : réponse JSON de la Server Action, conventionnellement `{ data: ... }` ou `{ error: string }`.
- Erreurs de transport : `401` sans Bearer (hors action publique), `404` pour une action inconnue, `400` pour JSON invalide ou erreur applicative, `500` pour erreur serveur inattendue.
- CORS : les origines sont explicitement configurées dans `RPC_ALLOWED_ORIGINS`, séparées par des virgules. Une origine non autorisée ne reçoit pas les en-têtes CORS.
- Dates : JSON transmet les dates sous forme de chaînes. Le client desktop convertit les chaînes ISO UTC reconnues en objets `Date`.
- Réseau : le client desktop transforme les erreurs réseau en `NetworkError`; après un seul refresh/réessai sur `401`, l'échec d'authentification est retourné sous forme `{ error }`.

La route de test correspondante est `apps/web/src/lib/rpc/route.unit.test.ts`; le transport desktop est couvert par `apps/desktop/src/lib/api.unit.test.ts`.

## Sécurité et limites

- Le registre `ACTIONS` est une allowlist, pas une preuve que les entrées sont sûres. Chaque action doit faire ses propres validations et contrôles d'accès côté serveur.
- Ne jamais faire confiance à `orgId`, au rôle ou à des permissions envoyés par le client. L'action doit déduire l'organisation et l'identité depuis le contexte authentifié et ses règles de service.
- Une action marquée publique doit être limitée aux opérations réellement anonymes; cette exception est inscrite explicitement, pas déduite du nom ou de l'absence d'argument.
- Les secrets, Prisma et les modules serveur restent dans `apps/web`; le package RPC généré est un adaptateur client uniquement.
- Les appels RPC sont des appels HTTP avec un corps JSON, pas des appels de fonction locaux. Les objets non sérialisables et types spécifiques à une plateforme ne font pas partie du contrat.
