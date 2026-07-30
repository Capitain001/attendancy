# Audit de régression `tryConstraint` — Prisma 6 → Prisma 7

## Contexte

Le projet a été migré de Prisma 6 vers Prisma 7.

La version **V1** est une version historique, testée en production et considérée comme la référence fonctionnelle. Elle est réputée robuste et son comportement est considéré comme correct.

La version **V2** est le projet actuel sous Prisma 7.

Tu ne peux exécuter que la V2.

La V1 ne doit être utilisée **que comme documentation du comportement attendu**.

## Fichiers à comparer

### V2 (version actuelle)

`C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\src\utils\server\prisma.ts`

### V1 (référence fonctionnelle)

`C:\PROJECTS\DEV\ULTIMATE\attendancy-sys\src\utils\server\utils.ts`

---

# Objectif

Déterminer si la migration vers Prisma 7 a introduit une **régression fonctionnelle** dans les helpers :

* `tryConstraint`
* `tryUnique`
* `uniqueError`
* `tryTriggerError`
* `normalizeConstraintTarget`

Ne cherche pas à rendre le code identique.

Le but est uniquement de vérifier que **le comportement observable de V2 reste équivalent à celui de V1**, malgré les adaptations nécessaires à Prisma 7.

---

# Important

La V1 est considérée comme la référence.

En cas de différence, pars du principe que :

* la logique V1 est correcte ;
* la logique V2 doit produire le même résultat fonctionnel.

En revanche, **ne considère jamais qu'une différence d'implémentation est une régression** tant qu'elle ne modifie pas le comportement observable.

---

# Ne sont PAS des régressions

Ne signale pas comme régression :

* changement de namespace Prisma (`Prisma.PrismaClientKnownRequestError` vs import dédié) ;
* changement imposé par Prisma 7 ;
* changement d'import ;
* remplacement de `if` par `switch` ;
* renommage de variables ;
* déplacement de fonctions ;
* simplification du code ;
* suppression d'un helper réservé au debug ;
* optimisation interne sans impact observable.

---

# Est une régression uniquement si...

## 1. Régression fonctionnelle

Une erreur Prisma n'est plus transformée comme auparavant.

Exemples :

* `P2002`
* `P2003`
* `P2025`
* erreurs de trigger PostgreSQL

ne produisent plus les mêmes erreurs métier.

---

## 2. Régression de couverture

Un cas traité dans V1 n'est plus traité dans V2.

Exemple :

* disparition d'un mapping ;
* disparition d'un fallback ;
* disparition d'une interception.

---

## 3. Régression de contrat

Le contrat public change.

Exemples :

* une fonction ne lance plus une `Error` ;
* le type de retour change ;
* un message métier attendu disparaît.

---

## 4. Régression métier

Une règle métier n'est plus appliquée.

Exemples :

* trigger PostgreSQL non interprété ;
* erreur technique exposée à l'utilisateur.

---

## 5. Régression de robustesse

V2 peut désormais :

* laisser remonter une erreur Prisma brute ;
* produire une exception non interceptée ;
* perdre un cas précédemment géré.

---

# Méthode d'analyse

Pour chaque helper :

* compare le comportement attendu de V1 ;
* compare le comportement de V2 ;
* identifie uniquement les différences observables.

Ne te contente jamais d'une comparaison syntaxique.

Si une différence est uniquement liée à Prisma 7, classe-la comme :

* Adaptation Prisma 7

et explique pourquoi le comportement reste identique.

---

# Vérification spécifique

Vérifie notamment :

* interception des erreurs Trigger PostgreSQL ;
* traitement de `P2002` ;
* traitement de `P2003` ;
* traitement de `P2025` ;
* résolution des contraintes via `CONSTRAINT_ERROR` ;
* fallback `ERRORS.UNIQUE.DEFAULT` ;
* fallback `ERRORS.DB.FOREIGN_KEY` ;
* propagation correcte des erreurs inconnues ;
* comportement de `normalizeConstraintTarget` (tri, stabilité, format de clé) ;
* compatibilité avec le runtime Prisma 7.

---

# Livrable

Présente les résultats dans un tableau :

| Élément | V1 | V2 | Statut | Justification |
| ------- | -- | -- | ------ | ------------- |

Le statut doit être obligatoirement l'un des suivants :

* Identique
* Adaptation Prisma 7
* Optimisation
* Régression fonctionnelle
* Régression métier
* Régression de robustesse
* Incertain

Pour chaque régression, explique précisément :

1. quel comportement V1 existait ;
2. quel comportement V2 produit désormais ;
3. quel impact concret cela peut avoir.

Ne propose aucune correction tant que la régression n'est pas démontrée.

Termine par un verdict global :

* ✅ Aucune régression détectée
* ⚠️ Régression(s) confirmée(s)
* ❓ Analyse insuffisante (avec justification)
