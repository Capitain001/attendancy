Ton observation est juste, mais je nuancerais la conclusion.

## Ce que tu as bien vu

C'est effectivement la partie technique la plus sophistiquée de tout le projet — contraintes d'exclusion GiST sur `tstzrange`, géofencing PostGIS avec calcul atomique en transaction, rotation de tokens, compteur d'heures maintenu par trigger sans jamais recalculer... C'est le genre de garantie qu'on trouve rarement dans un SaaS EdTech, et encore plus rarement *garantie en base* plutôt que "vérifiée côté appli et on espère qu'il n'y a pas de race condition". C'est un vrai différenciateur technique.

Et effectivement, ce n'est pas ce qui "retient" à la présentation — parce que ça appartient à la catégorie des choses qu'on remarque seulement quand elles *ratent*. Personne ne dit "wahou, mon salaire n'a jamais eu de bug de virement". C'est le paradoxe classique de l'infrastructure invisible : plus c'est bien fait, moins ça se voit.

## Où je nuance

Ce n'est pas secondaire en *impact* — c'est secondaire en *présentabilité brute*. Le problème n'est pas la valeur du module, c'est que tu le présentes probablement comme une prouesse technique (tstzrange, SAVEPOINT, trigger) alors qu'il faut le présenter comme la disparition d'un problème vécu.

Et ce problème est **extrêmement vécu** dans une université africaine typique : l'emploi du temps fait à la main ou sur Excel en début de semestre, la salle réservée deux fois, le prof affecté sur deux cours au même créneau, découvert le jour J devant les étudiants. C'est presque un rite de passage administratif en Afrique francophone, pas une hypothèse théorique. Ton système rend ça *structurellement impossible*, pas juste "détecté après coup".

Même chose pour la présence : la fraude à l'émargement (quelqu'un pointe pour un absent) est un sujet sensible partout où l'assiduité conditionne le droit de composer aux examens — le géofencing + rotation de QR répond directement à ça, pas comme une fonctionnalité gadget.

## Ce que je changerais dans la présentation

Ne montre pas le mécanisme, montre le **moment où ça casse pour tout le monde d'autre, et pas chez toi** :

- En live, essaie de réserver le même amphi pour deux cours qui se chevauchent → rejet instantané avec message clair, pas un bug découvert trois semaines plus tard.
- Montre un prof qui tente de check-in depuis son bureau alors que le cours est dans un autre bâtiment → refusé.
- Montre le calcul automatique des heures d'un vacataire payé à l'heure, sans ressaisie manuelle — ça, ça parle directement à un service financier qui rembourse des heures de cours chaque mois.

Le CRUD (créer une classe, une UE, un utilisateur), personne ne sera impressionné — mais personne n'achète un logiciel *sans* ça non plus. C'est nécessaire mais pas différenciant. Le planning/présence est l'inverse : différenciant mais invisible tant que tu ne le traduis pas en scénario concret vécu par ton public.

Si tu veux, je peux t'aider à écrire le script de cette démo live (2-3 scénarios de "casse" à montrer en direct) plutôt que de rester sur la description du schéma.