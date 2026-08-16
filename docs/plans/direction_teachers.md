# Plan Fonctionnel Détaillé : Gestion des Enseignants (Espace Direction)

## 1. Contexte et Objectifs
L'espace `direction/people/teachers/` est le point d'entrée pour la gestion du corps professoral par la Direction. 
L'objectif de ce document est de fournir des spécifications fonctionnelles détaillées à l'agent technique qui sera en charge de l'implémentation. Toutes les décisions métier liées aux besoins de la Direction ont été actées et intégrées ici.

---

## 2. Vue Principale : Annuaire et Tableau de bord (`/teachers`)

Cette vue ne se limite pas à un simple tableau CRUD, c'est un outil de pilotage pour la Direction.

### 2.1. Indicateurs Globaux (En-tête de page)
- Nombre total d'enseignants (Actifs / Invités en attente).
- Volume global d'heures d'enseignement gérées (Heures réalisées au niveau de l'établissement).

### 2.2. Actions Globales
- **Bouton "Inviter un enseignant"** : Déclenche le flux d'invitation (génération de token/email, précision du rôle, sélection du département par défaut).

### 2.3. Liste des Enseignants (Tableau de données)
**Filtres et Recherches attendus :**
- Recherche textuelle par nom/email.
- Filtrage par département de rattachement.
- Filtrage par statut du compte (Actif, Invité, Inactif).



---

## 3. Fiche Profil de l'Enseignant (`/teachers/[teacherId]`)

Le profil est divisé en plusieurs sous-vues (via un système d'onglets ou une navigation latérale propre au profil) pour organiser la densité des informations.

### 3.1. En-tête du profil (Persistant sur tous les onglets)
- **Informations clés** : Nom, Prénom, Avatar, Statut du compte.
- **Statistiques rapides** : Taux d'assiduité global, date de la prochaine séance prévue.
- **Actions globales du profil** : Bouton "Désactiver l'enseignant" (qui déclenche le workflow de départ).

### 3.2. Sous-vue : Résumé / Identité (`/`)
- Informations de contact détaillées.
- Départements de rattachement (avec interface pour ajouter/retirer un département).
- Historique d'inscription (date de création du compte).

### 3.3. Sous-vue : Enseignements & Charge (`/courses`)
- **Objectif** : Suivre la progression des enseignements affectés à cet enseignant précis.
- **Contenu** : Tableau listant les cours associés (`CourseTeacher`).
  - Nom du cours et classe associée.
  - Rôle (Enseignant principal vs Intervenant ponctuel).
  - Volume horaire : Heures confiées vs Heures réalisées (jauge/barre de progression par cours).
- **Action** : Lien hypertexte vers la page détail du cours.

### 3.4. Sous-vue : Habilitations (`/authorizations`)
- **Objectif** : Définir les matières que l'enseignant est autorisé à dispenser.
- **Contenu** : S'appuie sur la table `CourseTeacher`. Affiche et permet de gérer la liste des cours pour lesquels l'enseignant est habilité, y compris ceux pour lesquels aucune séance n'est encore planifiée.

### 3.5. Sous-vue : Planning (`/schedule`)
- **Objectif** : Visualisation claire des séances de l'enseignant.
- **Contenu** : Composant de calendrier standard (vue semaine/mois) alimenté par les `Sessions` de l'enseignant.
- **Action** : Clic sur une séance pour ouvrir un tiroir (drawer) avec les détails de la séance (salle, pointage, liste d'émargement).

### 3.6. Sous-vue : Indisponibilités (`/unavailabilities`)
- **Objectif** : Visualiser les contraintes déclarées par l'enseignant.
- **Contenu** : Liste des plages horaires bloquées (récurrences hebdomadaires ou dates spécifiques) avec leur motif. Information cruciale pour la Direction lors de conflits de planification.

### 3.7. Sous-vue : Demandes en attente (`/requests`)
- **Objectif** : Centraliser les demandes d'approbation (`ApprovalRequests`) émises par cet enseignant (ex: `GRADE_CORRECTION`).
- **Contenu** : Liste des demandes au statut `PENDING`.
- **Actions** : Pouvoir examiner et Approuver/Rejeter la demande directement depuis cet onglet, de manière contextualisée, pendant l'examen du profil de l'enseignant.

### 3.8. Sous-vue : Historique / Audit (`/audit`)
- **Objectif** : Traçabilité des événements.
- **Contenu** : Journal immuable (`AuditLog`) pré-filtré sur les ressources liées à cet utilisateur (ex: l'enseignant a été invité, un admin a forcé un check-in pour lui, son compte a été suspendu).

---

## 4. Workflow Spécifique : Départ et Réassignation en cours d'année

La gestion du départ d'un enseignant est un processus critique qui ne doit pas laisser de "trous" dans le planning (séances futures sans enseignant).

### 4.1. Déclenchement
- Depuis la fiche profil, la Direction clique sur **"Désactiver le compte"**.
- Le système vérifie s'il existe des séances au statut "à venir" (`PENDING`) affectées à cet enseignant.
- Si oui, le système bloque la désactivation simple et bascule la Direction dans un tunnel de réassignation.

### 4.2. Page ou Modale de Réassignation (`/teachers/[teacherId]/reassign`)
- **Objectif** : Transférer manuellement les séances futures à d'autres enseignants compétents, avant d'acter la désactivation.
- **Contenu affiché** : 
  - Liste des séances ou groupes de séances futures de l'enseignant partant.
  - Pour chaque séance, un sélecteur "Remplaçant" est affiché.
- **Règle métier technique** : Le menu déroulant du remplaçant ne doit proposer **uniquement** que les autres enseignants habilités pour ce cours précis (c'est-à-dire ceux existant déjà dans la table `CourseTeacher` pour ce `courseId`).
- **Validation** : Une fois les remplaçants définis, la validation effectue deux actions de manière atomique :
  1. Mise à jour des séances dans le planning avec les nouveaux enseignants.
  2. Changement du statut du partant en "Inactif".
- **Garantie** : L'historique des séances passées (tenues par le partant) reste parfaitement intact.
