# Architecture : Student Enrollment

## Décisions et Compromis

### Isolation Multi-Tenants et Performances

Lors de l'audit de sécurité, il a été soulevé que les mutations (`create`, `update`, `remove`) ne vérifient pas formellement côté applicatif si les entités manipulées (les IDs de `Student` ou de `Class`) appartiennent bien au tenant courant (`orgId`). L'ajout de vérifications via des requêtes `findFirst` supplémentaires a été audité mais rejeté pour éviter de dégrader les performances sur un service très sollicité.

**Décision actée et assumée :**
- [x] Laisser la faille de vérification inter-tenants côté application (app layer) sans requête supplémentaire.
- [ ] Implémenter la validation stricte directement côté Base de Données (DB layer) à l'avenir (ex: via Row Level Security, triggers ou fonctions natives).
