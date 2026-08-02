# Système d'Invitation - Documentation

## Vue d'ensemble

Le service d'invitation permet d'inviter des utilisateurs (enseignants, administrateurs, étudiants) dans l'application avec gestion des rôles, permissions, ressources et audit trail complet. Il utilise Supabase Auth pour l'envoi d'emails et Prisma pour la persistance.

---

## Architecture

```
src/services/invitation/
├── user.ts              # Action principale inviteUser() — Point d'entrée
├── invitation.ts        # Envoi via Supabase Auth
├── database.ts          # Persistance Prisma + Audit logs
├── metadata.ts          # Génération des métadonnées structurées
├── token.ts             # Génération de tokens sécurisés
├── utils.ts             # Gestionnaire d'erreurs Supabase
├── validation.ts        # Validation email
└── teacher/
    └── invite.ts        # Wrapper spécialisé pour enseignants
```

---

## Flux d'Invitation Complet

### Étape 1 — Point d'entrée (`user.ts` · `inviteUser`)

```typescript
inviteUser(params: InvitationParams)
  ↓
1. Authentification  : getUserInfo()
2. Autorisation      : getAuthorization(user, params.role)
3. Génération token  : generateInvitationToken()
4. Génération méta   : generateInvitationMetadata()
5. Envoi Supabase    : sendSupabaseInvitation()
6. Sauvegarde DB     : saveInvitationWithAudit()
```

### Étape 2 — Génération du Token (`token.ts`)

```typescript
const { token, expiresAt } = await generateInvitationToken();
```

- **Méthode** : `crypto.randomBytes(32).toString("hex")` — 64 caractères hex
- **Durée** : 7 jours (configurable)

### Étape 3 — Vérification des Autorisations (`auth.ts`)

```typescript
const auth = await getAuthorization(user, "ADMIN");
if (!auth.success) return auth.error;
```

### Étape 4 — Génération des Métadonnées (`metadata.ts`)

```typescript
const metadata = generateInvitationMetadata({
  email: "user@example.com",
  role: "TEACHER",
  departmentId: "dep-123"
}, currentUser, token);
```

Construit un objet `InvitationMetadata` contenant :

| Champ | Description |
|---|---|
| `role` | Rôle de l'utilisateur (`TEACHER`, `ADMIN`, etc.) |
| `name` | Nom optionnel |
| `function` | Fonction optionnelle (`PRINCIPAL`, `SECRETARY`, etc.) |
| `organization` | Organisation avec `permissions`, `departmentId`, `resources` |
| `organizations` | Tableau d'organisations |
| `invited_by` | Informations de l'inviteur (`id`, `name`, `email`) |
| `status` | `"PENDING"` |
| `invitationToken` | Token généré |
| `invitationType` | `"INVITE_ONLY"` |

> **Important** : Les champs `permissions`, `departmentId` et `resources` sont imbriqués dans `organization{}`.

### Étape 5 — Envoi de l'Invitation (`invitation.ts`)

```typescript
const result = await sendSupabaseInvitation(email, metadata);
```

- Utilise `adminClient.auth.admin.inviteUserByEmail()`
- Métadonnées transmises dans `data` → stockées dans `user_metadata`
- URL de redirection : `${NEXT_PUBLIC_SITE_URL}/auth/invite`
- Gestion des erreurs via `supabaseInvitationError()` (utils.ts)

### Étape 6 — Sauvegarde en Base (`database.ts`)

```typescript
await saveInvitationWithAudit(email, token, expiresAt, metadata, userId, "INVITE_USER");
```

**Transaction atomique** garantissant la cohérence :

1. **Table `Invitation`** : `email`, `token`, `expiresAt`, `organizationId`, `details` (JSON), `invitationType`
2. **Table `AuditLog`** : `userId`, `action` (`Action.CREATE`), `resource` (`"USER"`), `resourceId`, `details` (JSON)

---

## Structures de Données

### `InvitationMetadata` — envoyé à Supabase

```typescript
{
  role: "TEACHER",
  name?: "Jane Doe",
  function?: "DELEGATE",
  organization: {
    id: "uuid",
    name: "Havard",
    slug: "havard-1",
    logo?: "url",
    permissions: ["READ", "UPDATE"],
    departmentId?: "dep-123",
    resources?: { courses: ["c1"], classes: ["cl1"] }
  },
  organizations: [organization],
  invited_by: { id, name, email },
  status: "PENDING",
  invitationToken: "hex-token",
  invitationType: "INVITE_ONLY"
}
```

### `DatabaseInvitationDetails` — stocké dans `invitation.details`

```typescript
{
  role: "TEACHER",
  name?: "Jane Doe",
  function?: "DELEGATE",
  organization: { /* même structure */ },
  invited_by: { id, name, email },
  status: "PENDING",
  invitationType: "INVITE_ONLY"
}
```

### `AuditLogDetails` — stocké dans `auditLog.details`

```typescript
{
  email: "teacher@example.com",
  name?: "Jane Doe",
  orgId: "uuid",
  role: "TEACHER",
  function?: "DELEGATE",
  departmentId?: "dep-123"
}
```

---

## Rôles et Permissions

| Rôle | Fonction | Permissions |
|---|---|---|
| `SUPER_ADMIN` | Accès complet | Toutes les actions |
| `ADMIN` | Gestion organisation | Users, courses, schedules |
| `TEACHER` | Gestion cours | Courses, attendance, grades |
| `STUDENT` | Consultation | Courses, attendance |

---

## Types d'Invitation

| Type | Description |
|---|---|
| `INVITE_ONLY` | Invitation standard avec validation email |
| `DIRECT_ACCESS` | Accès direct sans validation *(futur)* |

---

## Cas d'Usage Spécialisés

### Invitation d'Enseignant (`teacher/invite.ts`)

Wrapper autour de `inviteUser()` avec `role` fixé à `"TEACHER"`, support des `resources` et `permissions` :

```typescript
inviteTeacher({
  email: "teacher@example.com",
  name: "Jane Doe",
  permissions: ["READ", "UPDATE"],
  resources: { courses: ["c1"], classes: ["cl1"] }
});
```

### Exemple complet — inviter un enseignant

```typescript
import {
  generateInvitationMetadata,
  generateInvitationToken,
  sendSupabaseInvitation,
  saveInvitationWithAudit
} from "@/lib/services";

async function inviteTeacher(email: string, name: string) {
  const { token, expiresAt } = await generateInvitationToken();
  const metadata = generateInvitationMetadata(
    { email, name, role: "TEACHER" },
    currentUser,
    token
  );

  const sent = await sendSupabaseInvitation(email, metadata);
  if (sent.success) {
    await saveInvitationWithAudit(
      email, token, expiresAt, metadata, currentUser.id, "INVITE_TEACHER"
    );
  }

  return sent;
}
```

---

## Gestion des Erreurs

Toutes les fonctions retournent un objet `InvitationResult` :

```typescript
{
  success: boolean;
  error?: string;
  message?: string;
  metadata?: InvitationMetadata;
}
```

Le service `utils.ts` gère les erreurs Supabase spécifiques :

| Erreur Supabase | Message retourné |
|---|---|
| Already exists | "Cet utilisateur a déjà été invité" |
| Rate limit | "Trop de tentatives, réessayez plus tard" |
| Invalid email | "L'adresse email est invalide" |
| User not found | "Utilisateur non trouvé" |
| Générique | Message détaillé avec logging console |

---

## Sécurité

1. **Tokens cryptographiques** : `crypto.randomBytes(32)` — impossible à deviner
2. **Expiration automatique** : 7 jours par défaut
3. **Vérification des autorisations** : contrôle strict via `getAuthorization()` avant toute action
4. **Audit trail** : toutes les actions loggées en transaction atomique
5. **Validation email** : format validé avant envoi

---

## Base de Données

### Tables utilisées

| Table | Rôle |
|---|---|
| `Invitation` | Stockage des invitations en cours |
| `AuditLog` | Historique complet des actions |
| `User` | Utilisateurs créés suite à une invitation |

### Champs JSON

- `invitation.details` : sous-ensemble de `InvitationMetadata`
- `auditLog.details` : email, nom, orgId, role, function, departmentId

---

## Variables d'Environnement

```env
NEXT_PUBLIC_SITE_URL=https://localhost:3000
```

---

## Points d'Attention

1. **Toujours vérifier les autorisations** avant d'inviter
2. **Transaction atomique** : `saveInvitationWithAudit()` garantit la cohérence BDD
3. **Métadonnées imbriquées** : `permissions`, `departmentId`, `resources` sont dans `organization{}`
4. **Revalidation** : commentée dans `user.ts` (ligne 59) — à activer si nécessaire
5. **Cache** : pas de cache explicite sur les listes d'invitations

---

## Améliorations Possibles

1. **Expiration configurable** : rendre la durée paramétrable par organisation
2. **Rappels automatiques** : système de relance pour invitations expirées

---

## Test TypeScript

```bash
npx tsc --noEmit --project . | Select-String "InviteTeacherForm.tsx"
```
