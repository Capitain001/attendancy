# Service `org`

## Rôle

Cycle de vie de l'organisation (tenant racine du multi-tenant). Possède le
modèle Prisma `Organization` et tous les enregistrements satellites créés lors
du setup initial (Settings, Usage, UserOrganization, Direction, Subscription).

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/org.mutations.ts` | `createOrgAction`, `updateOrgIdentityAction`, `setOrgDetailsAction`, `setMemberStatusAction` — mutations |
| `actions/org.mutations.ts` | `getOrgIdentityAction`, `getOrgUsageAction`, `getOrgDetailsAction`, `getOrgDailyMetricsAction`, `getOrgResourcesCountsAction` — queries |
| `database/org.mutations.ts` | Prisma pur — `createOrgWithDefaults` (transaction), `updateOrganization`, `setOrgDetails`, `setMemberStatusWithAudit` |
| `database/org.queries.ts` | Prisma pur — `getOrganizationById`, `getOrgIdentity`, `getOrgUsage`, `getOrgDetails`, `getOrgDailyMetrics`, `getOrgResourcesCounts` |
| `cache.ts` | `ORG_GRAPH` — enregistré dans `src/cache/server/key.ts` (spread dans CACHE_GRAPH) |
| `validation.ts` | Schémas Valibot — `orgSetupSchema`, `updateOrgIdentitySchema` + types InferInput/Output |
| `types.ts` | `OrgDetails`, `OrgContactSite`, DTOs `Awaited<ReturnType<…>>` |

## Flow création d'org (`createOrgAction`)

1. Auth (`getUserInfo`) + garde « déjà une org »
2. Parse `orgSetupSchema` (Valibot — slug en minuscules via `toLowerCase()`)
3. `createOrgWithDefaults` : transaction atomique créant Organization + Settings + Usage
   + UserOrganization(DIRECTION, isMainOrg, isResponsable) + Direction + User.status ACTIVE
   + Subscription TRIALING sur plan STARTER (si présent)
4. `setUserInfo` — snapshot org dans les métadonnées Supabase (LRU + Supabase)
5. `logAuditAsync` fire-and-forget

## Points d'extension (⚠ par projet)

- `validation.ts` → champs métier supplémentaires (ex : `domain`, `maxStudents`)
- `database/org.mutations.ts` → `createOrgWithDefaults` : entités supplémentaires à créer
- `database/org.queries.ts` → queries selon les besoins (ex : `getOrgBySlug`)
- `cache.ts` → événements supplémentaires à invalider

## Invariants

- `orgId` d'une mutation vient du token (`user.organization.id`) — l'input
  client ne porte JAMAIS d'orgId.
- Après toute mutation org : `removeUsersByOrg(orgSlug)` — les métadonnées
  Supabase des membres contiennent un snapshot org qui doit se resynchroniser.
- Le `slug` est immuable après création (il structure les URLs) — pas de
  champ slug dans `updateOrgIdentitySchema`.
- `setMemberStatusWithAudit` touche UNIQUEMENT `UserOrganization.status` —
  jamais `User.deletedAt` ni `Attendance`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/organization.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/organization.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/organization.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/organization.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `logo_url.ts` | Fichier interne |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | Schémas Valibot |
