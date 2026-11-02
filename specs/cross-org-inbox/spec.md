# Spec — Messagerie Interne & Boîte de Réception Cross-Org (Inbox)

> **Statut :** Brouillon validé / En attente d'implémentation  
> **Driver :** Gestion des invitations pour utilisateurs existants & centralisation des notifications cross-organisations.  
> **Périmètre :** Compte utilisateur (User-scoped, hors préfixe `/{orgSlug}`).

---

## 1. Contexte & Problématique

### 1.1 Limitation Supabase Auth
Le flow d'invitation initial repose sur `supabase.auth.admin.inviteUserByEmail()`. Cette méthode crée l'utilisateur dans `auth.users` et lui envoie un email d'accueil pour configurer son mot de passe.
- **Utilisateur inconnu (NEW)** : Fonctionne parfaitement.
- **Utilisateur déjà inscrit (ACTIVE / existant dans `auth.users`)** : Supabase rejette ou ne permet pas de ré-inviter un compte existant sous ce format pour l'ajouter à un nouveau tenant.

### 1.2 Découplage du Tenant (Cross-Org / Extra-Org)
Un utilisateur de la plateforme (enseignant, étudiant, tuteur) peut être sollicité par plusieurs établissements ou contextes (ex. cours personnel, nouveau tenant universitaire).
- Actuellement, les notifications in-app sont cloisonnées ou invisibles tant que l'utilisateur n'est pas déjà entré dans l'organisation.
- **Solution** : Une boîte de réception type **Gmail / Webmail** accessible au niveau racine du compte (`/inbox` ou `/messages`), permettant de centraliser les communications transverses et de traiter les invitations en un clic (Accepter / Refuser).

---

## 2. Architecture & Modèle de Données

Le système s'appuie sur les tables Prisma existantes sans nécessiter de modification lourde de schéma :

### 2.1 Table `Notification` (`prisma/schemas/communication.prisma`)
- `userId` : Destinataire du message (FK vers `User`).
- `type` : Enum `NotificationType` (`INVITATION`, `GENERAL`, `MESSAGE`, `SCHEDULE_UPDATE`...).
- `message` : Texte court / Titre du message.
- `read` : Booléen (`false` par défaut, passé à `true` à l'ouverture ou au traitement).
- `metadata` : JSON contenant les informations contextuelles de l'action :
  ```json
  {
    "invitationId": "uuid",
    "invitationToken": "string-hex-64",
    "orgId": "uuid",
    "orgName": "Université Paris-Saclay",
    "orgSlug": "paris-saclay",
    "orgLogo": "https://...",
    "role": "TEACHER",
    "resourceType": "CLASS",
    "resourceId": "uuid",
    "resourceName": "L3 Informatique - Groupe A",
    "senderName": "Jean Dupont",
    "expiresAt": "2026-11-07T00:00:00Z",
    "status": "PENDING" // "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"
  }
  ```

### 2.2 Table `Invitation` (`prisma/schemas/tenant.prisma`)
- Stocke le token d'invitation, l'email, la cible (`orgId`, `role`, `resourceType`, `resourceId`), les dates (`expiresAt`, `usedAt`).

---

## 3. Flows Métier

### Flow A : Émission d'une invitation
```
[Panel Emetteur (Direction / Enseignant)]
       │
       ▼
inviteUser({ email, role, orgId, ... })
       │
       ▼
Vérification de l'existence du compte (User.findUnique({ email }))
       │
       ├─ Non existant (NEW)
       │    └──► Supabase inviteUserByEmail() (Flow standard existant)
       │
       └─ Existant (ACTIVE)
            ├── 1. prisma.Invitation.create(...)
            ├── 2. prisma.Notification.create({
            │        userId: targetUser.id,
            │        type: "INVITATION",
            │        message: "Vous avez été invité à rejoindre L3 Informatique...",
            │        metadata: { ... }
            │      })
            └── 3. (Optionnel) Déclenchement Web Push si un abonnement actif existe.
```

### Flow B : Consultation & Traitement dans l'Inbox
```
[Page /inbox]
       │
       ▼
L'utilisateur consulte ses messages
       │
       ├─ Ouvre la notification d'invitation ──► Notification.read = true
       │
       ├─ Clic "Accepter"
       │    ├── Transaction DB :
       │    │     - Inscription de l'utilisateur à l'organisation (UserOrganization)
       │    │     - Provisioning du profil associé (Teacher / Student / Class enrollment)
       │    │     - Invitation.usedAt = now()
       │    │     - Notification.metadata.status = "ACCEPTED"
       │    └── Toast succès + Option de redirection vers le dashboard de l'organisation
       │
       └─ Clic "Refuser"
            ├── Invalidation de l'invitation
            └── Notification.metadata.status = "DECLINED"
```

---

## 4. Expérience Utilisateur & UI (Inspiration Gmail)

### 4.1 Route
- **`/inbox`** (Accessible depuis le menu profil ou la topbar globale, hors préfixe d'organisation).

### 4.2 Layout Split-Screen
```
+-----------------------------------------------------------------------------------+
|  [Logo] Attendancy              Recherche dans les messages...       [Mon Profil] |
+------------------+----------------------------------+-----------------------------+
|  BOÎTE           |  LISTE DES MESSAGES              |  DÉTAIL DU MESSAGE          |
|                  |                                  |                             |
|  📥 Boîte réc.   |  [●] Université Paris-Saclay     |  Invitation à rejoindre     |
|     (3 non-lus)  |      Invitation Enseignant - L3  |  Université Paris-Saclay    |
|                  |      Il y a 10 min               |                             |
|  ✉️ Invitations  |                                  |  De: Direction Pédagogique  |
|                  |  [ ] Lycée Victor Hugo           |  Pour: Enseignant (L3 Info) |
|  🔔 Système      |      Rappel séance               |                             |
|                  |      Hier                        |  Bonjour, vous avez été     |
|  🗑️ Corbeille    |                                  |  invité à rejoindre...      |
|                  |                                  |                             |
|                  |                                  |  +-----------------------+  |
|                  |                                  |  | [Accepter]  [Refuser] |  |
|                  |                                  |  +-----------------------+  |
+------------------+----------------------------------+-----------------------------+
```

### 4.3 États des Cartes d'Invitation
1. **En attente (`PENDING`)** : Boutons d'action clairs `[Accepter]` (primaire) et `[Refuser]` (secondaire discret).
2. **Acceptée (`ACCEPTED`)** : Badge vert `✓ Invitation acceptée`, bouton vers l'organisation `[Ouvrir l'espace]`.
3. **Refusée (`DECLINED`)** : Badge neutre `Invitation déclinée`.
4. **Expirée (`EXPIRED`)** : Badge d'avertissement `Cette invitation a expiré`.

---

## 5. Découpage Technique

### 5.1 Service & Backend
- **Module émetteur** : `apps/web/src/modules/invitation/user.ts` (détection `userStatus === 'ACTIVE'` et création notification).
- **Service inbox** : `apps/web/src/services/notification/` ou `apps/web/src/features/inbox/services/`
  - `database/inbox.queries.ts` : `getUserInbox()`, `getInboxUnreadCount()`.
  - `database/inbox.mutations.ts` : `markAsRead()`, `archiveMessage()`.
  - `actions/invitation-response.ts` : Server action transactionnelle `respondToInvitationAction({ invitationToken, accept: boolean })`.

### 5.2 Hooks React Query
- `useInboxMessages({ filter })` : Récupération paginée et cache TanStack.
- `useInboxUnreadCount()` : Pour le badge de la cloche/enveloppe dans la barre de navigation.
- `useRespondToInvitation()` : Mutation avec feedback toast immédiat et invalidation des clés de cache.

### 5.3 Composants UI
- `InboxSidebar` : Navigation des filtres/dossiers.
- `InboxList` : Liste ordonnée par date avec indicateurs visuels.
- `InboxMessageView` : Affichage complet avec carte interactive d'invitation.
- `InvitationActionCard` : Sous-composant dédié au traitement interactif de l'invitation.

---

## 6. Lots d'Implémentation & Suivi d'Avancement proproser

### [x] LOT 1 : Émission & Notification Interne (Backend Invitation)
- [x] Analyser `apps/web/src/modules/invitation/user.ts` et `database.ts`.
- [x] Adapter `inviteUser` : lorsque `userStatus === 'ACTIVE'`, bifurquer du mode Supabase email standard pour émettre une notification interne au `userId`.
- [x] Enregistrer l'invitation avec `Invitation.userId = existingUser.id`.
- [x] Créer l'entrée `Notification` (`type: "INVITATION"`, payload `metadata` enrichi).
- [x] Vérifier la rétrocompatibilité : les utilisateurs non inscrits (`NEW`) continuent sur le flow Supabase.

### [x] LOT 2 : Service & Actions Métier Inbox (Backend Inbox)
- [x] Consulter l'index API du service `notification` et identifier les besoins manquants.
- [x] Créer l'action `getInboxNotifications({ filter, limit })`.
- [x] Créer l'action `markNotificationAsRead(notificationId)`.
- [x] Créer l'action transactionnelle d'adhésion / refus dans `src/modules/auth/members/actions.ts` :
  - Si accept : appel à l'onboarding + mise à jour `Invitation.usedAt` + notification `metadata.status = "ACCEPTED"`.
  - Si refuse : mise à jour `Invitation.expiresAt` + notification `metadata.status = "DECLINED"`.
- [x] Créer les hooks TanStack Query correspondants (`useInboxNotifications`, etc.).

### [x] LOT 3 : Interface Inbox Gmail-like (Frontend `/inbox`)
- [x] Créer la route `apps/web/src/app/(app)/inbox/page.tsx` (espace utilisateur, hors slug).
- [x] Implémenter le layout split-screen (InboxLayout) responsive avec tokens du design system.
- [x] Implémenter la sidebar de dossiers/filtres (`InboxSidebar`).
- [x] Implémenter la liste des messages (`InboxList`) avec pastilles non-lu et avatars.
- [x] Implémenter la vue détail (`InboxMessageView`) et la carte interactive (`InvitationActionCard`).

### [x] LOT 4 : Validation & Tests E2E
- [x] Tester l'invitation d'un utilisateur existant depuis l'espace teacher/direction.
- [x] Vérifier l'apparition de la notification dans `/inbox`.
- [x] Tester l'acceptation de l'invitation et le rattachement de l'utilisateur à l'organisation.
- [x] Tester le refus de l'invitation.
