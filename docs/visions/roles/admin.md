# Rôle : Administrateur

## Positionnement

**Décision PROD-001 (acceptée)** : le rôle Admin est distinct de la Direction dès le MVP.

L'Admin est un **opérateur technique** (non propriétaire) qui configure et maintient la structure académique au quotidien. Il est remplaçable sans impact sur la gouvernance de l'établissement. Les fonctions administratives sont exposées sous `direction/` dans la navigation actuelle — des routes `admin/` dédiées sont à prévoir quand le périmètre Admin sera pleinement séparé.

---

## Besoins métier

| Besoin | Description |
|---|---|
| Configuration académique | Créer et maintenir années, départements, filières, classes, UE, cours |
| Gestion des accès | Inviter les utilisateurs, attribuer les rôles, couper les accès sans supprimer les comptes |
| Planification | Créer les semaines types, générer les séances récurrentes, gérer les salles |
| Cohérence des données | Garantir l'absence de conflits de planning ; données fiables pour tous les acteurs |
| Support opérationnel | Gérer les exceptions : annulations, séances manquées, réaffectations |

---

## Parcours utilisateurs clés

1. **Setup académique initial** (décision PROD-003 — wizard séquentiel) : créer l'année universitaire → créer les départements → créer les filières et maquettes pédagogiques → créer les classes → affecter les enseignants aux cours → inscrire les étudiants.
2. **Planification récurrente** : définir une semaine type (`WeeklyTemplate`) → générer les séances sur une période avec exclusions (fériés, vacances en `excludedDates`) → vérifier l'absence de conflits.
3. **Gestion des salles** : maintenir le référentiel des salles (capacité, équipements, QR statique, localisation géofencing) → affecter les salles aux séances.
4. **Gestion des invitations** : envoyer les invitations par email aux enseignants, étudiants, parents → suivre les statuts d'acceptation.
5. **Gestion des exceptions** : annuler une séance, créer une séance ponctuelle, gérer les demandes d'indisponibilité enseignant.

---

## Pages / interfaces disponibles

> Les fonctions Admin sont actuellement exposées sous les routes `direction/`. Des routes `admin/` dédiées sont à prévoir dans une prochaine phase (PROD-001 acté). Les interfaces ci-dessous sont les fonctionnalités attendues du rôle Admin, indépendamment de leur localisation de navigation actuelle.

### Structure pédagogique

| Page | Contenu | Actions |
|---|---|---|
| Années universitaires | Liste des années, année active/courante | Créer, activer, archiver |
| Départements | Départements, responsables, enseignants | Créer, modifier, archiver |
| Filières (`ProgramTrack`) | Filières et maquettes pédagogiques | Créer, associer des UE par semestre |
| UE et matières | Codes, crédits, volumes horaires, ordre pédagogique | Créer, archiver (sans casser l'historique) |
| Classes | Classes par filière et année, groupes TD/TP | Créer, gérer les semestres (`Term`) |

### Gestion des acteurs

| Page | Contenu | Actions |
|---|---|---|
| Enseignants | Fiche, département, cours affectés, charge horaire | Inviter, affecter aux cours, réintégrer |
| Étudiants | Dossier, inscription en classe, groupe | Inscrire, affecter au groupe, [import CSV — backlog] |
| Parents | Liens avec étudiants | Inviter, gérer les liens `ParentRelation` |

### Planification

| Page | Contenu | Actions |
|---|---|---|
| Semaines types | `WeeklyTemplate` + créneaux (`WeeklySlot`) | Créer, modifier, appliquer sur une période |
| Calendrier | Toutes les séances planifiées | Créer séances ponctuelles, annuler, consulter les conflits |
| Salles | Référentiel, QR, géofencing | Créer, modifier, activer/désactiver le contrôle GPS |
| Génération récurrente | `WeekRecurence` : intervalle, dates exclues | Générer, prévisualiser les conflits avant création |

### Gestion des accès

| Page | Contenu | Actions |
|---|---|---|
| Invitations | Tokens d'invitation par email, statuts, expiration | Envoyer, révoquer |
| Rôles et permissions | `Function` (groupes), `Permission` atomiques | Attribuer, retirer (RBAC) |
| Utilisateurs | Membres de l'organisation avec statuts | Couper l'accès à une org sans supprimer le compte |

---

## Interactions avec les autres rôles

| Interaction | Sens | Description |
|---|---|---|
| Invitation utilisateurs | Admin → Enseignant / Étudiant / Parent | Création des accès par email |
| Override check-in | Admin → Enseignant | Peut forcer un check-in (tracé AuditLog) |
| Configuration de la planification | Admin → Enseignant / Étudiant | Les séances créées alimentent les plannings de tous |
| Indisponibilités | Enseignant → Admin (signal) | L'Admin en tient compte à la planification |
| Clôture de semestre | Direction → Admin (coordination) | La clôture `Term.lockedAt` est décidée par la Direction mais peut être initiée par l'Admin |
| Reporting | Admin → Direction | Les données configurées par l'Admin alimentent les rapports de la Direction |
