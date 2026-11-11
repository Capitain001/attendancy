// src/modules/auth/members/utils.ts
// src/services/auth/members/utils.ts
import 'server-only'

import { PrismaClient, Role } from "@/generated/prisma/client";
import { Functions } from "@/types/user";
import { createStudentEnrollmentRaw } from '@/services/student-enrollment/database';
// import { ensureMainFunctions } from "@/services/fonctions/main/database";
// import { Functions } from "@/types/user";

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Garantit l'existence du profil métier du rôle pour (userId, orgId).
 *
 * Idempotente : rejouable sans erreur.
 * - profil absent → créé
 * - profil présent → renvoyé tel quel
 * - profil désactivé (`deletedAt`) → réactivé (pattern RESTORE, même id,
 *   l'historique reste rattaché)
 *
 * Le nom dit « create » par héritage : la fonction ne plante plus si le profil existe.
 */
export async function createRoleSpecificEntity(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  userId: string,
  role: Role,
  orgId: string,
  departmentId?: string | null
) {
  switch (role) {
    case "TEACHER":
      return await tx.teacher.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId, departmentId: departmentId || undefined },
        update: { deletedAt: null, ...(departmentId ? { departmentId } : {}) },
      });

    case "STUDENT":
      return await tx.student.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
      });

    case "PARENT":
      return await tx.parent.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
      });

    case "ADMIN":
      // Admin reste global (pas de scope org).
      return await tx.admin.upsert({
        where: { userId },
        create: { userId },
        update: { deletedAt: null },
      });

    case "DIRECTION":
      return await tx.direction.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
      });

    default:
      console.warn(`Rôle non géré: ${role}. Aucune entité spécifique créée.`);
      return null;
  }
}

/**
 * Assigne plusieurs fonctions à un utilisateur
 * 
 * @param tx - Transaction Prisma
 * @param userId - ID de l'utilisateur
 * @param orgId - ID de l'organisation
 * @param functionNames - Noms des fonctions à assigner
 * @param assignedBy - ID de l'utilisateur qui a assigné les fonctions (optionnel)
 * @returns Liste des enregistrements UserFunction créés
 */
export async function assignMultipleFunctionsToUser(
  tx: Tx,
  userId: string,
  orgId: string,
  functionNames: (Functions | string)[],
  assignedBy?: string | null
): Promise<{ id: string; userId: string; functionId: string }[]> {
  if (functionNames.length === 0) {
    return [];
  }

  const results: { id: string; userId: string; functionId: string }[] = [];

  for (const functionName of functionNames) {
    const result = await assignFunctionToUser(tx, userId, orgId, functionName, assignedBy);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Assigne une fonction à un utilisateur si elle est spécifiée
 * 
 * @param tx - Transaction Prisma
 * @param userId - ID de l'utilisateur
 * @param orgId - ID de l'organisation
 * @param functionName - Nom de la fonction à assigner (optionnel)
 * @param assignedBy - ID de l'utilisateur qui a assigné la fonction (optionnel)
 * @returns L'enregistrement UserFunction créé ou null
 * 
 * @example
 * ```typescript
 * await assignFunctionToUser(tx, userId, orgId, "PRINCIPAL", invitedById);
 * ```
 */
export async function assignFunctionToUser(
  tx: Tx,
  userId: string,
  orgId: string,
  functionName?: Functions | string,
  assignedBy?: string | null
): Promise<{ id: string; userId: string; functionId: string } | null> {
  if (!functionName) {
    return null;
  }

  try {
    // S'assurer que les fonctions principales existent pour l'organisation
    // await ensureMainFunctions(orgId);

    // Trouver la fonction par nom et orgId
    const function_ = await tx.function.findUnique({
      where: {
        name_orgId: {
          name: functionName,
          orgId,
        },
      },
      select: { id: true },
    });

    if (!function_) {
      console.warn(
        `Fonction "${functionName}" non trouvée pour l'organisation ${orgId}.`
      );
      return null;
    }

    // Vérifier si la fonction n'est pas déjà assignée
    const existingAssignment = await tx.userFunction.findUnique({
      where: {
        userId_functionId: {
          userId,
          functionId: function_.id,
        },
      },
    });

    if (existingAssignment) {
      console.warn(
        `La fonction "${functionName}" est déjà assignée à l'utilisateur ${userId}.`
      );
      return existingAssignment;
    }

    // Assigner la fonction à l'utilisateur
    const userFunction = await tx.userFunction.create({
      data: {
        userId,
        functionId: function_.id,
        assignedBy: assignedBy || null,
      },
      select: {
        id: true,
        userId: true,
        functionId: true,
      },
    });

    return userFunction;
  } catch (error) {
    console.error(
      `Erreur lors de l'assignation de la fonction "${functionName}" à l'utilisateur ${userId}:`,
      error
    );
    // Ne pas faire échouer la transaction si l'assignation de fonction échoue
    return null;
  }
}

/**
 * Garantit l'inscription d'un étudiant à sa classe (et à ses groupes si précisés).
 *
 * Idempotente : rejouable sans erreur.
 * - inscription absente → créée
 * - inscription clôturée (`endedAt`) → rouverte, même ligne donc même
 *   enrollmentId (l'historique d'assiduité reste rattaché)
 * - inscription active → inchangée
 * Les groupes sont additifs : une réouverture n'efface pas les groupes existants.
 */
export async function enrollStudentInClass(
  tx: Tx,
  studentId: string,
  enrollment?: import("@/types/invitation").EnrollmentDetails
) {
  if (!enrollment?.classId) return;

  const studentEnrollment = await createStudentEnrollmentRaw(tx, {
    studentId,
    classId: enrollment.classId,
  });

  if (Array.isArray(enrollment.groupIds) && enrollment.groupIds.length > 0) {
    await tx.studentGroup.createMany({
      data: enrollment.groupIds.map((groupId) => ({
        enrollmentId: studentEnrollment.id,
        groupId,
      })),
      skipDuplicates: true,
    });
  }
}
