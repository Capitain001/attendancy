service : apps\web\src\services\seed (service speciale car pas de db model propre)

objectif cree les UI du pannel seed :

Construis un panel simple avec un champ d’ID d’organisation en haut, puis une carte pour chaque générateur : Enseignants, Étudiants, Parents, Liaison cours ↔ profs et Purge.

Donne à chaque carte son propre état de chargement ainsi qu’un résumé de ses résultats.

cree et Réutilise le hook générique `useSeedAction` afin d’éviter de dupliquer la logique de transition et de toast dans chaque carte.
