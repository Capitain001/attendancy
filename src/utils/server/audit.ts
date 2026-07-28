// src/utils/server/audit.ts
// Journal d'audit — fire-and-forget, ne bloque jamais la réponse.
//
// Prérequis : un modèle AuditLog dans les schémas Prisma du projet
// (userId, orgId?, action, resource?, resourceId?, details Json?, ipAddress?,
//  userAgent?, createdAt). Voir prisma/schemas/README.md.
//
// Quand auditer (depuis une server action, APRÈS le succès de la mutation) :
//   - DELETE / remove* — toujours
//   - UPDATE sur données sensibles
//   - CREATE sur ressources critiques
// Jamais sur les queries.
import 'server-only'
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import { prisma } from '@/lib/db'
import type { Action } from '@/generated/prisma'

// Actions standard + ouvert aux valeurs projet.
// ⚠ À ÉTENDRE PAR PROJET — aligner sur l'enum Action des schémas Prisma
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | (string & {})

// Autocomplete sur les ressources connues, ouvert aux modules futurs.
// ⚠ À ÉTENDRE PAR PROJET — aligner sur l'enum Resource des schémas Prisma
export type AuditResource = string & {}

export interface AuditActor {
  name?: string
  email?: string
}

export interface LogAuditParams {
  userId: string
  orgId?: string | null
  action: AuditAction
  resource?: AuditResource
  resourceId?: string
  /** Snapshot de l'acteur fusionné dans details — vérité historique, survit au renommage/suppression. */
  actor?: AuditActor
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

export async function logAudit({
  userId,
  orgId,
  action,
  resource,
  resourceId,
  actor,
  details,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    const payload = { ...(details ?? {}), ...(actor && { actor }) }
    await prisma.auditLog.create({
      data: {
        userId,
        orgId: orgId ?? null,
        action: action as Action,
        resource: resource ?? null,
        resourceId: resourceId ?? null,
        details: Object.keys(payload).length === 0
          ? undefined
          : JSON.parse(JSON.stringify(payload)),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    })
  } catch (error) {
    console.error('[audit]', error)
  }
}

/** Fire-and-forget : journalise après le retour de la réponse, ne bloque jamais le flux. */
export function logAuditAsync(params: LogAuditParams) {
  setImmediate(() => {
    logAudit(params)
  })
}

export function getRequestMeta(headers: ReadonlyHeaders) {
  const forwarded = headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip')
  const userAgent = headers.get('user-agent')
  return { ip, userAgent }
}
