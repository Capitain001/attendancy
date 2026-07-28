// src/services/user/types.ts
// Types utilisateur — la STRUCTURE est architecturale et commune à tous les
// projets ; seuls les points marqués ⚠ portent du vocabulaire projet.
//
// Source de vérité : Supabase user_metadata. getUserInfo() lit ces métadonnées
// et les expose sous forme de UserInfo — aucun aller-retour DB sur le chemin
// chaud de l'auth.

// ── Rôles ─────────────────────────────────────────────────────────────────────
// Aligné sur l'enum Role du schéma Prisma.
// ⚠ À AJUSTER PAR PROJET si les rôles diffèrent.
export type Role =
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'DIRECTION'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'MEMBER'

// ── Fonctions (RBAC fin, orthogonal au rôle) ─────────────────────────────────
// 'SUPER_ADMIN' est architectural — court-circuite toutes les vérifications.
// ⚠ À ÉTENDRE PAR PROJET — ajouter les fonctions métier (ex: 'PRINCIPAL', 'SCOLARITE').
export type FunctionName = 'SUPER_ADMIN' | (string & {})

// ── Statut ────────────────────────────────────────────────────────────────────
// Cycle de vie du compte. NEW/INVITED = états pré-activation (avant que le
// modèle Prisma User n'existe ou ne soit complété).
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
  NEW: 'NEW',
  INVITED: 'INVITED',
} as const

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

// ── Organisation ─────────────────────────────────────────────────────────────
// Snapshot org stocké en Supabase user_metadata — PAS le modèle Prisma.
// Les champs ci-dessous sont architecturaux (identité + permissions).
export interface Organization {
  id?: string
  name?: string
  slug?: string
  logo?: string
  responsable?: boolean
  permissions?: string[]
  // IDs des profils métier scopés par organisation.
  // Injectés dans les metadata Supabase après création de l'entité (syncUserOrganizationProfile).
  // ⚠ À ÉTENDRE PAR PROJET — une entrée par rôle qui porte un profil DB.
  teacherId?:   string
  studentId?:   string
  parentId?:    string
  directionId?: string
}

export interface InvitedBy {
  id: string
  name: string
  email: string
}

// ── UserInfo ─────────────────────────────────────────────────────────────────
// Source de vérité user — retourné par getUserInfo().
export interface UserInfo {
  id?: string
  email?: string
  role?: Role
  name?: string
  avatar_url?: string
  phone?: string
  email_verified?: boolean
  phone_verified?: boolean
  function?: FunctionName
  organization?: Organization
  organizations?: Organization[]
  status?: UserStatus
  invitationToken?: string
  invitationType?: string
  invited_by?: Partial<InvitedBy>
  isConnected?: boolean
  online_at?: string
}

// Ce qui va dans Supabase user_metadata — dérivé de UserInfo
export type UserMetadata = Pick<
  UserInfo,
  | 'role'
  | 'name'
  | 'avatar_url'
  | 'function'
  | 'organization'
  | 'organizations'
  | 'status'
  | 'invitationToken'
  | 'invitationType'
  | 'invited_by'
  | 'isConnected'
>

// Contexte org injecté dans les Server Actions — orgId depuis token serveur
// UNIQUEMENT, jamais depuis body/query/headers.
export type OrgContext = {
  userId: string
  orgId: string
  role: Role
  function: FunctionName
}

/*
Exemple de user_metadata Supabase (référence de forme — vocabulaire neutre) :

{
  "role": "ADMIN",
  "name": "Jane Doe",
  "avatar_url": "https://…/avatar.png",
  "function": "SUPER_ADMIN",
  "status": "ACTIVE",
  "isConnected": true,
  "organization": {
    "id": "6f0e…",
    "name": "Acme",
    "slug": "acme",
    "responsable": true,
    "permissions": ["CREATE:ENTITY", "DELETE:ENTITY"]
  },
  "organizations": [
    { "id": "6f0e…", "name": "Acme", "slug": "acme" }
  ]
}
*/
