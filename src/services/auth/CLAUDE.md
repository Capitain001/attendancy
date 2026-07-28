# Service `auth`

## Rôle

Infrastructure d'authentification et d'autorisation : trois flows signup,
login/logout via Supabase Auth, création du record User applicatif, et fonctions
pures d'autorisation (rôle / fonction / permission).

Service d'infrastructure sans modèle métier propre — `actions.ts` en fichier
unique (exception assumée au pattern `actions/`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions.ts` | `signupPrincipalAction`, `createOrgResponsableAction`, `loginAction`, `logoutAction` |
| `authorization.ts` | `getAuthorization`, `authorize`, `userHasPermission`, `userHasRole`, `userHasFunction`, `checkResourcePermission` — PURES |
| `supabase/auth.ts` | Wrappeurs Supabase Auth + `getOrgContext()` (frontière orgId) |
| `database/user.mutations.ts` | `createUserRecord`, `createOrgResponsableDB` — upserts idempotents |
| `validation.ts` | Schémas Valibot signup/login principal |
| `members/actions.ts` | `submitSignupFormAction` — flow invitation (définit le mot de passe) |
| `members/complete-signup.ts` | Transaction : User + Org + RoleEntity + Functions + ParentRelation |
| `members/utils.ts` | `createRoleSpecificEntity`, `assignFunctionToUser` — helpers de transaction |
| `members/validation.ts` | Schéma Valibot membre (password + confirmPassword) |
| `types.ts` | `SignupResult`, `LoginResult` — types de retour des actions |

## Trois flows signup

1. **Principal** (`signupPrincipalAction`) — fondateur qui crée ensuite son org via `/auth/org-setup`
2. **Responsable** (`createOrgResponsableAction`) — admin nommé par la plateforme
3. **Membre invité** (`submitSignupFormAction` → `completeSignup`) — arrive via lien d'invitation, définit son mot de passe, crée ses enregistrements DB en background

## Invariants

- `orgId` sort UNIQUEMENT de `getOrgContext()` / `getUserInfo()` — jamais du body/query/headers (RULE-USR-001).
- `SUPER_ADMIN` (FunctionName) court-circuite toutes les vérifications d'autorisation.
- Les fonctions d'`authorization.ts` sont **pures/sync** : pas d'I/O — testables en `*.unit.test.ts`.
- Après login : `getUserInfo({ cache: false })` — jamais la version cachée.
- `completeSignup()` est appelé en `setImmediate` — ne pas l'`await` depuis l'action de signup.

## Points d'extension (⚠ par projet)

- `authorization.ts` → `ROLE_HIERARCHY` : une entrée par rôle
- `supabase/auth.ts` → `signUpPrincipal` / `signUpResponsable` : métadonnées initiales (role/function/status)
- `database/user.mutations.ts` → champs par défaut du modèle User
- `members/utils.ts` → `createRoleSpecificEntity` : un `case` par rôle qui porte un profil DB
- `members/complete-signup.ts` → décommenter `logAudit` + `syncUserOrganizationProfile` quand les services seront implémentés

## Dépendance TODO

| Import | Module à créer |
|---|---|
| `ensureMainFunctions` | `src/services/org/` ou `src/services/function/` |
