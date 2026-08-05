// src/services/invitation/student/database.ts

import { prisma } from "@/lib/prisma";
import type { InvitationListItem } from "../database";
import type { DatabaseInvitationDetails } from "@/types/invitation";

interface CheckInvitationResourcesParams {
  classId:   string;
  orgId:     string;
  groupIds?: string[];
}

interface CheckResult {
  valid:  boolean;
  error?: string;
}

/**
 * Vérifie en une seule passe (Promise.all) que :
 * - la classe existe et appartient à l'organisation (via Class → AcademicYear.orgId)
 * - tous les groupes (si fournis) appartiennent à la classe
 *
 * yearId n'est pas un paramètre — il est porté par Class.yearId directement.
 */
export async function checkInvitationResources(
  params: CheckInvitationResourcesParams
) {
  const { classId, orgId, groupIds } = params;

  const hasGroups = !!groupIds?.length;

  const [_class, validGroupCount] = await Promise.all([
    // Vérifie classe + appartenance à l'org via AcademicYear
    prisma.class.findFirst({
      where: {
        id:        classId,
        deletedAt: null,
        academicYear: {
          orgId,
          isActive: true,
        },
      },
      select: { id: true },
    }),

    // Compte combien de groupes de la liste appartiennent bien à la classe
    // Si le compte != groupIds.length → au moins un groupe est invalide
    hasGroups
      ? prisma.group.count({
          where: {
            id:        { in: groupIds },
            classId,
            deletedAt: null,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!_class) {
    return { valid: false, error: "La classe spécifiée n'existe pas ou n'appartient pas à cette organisation" };
  }

  if (hasGroups && validGroupCount !== groupIds!.length) {
    return { valid: false, error: "Un ou plusieurs groupes ne sont pas valides ou n'appartiennent pas à cette classe" };
  }

  return { valid: true };
}

/**
 * Invitations dont les détails contiennent `enrollment.classId` pour une classe donnée.
 */
export async function getClassInvitations(classId: string, orgId: string) {
  const invitations = await prisma.invitation.findMany({
    where: {
      orgId,
      resourceId:   classId,
      resourceType: "CLASS",
    },
    select: {
      id:        true,
      email:     true,
      createdAt: true,
      expiresAt: true,
      usedAt:    true,
      details:   true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return invitations.map((inv) => ({
    id:        inv.id,
    email:     inv.email,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    usedAt:    inv.usedAt,
    details:   inv.details ? (inv.details as DatabaseInvitationDetails) : null,
  }));
}