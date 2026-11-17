// src/services/message/policy.ts
//
// Règles métier PURES de l'envoi d'un message (testables sans base, sans React).
// Le serveur les applique ; l'adaptateur offline (modules/chat) en lit les codes.
// Ce fichier grandit au fil des règles rencontrées — pas d'inventaire exhaustif.

import { ERROR_CODES, type ErrorCode } from '@/config'

// ─────────────────────────────────────────────────────────────────────────────
// Refus métier : une entrée = la réponse complète de l'action ({ error, code })
// ─────────────────────────────────────────────────────────────────────────────

export type MessageRefusal = 'NOT_MEMBER' | 'PARENT_MISSING' | 'PARENT_WRONG_CHANNEL' | 'ID_TAKEN'

const ERRORS = {
  NOT_MEMBER: { error: 'Accès refusé au canal', code: ERROR_CODES.FORBIDDEN },
  PARENT_MISSING: { error: 'Message parent introuvable', code: ERROR_CODES.NOT_FOUND },
  PARENT_WRONG_CHANNEL: { error: 'Message parent invalide', code: ERROR_CODES.BAD_REQUEST },
  ID_TAKEN: { error: 'Identifiant déjà utilisé', code: ERROR_CODES.BAD_REQUEST },
} as const satisfies Record<MessageRefusal, { error: string; code: ErrorCode }>

export const MESSAGE = {
  ERRORS,
  // Refus qui se résorbent seuls (le parent arrivera sur le serveur plus tard).
  // Dérivé de la table : aucun code écrit une deuxième fois.
  RETRYABLE_CODES: [ERRORS.PARENT_MISSING.code],
} as const

// ─────────────────────────────────────────────────────────────────────────────
// R1 — Un parent doit exister et appartenir au même canal
// ─────────────────────────────────────────────────────────────────────────────
//
// « Manquant » est transitoire : une réponse peut viser un message que seul le
// LAN a vu et qui n'est pas encore synchronisé.

export function checkParent(
  parent: { channelId: string } | null,
  channelId: string,
): MessageRefusal | null {
  if (!parent) return 'PARENT_MISSING'
  return parent.channelId === channelId ? null : 'PARENT_WRONG_CHANNEL'
}

// ─────────────────────────────────────────────────────────────────────────────
// R2 — Un id déjà en base n'est un renvoi légitime que s'il décrit le même message
// ─────────────────────────────────────────────────────────────────────────────
//
// Seuls les champs IMMUABLES comptent. `content` est exclu : il peut être édité
// entre un envoi réussi (ack perdu) et son retry.

export function isReplay(
  existing: { channelId: string; parentId: string | null; user: { id: string } | null },
  wanted: { userId: string; channelId: string; parentId?: string | null },
): boolean {
  return (
    existing.user?.id === wanted.userId &&
    existing.channelId === wanted.channelId &&
    existing.parentId === (wanted.parentId ?? null)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// R3 — createdAt est déclaré par le client : jamais fiable par défaut
// ─────────────────────────────────────────────────────────────────────────────
//
// Retenu seulement s'il est plausible (ni dans le futur, ni plus vieux que la
// limite). Sinon on ne l'utilise pas : Prisma applique @default(now()).
// Un message hors-ligne plus vieux que la limite est donc daté de sa synchro.

export const MAX_BACKDATE_MS = 7 * 86_400_000

export function isTrustedCreatedAt(createdAt: Date, now: Date): boolean {
  const t = createdAt.getTime()
  return t <= now.getTime() && t >= now.getTime() - MAX_BACKDATE_MS
}
