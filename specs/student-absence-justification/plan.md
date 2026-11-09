# Plan : demande de justification d'absence par l'étudiant

## Contexte

Permettre à l'étudiant de déposer une demande de justification liée à une séance,
de suivre son traitement, et permettre à la Direction de rendre une décision.
Le dépôt seul ne suffit pas : sans traitement de la demande, le statut ne peut
pas évoluer vers `EXCUSED`.

Le dépôt contient déjà le modèle Prisma `Justification`, ses statuts, le champ
de motif et les champs de décision dans
`apps/web/prisma/schemas/attendance.prisma`. Le SQL
`apps/web/prisma/post-migrate/50_attendance.sql` contient aussi un index unique
partiel pour limiter à une demande `PENDING` par séance et étudiant. En
revanche, aucune query/action applicative utilisant `prisma.justification` ni
aucune page de décision Direction n'a été trouvée.

La page étudiant d'historique existe déjà à
`apps/web/src/app/(app)/[slug]/student/attendance/page.tsx`; elle affiche les
présences, mais n'offre pas encore de parcours de demande.

## Propriété des modèles

| Modèle | Service owner | Utilisation prévue |
|---|---|---|
| `Justification` | `attendance` (modèle défini dans `attendance.prisma`) | Création, consultation et décision de la demande |
| `Attendance` | `attendance` | Lecture du statut courant; passage à `EXCUSED` après approbation |
| `Schedule` | `schedule` | Vérification de l'appartenance, éligibilité et détails de la séance |
| `Student` / inscription | `student` | Résolution du périmètre de l'étudiant depuis l'identité authentifiée |
| `Document` | Domaine propriétaire à identifier avant implementation | Métadonnées de la pièce justificative obligatoire; fichier stocké en bucket privé Supabase |

`orgId`, `studentId` et `declaredById` sont dérivés côté serveur de
l'authentification; ils ne sont jamais acceptés du formulaire.

## Arborescence proposée

### Service `attendance`

- `apps/web/src/services/attendance/database/justification.queries.ts` —
  contexte de demande étudiant et file de demandes Direction.
- `apps/web/src/services/attendance/database/justification.mutations.ts` —
  dépôt atomique et décision atomique.
- `apps/web/src/services/attendance/database/attendance.mutations.ts` —
  intégrer les demandes approuvées au flux de clôture si l'étudiant est absent.
- `apps/web/src/services/attendance/database/index.ts` — exporter les nouvelles
  queries/mutations.
- `apps/web/src/services/attendance/validation.ts` — schémas Valibot de dépôt
  et décision.
- `apps/web/src/services/attendance/actions/justification.queries.ts` —
  actions étudiant et Direction en lecture.
- `apps/web/src/services/attendance/actions/justification.mutations.ts` —
  actions de dépôt étudiant et de décision Direction.
- `apps/web/src/services/attendance/actions/index.ts` — exporter les actions.
- `apps/web/src/services/attendance/cache.ts` et
  `apps/web/src/cache/server/key.ts` — invalider l'historique et les vues
  concernées après dépôt/décision, selon le cache réellement utilisé.
- `apps/web/src/services/attendance/CLAUDE.md` —
  documenter le workflow Justification.
- `apps/web/src/services/SERVICE_CONTEXT.md` — enregistrer explicitement
  `Justification` sous le propriétaire `attendance`.

### Interface étudiant

- `apps/web/src/app/(app)/[slug]/student/attendance/[scheduleId]/justify/page.tsx`
  — page RSC du dépôt et du suivi d'une demande.
- `apps/web/src/components/student/attendance/JustificationForm.tsx` —
  formulaire et rendu de l'état de la demande.
- La vue planning étudiant et/ou le détail d'une séance à venir — point d'entrée
  vers la demande avant le début du cours. Ne pas placer le lien uniquement sur
  une ligne `ABSENT` de l'historique, puisque le dépôt est limité à l'avant-cours.
- `apps/web/src/components/student/attendance/AttendanceView.tsx` — afficher
  l'état d'une demande liée à l'historique si disponible; pas de création depuis
  une séance déjà commencée.
- Hook sous `apps/web/src/hooks/data/attendance/` pour les mutations/actions
  consommées par le composant client, après lecture des conventions des hooks.

### Interface Direction — nécessaire pour le parcours complet

- Page sous
  `apps/web/src/app/(app)/[slug]/direction/attendance/justifications/` —
  file à traiter.
- Composant de liste/décision sous
  `apps/web/src/components/direction/attendance/` ou le dossier voisin déjà
  utilisé par les pages Direction.
- Ajouter un accès dans la navigation Direction après vérification de sa
  structure actuelle.

### Schéma et migrations

- Aucun nouveau modèle ni changement de schéma n'est prévu au départ.
- Vérifier que l'index partiel existant est bien appliqué dans les
  environnements concernés. Ne pas créer un doublon.
- Une évolution du schéma ou un SQL post-migrate ne sera ajouté que si les
  décisions produit ou les tests révèlent un besoin réel.

## Phase 0 — Décisions produit confirmées

- Dépôt par l'étudiant uniquement, avant l'heure planifiée de début du cours.
- Parcours complet étudiant + décision Direction; pas de dépôt enseignant ou
  parent dans cette livraison.
- Pièce obligatoire : PDF/JPG/PNG, 10 Mo maximum, bucket privé Supabase.
- Nouvelle demande illimitée après chaque rejet; une seule demande `PENDING`
  simultanée par séance/étudiant.
- Commentaire de décision facultatif.

## Phase 1 — Queries et mutations `attendance`

### Queries

1. `getStudentJustificationContext(scheduleId, studentId, orgId)` :
   retourner uniquement les informations nécessaires au formulaire
   (cours, date/horaires, statut Attendance, demande de justification existante)
   après vérification que la séance appartient à l'organisation et que
   l'étudiant y est inscrit/dans le groupe visé.
2. `getStudentJustifications(studentId, orgId)` ou enrichissement ciblé de
   `getStudentAttendances` : exposer le statut de justification et le commentaire
   de décision dans l'historique étudiant, sans requête par ligne.
3. `getPendingJustifications(orgId, filters)` : fournir à la Direction la file
   des demandes `PENDING`, les détails de séance/étudiant et les métadonnées de
   pièces si les pièces sont retenues.
4. Chaque query utilise un `select` explicite et vérifie le scope tenant.

### Mutations

1. `createJustification(...)` :
   - vérifier à nouveau l'éligibilité et l'appartenance dans la transaction;
   - vérifier que `schedule.startTime` est encore dans le futur au moment de
     l'enregistrement, pas uniquement lors du chargement du formulaire;
   - insérer `Justification` avec `status: PENDING`, `studentId`, `orgId`,
     `scheduleId`, `declaredById` et motif;
   - s'appuyer sur l'index unique partiel existant pour la concurrence et
     convertir proprement le conflit en erreur métier;
   - autoriser une nouvelle demande après rejet, sans limite de tentatives;
   - ne pas modifier `Attendance` au dépôt.
2. `reviewJustification(...)` :
   - transition permise seulement depuis `PENDING` vers `APPROVED` ou `REJECTED`;
   - enregistrer `reviewedById`, `reviewedAt` et le commentaire;
   - appliquer `EXCUSED` seulement si la séance est terminée et que l'étudiant
     est effectivement absent; une approbation anticipée ne doit pas écraser une
     présence `PRESENT` ou `LATE`;
   - si l'étudiant assiste finalement au cours après approbation anticipée,
     conserver la justification en `APPROVED` comme historique et conserver le
     statut réel `PRESENT`/`LATE` dans `Attendance`;
   - préserver la présence d'origine comme trace d'audit si le mécanisme
     d'audit du projet le requiert.
3. Après rejet, autoriser une nouvelle demande sans limite. L'index unique
   partiel existant garantit une seule demande `PENDING` à la fois, mais ne
   limite pas le nombre de demandes rejetées/historiques.

## Phase 2 — Actions serveur

- Toutes les actions renvoient strictement `{ data } | { error: string }`.
- Dépôt et lecture étudiant : `authAccess({ requiredRole: "STUDENT" })`;
  obtenir `studentId` depuis `auth.data.user.organization.studentId`.
- Lecture et décision Direction : `authAccess({ requiredRole: ["DIRECTION",
  "ADMIN"] })`; obtenir `orgId` et l'identité du décideur du token.
- Valider tous les paramètres entrants avec Valibot; ne jamais faire confiance
  à un `orgId`, `studentId`, `declaredById` ou rôle envoyé par le client.
- Noms envisagés : `getStudentJustificationContextAction`,
  `createStudentJustificationAction`, `getPendingJustificationsAction`,
  `reviewJustificationAction`.
- Ajouter les fichiers à `actions/index.ts` et garder les accès Prisma dans
  `database/`.

## Phase 3 — Frontend étudiant

1. Ajouter le lien de demande au planning ou au détail des séances à venir,
   uniquement avant le début prévu du cours. L'historique des séances passées
   sert au suivi de l'état, pas au dépôt.
2. Créer la page RSC avec `await connection()` avant les accès dynamiques,
   charger le contexte via l'action, puis afficher cours, date, statut et
   éventuelle demande existante.
3. Le formulaire collecte le motif et une pièce obligatoire (PDF, JPG ou PNG,
   10 Mo maximum). Envoyer le fichier vers un bucket privé Supabase dédié via
   un flux d'upload autorisé et scoped côté serveur, puis enregistrer ses
   métadonnées dans `Document` avec `resourceType: JUSTIFICATION`; conserver
   uniquement le chemin privé, jamais une URL signée permanente.
4. Le composant client appelle les actions via un hook
   `apps/web/src/hooks/data/attendance/`, jamais directement une server action.
5. Afficher clairement les états `PENDING`, `APPROVED`, `REJECTED` et `CANCELED`,
   le commentaire de la Direction et les règles de nouvelle soumission.
6. Invalider/rafraîchir l'historique après dépôt; après approbation, refléter
   `EXCUSED`.

## Phase 4 — Frontend Direction

1. Ajouter une file des demandes en attente scoped par `orgId`.
2. Permettre l'examen du motif et des pièces par URL signée à durée limitée.
3. Permettre approuver ou rejeter; commentaire facultatif.
4. Mettre à jour la file et le dossier de présence après décision.

## Phase 5 — Cache et audit

- Ajouter les événements de cache nécessaires pour invalidation après dépôt et
  décision. Vérifier si l'historique actuel est caché avant d'ajouter des tags.
- Après approbation, les vues Attendance, taux et rapports doivent refléter
  `EXCUSED`; confirmer leurs tags/invalidation existants.
- Auditer le dépôt et la décision selon la convention des actions critiques et
  le service `audit`; ne pas enregistrer le contenu sensible d'une pièce dans
  les logs.
- Si notifications activées, notifier l'étudiant après décision. Ce point est
  facultatif et dépend de la politique de notification existante.

## Phase 6 — Tests et vérifications

- Tests unitaires de validation et des transitions d'état.
- Tests DB/intégration : scope org/étudiant, inscription à la séance, doublon
  concurrent `PENDING`, rejet sans modification de présence, resoumission après
  rejet, approbation anticipée suivie d'une présence effective, et approbation
  appliquant `EXCUSED` seulement à une absence réelle lors de la clôture.
- Tests d'interface des états vide, éligible, en attente, approuvé et rejeté.
- Depuis `apps/web/` :

```bash
bun run check:naming:svc -- attendance
bun run check:types:svc -- attendance
bun run generate:types:svc -- attendance
bun run generate:api:svc -- attendance
bun run api:check
```

- Exécuter également les tests ciblés d'`attendance`, le contrôle TypeScript et
  `git diff --check`.
- Générer les types/API seulement après stabilisation des signatures.

## Décisions retenues et questions restantes

Les décisions produit suivantes sont tranchées :

1. **Éligibilité et rôle** : l'étudiant peut demander une justification
   uniquement avant l'heure planifiée de début du cours. Cette première
   implémentation ne couvre pas les dépôts après le début du cours, ni les
   dépôts par un enseignant ou un parent.
2. **Périmètre** : inclure le parcours étudiant et le traitement Direction,
   afin qu'une demande puisse être approuvée ou rejetée.
3. **Pièce** : obligatoire; formats PDF/JPG/PNG, taille maximale 10 Mo;
   stockage dans un bucket privé dédié Supabase et métadonnées dans `Document`.
4. **Nouvelle demande** : illimitée après chaque rejet. L'index de
   `50_attendance.sql` ne permet qu'une demande `PENDING` par séance/étudiant
   à un instant donné; il ne plafonne pas le nombre de dépôts après rejet.
5. **Commentaire de décision** : facultatif.

### Questions techniques restantes

- Identifier le service propriétaire du modèle `Document` et ses helpers
  d'upload/lecture avant l'implémentation. Le client Supabase existe et d'autres
  uploads sont utilisés, mais aucun flux documentaire privé réutilisable n'a
  été identifié.
- Définir les règles RLS/accès du bucket privé et le mécanisme de création et
  consommation des URL signées pour étudiant et Direction.

## Risques / décisions

| Décision proposée | Alternative écartée | Risque |
|---|---|---|
| Réutiliser `Justification` existant dans le service `attendance`; pas de nouveau modèle prévu | Créer un service Justification séparé | Duplication du domaine et déplacement inutile d'un modèle déjà défini dans le schéma attendance |
| Autoriser le dépôt étudiant seulement avant l'heure de début planifiée; inclure Direction mais pas dépôt enseignant/parent | Accepter les demandes après le cours et depuis plusieurs rôles dès la première version | Une fenêtre trop permissive ou un mauvais rôle pourrait permettre de modifier le dossier d'assiduité hors du parcours voulu |
| Garder le statut Attendance inchangé au dépôt; appliquer `EXCUSED` à la clôture seulement si l'étudiant est réellement absent; conserver `PRESENT`/`LATE` et la demande `APPROVED` si l'étudiant participe | Passer immédiatement à `EXCUSED` lors du dépôt ou de l'approbation | Le taux serait faussé si la demande est en attente ou si l'étudiant assiste au cours |
| Transactionner ensemble la décision et toute mise à jour Attendance déclenchée par celle-ci | Écritures séparées | État `APPROVED` sans mise à jour d'assiduité cohérente |
| Inclure la modération Direction dans la livraison fonctionnelle | Livrer seulement le formulaire étudiant | Demandes `PENDING` sans chemin de traitement |
| Pièce obligatoire PDF/JPG/PNG ≤ 10 Mo, bucket privé Supabase, stockage du chemin dans `Document` | Stocker la pièce dans un champ libre ou une URL publique | Fuite de données personnelles/médicales ou accès non autorisé aux justificatifs |
| Commentaire de décision facultatif; nouvelles demandes sans limite après rejet | Bloquer toute resoumission ou limiter à un dépôt total | Refus de prise en compte d'un nouveau justificatif; le système doit néanmoins prévenir les demandes PENDING concurrentes |
