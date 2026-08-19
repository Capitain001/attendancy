# Analyse du Flux Académique et Pages Applicatives

Cette analyse est basée sur l'architecture de la base de données (modèles Prisma), qui sépare strictement la **Théorie** (les maquettes pédagogiques intemporelles) et la **Réalité** (les années scolaires en cours avec leurs vraies dates et de vrais humains).

## 1. Espace Direction / Scolarité (Le chef d'orchestre)

### A. Page "Ingénierie Pédagogique" (La Théorie)
- **Ce qu'on y fait** : L'administrateur définit les Départements, les Filières (`ProgramTrack`), les Unités d'Enseignement (`UE`) et assemble les Programmes.
- **L'expérience** : Une interface où l'on construit le cursus (ex: "Licence 3 Info"). On y définit qu'une UE demande 24 heures de CM et 10 heures de TD (`UECourse`). Une fois le cursus parfait, on le verrouille (`isLocked`). C'est un modèle réutilisable d'année en année.

### B. Page "Préparation de la Rentrée" (La Réalité)
- **Ce qu'on y fait** : La scolarité crée une nouvelle Année Académique (ex: 2026-2027) et instancie une `Class` (ex: L3 Info 2026) basée sur la maquette.
- **L'expérience** : Le système génère le calendrier (les semestres ou `Term`) et les cours (`Course`). L'administrateur ajuste les dates réelles. C'est ici qu'on importe les étudiants (`StudentEnrollment`), qu'on les divise en groupes de TP (`Group`) et qu'on affecte les vrais professeurs (`CourseTeacher`) pour cette année-là.

### C. Page "Générateur d'Emploi du Temps" (Schedule)
- **Ce qu'on y fait** : Placer les séances (`Schedule`).
- **L'expérience** : L'admin crée une "Semaine Type" (`WeeklyTemplate`). Le système l'avertit si un prof a déclaré une indisponibilité. Ensuite, il déploie cette semaine sur 3 mois (`WeekRecurrence`). 
- **Sécurité** : Si une salle est déjà prise ou si un prof est appelé à deux endroits, le système bloque la création grâce à une contrainte de base de données ultra-stricte. 

### D. Page "Gestion des Absences & Justifications"
- **Ce qu'on y fait** : Modérer les demandes d'absences (`Justification`).
- **L'expérience** : L'admin voit une liste de demandes en attente. S'il valide, l'absence de l'étudiant passe automatiquement d'ABSENT à EXCUSÉ (`EXCUSED`) dans l'`Attendance`.

---

## 2. Espace Enseignant (Sur le terrain)

### A. L'Accueil "Mon Planning"
- **Ce qu'on y fait** : Le professeur voit ses cours du jour.
- **L'expérience** : Il voit une timeline claire. Il y a aussi un bouton pour déclarer une "Indisponibilité" (`TeacherUnavailability`), ce qui alertera la scolarité pour le planning futur.

### B. Vue "En Cours" (La Session d'Émargement)
- **Ce qu'on y fait** : Réaliser l'appel.
- **L'expérience** : En arrivant en salle, le prof clique sur "Démarrer le cours". L'application vérifie sa position GPS (`Location`) pour s'assurer qu'il est bien dans la salle. Ensuite, l'écran de l'enseignant affiche un grand QR Code dynamique (`SessionToken`) projeté au tableau. 

### C. Vue "Bilan de fin de cours"
- **Ce qu'on y fait** : Gérer les anomalies et finaliser la session.
- **L'expérience** : Le prof voit en temps réel les étudiants passer au vert après avoir scanné. À la fin, il voit ceux qui n'ont pas scanné, peut manuellement marquer "En retard" un étudiant, puis clôturer la séance.

---

## 3. Espace Étudiant (Rapide & Informatif)

### A. Application Mobile : Dashboard
- **Ce qu'on y fait** : Voir son prochain cours et scanner.
- **L'expérience** : En ouvrant l'app, l'étudiant voit immédiatement la salle où il doit se rendre (gérée finement selon s'il est en classe entière ou dans son sous-groupe de TP). Un bouton central "Scanner" est affiché.
- **Flux de présence** : L'étudiant scanne le QR projeté au tableau. L'application enregistre le pointage (`QRScan`) instantanément, et la présence est validée (`Attendance`).

### B. Le Dossier "Assiduité"
- **Ce qu'on y fait** : Suivre ses absences et se justifier.
- **L'expérience** : L'étudiant voit ses compteurs d'absences. S'il a un cours marqué en rouge ("Absent"), il peut cliquer dessus, uploader un justificatif médical (`Justification`). Tant que la direction n'a pas validé, le statut reste "En cours de traitement" (`PENDING`).

---

## Conclusions sur l'Architecture (Zero-Trust)
Le produit s'appuie sur une conception forte pour éviter les erreurs et triches :
1. **Anti-conflits natif** : On ne peut pas mettre 2 profs au même endroit (la BDD empêche les conflits d'emploi du temps).
2. **Anti-triche d'émargement** : L'étudiant ne peut pas tricher sur l'appel (le QR code tourne en boucle).
3. **Géofencing** : L'enseignant ne peut pas lancer l'appel depuis chez lui (il doit être dans le rayon GPS de la salle).
4. **Conservation de l'historique** : La scolarité ne perd pas l'historique : si une matière change de nom l'année prochaine, cela ne modifiera pas les bulletins des années passées car la théorie et la pratique sont formellement séparées.
