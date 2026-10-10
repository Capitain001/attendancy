# Task 34 — Slot 2 : thème, layout et UI présentative partagée

**Lot parent :** Lot 2 — Construire le layout et l’inventaire UI  
**Statut :** Esquisse — dépend des Slots 0 et 1

## But

Construire un layout enseignant commun aux deux routes et extraire uniquement
les éléments de présentation réellement partageables.

## Défis techniques à résoudre

- Le thème doit rester celui choisi par l’utilisateur dans les réglages.
  Importer `teacher.css` ne doit pas appliquer automatiquement la palette
  `teacher` aux pages de ce rôle; distinguer la disponibilité du thème et son
  activation explicite.
- L’`AsyncHeader` global Web et le menu enseignant sont deux éléments de
  couches différentes. Leur composition Desktop ne doit ni omettre l’en-tête
  attendu ni le rendre deux fois.
- Le Header Desktop existant importe des composants Web et a des changements
  locaux préexistants; l’inspecter et préserver ces modifications avant toute
  réutilisation ou refonte.
- `MobileNavMenu`, le lien de bienvenue et les chemins personnels dépendent
  de Next. Les composants partagés ne doivent pas importer Next ou TanStack;
  les destinations et callbacks doivent venir des adaptateurs Desktop.
- Le layout doit préserver le slug et fonctionner dans les formats de fenêtre
  visés sans embarquer de logique métier ni d’accès aux données.

## Esquisse d’implémentation

1. Garder les thèmes disponibles via `@attendancy/ui`, mais laisser le thème
   actif à la préférence utilisateur; ne pas appliquer automatiquement
   `teacher.css`.
2. Prendre en compte l’`AsyncHeader` du layout racine Web : inventorier ce
   qu’il rend réellement et décider quels éléments doivent figurer dans le
   shell Desktop. Le layout enseignant Web ne rend à lui seul que le menu
   mobile et son contenu.
3. Auditer le `Header` Desktop existant avant de le réutiliser; identifier les
   dépendances à des composants Web et les données attendues.
4. Créer un composant de layout Desktop responsable de la structure et des
   points d’insertion, sans requête métier ni accès Prisma.
5. Transformer les données de navigation en modèle présentatif simple
   (`label`, `href`, éventuellement `icon`) dans l’adaptateur Desktop.
6. Fournir les destinations au layout depuis la couche Desktop; ne pas faire
   importer TanStack Router ou `next/link` par un composant UI partagé.
7. Évaluer l’extraction dans `packages/ui` :
   - éléments purement visuels et accessibles vers des composants UI;
   - navigation plateforme et composition dans Desktop;
   - styles enseignant réutilisés tels quels, sans les recopier.
8. Évaluer séparément le menu animé Web : `MobileNavMenu` dépend de Next Link
   et Framer Motion, et ne doit pas être transféré directement dans le package.
9. Mettre à jour le registre de composants dans `task34.md` avec le statut
   réel de chaque composant extrait, réutilisé ou spécifique.

## Fichiers pressentis

- `packages/ui/src/components/teacher/` pour les composants présentatifs
  effectivement justifiés par l’inventaire.
- `packages/ui/src/index.ts` pour les exports publics, si de nouveaux
  composants y sont ajoutés.
- `apps/desktop/src/components/layout/` pour le shell et les adaptateurs
  Desktop.
- `apps/desktop/src/styles.css` ou le point d’entrée CSS confirmé pour le
  thème enseignant.

## Contraintes de séparation

- `@attendancy/ui` ne dépend ni de Prisma, ni d’une action serveur, ni d’une
  route de plateforme.
- Les callbacks et propriétés visuelles sont privilégiés aux appels réseau
  dans les composants partagés.
- Ne pas recopier ni modifier la version Web au cours de cette phase.
- Vérifier la disponibilité des primitives `Sheet` et `Separator` avant de
  prévoir leur réutilisation.

## Tests d’acceptation

- [ ] Le thème choisi par l’utilisateur reste visible sur les deux routes;
  `teacher` ne s’active que si l’utilisateur l’a choisi.
- [ ] L’en-tête global et le menu enseignant sont reproduits selon la décision
  validée, sans doubler l’en-tête.
- [ ] Le layout ne se duplique pas entre les pages.
- [ ] La navigation conserve le slug courant.
- [ ] Les composants UI partagés compilent via l’API publique de
  `@attendancy/ui`.
- [ ] Le registre indique une décision pour chaque composant effectivement
  évalué.
- [ ] Le layout est utilisable aux formats d’écran Desktop retenus au Slot 0.
