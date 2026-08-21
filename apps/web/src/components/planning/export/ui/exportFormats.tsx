import React from "react";
import type { ExportFormat } from "@/lib/export/types";
import {
  IconPDF,
  IconCSV,
  IconJSON,
  IconXLSX,
} from "@/components/ui/ExportIcons";

export interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const FORMATS: FormatOption[] = [
  {
    value: "xlsx",
    label: "Excel",
    description: "Tableau natif Excel (.xlsx)",
    icon: <IconXLSX />,
  },
  {
    value: "csv",
    label: "CSV",
    description: "Tableau compatible Excel / Sheets",
    icon: <IconCSV />,
  },
  {
    value: "json",
    label: "JSON",
    description: "Données brutes structurées",
    icon: <IconJSON />,
  },
  {
    value: "print",
    label: "Impression / PDF",
    description: "Document mis en page, prêt à imprimer",
    icon: <IconPDF />,
  },
];
