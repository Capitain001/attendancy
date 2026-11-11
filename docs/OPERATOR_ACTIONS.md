# Situations à résoudre côté fondateur (hors scope agent)

Quand l'agent rencontre une de ces situations, il **n'insiste pas / ne contourne pas** :
il s'arrête et **te le signale**, car la résolution est à ton niveau (réseau, accès,
secrets, infra externe). Ce fichier sert de référence partagée pour les reconnaître vite.

Convention : à l'apparition d'un de ces signaux, l'agent dit explicitement
« ⛔ situation OPERATOR — voir OPERATOR_ACTIONS.md #ID » et attend.

---

## OP-01 · Base de données injoignable (Prisma `P1001`)
**Signal** : `Can't reach database server at ...` (dev Supabase ou DB de test/shadow Neon).
**Cause probable** : réseau restreint, instance Supabase/Neon **en pause**, VPN/pare-feu.
**À ton niveau** : réveiller l'instance, lever la restriction réseau, vérifier l'URL.
**Côté agent** : ne pas boucler de retries ; écrire le code/migration **offline** (génération,
`tsc`) et reporter « migration prête, à appliquer quand la DB répond ».

## OP-02 · `migrate reset` bloqué (action destructive)
**Signal** : le harness demande un consentement explicite avant `prisma migrate reset`
(`test:db:setup`).
**Cause** : garde-fou anti-action destructive (sain).
**À ton niveau** : confirmer explicitement (« oui, … ») pour que l'agent relance avec le
consentement. C'est **toujours** le cas pour la DB de test — c'est attendu, pas une erreur.

## OP-03 · Advisory lock Prisma au reset/migrate
**Signal** : `Timed out trying to acquire a postgres advisory lock (pg_advisory_lock ...)`.
**Cause** : une connexion résiduelle (process Prisma précédent, pooler) tient le lock migrate.
**À ton niveau** : si ça persiste après 1-2 retries → fermer les connexions ouvertes
(autre `prisma`/`vitest` en cours, Studio, pooler), puis relancer.
**Côté agent** : 1 retry court autorisé, sinon signaler (pas de boucle).

## OP-04 · Migration échouée laissée en état `failed` (`P3018`)
**Signal** : `A migration failed to apply. New migrations cannot be applied before the error
is recovered`.
**Cause** : une migration a planté en cours (ex. contrainte FK, donnée incohérente).
**Résolution** (agent, si la cause est dans le SQL) : corriger le `.sql`, puis
`prisma migrate resolve --rolled-back <name>` avant de relancer `migrate deploy`.
**À ton niveau** : si la cause est une donnée/état DB spécifique non reproductible offline.

## OP-05 · Secrets / accès externes manquants
**Signal** : auth Supabase, clés API, `gcloud`/`vercel` login, variables d'env absentes.
**À ton niveau** : fournir le secret / faire le login interactif (`! <commande>` dans le prompt).
**Côté agent** : ne jamais inventer/committer un secret ; demander.

## OP-06 · Rendre la démo (`ecole-demo`) *loginnable* — P-43
**Signal** : après `SEED_CONFIRM=1 pnpm seed`, l'org de démo `ecole-demo` existe (données crédibles)
mais aucun compte ne « tombe » dessus à la connexion.
**Cause** : l'org **active** d'un utilisateur est lue depuis le **`user_metadata` Supabase**
(`getUserInfo → user.organization`), pas via une table Prisma. Le seed (Prisma only) ne peut donc
pas relier un compte de connexion à l'org démo.
**À ton niveau (Supabase admin)** :
  1. Choisir un compte Direction de démo (ex. `captaindev003@gmail.com`, cf. `doc/TEST_ACCOUNTS.md`).
  2. Mettre son `user_metadata.organization` = `{ id, slug: "ecole-demo", name, … }` de l'org seedée.
  3. S'assurer d'une ligne `UserOrganization { userId, orgId, role: DIRECTION, status: ACTIVE }`
     (+ `Direction { userId, orgId }`) pour cet utilisateur sur l'org démo.
**Côté agent** : ne pas écrire dans Supabase ni rattacher un compte réel en dur (choix + auth). Le
seed reste Prisma-only ; cette liaison est volontairement hors scope agent.

## OP-07 · ~~Login impossible avec le compte de test~~ → **RÉSOLU** (typo mot de passe)
> **Résolu 2026-06-27** : les 3 comptes de `TEST_ACCOUNTS.md` **existent et fonctionnent** (vérifié
> via `signInWithPassword` contre le Supabase de `.env`, projet `kyitmnunzsqyhqbkzekk`, org `havard`).
> Le mot de passe documenté `1234578` était une **typo** (chiffre manquant) ; le vrai est
> **`12345678`**. `doc/TEST_ACCOUNTS.md` corrigé. L'auth applicative n'était donc pas cassée.
> *Reste pour l'audit UI live* : recharger les outils **Playwright MCP** (déconnectés en cours de
> session ; reconnectés via `claude mcp` mais non injectés à chaud → **redémarrer la session**).

### (historique) OP-07 · Login impossible avec le compte de test (`Invalid login credentials`)
**Signal** : sur `/login` (prod **et** local, reproduit 2026-06-26 via Playwright), la soumission
avec `captaindev003@gmail.com` / `1234578` (cf. `doc/TEST_ACCOUNTS.md`) ne connecte pas. Le serveur
de dev montre `sigin error: undefined` mais le formulaire affiche **`AuthApiError: Invalid login
credentials`** → identifiants rejetés par Supabase.
**Cause** : le compte de test n'est **pas valide** dans l'instance Supabase courante (mot de passe
différent, compte absent, ou e-mail non confirmé). C'est un état **données/auth Supabase**, pas un
bug de code.
**À ton niveau (Supabase admin)** : (re)créer/valider le compte de test avec le bon mot de passe
(ou mettre à jour `doc/TEST_ACCOUNTS.md`), confirmer l'e-mail, vérifier la liaison org (cf. OP-06).
**Côté agent** : audit live **authentifié** reste bloqué tant que les identifiants ne sont pas
valides ; ne pas boucler. Audit **non authentifié** possible (pages publiques) — fait.

> **Note (résolu côté code 2026-06-26)** : les `500` observés sur `/login` n'étaient **pas** le
> login lui-même mais la **cloche de notifications** du Header global qui s'exécutait sur la page
> publique (`getNotifications → getAuthUser` → throw « Not authenticated »). **Corrigé** : la
> `NotificationsPopover` n'est plus rendue pour les invités (`{user && …}` dans `Header.tsx`).
> Vérifié en live : `/login` → `200`, 0 erreur console. Ce point n'est donc plus un blocage
> opérateur ; seul l'`Invalid login credentials` ci-dessus l'est.

## OP-08 · Build `next/font/google` + Turbopack — police Google injoignable au build
**Signal** : `pnpm build` échoue avec `Module not found: Can't resolve
'@vercel/turbopack-next/internal/font/google/font'` (sur `geist_*.module.css`). Constaté
2026-06-26 : 1er build OK, puis 2 builds consécutifs en échec sur cette même erreur.
**Cause** : `next/font/google` télécharge les polices (Geist) **au moment du build** via Turbopack ;
si le réseau vers Google Fonts est injoignable/rate-limité (builds rapprochés, réseau restreint),
la résolution du module police échoue. **Indépendant du code applicatif** (le 1er build passait
avec le même code ; n'a aucun lien avec le middleware `proxy.ts` ajouté entre-temps).
**À ton niveau** : relancer le build avec accès réseau à Google Fonts, **ou** self-host les polices
(`next/font/local` avec les `.woff2` Geist en local) pour rendre le build hermétique et fiable
(recommandé pour CI/Vercel et builds hors-ligne).
**Côté agent** : ne pas boucler de builds (risque rate-limit) ; `tsc --noEmit` reste le garde-fou de
type. Build « shippable » déjà prouvé (build1 it.18 : 56/56 pages, 0 erreur).

---

> Ajouter une entrée OP-XX dès qu'une nouvelle situation « hors scope agent » se répète.
