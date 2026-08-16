## Contexte

Nous travaillons sur une application de **gestion de planning universitaire**.

La page :

`apps\web\src\app\(app)\[slug]\direction\people\teachers\page.tsx`

est le point d'entrée de la **gestion des enseignants côté Direction**.

## Objectif

Avant toute implémentation, nous devons définir les **besoins métier de la Direction** et les **fonctionnalités à fournir** pour cette vue ainsi que les éventuelles vues enfants liées.

Il s'agit uniquement d'une **tâche de structuration produit**, sans décision technique.

## Sources

Tu peux consulter :

* `docs\visions\roles\teacher.md`
* `docs\visions\roles\direction.md`
* `docs\product\PRD.md`
* `docs\product\Fonctionnalities.md`

Ces documents servent de contexte mais ne sont pas nécessairement exhaustifs. Complète leur contenu avec ton **expertise des activités universitaires et de la gestion des enseignants**.

## Contraintes

* **Ne pars pas du code existant** pour déduire les fonctionnalités.
* Ne propose aucune architecture, API, composant, hook, modèle de données ou autre détail technique.
* Ne transforme pas le sujet en simple CRUD.
* Raisonne à partir des **responsabilités réelles de la Direction** : gestion des enseignants, affectations, enseignements, contraintes et interaction avec le planning.
* Ne suppose pas qu'une fonctionnalité existe déjà.
* Ne propose pas de fonctionnalité uniquement parce qu'elle est techniquement possible.
* Lorsque le besoin est incertain, signale-le comme tel.

## Résultat attendu

Produis une **analyse fonctionnelle concise** couvrant :

1. les besoins de la Direction ;
2. les capacités/fonctionnalités nécessaires ;
3. le rôle de la vue principale ;
4. les éventuelles vues enfants et leur utilité ;
5. les principaux cas d'usage ;
6. les informations importantes à consulter ;
7. les points métier restant à décider.

L'objectif est d'obtenir une **base fonctionnelle indépendante du code**, qui pourra ensuite servir de référence pour concevoir l'interface.
