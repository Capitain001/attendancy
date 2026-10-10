# Task 34 — Slot 1 : routes Desktop et garde d’authentification

**Lot parent :** Lot 1 — Préparer les routes et la garde d’authentification  
**Statut :** Esquisse — dépend du Slot 0

## But

Rendre les deux URL confirmées accessibles dans Desktop avec `$slug`, sans
régression sur les routes de connexion existantes.

## Défis techniques à résoudre

- Le routeur Desktop est actuellement assemblé manuellement; introduire un
  routeur à fichiers en parallèle créerait deux sources de vérité. Confirmer
  l’approche avant les changements.
- Les routes nécessitent un paramètre `$slug` fiable, conservé dans tous les
  liens et lors du chargement direct sous le hash Tauri.
- Les gardes doivent attendre l’état partagé de `AuthProvider`; rendre une
  route pendant l’hydratation de session peut provoquer une boucle ou le
  remontage qui avait précédemment perturbé les formulaires.
- L’état `offline-stale` est une session locale utilisable avec des limites
  réseau : décider et tester son accès aux pages protégées sans la confondre
  avec une session déconnectée.
- Le nouveau parent enseignant ne doit pas casser `/login`, `/signup` ou
  `/account`.

## Esquisse d’implémentation

1. Étendre le route tree défini dans `apps/desktop/src/app/router.tsx`.
2. Créer un parent/layout enseignant et ses routes enfants :
   - `/personal/$slug/teacher`
   - `/personal/$slug/teacher/start`
3. Extraire `slug` à partir des paramètres TanStack Router et le transmettre
   aux pages/adaptateurs concernés.
4. Protéger le parent avec l’état partagé déjà fourni par
   `AuthProvider`/`useAuth` (`apps/desktop/src/hooks/useAuth.ts`) :
   - afficher l’attente tant que l’état est `null`;
   - laisser entrer les états `signed-in` et `offline-stale`;
   - rediriger un état `signed-out` vers la connexion;
   - ne pas appeler `useAuth` indépendamment dans chaque garde.
5. Conserver `createHashHistory()` requis par Tauri et vérifier le chargement
   direct d’une URL contenant le slug.

## Décision de routage à confirmer

Le routeur actuel est construit manuellement. Recommandation de ce slot :
étendre cette approche pour deux routes, sans introduire immédiatement un
plugin de routes fichiers. Si l’objectif de migration impose une génération
fichier-par-fichier, choisir cette option avant de commencer et ne pas combiner
les deux mécanismes.

## Fichiers pressentis

- Modifier `apps/desktop/src/app/router.tsx`.
- Créer un shell/layout Desktop si nécessaire sous
  `apps/desktop/src/components/layout/`.
- Ajouter tests de route/guards si une infrastructure de test de composants
  existe déjà; sinon vérifier les scénarios via l’application.

## Tests d’acceptation

- [ ] `#/personal/<slug>/teacher` charge l’accueil.
- [ ] `#/personal/<slug>/teacher/start` charge la page de démarrage.
- [ ] Les deux URLs sont accessibles directement après le démarrage.
- [ ] Une session absente mène à la connexion; une session valide ne reboucle
  pas vers la connexion.
- [ ] `#/login`, `#/signup` et `#/account` gardent leur comportement.
- [ ] Les deux pages enfant reçoivent exactement le slug de leur URL.

## Hors périmètre

Ne pas encore porter les composants de page ni créer de nouvelle action RPC.
