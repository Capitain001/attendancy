Le flow actuel n'offre aucun chemin à un enseignant sans org : le signup ne fabrique que des `PRINCIPAL`, et `createOrgAction` est verrouillé `DIRECTION/PRINCIPAL`. Il faut donc une action de création, une entrée (signup solo et bouton) et un routage vers `/my/...`. Je livre le lib slug et l'action, et je te demande plus bas les fichiers qui me manquent pour le reste.Les trois fichiers sont ci-dessus. Ils sont écrits sans avoir vu `redirects.ts` ni `ensureRoleProfile`, donc à relire avec ça en tête.

## Ce que la lecture de tes fichiers a changé

1. **`createOrgAction` écrase `organizations: [orgSnapshot]`.** C'est correct pour un fondateur, mais destructeur pour un enseignant déjà rattaché à une université. L'action perso ajoute à la liste.
2. **`Organization.name` est `@unique`.** Deux « Jean Dupont » entreraient en collision. Le nom stocké est donc technique (`Espace de Jean Dupont · k3x9a2`, avec le même suffixe que le slug), et l'UI affiche « Mon espace personnel » d'après `type`, jamais d'après `name`.
3. **Préfixe `p_` plutôt qu'un préfixe lisible comme `perso-`.** `toSlug` ne peut jamais produire `_`, donc zéro collision avec un slug institutionnel et aucun nom d'établissement légitime refusé. Comme le formulaire institutionnel laisse éditer le slug à la main, il faut brancher `isReservedSlug` dans `orgSetupSchema`. J'y ai mis aussi `my`, sinon un établissement au slug `my` masque `(attendancy)/my/[slug]/...`. La liste `RESERVED_SLUGS` est à compléter avec tes vrais segments racine.
4. **Un clic, aucune saisie**, donc pas de Valibot. L'action est idempotente : si l'espace existe déjà, elle le renvoie et re-projette les metadata. Ça répare le cas « DB écrite, `setUserInfo` en échec », qui laisse aujourd'hui `createOrgAction` avec une org orpheline.
5. **Ce que l'espace perso ne reçoit pas** : pas de `Direction`, pas de `Subscription` (gratuit par construction), et la structure académique reste créée par `academic` à la première classe, pas au bootstrap.
6. **Garde stricte `role === 'TEACHER'`.** `getAuthorization(user, 'TEACHER')` laisserait sans doute passer les rôles supérieurs, et je préfère qu'un `DIRECTION` ne puisse pas créer d'espace perso pour l'instant.

## Un ajustement à mon snippet `allowPersonalOrg`

Dans le bypass de `getAuthorization`, ajoute `teacherId` au rôle :

```ts
options?.allowPersonalOrg &&
user.organization?.type === 'PERSONAL' &&
userRole === 'TEACHER' &&
!!user.organization.teacherId
```

Le `role` de la metadata est global à l'utilisateur, alors que `teacherId` est le seul élément par-org du snapshot. Il faut aussi ajouter `type?: OrganizationType` à l'interface `Organization` de `types/user.ts`, sinon `snapshot.type` ne compile pas.

## Ce qu'il me manque

Pour la suite (signup solo, bouton « Créer », redirection vers `/my/...`), envoie-moi :

- **`config/redirects.ts`**, pour que `redirectUser` construise `/my/{slug}/teacher` quand l'org est `PERSONAL`.
- **`modules/auth/profile/user.ts`**, pour vérifier qu'`ensureRoleProfile` ne crée pas un second `Teacher` et respecte l'`orgId` (A-07).
- **`modules/user/profile.ts`** (`updateOrganizationsProfile`), pour voir s'il reconstruit les snapshots champ par champ. Si oui, `type` serait perdu au premier `syncUserOrganizationProfile`.
- **`services/org/validation.ts`**, pour y placer `isReservedSlug`.
- **`app/auth/callback/route.ts` et `app/auth/org/info/page.tsx`**, pour placer le bouton « Créer ». Aujourd'hui `needsOrgSetup` ne vaut que pour `PRINCIPAL` : un enseignant solo sans org atterrirait sur `/auth/org/info`, qui serait l'endroit naturel du bouton.

Il n'existe aucun signup solo enseignant (`signUpTeacher`, miroir de `signUpPrincipal` avec `role: TEACHER`). C'est 15 lignes, je l'écris quand j'aurai `callback` et `org/info`.

## Trois décisions à trancher

- **Préfixe `p_`** : c'est une constante, changeable en une ligne, mais dis-moi si tu préfères autre chose.
- **`maxUsers`** : `OrganizationSettings.maxUsers` vaut 10 par défaut. Si ce quota est appliqué quelque part, un prof ne pourrait inviter que 9 élèves. Quelle valeur pour un espace perso ?
- **Rôle strict `TEACHER`** : tu confirmes que `DIRECTION` ne crée pas d'espace perso pour l'instant ?

## Un point hors sujet mais important

Tout `getAuthorization` (rôle, fonction, permissions) lit `user_metadata` via `getUserInfo`. Dans Supabase, `user_metadata` est modifiable par l'utilisateur lui-même avec `supabase.auth.updateUser({ data })` depuis le navigateur, ce qui rendrait `role: 'DIRECTION'` ou `function: 'SUPER_ADMIN'` falsifiables. Je ne sais pas si tu l'as déjà neutralisé (autre source de vérité, hook de claims, etc.), mais ça vaut une vérification, car la fiabilité de `allowPersonalOrg` en dépend comme celle de tout le reste.