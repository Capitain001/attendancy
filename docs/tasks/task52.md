# Plan final (v8) : refonte des notifications

Ce plan intègre toutes les décisions : `resourceType` + `resourceId` + `event` en relation libre, plus de `scheduleId`, `orgId` nullable, `INVITATION` dans `Resource`, index allégés. Il y a aussi un ajustement sur une contrainte (voir §3) et quelques points à vérifier (voir §7).

## 1. Schéma Prisma

```prisma
// Notification in-app. Cycle de vie porté par read — pas de soft delete.
// resourceType + resourceId : relation libre vers la ressource concernée
// (même contrat que Document : pas de FK, intégrité vérifiée à l'écriture).
// event : ce qui s'est passé. orgId : cloisonne les vues admin (User est global).
// Tout est nullable : une notification système n'a ni ressource ni org.
model Notification {
  id           String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String             @db.Uuid
  orgId        String?            @db.Uuid
  message      String
  resourceType Resource?
  resourceId   String?            @db.Uuid
  event        NotificationEvent?
  read         Boolean            @default(false)
  metadata     Json?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization?      @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([orgId, createdAt(sort: Desc)])
  @@index([resourceType, resourceId])
  @@schema("public")
}

enum NotificationEvent {
  CREATED
  UPDATED
  CANCELED
  CONFIRMED
  ASSIGNED
  UNASSIGNED

  @@schema("public")
}

enum Resource {
  // ... existant
  INVITATION

  @@schema("public")
}
```

Autres changements de schéma :

- `Organization` : ajouter `notifications Notification[]` (purge RGPD).
- `Schedule` : retirer la back-relation `notifications Notification[]`.
- `NotificationType` : supprimé à la fin (migration C).

## 2. Index

Le jeu final contient trois index Prisma :

- `[userId, createdAt DESC]` pour l'inbox et la liste ;
- `[orgId, createdAt DESC]` pour les vues admin ;
- `[resourceType, resourceId]` pour marquer comme lues ou purger par ressource.

Pour le badge et la liste des non lues, un index partiel optionnel en post-migrate, à ajouter si `EXPLAIN ANALYZE` montre que le `count` ralentit :

```sql
CREATE INDEX notification_unread_idx
  ON "public"."Notification" ("userId", "createdAt" DESC)
  WHERE read = false;
```

## 3. Contrainte (ajustée)

J'ai changé la contrainte `notification_resource_pair` du message précédent. Elle imposait « type et id vont ensemble », ce qui obligeait à effacer `resourceType` sur les anciennes notifications d'absence ou de message qui n'ont pas de cible. La version suivante est plus souple : un `resourceId` exige un `resourceType`, mais pas l'inverse.

```sql
-- post-migrate
ALTER TABLE "public"."Notification"
  ADD CONSTRAINT notification_resource_id_needs_type
  CHECK ("resourceId" IS NULL OR "resourceType" IS NOT NULL);
```

Les anciennes lignes gardent leur icône par type, et il n'y a plus qu'une seule contrainte.

## 4. Migrations

Pour que Prisma génère le diff, utilise `prisma migrate dev --create-only`, puis édite le fichier SQL pour y insérer le backfill. Au temps 1, le schéma doit encore contenir `type` et `scheduleId`.

**Migration A : enums** (séparée : une valeur d'enum ajoutée ne s'utilise pas dans la même transaction)

```sql
ALTER TYPE "public"."Resource" ADD VALUE 'INVITATION';
CREATE TYPE "public"."NotificationEvent" AS ENUM
  ('CREATED','CONFIRMED','UPDATED','CANCELED','UNASSIGNED');
```

**Migration B : expand + backfill**

```sql
ALTER TABLE "public"."Notification"
  ADD COLUMN "resourceType" "public"."Resource",
  ADD COLUMN "resourceId" uuid,
  ADD COLUMN "event" "public"."NotificationEvent",
  ADD COLUMN "orgId" uuid
    REFERENCES "public"."Organization"(id) ON DELETE CASCADE;

-- resourceType depuis l'ancien type
UPDATE "public"."Notification" SET "resourceType" = CASE "type"
  WHEN 'NEW_COURSE'      THEN 'SCHEDULE'::"public"."Resource"
  WHEN 'SCHEDULE_UPDATE' THEN 'SCHEDULE'
  WHEN 'COURSE_CHANGE'   THEN 'SCHEDULE'
  WHEN 'ABSENCE'         THEN 'ATTENDANCE'
  WHEN 'MESSAGE'         THEN 'MESSAGE'
  WHEN 'INVITATION'      THEN 'INVITATION'
  ELSE NULL END;

-- ressource : dès qu'une séance est liée, c'est elle la cible
-- (écrase ATTENDANCE pour les anciennes absences liées à une séance)
UPDATE "public"."Notification"
SET "resourceType" = 'SCHEDULE', "resourceId" = "scheduleId"
WHERE "scheduleId" IS NOT NULL;

-- event : d'abord depuis metadata (déjà écrit par onScheduleEvent)
UPDATE "public"."Notification"
SET "event" = (metadata->>'event')::"public"."NotificationEvent"
WHERE metadata->>'event' IN ('CREATED','CONFIRMED','UPDATED','CANCELED');

-- event : fallback sur l'ancien type
UPDATE "public"."Notification" SET "event" = CASE "type"
  WHEN 'NEW_COURSE'      THEN 'CREATED'::"public"."NotificationEvent"
  WHEN 'SCHEDULE_UPDATE' THEN 'UPDATED'
  WHEN 'COURSE_CHANGE'   THEN 'UPDATED'
  END
WHERE "event" IS NULL AND "type" IN ('NEW_COURSE','SCHEDULE_UPDATE','COURSE_CHANGE');

-- orgId : via la séance (source fiable)
UPDATE "public"."Notification" n
SET "orgId" = s."orgId"
FROM "public"."Schedule" s
WHERE n."scheduleId" = s.id;

-- orgId : reste, seulement si l'user n'a qu'une organisation
UPDATE "public"."Notification" n
SET "orgId" = uo."orgId"
FROM (
  SELECT "userId", min("orgId"::text)::uuid AS "orgId"
  FROM "public"."UserOrganization"
  GROUP BY "userId"
  HAVING count(*) = 1
) uo
WHERE n."orgId" IS NULL AND n."userId" = uo."userId";
```

Les anciennes notifications d'absence liées à une séance deviennent des notifications de séance, sans `event`. Les anciennes notifications des users multi-organisations sans séance restent à `orgId = NULL` et n'apparaissent plus dans les vues admin, ce qui est le comportement sûr.

**Migration C : contract** (après déploiement du code)

```sql
ALTER TABLE "public"."Notification" DROP COLUMN "scheduleId";
ALTER TABLE "public"."Notification" DROP COLUMN "type";
DROP TYPE "public"."NotificationType";
```

## 5. Changements de code

**`audiences.ts`**

```typescript
import { NotificationEvent, Resource } from "@/generated/prisma/browser";

export type TeacherRecipient = {
  userId: string;
  message: string;
  resourceType: Resource;
  event: NotificationEvent;
};

// désassigné
recipients.push({
  userId: beforeTeacherUserId,
  message: getTeacherUnassignedMessage(courseName, day),
  resourceType: Resource.SCHEDULE,
  event: NotificationEvent.UNASSIGNED,
});

// nouveau prof
recipients.push({
  userId: newTeacherUserId,
  message: getTeacherScheduleMessage("CREATED", courseName, day),
  resourceType: Resource.SCHEDULE,
  event: NotificationEvent.CREATED,
});

// cas général : l'event passe tel quel, plus de ternaire
recipients.push({
  userId: newTeacherUserId,
  message: teacherMessage,
  resourceType: Resource.SCHEDULE,
  event,
});
```

Retire aussi `event === "CONFIRMED"` de `notifyTeacherForEvent` (branche jamais atteinte) et supprime le ternaire `notificationType`.

**`onScheduleEvent`**

```typescript
const day = formatDate(schedule.startTime, "DAY_MONTH");

const notifications: Array<{
  userId: string;
  message: string;
  event: NotificationEvent;
}> = [];
```

`resourceType` et `resourceId` sont constants dans ce fichier : ils sont ajoutés à l'émission, pas stockés dans chaque entrée.

```typescript
sendPushNotificationById(userId, {
  orgId,
  message,
  resourceType: Resource.SCHEDULE,
  resourceId: scheduleId,
  event,
  metadata: { kind: "schedule" },
})
```

Le ternaire `notificationType` des élèves et parents disparaît : on passe `event` tel quel.

**`sendPushNotificationById`**

Signature :

```typescript
{
  orgId?: string;
  message: string;
  resourceType?: Resource;
  resourceId?: string;
  event?: NotificationEvent;
  metadata?: Prisma.InputJsonValue;
}
```

Dans le `create`, écris `orgId`, `resourceType`, `resourceId` et `event`. C'est aussi ici que va la vérification d'intégrité : si `resourceType` et `resourceId` sont présents, contrôler que la ressource existe et appartient à `orgId`. Fais-le à cet endroit unique, pas dans chaque appelant.

**`notification.queries.ts`**

Les trois `select` :

```typescript
select: {
  id: true,
  message: true,
  resourceType: true,
  resourceId: true,
  event: true,
  read: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
},
```

Filtres de l'inbox (le `OR` est obligatoire : `NULL <> 'INVITATION'` vaut `NULL` en SQL et exclurait les notifications générales) :

```typescript
if (filter === 'unread') {
  whereClause.read = false
} else if (filter === 'invitations') {
  whereClause.resourceType = 'INVITATION'
} else if (filter === 'system') {
  whereClause.OR = [
    { resourceType: null },
    { resourceType: { not: 'INVITATION' } },
  ]
}
```

Tie-breaker du curseur :

```typescript
orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
```

Requêtes admin : le `JOIN` disparaît, et la fuite cross-org avec.

```typescript
// avant
where: { user: { userOrganizations: { some: { orgId } } } }
// après
where: { orgId }
```

Idem pour les quatre autres `getOrganization*` et pour les trois requêtes des stats. Stats par type :

```typescript
prisma.notification.groupBy({
  by: ['resourceType'],
  where: { orgId },
  _count: { _all: true },   // _all compte aussi les lignes à null
})

const byTypeMap = byType.reduce<Record<string, number>>((acc, item) => {
  acc[item.resourceType ?? 'GENERAL'] = item._count._all
  return acc
}, {})
```

**Résolveur de lien et UI**

Un seul résolveur remplace tous les `switch (notification.type)`. Les routes ci-dessous sont des exemples, à adapter aux tiennes :

```typescript
const NOTIFICATION_HREF: Partial<
  Record<Resource, (n: { resourceId: string; metadata: any }) => string>
> = {
  SCHEDULE:   (n) => `/planning/${n.resourceId}`,
  ATTENDANCE: (n) => `/absences/${n.resourceId}`,
  MESSAGE:    (n) => `/messages/${n.metadata?.channelId}#${n.resourceId}`,
  INVITATION: (n) => `/invitations/${n.resourceId}`,
};

export function getNotificationHref(n: {
  resourceType: Resource | null;
  resourceId: string | null;
  metadata: unknown;
}) {
  if (!n.resourceType || !n.resourceId) return null; // pas cliquable
  return NOTIFICATION_HREF[n.resourceType]?.({
    resourceId: n.resourceId,
    metadata: n.metadata,
  }) ?? null;
}
```

`resourceType` donne l'icône et `event` la couleur ou le libellé (`CANCELED` en rouge).

## 6. Ordre d'exécution

1. Migration A, puis B.
2. Déploiement du code (écriture et lecture des nouvelles colonnes).
3. Vérifications, qui doivent toutes renvoyer `0` :

```sql
-- aucune ligne typée non migrée
SELECT count(*) FROM "Notification"
WHERE "resourceType" IS NULL AND "type" <> 'GENERAL';

-- aucun resourceId sans type (la contrainte passera)
SELECT count(*) FROM "Notification"
WHERE "resourceId" IS NOT NULL AND "resourceType" IS NULL;

-- aucune séance liée non reportée
SELECT count(*) FROM "Notification"
WHERE "scheduleId" IS NOT NULL AND "resourceId" IS DISTINCT FROM "scheduleId";
```

4. Ajout du `CHECK` en post-migrate.
5. Migration C.
6. `prisma generate`, puis recherche globale de `NotificationType`, `.type` et `scheduleId` pour les restes.

## 7. Autres ajustements à vérifier

- **Notifications orphelines.** Sans FK, supprimer une ressource en dur laisse des liens morts. Si des séances (ou autres cibles) sont supprimées en dur, ajoute dans le service de suppression : `prisma.notification.deleteMany({ where: { resourceType: 'SCHEDULE', resourceId } })`. L'index `[resourceType, resourceId]` sert ce cas. Si elles sont seulement annulées, la page de destination peut simplement gérer le cas introuvable.
- **Autres lecteurs de `type`.** Cherche `type` dans le service worker et le payload Web Push (clic sur la notification, icône), dans les schémas de validation (`../validation`, y compris `InboxFilter`), dans les seeds et dans les tests. Ce sont les endroits les plus faciles à oublier.
- **Rétention.** Il n'y a pas de soft delete, donc la table grossit sans limite. Un cron qui supprime les notifications lues de plus de 90 jours évite de dépendre des index pour compenser. C'est optionnel, mais autant le décider maintenant.
- **`event` sur les anciennes lignes.** Certaines restent à `NULL` (anciennes absences, messages). L'UI doit donc traiter `event` comme optionnel, sans supposer qu'il est toujours présent.