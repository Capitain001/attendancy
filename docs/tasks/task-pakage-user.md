Je valide la recommandation. ( ne pas encore editer)
## Amendements

1. **Ajouter le contrat serveur → client au package : `RPC_USER_KEYS`, `RpcUser`, `mapUserRpc`, et le helper `pickKeys` dont ils dépendent.** 
`RPC_USER_KEYS` : restreindre la liste dans `web` ne rétrécirait pas le type côté client, alors que c'est la propriété qu'on voulait. Avec les trois dans le même package, un seul `RPC_USER_KEYS` produit le type des deux côtés. `RpcUser` doit alors disparaître de `@attendancy/types` ?.

2. **`user` est une feuille, et personne ne définit `UserInfo` deux fois.** `@attendancy/types` ne redéfinit pas `UserInfo`. Il peut le ré-exporter en `export type { UserInfo } from "@attendancy/user"`, ou les imports changent : les deux se valent, une seule définition compte. Les dépendances de `user` se limitent à des types : `import type { User }` de Supabase, qui est déclaré en `peerDependency` ou `devDependency` pour ne pas embarquer le client, et les enums Prisma.
3. **Les enums Prisma doivent venir d'une entrée sûre pour le navigateur.** `mapUserInfo` et `UserRoles` utilisent `Role` comme valeur à l'exécution. Si `@attendancy/db` expose son client Prisma complet, `apps/chat` l'embarquerait. Il faut une entrée équivalente à ton `@/generated/prisma/browser`, que `user` importe à la place. Dans `web`, vérifie aussi qu'il n'y a qu'un seul `Role` en circulation : le `types/user.ts` actuel importe celui de `@/generated/prisma/browser`, et un second `Role` venu de `@attendancy/db` crée deux types identiques en apparence.
4. **Les ré-exports côté `web` sont transitoires.** Ils épargnent les ~30 imports aujourd'hui, mais deux chemins d'import pour la même chose s'installent. La règle : tout nouveau code importe de `@attendancy/user`, et les ré-exports de `types/user.ts` et `modules/user/utils.ts` sont retirés quand `tsc` le permet. Ce qui reste propre à `web` (les patchs `AppMetadataPatch`, `SupabaseUser`, et `PublicUserInfo` s'il survit) reste dans `types/user.ts`.
5. **Emballage du package.** `"sideEffects": false` (que des constantes et des fonctions pures) pour que le bundle de `chat` n'embarque que ce qu'il utilise. Si le package livre du TypeScript source, `apps/web` doit le déclarer dans `transpilePackages` : vérifie que `web` consomme déjà des paquets du workspace, sinon c'est une première, avec la dépendance à ajouter.
6. **`useAuthUser` simplifié.** `./map-user-info` n'existe plus dans `auth`, et le point d'entrée `./user-info` dont je parlais n'a plus lieu d'être. Les imports du hook deviennent :

```typescript
// packages/auth/src/useAuthUser.ts — imports (le reste du fichier est inchangé)
import { mapUserInfo, type RpcUser, type UserInfo } from "@attendancy/user";
```

7. **Des tests dans le package.** `mapUserInfo` et `toPresenceUser` sont désormais partagés par le serveur et le client : leurs valeurs par défaut (`GUEST`, `PENDING`, repli du nom sur l'email) et le fait que `toPresenceUser` n'émet aucune clé hors de `PRESENCE_USER_KEYS` méritent un test, un seul, exécuté pour tout le monde.

## Contenu final du package `@attendancy/user`

- `UserInfo` et ses constituants (`AppMetadata`, `UserMetadata`, `AuthMetadata`, `Organization`), `UserRoles`, `Functions` et `FUNCTIONS`, `UserStatus` ;
- `mapUserInfo` ;
- `PRESENCE_USER_KEYS`, `PresenceUser`, `toPresenceUser` ;
- `RPC_USER_KEYS`, `RpcUser`, `mapUserRpc` ;
- `pickKeys`, avec les tests de `mapUserInfo` et `toPresenceUser`.

## Ordre de migration

L'étape sensible est la première, le reste est du câblage :

1. Créer le package et y déplacer le contenu ci-dessus, en gardant les ré-exports dans `web` pour que rien d'autre ne bouge. `tsc` de `web` doit rester à zéro.
2. Brancher `@attendancy/auth` (`useAuthUser`) puis `apps/chat` (`toPresenceUser`).
3. Retirer `RpcUser` de `@attendancy/types`, puis les ré-exports de `web`, petit à petit.