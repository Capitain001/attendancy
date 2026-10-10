# Task 34 — Slot 4 : porter la bienvenue `/teacher/start`

**Lot parent :** Lot 4 — Porter la bienvenue `/teacher/start`  
**Statut :** Esquisse — dépend des Slots 0, 1 et 2

## But

Porter l’écran de bienvenue `PersonalTeacherWelcome` à la route
`/personal/$slug/teacher/start`, sans faire dépendre l’UI partagée de Next.js
ni du routeur Desktop.

## Défis techniques à résoudre

- La vue Web contient son propre lien Next et appelle `personal.home(slug)`.
  Le composant partageable doit recevoir un callback; l’adaptateur Desktop
  construit la destination TanStack avec le slug de route.
- Le CTA doit mener vers `/personal/$slug/teacher`, pas vers une route
  codée en dur ni un chemin Web avec le slug perdu.
- Le layout et la préférence de thème viennent du slot précédent; cette page
  ne doit pas activer la palette `teacher` par elle-même.
- Préserver l’accessibilité du bouton et la hiérarchie de la page Web sans
  importer ses dépendances d’application dans `@attendancy/ui`.

## Esquisse d’implémentation

1. Extraire dans `packages/ui` un composant présentatif minimal : titre,
   description, bouton et callback de démarrage.
2. Dans la route Desktop `/personal/$slug/teacher/start`, lire le slug
   TanStack et connecter le callback à la navigation Desktop vers
   `/personal/$slug/teacher`.
3. Réutiliser le thème et le layout du Slot 2.
4. Mettre à jour le registre UI avec les éléments réutilisés sans adaptation
   et ceux nécessitant un adaptateur.
5. Ne pas importer `personal.home()` serveur ni le `Link` de Next dans le
   composant partagé.

## Destination du CTA établie dans l’implémentation Web

La page de bienvenue est `/personal/[slug]/teacher/start`. Son bouton
« Démarrer » appelle `personal.home(slug)`, qui mène à
`/personal/[slug]/teacher`, la page de l’écran quotidien. Desktop doit
conserver ce parcours. La destination reste dans l’adaptateur Desktop, hors du
composant UI partagé.

## Fichiers pressentis

- Vue présentative de bienvenue dans `packages/ui/src/components/teacher/`.
- Export public dans `packages/ui/src/index.ts`.
- Page/adaptateur de route `/personal/$slug/teacher/start` dans Desktop.
- Mise à jour du registre dans `docs/tasks/task34.md`.

## Tests d’acceptation

- [ ] Le rendu respecte le texte, la hiérarchie et le thème de la page Web.
- [ ] Le CTA reste accessible au clavier et déclenche le callback fourni.
- [ ] Le CTA mène vers `/personal/$slug/teacher` et conserve le slug.
- [ ] Le composant partagé ne dépend ni de `next/link` ni de TanStack Router.
