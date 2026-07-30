// src/services/audit/logger.ts
// Journal immuable de traçabilité métier.
// resource en String (pas l'enum) : historique durable, modules futurs libres.
// AuditResource offre l'autocomplete sur les valeurs connues de l'enum Resource
// tout en acceptant des strings pour les ressources non encore dans l'enum.
import { prisma } from '@/lib/prisma'
import type { Action, Resource } from '@/generated/prisma'

export type AuditResource = Resource | (string & {})

export interface LogAuditParams {
  userId: string
  action: Action
  resource?: AuditResource
  resourceId?: string
  /** Scope multi-tenant — requis pour les journaux filtrés par org. */
  orgId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

// Synchrone — à appeler depuis un contexte déjà async.
// Préférer logAuditAsync pour ne pas bloquer la réponse.
export async function logAudit(params: LogAuditParams) {
  try {
    const { details, ...rest } = params
    await prisma.auditLog.create({
      data: {
        ...rest,
        ...(details !== undefined && { details: JSON.parse(JSON.stringify(details)) }),
      },
    })
  } catch (error) {
    console.error('[logAudit] échec écriture journal:', error)
  }
}

// Fire-and-forget — n'attend pas la résolution, n'impacte pas le temps de réponse.
// À utiliser systématiquement dans les server actions (CREATE/UPDATE/DELETE critiques).
export function logAuditAsync(params: LogAuditParams) {
  setImmediate(() => { logAudit(params) })
}
