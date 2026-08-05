# Invitation Enseignant — Structures JSON

## Données envoyées à Supabase (user_metadata)

Structure envoyée via `inviteUserByEmail(..., { data })` (reprend `InvitationMetadata`).

```json
{
  "role": "TEACHER",
  "name": "Jane Doe",
  "function": "DELEGATE",
  "organization": {
    "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
    "name": "havard",
    "slug": "havard-1",
    "logo": "https://.../logo.png",
    "permissions": []
  },
  "organizations": [
    {
      "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
      "name": "havard",
      "slug": "havard-1",
      "logo": "https://.../logo.png",
      "permissions": []
    }
  ],
  "invited_by": {
    "id": "713ca158-ba30-4761-abdb-cb365343f011",
    "name": "Admin Inviteur",
    "email": "admin@example.com"
  },
  "status": "PENDING",
  "invitationToken": "dba3f42d-f071-429f-8186-b3863eea88eb",
  "invitationType": "INVITE_ONLY"
}
```

Notes:
- Les champs `departmentId`, `resources`, `permissions` sont désormais inclus dans `InvitationMetadata`, envoyés à Supabase et persistés dans `Invitation.details` lorsque fournis.

## Données persistées en base — Invitation.details

Contenu JSON inséré dans `prisma.invitation.details` (sous-ensemble de `InvitationMetadata`).

```json
{
  "role": "TEACHER",
  "name": "Jane Doe",
  "function": "DELEGATE",
  "organization": {
    "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
    "name": "havard",
    "slug": "havard-1",
    "logo": "https://.../logo.png",
    "permissions": ["READ", "UPDATE"],
    "departmentId": "dep-123",
    "resources": { "courses": ["c1"], "classes": ["cl1"] }
  },
  "invited_by": {
    "id": "713ca158-ba30-4761-abdb-cb365343f011",
    "name": "Admin Inviteur",
    "email": "admin@example.com"
  },
  "status": "PENDING",
  "invitationType": "INVITE_ONLY"
}
```

Colonnes scalaires associées sur la table `Invitation` (hors JSON): `email`, `token`, `expiresAt`, `organizationId`, `invitationType`, etc.

## Données persistées en base — AuditLog.details

Contenu JSON inséré dans `prisma.auditLog.details` lors de l’invitation.

```json
{
  "email": "teacher@example.com",
  "name": "Jane Doe",
  "orgId": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
  "role": "TEACHER",
  "function": "DELEGATE",
  "departmentId": "dep-123"
}
```

## Références
- Génération des données Supabase: `src/services/invitation/invitation.ts` (`createSupabaseInviteData`)
- Mappage DB.details (Invitation): `src/services/invitation/database.ts` (`createDatabaseDetails`)
- Mappage Audit.details: `src/services/invitation/database.ts` (`createAuditDetails`)

