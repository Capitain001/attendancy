# Dashboard — Vision produit

## Principe directeur

Le dashboard n'est pas un écran de données. C'est la réponse à une seule question :
**"Qu'est-ce que je dois savoir / faire maintenant ?"**

Chaque rôle a une journée type différente. Le dashboard doit s'y adapter.

---

## Par rôle

### Direction (DIRECTION / PRINCIPAL)

**Job to be done** : piloter l'établissement sans chercher l'information.

L'administrateur arrive le matin et veut savoir si la journée se déroule normalement. Il n'a pas le temps de naviguer entre 5 écrans.

Ce que le dashboard doit lui montrer :

- **Alerte immédiate** : y a-t-il quelque chose qui bloque aujourd'hui ? (enseignant absent non remplacé, salle manquante, conflit de planning détecté)
- **Pouls du jour** : combien de séances sont en cours ? Taux de présence global en temps réel.
- **Signaux faibles** : étudiants avec un taux d'absence critique cette semaine (seuil configurable), classes en difficulté.
- **Prochaine action** : une approbation en attente ? Un rapport à valider ?

Ce qu'il ne doit PAS voir : des compteurs de salles et de cours. C'est de la donnée administrative, pas du pilotage.

---

### Enseignant (TEACHER)

**Job to be done** : savoir ce qu'il a à faire aujourd'hui et gérer sa séance active.

L'enseignant ouvre l'app 5 minutes avant son cours ou en salle.

Ce que le dashboard doit lui montrer :

- **Prochaine séance** : dans combien de temps, quelle salle, quel groupe. Bouton direct "Démarrer l'appel".
- **Séance en cours** (si active) : nombre de présents / absents en temps réel, bouton pour clôturer.
- **Planning de la semaine** : vue 5 jours, ses cours uniquement.
- **Absents récurrents** : étudiants qui manquent souvent ses cours (signal pour alerte parentale).

Ce qu'il ne doit PAS voir : des métriques d'organisation, des stats globales. Ce n'est pas son périmètre.

---

### Étudiant (STUDENT)

**Job to be done** : ne pas rater de cours, suivre son assiduité.

Ce que le dashboard doit lui montrer :

- **Prochain cours** : heure, salle, matière. Sans chercher.
- **Mon taux d'assiduité** : simple, visuel, par matière. Alerte si proche du seuil.
- **Planning de la semaine** : ses séances uniquement.
- **Justification en attente** : a-t-il une absence non justifiée à traiter ?

Ce qu'il ne doit PAS voir : les données des autres étudiants, les métriques d'établissement.

---

### Parent (PARENT)

**Job to be done** : suivre l'assiduité de son enfant sans être noyé d'informations.

Ce que le dashboard doit lui montrer :

- **Résumé de la semaine** : présent / absent cette semaine, par enfant si plusieurs.
- **Dernière absence** : date, matière, justifiée ou non.
- **Alerte** : notification si taux d'absence dépasse un seuil.

Ce qu'il ne doit PAS voir : le planning détaillé (c'est un écran à part), les données de l'établissement.

---

## Ce que tout dashboard doit respecter

1. **Une seule action primaire par rôle** — le bouton le plus important est visible sans scroll.
2. **Pas de chiffres sans contexte** — "47 présents" ne veut rien dire sans "sur 52 attendus".
3. **L'état vide est une information** — si tout va bien, le dire explicitement ("Aucune alerte aujourd'hui").
4. **Temps réel ≠ tout rafraîchir** — seules les données critiques (séance en cours, absences du jour) sont temps réel. Le reste peut être mis en cache.
5. **Mobile first** — l'enseignant et l'étudiant utilisent l'app sur téléphone, en salle.

---

## Ce que le dashboard n'est PAS

- Une page de statistiques (→ section Rapports)
- Une liste exhaustive de ressources (→ section Administration)
- Un clone du dashboard direction pour tous les rôles

---

## Priorité d'implémentation

| Priorité | Rôle | Raison |
|----------|------|--------|
| P1 | Direction | Décideur, valide le produit |
| P2 | Enseignant | Utilisateur quotidien, adoption critique |
| P3 | Étudiant | Volume, mais usage passif |
| P4 | Parent | Consultation ponctuelle |
