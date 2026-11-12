# Notifications de planning — suivi et validation

> **Statut : lots 1 et 2 implémentés.**

## 1. Fonction dédiée `notifyScheduleStakeholders`

**Décision : une fonction commune dans `services/schedule/notifications.ts`.**

`notifyInvitationStakeholders` fournit bien le précédent demandé : fonction
hors `"use server"`, collecte des destinataires dans un `Set`, `Promise.allSettled`
et erreurs absorbées :
[`apps/web/src/modules/invitation/notifications.ts`](../../apps/web/src/modules/invitation/notifications.ts#L32).

Les trois fonctions de planning ne sont pas toutes de même nature :

- `notifyScheduleChange` et `notifyScheduleCreation` sont privées et n'ont
  aucun appelant externe au fichier.
- `notifyScheduleCreationAction` et `notifyScheduleCreationsAction` sont des
  actions exportées. Elles n'ont pas d'appelant retrouvé dans `apps/web/src`,
  mais sont exposées par le barrel d'actions. Les supprimer changerait donc
  l'API du service, même si aucun usage UI direct n'a été trouvé.
- `notifyAssignedTeacher` n'existe pas encore.

Déplacer l'émission dans `apps/web/src/services/schedule/notifications.ts`,
sans directive `"use server"`. Garder
`notifyScheduleCreationAction` et `notifyScheduleCreationsAction` comme
wrappers minces vers `notifyScheduleStakeholders({ ..., event: "CREATED" })`,
sans logique d'envoi propre. Leur retrait éventuel est une décision séparée.

Forme indicative :

```ts
export type ScheduleNotifyAudience = "ALL" | "STUDENTS_AND_PARENTS";

export type ScheduleNotifyEvent =
  "CREATED" | "CONFIRMED" | "UPDATED" | "CANCELED";

export type ScheduleNotifyBefore = {
  confirmed?: boolean;
  status?: ScheduleStatus;
  teacherUserId?: string | null;
};

export type ScheduleNotifyParams =
  | {
      scheduleId: string;
      orgId: string;
      event: "CREATED";
      audience?: ScheduleNotifyAudience;
    }
  | {
      scheduleId: string;
      orgId: string;
      event: "CONFIRMED" | "UPDATED" | "CANCELED";
      before: ScheduleNotifyBefore;
    };

export async function notifyScheduleStakeholders(
  params: ScheduleNotifyParams,
): Promise<{ announced: boolean }> {
  // announced indique seulement que le claim a été obtenu.
}
```

`before` est absent pour `CREATED` et obligatoire pour `CONFIRMED`, `UPDATED`
et `CANCELED`. Le snapshot comprend `confirmed`, `status` et l'ancien
`teacherUserId`. L'action le lit avant sa mutation, détermine `event`, puis le
transmet à `notifyScheduleStakeholders`. La fonction relit l'état courant et
les destinataires après mutation, mais ne relit pas l'état « avant ».

- Un seul événement est traité par mutation.
- `CREATED` : notifier l'enseignant; élèves et parents seulement si la séance
  est confirmée.
- `CONFIRMED` : à la transition `false → true`, envoyer uniquement cet
  événement aux élèves et parents, même si d'autres champs changent en même
  temps.
- `UPDATED` et `CANCELED` : notifier l'enseignant; élèves et parents seulement
  si la séance était confirmée avant la mutation.
- Si la mutation demande `status: "CANCELED"` et confirme simultanément la
  séance, `CANCELED` prime sur `CONFIRMED`.
- Dédupliquer par `userId` dans un seul `Set`.
- Respecter le réglage `parentalNotifications`.
- Utiliser `metadata: { kind: "schedule", scheduleId, event }`.
- Utiliser `Promise.allSettled` et absorber les erreurs de livraison.
  Pas de bilan `{ failed }` ni de retry : c'est une tentative best-effort, pas
  une garantie de livraison.
- Les wrappers manuels appellent l'événement `CREATED` avec une audience
  restreinte élèves/parents, sans prévenir de nouveau l'enseignant.
- Au lot 1, les wrappers délèguent à `CREATED` avec
  `audience: "STUDENTS_AND_PARENTS"` et vérifient `confirmed` via
  `getScheduleForNotify`; une séance non confirmée n'est pas envoyée ni
  marquée `SENT`. Ils ne détectent pas une annonce antérieure.
- Au lot 2, ils utilisent le claim avant d'annoncer.

Le paramètre `audience?: "ALL" | "STUDENTS_AND_PARENTS"` n'existe que sur la
variante `event: "CREATED"` de `ScheduleNotifyParams`, avec `"ALL"` par défaut.
Les autres événements n'acceptent pas ce paramètre dans le type; les deux
wrappers manuels passent `"STUDENTS_AND_PARENTS"`.

Les wrappers délèguent uniquement à `CREATED` avec l'audience élèves/parents.
Ils n'envoient rien si la séance n'est pas confirmée et le claim bloque toute
annonce déjà déclenchée. `notifyScheduleStakeholders` retourne
`{ announced: boolean }`, qui indique seulement si le claim a été obtenu;
ce n'est jamais un bilan de livraison.

## 2. Contrat d'envoi best-effort

**Décision actée : pas de bilan `{ failed }`, pas de retry, pas de livraison garantie.**

`sendPushNotificationToUserById` persiste d'abord la notification en base,
puis cherche les appareils actifs. Sans appareil actif, il retourne
`{ success: false, error: "Aucun appareil abonné actif" }` après cette
persistance. Il renvoie aussi `success: false` si VAPID n'est pas configuré,
mais dans ce cas le contrôle VAPID arrive **avant** la persistance.
Voir
[`apps/web/src/modules/notification/user.ts`](../../apps/web/src/modules/notification/user.ts#L220).

En outre, les échecs individuels de `sendToDevice` sont consommés par
`Promise.allSettled`; la fonction peut ensuite retourner `success: true`.
`notifyParentsForStudents` retourne `void` et compte uniquement les promesses
rejetées, pas les réponses résolues avec `success: false` :
[`apps/web/src/services/parent/notifications.ts`](../../apps/web/src/services/parent/notifications.ts#L14).

`success: false` ne signifie donc pas nécessairement que la notification
persistante a échoué. En particulier, sans abonnement push actif, la ligne en
base existe déjà. Un total `{ failed }` ne mesurerait pas la persistance réelle
des notifications. La fonction de planning adopte le contrat best-effort sans
retry inspiré du flux invitation.

Avec VAPID absent ou une erreur avant création en base, le message n'est pas
persisté; sans retry, il est perdu. Le contrat est donc « tentative best-effort
sans retry », pas « livraison garantie ».

## 3. `confirmed` et choix d'un événement par mutation

**Décision actée.**

Le commentaire Prisma confirme que seules les séances confirmées sont visibles
aux élèves; la valeur par défaut est `false`. Les formulaires de planning
initialisent aussi `confirmed` à `false` :
[`apps/web/prisma/schemas/schedule.prisma`](../../apps/web/prisma/schemas/schedule.prisma#L22),
[`apps/web/src/components/planning/coursePlanning/formState.ts`](../../apps/web/src/components/planning/coursePlanning/formState.ts#L26),
[`apps/web/src/components/planning/coursePlanning/submit.ts`](../../apps/web/src/components/planning/coursePlanning/submit.ts#L75).

Règles de destinataires élèves/parents :

- `CREATED` : seulement si `schedule.confirmed === true`.
- `CONFIRMED` : seulement sur la transition `before.confirmed === false` vers
  `schedule.confirmed === true`. C'est l'unique événement de cette mutation,
  même si d'autres champs changent.
- `UPDATED` ou `CANCELED` : seulement si `before.confirmed === true`; l'état
  après mutation ne participe pas à cette condition.
- `confirmed: true → false` : aucune notification élèves/parents dans ces lots.
- Une mutation `UPDATED` n'est notifiée que si elle change un champ
  significatif. `CONFIRMED` et `CANCELED` restent des événements distincts et
  ne dépendent pas de ce filtre.

Exemple de sélection d'événement pour une mise à jour (le snapshot `before`
est requis) :

```ts
const event =
  data.status === "CANCELED"
    ? "CANCELED"
    : before.confirmed === false && schedule.confirmed === true
      ? "CONFIRMED"
      : "UPDATED";

const significant =
  data.roomId !== undefined ||
  data.teacherId !== undefined ||
  data.startTime !== undefined ||
  data.endTime !== undefined ||
  data.courseId !== undefined;

if (event !== "UPDATED" || significant) {
  await notifyScheduleStakeholders({ scheduleId, orgId, event, before });
}
```

Décision actée : `CANCELED` prime sur la transition `false → true`, afin de ne
pas annoncer un nouveau cours qui est déjà annulé. Dans ce cas, les
élèves/parents reçoivent le message d'annulation seulement si
`before.confirmed === true`; sinon, aucun message élèves/parents n'est envoyé.
L'enseignant reçoit la notification d'annulation. Hors annulation, une
transition de confirmation produit un seul `CONFIRMED`, même si horaire, salle
ou enseignant changent dans la même mutation.
`data.status === "CANCELED"` est démontré dans le payload de cette mutation;
la comparaison avec `before.status` évite un nouvel envoi si l'état était déjà
annulé. Utiliser un unique `getScheduleNotificationContext(scheduleId, orgId)`
avant mutation pour lire `confirmed`, `status` et `teacher.userId`.

### Champs significatifs — décision actée

Le filtre actuel de `notifyScheduleChange` inclut une annulation ou un
changement de `roomId`, `teacherId`, `startTime` ou `endTime`; il ignore
`notes` et `courseId`
([`schedule.mutations.ts`](../../apps/web/src/services/schedule/actions/schedule.mutations.ts#L34)).
Le schéma autorise `courseId` dans une mise à jour
([`validation.ts`](../../apps/web/src/services/schedule/validation.ts#L32)).
L'UI de planning envoie les champs modifiés après un `diff` du payload
([`usePlanningEvents.ts`](../../apps/web/src/components/planning/hook/usePlanningEvents.ts#L129)).
Le filtre serveur actuel teste la présence des champs dans le payload, pas
l'égalité entre les valeurs avant et après mutation.

**Décision :** `roomId`, `teacherId`, `startTime`, `endTime` et `courseId`
sont significatifs pour `UPDATED`. `notes` n'est pas significatif. Un
changement de classe ou de groupe entraîne l'annulation puis la reprogrammation
de la séance, pas une mise à jour de celle-ci.

## 4. Claim `notifyState` pour l'annonce élèves/parents

**Implémenté au lot 2.**

Le champ nullable n'a que `PENDING` et `SENT`; `createSchedule` écrit
`PENDING`, et la récurrence par `createMany` le laisse `null`. Aucun autre
lecteur/écrivain applicatif n'a été trouvé. Références :
[`apps/web/prisma/schemas/schedule.prisma`](../../apps/web/prisma/schemas/schedule.prisma#L41),
[`apps/web/src/services/schedule/database/schedule.mutations.ts`](../../apps/web/src/services/schedule/database/schedule.mutations.ts#L20),
[`apps/web/src/services/weekly-template/database/weekly-template.mutations.ts`](../../apps/web/src/services/weekly-template/database/weekly-template.mutations.ts).

Le claim conditionnel devra accepter les deux états. La mutation Prisma reste
dans `schedule/database/`; `schedule/notifications.ts` orchestre l'annonce en
appelant cette primitive :

```ts
export async function claimScheduleAnnouncement(
  scheduleId: string,
  orgId: string,
): Promise<boolean> {
  const result = await prisma.schedule.updateMany({
    where: {
      id: scheduleId,
      orgId,
      OR: [{ notifyState: "PENDING" }, { notifyState: null }],
    },
    data: { notifyState: "SENT", notifiedAt: new Date() },
  });
  return result.count === 1;
}

if (!(await claimScheduleAnnouncement(scheduleId, orgId))) return;
// Émettre ici l'annonce élèves/parents uniquement.
```

Le claim protège **uniquement** l'annonce élèves/parents pour `CREATED`
confirmée ou `CONFIRMED`. Il ne protège ni les push enseignant, ni les
événements `UPDATED`/`CANCELED`. Il couvre les séances classiques (`PENDING`)
et les séances issues de `createMany` (`null`) au moment de leur confirmation;
aucune modification de `weekly-template` n'est nécessaire pour ce cas.
Il n'autorise qu'une annonce par séance : après une annonce déjà revendiquée,
une déconfirmation puis reconfirmation sera aussi bloquée par `SENT`.
Si le claim d'un `CREATED` confirmé est refusé, l'annonce élèves/parents est
ignorée mais la notification enseignant reste envoyée.

`SENT` signifie « annonce élèves/parents déclenchée », pas « notification
livrée ». L'état est revendiqué avant envoi : en cas de crash après le claim,
il n'y aura pas de retry. Le commentaire du champ Prisma documente cette
sémantique; aucun nouvel état ni migration n'est ajouté.

`notifyScheduleStakeholders` retourne `{ announced: boolean }` :
`true` signifie que l'appel a obtenu le claim conditionnel; `false` signifie
qu'il ne l'a pas obtenu. Ce résultat décrit uniquement l'état du claim avant
l'envoi; il ne certifie ni la persistance ni la livraison des notifications.
Il n'est utilisé que pour les événements avec claim (`CREATED` confirmé /
`CONFIRMED`), pas pour les push enseignant ou `UPDATED` / `CANCELED`.

Les actions manuelles `notifyScheduleCreationAction` et
`notifyScheduleCreationsAction` restent des wrappers vers `CREATED`, passent
`audience: "STUDENTS_AND_PARENTS"` et n'ajoutent pas de logique d'envoi
parallèle. Les deux vérifient `confirmed`; l'action unitaire renvoie une erreur
claire pour `NOT_FOUND`, `NOT_CONFIRMED` et `ALREADY_ANNOUNCED`, tandis que
l'action batch expose `{ succeeded, skipped }`.

Après livraison du flux automatique et du claim, le bouton manuel ne servira
plus qu'aux séances préexistantes, confirmées et encore `PENDING` ou `null`.
Les nouvelles séances confirmées seront annoncées à la création; les séances
créées non confirmées le seront à leur confirmation. Une séance déjà revendiquée
sera ignorée comme `ALREADY_ANNOUNCED`.

Le résultat de l'action batch est :

```ts
type ScheduleNotificationSkipReason =
  "NOT_FOUND" | "NOT_CONFIRMED" | "ALREADY_ANNOUNCED";

type NotifyScheduleCreationsResult = {
  succeeded: number;
  skipped: { scheduleId: string; reason: ScheduleNotificationSkipReason }[];
};
```

`succeeded` compte les claims obtenus, pas les livraisons. Une séance
introuvable, non confirmée ou dont le claim est déjà pris est reportée dans
`skipped`; un échec best-effort de livraison ne devient pas un échec de claim.

### Risque transitoire du lot 1 — résolu au lot 2

Avant le lot 2, aucune revendication atomique n'empêchait deux appels
d'annoncer la même séance. Le claim atomique PENDING/null → SENT empêche
désormais les doublons entre l'annonce automatique et l'action manuelle.

## 5. Enseignant et réaffectation

**Décision actée.**

Notifier l'enseignant pour `CREATED`, `UPDATED` et `CANCELED`, indépendamment
de `confirmed`. `Teacher` possède `userId`; ajouter cet identifiant au select
du résultat de mutation, sans faire de lookup séparé.

### Mapping des événements, types et messages

| Événement   | Élèves / parents                                                                                                        | Enseignant                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATED`   | `NEW_COURSE` — message existant : « Nouveau cours : `<cours>` le `<jour>`. » si confirmé                                | `NEW_COURSE` — message d'affectation : « Vous êtes affecté au cours `<cours>` le `<jour>`. »                                                                |
| `CONFIRMED` | `NEW_COURSE` — même message de nouveau cours                                                                            | Pas de notification pour la confirmation seule; si elle accompagne une réaffectation, le nouvel enseignant reçoit le message d'affectation dédié ci-dessous |
| `UPDATED`   | `SCHEDULE_UPDATE` — message existant : « Le cours `<cours>` du `<jour>` a été modifié (salle, horaire ou enseignant). » | `SCHEDULE_UPDATE` — message de modification du cours                                                                                                        |
| `CANCELED`  | `SCHEDULE_UPDATE` — message existant : « Le cours `<cours>` du `<jour>` est annulé. »                                   | `SCHEDULE_UPDATE` — message d'annulation du cours                                                                                                           |

Le code existant ne définit que les messages élèves/parents de création et de
modification/annulation; il n'envoie actuellement aucun push enseignant. Les
messages enseignant du tableau sont le contrat d'après les décisions de
notification enseignant consignées ici, pas des modèles déjà présents dans le
code.

Lors d'une réaffectation :

- ancien enseignant : `SCHEDULE_UPDATE`;
- nouvel enseignant : `NEW_COURSE` avec le message dédié
  `Vous êtes affecté au cours <nom> le <jour>.`;
- comparer les `userId` avant de construire les messages. Si `teacherId` change
  mais que `userId` est identique, ce n'est pas une réaffectation côté
  utilisateur : envoyer un seul `SCHEDULE_UPDATE` générique, sans message
  d'affectation.
- Si la réaffectation a lieu dans la même mutation que `confirmed: false → true`,
  le nouvel enseignant reçoit quand même le `NEW_COURSE` dédié. La priorité de
  `CONFIRMED` ne concerne que l'audience élèves/parents; elle ne supprime pas
  l'envoi enseignant.

Le seul `getScheduleNotificationContext(scheduleId, orgId)` avant mutation
doit fournir l'ancien `teacher.userId`, `confirmed` et `status`. Le résultat de
`updateSchedule` donne le nouvel enseignant. À la création, utiliser
`schedule.id` et l'identité de l'enseignant comprise dans le résultat créé.
Les push enseignant ne passent jamais par le claim `notifyState`.

## 6. `cancelScheduleAction`

**Implémenté.**

Réutiliser le résultat de `updateSchedule` pour notifier via
`notifyScheduleStakeholders({ scheduleId, orgId, event: "CANCELED", before })`,
tout en gardant le retour public actuel `{ data: true }`.

Le flux consulte le snapshot avant mutation et n'envoie rien si
`before.status === "CANCELED"`. `cancelScheduleAction` réutilise le résultat de
`updateSchedule` pour l'identifiant et conserve le retour `{ data: true }` :
[`apps/web/src/services/schedule/actions/schedule.mutations.ts`](../../apps/web/src/services/schedule/actions/schedule.mutations.ts#L182).

## 7. Frontières entre services

**Structure implémentée.**

- `attendance/server.ts` exporte `getExpectedAttendees`;
  `schedule/notifications.ts` l'importe depuis `@/services/attendance/server`,
  jamais depuis `attendance/database`.
- Le service parent expose une fonction owner-side qui prend
  `(studentIds, orgId)`, applique le gate `parentalNotifications` et retourne
  les `userId` des parents à notifier. Cette API est exposée par un nouveau
  `services/parent/server.ts`.
- Le réglage `parentalNotifications` appartient au service `org`; le service
  parent le lit via `services/organization/server.ts`, sans accès Prisma direct.
- `notifyScheduleStakeholders` fusionne les IDs retournés dans son `Set`
  commun avec les élèves et enseignants.
- `notifyParentsForStudents` reste en place pour ses autres appelants, sans
  changement de signature.

## 8. Ordre de livraison

### Lot 1 — flux métier

1. Créer `services/schedule/notifications.ts` et
   `notifyScheduleStakeholders` pour les quatre événements.
2. Mettre en place les entrées owner-side attendance et parent définies au §7.
3. Brancher `CREATED` dans `createScheduleAction`, avec `schedule.id`.
4. Brancher `UPDATED` / `CONFIRMED` dans `updateScheduleAction`.
5. Brancher `CANCELED` dans `cancelScheduleAction`.
6. Garder les deux actions manuelles comme wrappers minces vers `CREATED`.
7. Respecter les règles d'audience du §3 et les messages/types du §5.

`getScheduleNotificationContext` retourne le snapshot complet avant mutation.

La recherche dans `apps/web/src` ne trouve aucun appelant des deux actions
manuelles ni aucun consommateur de leur ancien champ `failed`; les usages de
`failed` retrouvés concernent d'autres fonctionnalités.

### Lot 2 — garde-fous

1. Snapshot avant mutation enrichi avec `status` et `teacher.userId`.
2. Notifications de réaffectation, avec messages dédiés et déduplication par
   `userId`; `teacherId` fourni dans les données d'update signale le cas où
   l'ancien et le nouveau profil appartiennent au même utilisateur.
3. Garde-fou d'annulation déjà effective.
4. Claim atomique PENDING/null → SENT pour l'annonce élèves/parents de
   `CREATED` confirmée et `CONFIRMED`; aucune migration, aucun retry.
5. Commentaire Prisma précise que `SENT` signifie « annonce déclenchée ».
6. Tests unitaires du flux et du claim; scénarios métier vérifiés.

## Hors périmètre

- **Déconfirmation `true → false`** : pas de notification élèves/parents dans
  ces lots.
- **`removeScheduleAction`** : soft delete non notifié; décision et traitement
  séparés.
- **Récurrence** : ne pas modifier `weekly-template` dans ces lots. Le claim
  `notifyState` permet toutefois qu'une séance récurrente
  créée avec `notifyState: null` soit annoncée lors de sa confirmation.

## État

- Ce document contient les décisions données par l'utilisateur et leur ordre
  d'application.
- Les lots 1 et 2 sont implémentés; seule la documentation du champ Prisma a
  changé, sans migration ni modification de `weekly-template`.
