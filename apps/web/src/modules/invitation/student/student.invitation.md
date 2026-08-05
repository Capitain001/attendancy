````markdown
# 📋 Invitation Étudiant — Structures JSON et Tables Modifiées

## 📋 Vue d'ensemble

Ce document décrit la structure des données créées/modifiées lors de l'invitation d'un étudiant via `inviteStudent()`.

---

## 🔄 Flux d'invitation

inviteStudent(params)
  ↓
1. Validation des paramètres (Valibot)
2. Récupération de l'organisation courante
3. Vérification des ressources (class + year via classId, groups)
4. inviteUser({ email, name, role: "STUDENT" })
   ↓
   - Génération token
   - Génération métadonnées
   - Envoi Supabase (user_metadata)
   - Sauvegarde Invitation + AuditLog
5. Mise à jour Invitation.details avec enrollment

---

## 📥 0. Paramètres d'invitation (`InviteStudentParams`)

```ts
{
  email: string;
  firstName?: string;
  lastName?: string;

  classId: string;       // ID de la classe (yearId déduit via Class)
  groupIds?: string[];   // IDs des groupes (optionnel)

  parentEmail?: string;  // Email du parent (optionnel)
}
````

---

## 📤 1. Données envoyées à Supabase (user_metadata)

```json
{
  "role": "STUDENT",
  "name": "Jean Dupont",
  "organization": {
    "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
    "name": "Harvard University",
    "slug": "harvard-1",
    "logo": "https://example.com/logo.png",
    "permissions": []
  },
  "organizations": [
    {
      "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
      "name": "Harvard University",
      "slug": "harvard-1",
      "logo": "https://example.com/logo.png",
      "permissions": []
    }
  ],
  "invited_by": {
    "id": "713ca158-ba30-4761-abdb-cb365343f011",
    "name": "Admin Inviteur",
    "email": "admin@harvard.edu"
  },
  "status": "PENDING",
  "invitationToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "invitationType": "INVITE_ONLY"
}
```

---

## 💾 2. Table `Invitation` — Colonnes et JSON

### Colonnes scalaires

| Colonne        | Type      | Description        |
| -------------- | --------- | ------------------ |
| id             | UUID      | ID unique          |
| token          | String    | Token d’invitation |
| email          | String    | Email étudiant     |
| organizationId | UUID      | Organisation       |
| createdAt      | DateTime  | Création           |
| expiresAt      | DateTime  | Expiration         |
| usedAt         | DateTime? | Acceptation        |
| userId         | UUID?     | User créé          |
| invitationType | Enum      | Type invitation    |

---

### 📦 `details` (JSON)

```json
{
  "role": "STUDENT",
  "name": "Jean Dupont",
  "organization": {
    "id": "org-id",
    "name": "Harvard University",
    "slug": "harvard-1",
    "logo": "https://example.com/logo.png",
    "permissions": []
  },
  "invited_by": {
    "id": "admin-id",
    "name": "Admin",
    "email": "admin@harvard.edu"
  },
  "status": "PENDING",
  "invitationType": "INVITE_ONLY",
  "enrollment": {
    "classId": "uuid-class-123",
    "yearId": "auto-derived-from-class",
    "groupIds": [
      "uuid-group-1",
      "uuid-group-2"
    ],
    "parentEmail": "parent@example.com"
  }
}
```

---

## 👤 3. AuditLog

```json
{
  "email": "jean.dupont@example.com",
  "name": "Jean Dupont",
  "orgId": "org-id",
  "role": "STUDENT",
  "function": null,
  "departmentId": null
}
```

---

## 👤 4. Supabase Auth (user_metadata)

Identique à la section 1.

---

## 🔄 5. Après acceptation

### User

```json
{
  "email": "jean.dupont@example.com",
  "status": "ACTIVE"
}
```

---

### UserOrganization

```json
{
  "role": "STUDENT",
  "orgId": "org-id"
}
```

---

### StudentEnrollment

```json
{
  "userId": "user-id",
  "classId": "class-id",
  "yearId": "class.yearId",
  "groupId": null
}
```

---

## 📌 Notes importantes

### 1. YearId supprimé des params

* ❌ plus envoyé dans les paramètres
* ✅ déduit automatiquement via `Class.yearId`

---

### 2. Group logique évoluée

* ❌ ancien: `groupId`
* ✅ nouveau: `groupIds: string[]`

---

### 3. Source de vérité

| Data       | Source             |
| ---------- | ------------------ |
| yearId     | Class table        |
| classId    | Params             |
| groups     | Group table        |
| enrollment | Invitation.details |

---

### 4. Invariant métier

Un étudiant appartient toujours à :

* 1 classe
* 1 année (via classe)
* N groupes (optionnel)

---

## 🚀 Résultat

Ce système garantit :

* cohérence des données
* suppression de la duplication yearId
* support multi-groupes
* architecture scalable pour le futur

```
```
