//types
import type { ComponentType } from "react";
import type { StudentRow } from "@/components/direction/students/utils";

export type { StudentRow };

export type RateEntry = { rate: number | null; absences: number; denominator: number };
export type AttendanceRates = Record<string, RateEntry>;

export type Sex = StudentRow["sex"];

/**
 * Niveau d'importance visuelle d'une colonne.
 * Détermine à lui seul la hiérarchie de lecture (typographie, poids, couleur) —
 * voir presentation.ts, seule source de vérité pour le rendu associé.
 */
export type ImportanceTier = "critical" | "primary" | "secondary" | "tertiary";

export type ColumnKind = "text" | "number" | "sex";

export type BaseColumnId =
  | "presence"
  | "nom"
  | "prenom"
  | "filiere"
  | "classe"
  | "age"
  | "sexe"
  | "email"
  | "phone"
  | "parents";

/** Définition d'une colonne de base : donnée pure, aucun rendu. */
export interface BaseColumnDef {
  id: BaseColumnId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  width: number;
  align?: "right";
  sortId?: string;
  kind: ColumnKind;
  tier: ImportanceTier;
  /** Valeur brute (string) dérivée des données serveur, avant tout override local. */
  raw: (s: StudentRow, rate?: RateEntry) => string;
}

export interface CustomColumnDef {
  id: string;
  label: string;
}

/**
 * Overrides locaux, jamais persistés en base.
 * overrides[studentId][columnKey] = valeur saisie par l'utilisateur en mode édition.
 */
export type Overrides = Record<string, Record<string, string>>;

export interface ColumnFilters {
  filiere: string;
  classe: string;
  sexe: string;
  presenceMin: string;
}
