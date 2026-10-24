# Feature Spec : Typage des Classes (Cohorte vs Thématique)

## 1. Contexte & Problématique

Le cœur de l'application **Attendancy** repose sur une architecture académique stricte et robuste : `Student -> Class -> Course`.

Si ce modèle est parfait pour une organisation de type `INSTITUTION` (universités, écoles), il crée une friction cognitive majeure pour les professeurs indépendants (`PERSONAL`). Un professeur indépendant ne gère pas toujours des "Classes" au sens strict, mais souvent des groupes de niveau, des masterclass, ou du coaching par matière.
**Le problème :** Forcer un professeur indépendant à utiliser le vocabulaire institutionnel brise son modèle mental et dégrade l'expérience utilisateur (UX).
**Le défi :** Adapter l'interface aux professeurs indépendants sans altérer la robustesse du moteur relationnel backend.

## 2. La Solution Architecturale (Domain-Driven Design)

La solution consiste à séparer la **structure de données** de **l'intention métier**.
Techniquement, le conteneur reste une table `Class`, mais nous introduisons un discriminant d'intention pédagogique via un enum `ClassType`.

### Modification du Schéma Prisma

```prisma
enum ClassType {
  COHORT      // Logique institutionnelle : un groupe d'élèves qui se suivent
  THEMATIC    // Logique matière : un rassemblement autour d'un sujet commun

  @@schema("public")
}

model Class {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  type           ClassType @default(COHORT)
  
  // Le reste des relations (courses, enrollments, etc.) reste inchangé
}

```

## 3. Modélisation Métier : Comprendre la différence

La distinction entre `COHORT` et `THEMATIC` ne réside pas dans les contraintes de base de données, mais dans **ce qui relie les étudiants entre eux** à l'intérieur du conteneur.

### Type A : `COHORT` (La logique "Les gens d'abord")

* **Définition :** Les étudiants forment un bloc, ils évoluent ensemble au fil de l'année.
* **Le conteneur (`Class`) :** Ex: *Terminale S1*, *L3 Informatique*, *Mes élèves de coaching*.
* **Le contenu (`Course`) :** Différentes matières (Maths, Physique, SVT).
* **Usage :** Le professeur a une bande d'élèves pour l'année et leur enseigne plusieurs choses différentes.

### Type B : `THEMATIC` (La logique "Le sujet d'abord")

* **Définition :** Les étudiants sont réunis uniquement par la matière ou le sujet enseigné. Ils ne se connaissent pas forcément par ailleurs.
* **Le conteneur (`Class`) :** Ex: *Masterclass React*, *Soutien Anglais Intensif*.
* **Le contenu (`Course`) :** Différents chapitres, modules ou niveaux de cette même matière (Grammaire, Conjugaison, Examen blanc).
* **Usage :** Le professeur a un programme spécifique et y invite les élèves intéressés.

## 4. Comportement UX/UI (Le Frontend "Caméléon")

L'ajout du champ `type` permet au frontend (Next.js) d'adapter dynamiquement son vocabulaire et son iconographie pour correspondre parfaitement à l'intention du professeur.

### À la création (L'Onboarding)

Le professeur choisit l'intention via des "Radio Cards" stylisées :

* **Choix 1 : Classe institutionnelle (`COHORT`)** -> Le formulaire demande *"Nom de la classe" (Ex: Terminale S)*.
* **Choix 2 : Groupe thématique (`THEMATIC`)** -> Le formulaire demande *"Nom du groupe ou de la matière" (Ex: Masterclass React)*.

### Dans l'espace personnel (Les Vues)

Le vocabulaire de l'interface change dynamiquement selon `class.type` :

| Élément UI | Si `type === COHORT` | Si `type === THEMATIC` |
| --- | --- | --- |
| **Titre principal** | "Gérer la classe" | "Gérer le groupe" |
| **Bouton d'ajout enfant** | "Ajouter une matière" | "Ajouter un module" |
| **Onglet Membres** | "Liste des élèves" | "Participants" |
| **Iconographie (Card)** | 🎓 (Diplôme/École) | 🎯 (Cible/Focus) |

## 5. Avantages Techniques & Produit

1. **Zéro Dette Technique :** Le moteur backend (calculs d'emploi du temps, gestion des conflits, requêtes d'absences) s'en fiche de l'intention. Il traite une `Class` de manière générique. Le code serveur reste DRY et ultra-robuste.
2. **Clarification des concepts :** On sépare strictement le cadre juridique (`OrganizationType`: Institution vs Personal) du cadre pédagogique (`ClassType`: Cohort vs Thematic). Un prof indépendant (`PERSONAL`) est libre de créer des cohortes ou des groupes thématiques selon ses besoins.
3. **Avantage Concurrentiel (UX) :** L'outil offre la puissance d'un logiciel institutionnel massif, mais l'interface donne l'impression d'avoir été conçue sur mesure pour les besoins d'un formateur indépendant.