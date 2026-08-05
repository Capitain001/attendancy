# Tâche : Définir la vision produit

## Contexte

La tâche suivante est **purement théorique** et relève exclusivement de la conception produit.

Elle ne nécessite **aucune analyse du code existant**. Il est donc inutile de lire :

* les services ;
* les pages existantes ;
* le schéma de base de données ;
* ou toute autre implémentation métier.

Pour réaliser cette mission, privilégie des **agents spécialisés en Product Management / UX / Product Design**, plutôt que des agents orientés développement.

## Objectif

Formaliser la **vision produit** du projet en définissant l'ensemble des interfaces fonctionnelles de l'application.

Cette réflexion doit permettre de répondre notamment aux questions suivantes :

* Quels sont les différents rôles de la plateforme ?
* Quels sont leurs besoins métier ?
* Quels parcours doivent-ils pouvoir réaliser ?
* Quelles pages sont nécessaires ?
* Quel est le contenu de chaque page ?
* Quelles actions doivent être proposées ?
* Comment les différentes interfaces s'articulent-elles entre elles ?

L'objectif est d'obtenir une vision produit complète qui servira de fondation aux futurs plans d'implémentation.

## Approche

La réflexion doit être menée **du point de vue du produit**, sans tenir compte des contraintes techniques.

Les interfaces doivent être conçues à partir des besoins des utilisateurs et des processus métier, et non à partir du code existant.

## Sources de vérité

Construire cette vision exclusivement à partir des documents suivants :

* `docs/product/Fonctionnalities.md`
* `docs/product/PRD.md`
* `docs/product/decisions/`
* `docs/cmd/pro-dev.md`
* `src/app/(app)/structure.md`

Ces documents constituent les références officielles du produit.

## Organisation du livrable

La vision produit devra être créée dans le dossier :

`docs/visions/`

Le contenu devra être structuré en plusieurs documents afin de rester lisible et évolutif.

Structure attendue :

* une **vision globale** du produit ;
* un document dédié à chaque rôle utilisateur ;
* les parcours utilisateurs associés ;
* les interfaces propres à chaque rôle ;
* les fonctionnalités attendues ;
* les interactions entre les différentes interfaces.

L'organisation des fichiers est laissée à ton appréciation, à condition qu'elle soit claire, cohérente et facilement maintenable.

## Résultat attendu

Le livrable doit constituer une **référence produit**, indépendante de toute implémentation technique.

Il servira de base à la rédaction des futurs plans d'implémentation fonctionnels et techniques.
