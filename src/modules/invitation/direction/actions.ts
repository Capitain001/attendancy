// src/services/invitation/direction/actions.ts
"use server";

import { InvitationResult } from "@/types/invitation";
import { inviteUser } from "../user";
import { InviteDirectionParams } from "./types";
import { checkFunctionsExist } from "./database";
import { inviteDirectionSchema } from "./validation";
import { safeParse } from "valibot";
import { FunctionName, MAIN_FUNCTIONS } from "@/config/data";

/**
 * Invite un membre de la direction académique
 * 
 * @param params - Paramètres d'invitation
 * @returns Résultat de l'invitation
 * 
 * @example
 * ```typescript
 * await inviteDirection({
 *   email: "directeur@example.com",
 *   name: "Jean Dupont",
 *   functions: ["PRINCIPAL", "SECRETARY"],
 *   permissions: ["READ:STUDENT", "UPDATE:STUDENT"]
 * });
 * ```
 */
export async function inviteDirection(
  params: InviteDirectionParams
): Promise<InvitationResult> {
  try {
    // 1. Validation des paramètres avec Valibot
    const validationResult = safeParse(inviteDirectionSchema, params);
    
    if (!validationResult.success) {
      const firstError = validationResult.issues[0];
      return {
        success: false,
        error: firstError?.message || "Paramètres d'invitation invalides",
      };
    }

    const { email, name, functions, permissions = [] } = validationResult.output;

    // 2. Vérifier qu'au moins une fonction est spécifiée
    if (!functions || functions.length === 0) {
      return {
        success: false,
        error: "Au moins une fonction doit être spécifiée pour un membre de la direction",
      };
    }

    // 3. Récupérer l'utilisateur courant pour obtenir l'organisation
    const { getUserInfo } = await import("@/services/user");
    const currentUser = await getUserInfo();
    
    if (!currentUser?.organization?.id) {
      return {
        success: false,
        error: "Organisation non trouvée. Vous devez être associé à une organisation.",
      };
    }

    const orgId = currentUser.organization.id;

    // 4. Valider que les fonctions existent dans l'organisation
    const { valid, invalid } = await checkFunctionsExist(functions, orgId);

    if (invalid.length > 0) {
      return {
        success: false,
        error: `Les fonctions suivantes n'existent pas dans cette organisation: ${invalid.join(", ")}`,
      };
    }

    if (valid.length === 0) {
      return {
        success: false,
        error: "Aucune fonction valide trouvée",
      };
    }

    // 5. Pour la direction, on utilise la première fonction comme fonction principale
    // Les autres fonctions seront assignées via UserFunction lors de l'acceptation

      /**
     * NOTE :
     * Nous utilisons `as FunctionName` même pour les fonctions personnalisées
     * afin de respecter le type `FunctionName` attendu par `inviteUser()`.
     */
    const primaryFunctionName = valid[0] as FunctionName;
    
    // Récupérer l'objet fonction complet si besoin
    const primaryFunction = MAIN_FUNCTIONS.find((f) => f.name === primaryFunctionName);
    const additionalFunctions = valid.slice(1); // Fonctions supplémentaires

    if (!primaryFunction) {
      console.log(`Fonction personnalisée : ${primaryFunctionName}`);
    }
    // 6. Appeler inviteUser avec le rôle DIRECTION
    const result = await inviteUser({
      email,
      name,
      role: "DIRECTION",
      adminFunction: primaryFunction?.name || primaryFunctionName, // On passe le nom de la fonction
      permissions,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Échec de l'invitation du membre de la direction",
      };
    }

    // 7. Mettre à jour l'invitation pour stocker les fonctions supplémentaires
    // dans les détails de l'invitation pour qu'elles soient assignées lors de l'acceptation
    if (additionalFunctions.length > 0 && result.metadata) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const invitation = await prisma.invitation.findFirst({
          where: {
            email,
            orgId,
            usedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (invitation) {
          const currentDetails = invitation.details as any;
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
              details: {
                ...currentDetails,
                additionalFunctions, // Stocker les fonctions supplémentaires
              },
            },
          });
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des fonctions supplémentaires:", error);
        // Ne pas faire échouer l'invitation si cette étape échoue
      }
    }

    return {
      success: true,
      message: `Une invitation a été envoyée à ${email} pour le poste de direction`,
      metadata: result.metadata,
    };
  } catch (error) {
    console.error("Erreur lors de l'invitation du membre de la direction:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de l'invitation",
    };
  }
}

