# Audit des métadonnées utilisateur

**Date :** 20 octobre 2026  
**Périmètre :** lectures et écritures Supabase Auth de `user_metadata` et `app_metadata` dans `apps/web/src`, `apps/desktop/src` et `packages/ui/src`.

## Résumé

Les clés de profil sont `name`, `avatar_url`, `phone`, `isConnected`, `invited_by`, `invitationToken` et `invitationType`. Les clés d'accès sont `role`, `function`, `status`, `organization` et `organizations`.

L'audit a trouvé six lectures de clés d'accès dans `user_metadata`, dont `role` et `organization` dans le contrôle d'accès de la route `schedule-days`. Il a aussi recensé 13 appels d'écriture Supabase Auth. La revue des payloads directs et indirects listés ci-dessous n'a pas identifié d'écriture de clé d'accès dans `user_metadata` ni de clé de profil dans `app_metadata`. Aucun backfill ni changement des données d'authentification n'a été effectué.

## Constats

| Sévérité | Fichier                                                                                  | Lecture observée                                                           | Impact                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Haute    | [`route.ts`](../../apps/web/src/app/api/teacher/schedule-days/route.ts) (lignes 34-35)   | `organization` et `role` lus depuis `user.user_metadata`                   | Contrôle d'accès basé sur la mauvaise source modifiable par le client. Le handler renvoie actuellement un objet vide pour les jours; le contrôle devra être corrigé avant de retourner des données de planning. |
| Moyenne  | [`Header.tsx`](../../packages/ui/src/Header.tsx) (lignes 31, 35)                         | `organization.slug` et `organization.name` lus depuis `user.user_metadata` | Le lien et le libellé d'organisation peuvent retomber sur `/` et « Attendancy » lorsque l'organisation n'est plus dupliquée dans les métadonnées de profil.                                                     |
| Faible   | [`AuthMenu.tsx`](../../packages/ui/src/components/layout/Header/AuthMenu.tsx) (ligne 94) | `organization.slug` lu depuis `user.user_metadata`                         | Les liens de réglages peuvent utiliser le slug de repli `app` au lieu de l'organisation active.                                                                                                                 |
| Faible   | [`page.tsx`](../../apps/web/src/app/auth/invite/page.tsx) (ligne 53)                     | `role` lu depuis `data.user.user_metadata` pour le journal de diagnostic   | La valeur journalisée ne suit plus le stockage courant et peut être absente; cette lecture ne détermine pas l'autorisation.                                                                                     |

## Documentation à aligner

- [`CLAUDE.md`](../../apps/web/src/modules/user/CLAUDE.md) décrit encore `user_metadata` comme source du rôle et de l'organisation, en contradiction avec `mapUserInfo` et les types actuels.
- [`cache.md`](../../apps/web/src/modules/user/cache.md) montre encore un exemple de `role` dans `user_metadata`.

## Audit des écritures

Le vérificateur a recensé **13 sites d'écriture** :

| Fichier                                                                                                                                                            | Stockage cible  | Payload / validation                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`auth/profile/user.ts`](../../apps/web/src/modules/auth/profile/user.ts)                                                                                          | `user_metadata` | `name`, `phone` — profil                                                                                                 |
| [`auth/supabase.ts`](../../apps/web/src/modules/auth/supabase.ts)                                                                                                  | `user_metadata` | `signUp` reçoit `SignUpInfo`, limité à `name`, `phone`, `avatar_url`; `updateProfile` écrit explicitement ces trois clés |
| [`invitation/invitation.ts`](../../apps/web/src/modules/invitation/invitation.ts) et [`invitation/supabase.ts`](../../apps/web/src/modules/invitation/supabase.ts) | `user_metadata` | Les payloads passent par `pickInviteUserMetadata`, qui ne conserve que les clés présentes dans `USER_METADATA_KEYS`      |
| [`user/access.ts`](../../apps/web/src/modules/user/access.ts)                                                                                                      | `app_metadata`  | Le payload est typé `AppMetadataPatch`                                                                                   |
| [`user/update.ts`](../../apps/web/src/modules/user/update.ts)                                                                                                      | `user_metadata` | Payloads typés `UserMetadata` / `UserMetadataPatch`; `cleanUserMetadata` ne remet à zéro que `USER_METADATA_KEYS`        |

**Résultat : aucune divergence d'écriture identifiée dans ces chemins.** Cette conclusion repose sur les helpers et types observés; les payloads transmis par variable ne sont pas tous développés en clés par le contrôle statique. Tout nouvel appel direct ou nouveau helper de mutation devra être revu, surtout s'il contourne `pickInviteUserMetadata`, `UserMetadataPatch` ou `AppMetadataPatch`.

## Vérification automatisée

Un vérificateur statique a été ajouté et s'exécute avec `bun run check:user-metadata` depuis `apps/web/`. Il lit les listes de clés directement dans `src/types/user.ts`, audite les lectures directes/alias locaux et inventorie les écritures Auth reconnues (`updateUser`, `updateUserById`, `signUp`, `inviteUserByEmail`, `generateLink`). Il signale les clés inline placées dans le mauvais objet ou absentes des listes, et affiche les payloads indirects à vérifier. Il échoue avec un code de sortie non nul tant que des lectures ou écritures mal classées sont signalées.

Limites : les accès dynamiques par clé calculée, les alias transmis entre fonctions/fichiers, les spreads et les wrappers de mutation personnalisés ne sont pas complètement résolus. Les écritures SQL directes à `auth.users` et les systèmes externes ne sont pas audités. Ce contrôle complète une revue du code; il ne remplace pas une analyse de flux.

## Suite recommandée

Corriger les lectures listées pour utiliser `app_metadata` pour les clés d'accès, puis mettre à jour les deux documents du module User et relancer le vérificateur. La migration des comptes existants reste hors périmètre de cet audit.
