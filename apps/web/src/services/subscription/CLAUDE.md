# Service : subscription

Gère l'abonnement SaaS d'une organisation (`Subscription`) et les plans disponibles (`Plan`).
Modèle : 1-1 avec `Organization` (contrainte `@unique` sur `orgId`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/subscription.queries.ts` | `getSubscription(orgId)` — détail avec plan inclus |
| `database/subscription.mutations.ts` | `createSubscription`, `updateSubscriptionStatus` |
| `cache.ts` | `SUBSCRIPTION_GRAPH` — événements `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED` |
| `validation.ts` | `createSubscriptionSchema` (planId UUID requis) |
| `actions/subscription.queries.ts` | `getSubscriptionAction()` — orgId extrait du token |
| `actions/subscription.mutations.ts` | `createSubscriptionAction`, `updateSubscriptionStatusAction` |
| `types.ts` | `GetSubscriptionDto` |

## Notes

- `getPlans()` n'a pas d'`orgId` : `Plan` est un catalogue global SaaS, non scopé par tenant.
  Le warning `orgId` du générateur API est attendu et normal pour cette query.

## Invariants

- `orgId` TOUJOURS extrait du token via `getUserInfo()` — jamais depuis le body/query.
- `Subscription` est unique par `orgId` : créer = `prisma.subscription.create` avec `@unique orgId`.
- Prisma uniquement dans `database/` — jamais dans `actions/`.
- Le modèle `Plan` est read-only depuis ce service (pas de mutation Plan ici).
- `SUBSCRIPTION_GRAPH` enregistré dans `src/cache/server/key.ts`.

## Points d'extension (⚠)

- Intégration Stripe : les champs `stripe_customer_id` / `stripe_subscription_id` n'existent
  PAS dans le schéma actuel (`billing.prisma`). À ajouter via migration si besoin Stripe.
- `cancelSubscriptionAction` — mettre `canceledAt` + `status: CANCELED` + invalidation cache.
- Webhook Stripe (`POST /api/webhooks/stripe`) — hors du pattern service, à placer dans `app/api/`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/subscription.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/subscription.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/subscription.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/subscription.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |
