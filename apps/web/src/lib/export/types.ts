// src/lib/export/types.ts
//
// Modèle d'export générique réutilisable (CSV / XLSX / PDF / DOCX / JSON / print).
// Convention : une feature décrit ses COLONNES (header + accesseur) + ses lignes ;
// les exporters s'occupent du formatage et de l'auto-ajustement des largeurs.


import { ResourceIconName } from "@/config/data";
import type { ElementType } from "react";

/** Une colonne d'export : libellé + extraction de la valeur texte depuis une ligne. */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string;
  /** Largeur indicative (caractères). Si omis, auto-ajustée au contenu. */
  width?: number;
}

export interface ExportConfig<T> {
  columns: ExportColumn<T>[];
  rows: T[];
  /** Nom de fichier sans extension (ex. "etudiants-2026-06-14"). */
  filename: string;
  /** Titre affiché dans XLSX / DOCX / PDF / print. */
  title?: string;
  /** Sous-titre (ex. date). */
  subtitle?: string;
  /** Nom de l'onglet XLSX (défaut: "Export"). */
  sheetName?: string;
}

// "print" = impression navigateur → enregistrer en PDF (rendu HTML/CSS propre).
// On n'expose pas de PDF « dessiné » (jspdf) ni serveur : rendu incohérent avec
// le print, non garantissable (dépend des réglages d'impression locaux).
export type ExportFormat = "xlsx" | "csv" | "docx" | "json" | "print";

export interface ExportFormatMeta {
  label: string;
  /** Icône . */
  // icon: ElementType;
    icon: ResourceIconName;
}
