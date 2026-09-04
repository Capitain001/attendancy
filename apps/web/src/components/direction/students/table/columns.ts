import { Activity, Cake, DoorOpen, Mail, Phone, School, User, Users, Venus } from "lucide-react";

import { CLASS_LABEL } from "@/services/class/policy";
import { computeAge } from "@/components/direction/students/utils";
import type { BaseColumnDef } from "./types";

/**
 * Colonnes de base, triées par niveau d'importance décroissant.
 * L'ordre ici pilote directement l'ordre d'affichage : la lecture va du plus
 * critique (présence) au plus accessoire (contact), de gauche à droite.
 */
export const BASE_COLUMNS: BaseColumnDef[] = [
  // Critique : indicateur de suivi, doit sauter aux yeux avant tout le reste.
  {
    id: "presence",
    label: "Présence",
    icon: Activity,
    width: 70,
    sortId: "rate",
    kind: "number",
    tier: "critical",
    raw: (_s, rate) => (rate && rate.rate !== null ? String(rate.rate) : ""),
  },

  // Primaire : identité et placement académique — cœur de la fiche.
  { id: "nom", label: "Nom", icon: User, width: 120, sortId: "nom", kind: "text", tier: "primary", raw: (s) => s.lastName ?? "" },
  { id: "prenom", label: "Prénom", icon: User, width: 120, sortId: "prenom", kind: "text", tier: "primary", raw: (s) => s.firstName ?? "" },
  { id: "filiere", label: "Filière", icon: School, width: 135, sortId: "filiere", kind: "text", tier: "primary", raw: (s) => s.programTrackName ?? "" },
  { id: "classe", label: CLASS_LABEL, icon: DoorOpen, width: 140, sortId: "classe", kind: "text", tier: "primary", raw: (s) => s.className ?? "" },

  // Secondaire : informations contextuelles, utiles mais non prioritaires.
  {
    id: "age",
    label: "Âge",
    icon: Cake,
    width: 75,
    sortId: "age",
    kind: "number",
    tier: "secondary",
    raw: (s) => {
      const a = computeAge(s.dateOfBirth);
      return a !== null ? String(a) : "";
    },
  },
  { id: "sexe", label: "Sexe", icon: Venus, width: 90, sortId: "sexe", kind: "sex", tier: "secondary", raw: (s) => String(s.sex) },

  // Tertiaire : coordonnées de contact — consultées ponctuellement, jamais scannées en masse.
  { id: "email", label: "Email", icon: Mail, width: 165, sortId: "email", kind: "text", tier: "tertiary", raw: (s) => s.email ?? "" },
  { id: "phone", label: "Téléphone", icon: Phone, width: 120, sortId: "phone", kind: "text", tier: "tertiary", raw: (s) => s.phone ?? "" },
  {
    id: "parents",
    label: "Parents",
    icon: Users,
    width: 80,
    sortId: "parents",
    kind: "number",
    tier: "tertiary",
    raw: (s) => String(s.parentCount ?? 0),
  },
];
