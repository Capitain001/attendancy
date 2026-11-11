// src/components/personal/organization/profile/roles.ts
import type { PersonalRole } from "@/modules/auth/constants";

export type RoleOptionConfig = {
  role: PersonalRole;
  label: string;
  description: string;
  imageUrl: string;
};

// Remplace les imageUrl par tes URLs.
export const ROLE_OPTIONS: RoleOptionConfig[] = [
  { role: "TEACHER", label: "Enseignant", description: "Gérez vos classes, cours et présences.", imageUrl: "" },
  { role: "STUDENT", label: "Étudiant", description: "Suivez votre emploi du temps et vos présences.", imageUrl: "" },
  { role: "PARENT", label: "Parent", description: "Suivez la scolarité de vos enfants.", imageUrl: "" },
];