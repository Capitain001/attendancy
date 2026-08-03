// src/services/organization/logo_url.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function updateOrganizationLogo(organizationId: string, logo_url: string) {
  try {
    const supabase = await createClient();

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Vérifier que l'utilisateur a les droits sur cette organisation
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: user.id,
        orgId: organizationId,
        isResponsable: true
      }
    });

    if (!userOrg) {
      throw new Error("Vous n'avez pas les droits pour modifier cette organisation");
    }

    // Mettre à jour le logo de l'organisation
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: { logo: logo_url },
    });

    return {
      success: true,
      organization: updatedOrganization,
      logo_url,
    };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du logo:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la mise à jour du logo",
    };
  }
}
