"use server";


import { InvitationResult } from "@/types/invitation";
import { inviteUser } from "../user";

type InviteTeacherParams = {
  email: string;
  name?: string;
  resources?: TeacherResources
  permissions?: string[];   
};

export type TeacherResources= {
    courses?: string[];
    classes?: string[];
}
export async function inviteTeacher({
  email,
  name,
  permissions = [],
  resources
}: InviteTeacherParams) {
  try {
    const result = await inviteUser({
      email,
      name,
      role: "TEACHER",
      permissions,
      resources,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error || "Échec de l'invitation de l'enseignant",
      };
    }

    return {
      success: true,
      message: `Une invitation a été envoyée à ${email}`,
      metadata: result.data?.metadata,
    };
  } catch (error) {
    console.error("Erreur lors de l'invitation de l'enseignant:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de l'invitation",
    };
  }
}
