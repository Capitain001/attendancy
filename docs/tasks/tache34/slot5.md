# Task 34 — Slot 5 : validation des pages enseignant Desktop

**Lot parent :** Lot 5 — Validation de la livraison  
**Statut :** Esquisse — dépend des Slots 0 à 4

## But

Valider les deux parcours, les frontières des packages et l’absence de
régression sur l’authentification et le Web.

## Défis techniques à résoudre

- Les tests doivent couvrir les vraies frontières : gardes et navigation
  hash, slug, adaptateurs de données, états erreur/vide et callbacks, plutôt
  que seulement vérifier que TypeScript compile.
- Les actions RPC et les types sont des sorties générées; ne régénérer que si
  le registre source a effectivement changé et vérifier les diffs produits.
- Le projet a déjà des modifications non commitées. Isoler les changements de
  la tâche et ne pas confondre erreurs existantes du code Web importé avec les
  régressions du portage.
- Les vérifications doivent être ciblées, puis étendues au build final; le
  parcours doit aussi être essayé dans la WebView Tauri et non seulement dans
  le navigateur Vite.

## Parcours de validation

- [ ] Déconnecté : accès direct aux deux routes protégées mène à la connexion.
- [ ] Connecté : accès aux deux routes; aucun rebouclage login/account ni
  remontage répété.
- [ ] Slug : accès direct, liens de navigation et CTA conservent le slug.
- [ ] `/teacher` : vérifier chargement, erreur réseau, résultat vide, séance
  active/à venir et ouverture/fermeture des détails selon le contrat.
- [ ] `/teacher/start` : vérifier le rendu de bienvenue et le CTA vers
  `/teacher`, avec conservation du slug.
- [ ] Tauri/hash history : vérifier les deux routes dans la WebView desktop.
- [ ] Web : confirmer que les deux pages et le layout d’origine sont toujours
  présents et que leurs imports n’ont pas été remplacés.

## Vérifications techniques proposées

À lancer depuis la racine du monorepo, selon les fichiers modifiés :

```powershell
bun run --filter @attendancy/ui check-types
bun run --filter @attendancy/rpc gen
bun run --filter @attendancy/types build:types
bun run --filter @attendancy/desktop check-types
bun run --filter @attendancy/desktop build
```

Ne lancer la génération RPC et le build des types que si le Slot 3 modifie le
registre des actions. Pour chaque échec global du Desktop, distinguer les
erreurs préexistantes provenant du code Web importé des erreurs introduites
par cette tâche.

Exécuter aussi les tests ciblés présents pour les hooks/actions modifiés, puis
mettre à jour le registre UI de `task34.md` et consigner les décisions encore
ouvertes.

## Définition de terminé

- Les critères F34-01 à F34-05 du document parent sont vérifiés.
- Les résultats des commandes/tests sont consignés.
- Aucun fichier généré n’a été modifié manuellement.
- Les pages Web source restent intactes.
