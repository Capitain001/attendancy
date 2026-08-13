# Gestion des Enseignants - Liste des Fonctionnalités à Implémenter

Ce document dresse la liste exhaustive des fonctionnalités métier à implémenter pour le module de **Gestion des Enseignants** par la Direction, en se conformant strictement aux spécifications fonctionnelles du produit et aux règles de gouvernance établies. 

## 1. Gouvernance et Cycle de vie du Profil Enseignant
- **Invitation et Onboarding** : Interface permettant d'inviter de nouveaux enseignants sur la plateforme, avec définition initiale de leur rattachement administratif et envoi de notifications.
- **Rattachement au Département** : Gestion de l'affectation d'un enseignant à une ou plusieurs composantes/départements de l'établissement.
- **Désactivation et Réintégration** : Capacité à suspendre ou archiver le profil d'un enseignant (départ ou arrêt) et à le réactiver ultérieurement. Le système garantit la conservation totale de son historique (séances, notes, heures effectuées).

## 2. Dossier Enseignant et Suivi d'Activité
- **Fiche d'Identité** : Consultation des informations de contact et du statut du compte (Actif, Inactif, Invité).
- **Rapport de Service (Statistiques)** : Tableau de bord individuel pour chaque enseignant comprenant :
  - Le suivi des charges de cours : comparaison entre les heures prévisionnelles confiées et les heures réellement effectuées (émargées).
  - Les indicateurs de fiabilité : taux de présence de l'enseignant, statistiques de retards et d'annulations.

## 3. Affectation Pédagogique (Cours)
- **Liste des Affectations** : Vue consolidée de tous les cours et matières assignés à l'enseignant au sein de l'établissement.
- **Responsabilités** : Distinction entre le rôle d'enseignant principal et le co-enseignement sur une même matière, avec visibilité sur le volume horaire spécifique attribué pour chaque cours.

## 4. Planification et Indisponibilités
- **Supervision du Calendrier** : Accès direct à l'emploi du temps individuel de l'enseignant, regroupant ses cours réguliers, ses événements ponctuels (soutenances, surveillances) et ses exceptions de planning.
- **Gestion des Indisponibilités** : 
  - Interface listant les plages d'indisponibilité (hebdomadaires ou ponctuelles) déclarées avec leurs motifs.
  - **Forçage Direction (Override)** : Privilège exclusif permettant à la direction de contourner une indisponibilité signalée pour forcer la planification d'un cours en cas de nécessité (action obligatoirement tracée dans le journal d'audit).
- **Recherche de Remplaçants** : Filtre fonctionnel permettant à la direction de croiser en temps réel le planning et les indisponibilités pour identifier les enseignants disponibles sur un créneau donné.

## 5. Suivi Opérationnel (Pointage & Dérogations)
- **Suivi des Émargements Enseignant** : Visualisation des actions de validation de cours de l'enseignant (check-ins réalisés, détection automatique des retards sur session, séances oubliées ou manquées).
- **Override de Check-in (Admin)** : Possibilité pour la direction de valider manuellement la présence d'un enseignant (contournement de la géolocalisation ou du QR code en cas de problème technique), action strictement journalisée.
- **Approbations Pédagogiques** : Workflow permettant à la direction de recevoir, analyser et approuver les demandes exceptionnelles initiées par l'enseignant (ex: demande de correction de note après la clôture officielle d'une période par le jury).
