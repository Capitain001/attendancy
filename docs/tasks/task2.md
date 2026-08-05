# Objectif

Reproduire la page dashbord direction de la V1 :
path:
`C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\direction\page.tsx`

L'objectif est de **recréer fidèlement la structure, l'organisation et la hiérarchie visuelle de la V1**, sans chercher à reproduire immédiatement toute la logique métier.

## À exclure dans cette première version

Ne pas implémenter les fonctionnalités complexes, notamment :

* Les anomalies.
* Les calculs métier avancés.
* Les agrégations de données.
* Toute logique nécessitant plusieurs requêtes ou traitements importants.

## Placeholders

Les sections dont la logique est complexe doivent être remplacées par un **placeholder** conservant le même espace dans l'interface.

Exemples :

* `Absences du jour`
* `ActiveSessionsGrid`
* Toute autre section dont les données ne sont pas encore disponibles.

L'objectif est d'obtenir une page complète visuellement, quitte à remplacer temporairement certaines parties par des composants de substitution.

## Interface

Conserver autant que possible la sémantique visuelle de la V1 :

* réutiliser les composants Shell existants ;
* conserver les espacements, la hiérarchie et le découpage de la page ;
* privilégier les composants déjà présents, notamment :

  * `CollapseSection`
  * `MetricCard`
  * et les autres composants de layout déjà disponibles.

## Données

Éviter de reproduire les fetchs complexes de la V1.

Par exemple, ne pas réimplémenter pour l'instant des traitements comme :

* fusion de plusieurs requêtes ;
* les anomalies ;


Cette tâche est uniquement centrée sur la reproduction de l'interface.

Ne pas réimplémenter les logiques métier complexes de la V1. Les traitements complexe sont volontairement hors périmètre :

Lorsque ces données sont nécessaires à l'affichage, utiliser  des placeholders.

la prioriter est de reproduire le coprs (squelette ) de l'interface 

