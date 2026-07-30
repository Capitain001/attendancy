// src/utils/server/audit.ts

import "server-only";

import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { ERRORS } from "@/config";
import { prisma } from "@/lib/prisma";
import type { Action, Resource } from "@/generated/prisma";

/**
 * Actions d'audit définies par le projet (enum Prisma).
 */
export type AuditAction = Action;

/**
 * Ressources auditées.
 * L'union avec `string` permet d'introduire progressivement
 * de nouveaux modules sans bloquer le développement.
 */
export type AuditResource = Resource | (string & {});

/**
 * Informations de l'utilisateur conservées dans le journal.
 * Elles sont enregistrées dans `details.actor` afin de préserver
 * le contexte historique même si le compte est modifié ou supprimé.
 */
export interface AuditActor {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface LogAuditParams {
  /** Identifiant de l'utilisateur ayant effectué l'action. */
  userId: string;

  /** Scope du journal en environnement multi-tenant. */
  orgId?: string | null;

  /** Action réalisée. */
  action: AuditAction;

  /** Ressource concernée (User, Student, Invoice, ...). */
  resource?: AuditResource;

  /** Identifiant de la ressource concernée. */
  resourceId?: string;

  /**
   * Snapshot de l'acteur au moment de l'action.
   * Fusionné dans `details.actor`.
   */
  actor?: AuditActor;

  /**
   * Informations métier complémentaires.
   * Exemple :
   * {
   *   previousStatus: "PENDING",
   *   newStatus: "APPROVED"
   * }
   */
  details?: Record<string, unknown>;

  /** Adresse IP de l'auteur de l'action. */
  ipAddress?: string | null;

  /** User-Agent de la requête. */
  userAgent?: string | null;
}

/**
 * Enregistre une entrée dans le journal d'audit.
 *
 * À utiliser uniquement après une mutation réussie
 * (create, update, delete, restore, archive...).
 */
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
    // Fusionne les informations métier avec le snapshot de l'acteur.
    const payload = {
      ...(details ?? {}),
      ...(actor && { actor }),
    };

    await prisma.auditLog.create({
      data: {
        userId,
        orgId: orgId ?? null,
        action,
        resource: resource ?? null,
        resourceId: resourceId ?? null,
        details:
          Object.keys(payload).length === 0
            ? undefined
            : JSON.parse(JSON.stringify(payload)),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    // La journalisation ne doit jamais empêcher l'action métier de réussir.
    console.error(ERRORS.AUDIT_LOG, error);
  }
}

/**
 * Lance la journalisation en arrière-plan afin de ne pas
 * augmenter le temps de réponse de la Server Action.
 */
export function logAuditAsync(params: LogAuditParams) {
  setImmediate(() => {
    logAudit(params);
  });
}

/**
 * Extrait les métadonnées utiles de la requête HTTP
 * pour les enregistrer dans le journal d'audit.
 */
export function getRequestMeta(headers: ReadonlyHeaders) {
  const forwarded = headers.get("x-forwarded-for");

  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : headers.get("x-real-ip");

  return {
    ip,
    userAgent: headers.get("user-agent"),
  };
}
