// src/hooks/data/programs/programPdfStructure.ts

/**
 * Structure de référence des informations affichées dans l'export PDF programme.
 * Ce fichier sert de source unique pour:
 * - documenter les sections visibles
 * - standardiser les labels utilisés dans le PDF
 */

export const PROGRAM_PDF_STRUCTURE = {
  header: {
    title: "Programme",
    classLine: ["programTrack", "name", "level", "academicYear"] as const,
    exportDateLabel: "Édité le",
  },

  organization: {
    sectionTitle: "Informations organisation",
    fields: [
      { key: "name", label: "Organisation" },
      { key: "slug", label: "Slug" },
      { key: "ville", label: "Ville" },
      { key: "adresse-postale", label: "Adresse postale" },
      { key: "indicatif", label: "Indicatif" },
      { key: "phones", label: "Téléphones" },
      { key: "emails", label: "Emails" },
    ] as const,
  },

  globalStats: {
    cards: ["Semestres", "UE", "Cours", "Crédits", "Volume"] as const,
  },

  semesterTable: {
    titlePrefix: "Semestre",
    summaryPattern: "{ueCount} UE  ·  {duration}h  ·  {credits} crédits",
    columns: ["N°", "Code", "Intitulé", "Vol. horaire", "Crédits", ""] as const,
    totalLabel: "TOTAL SEMESTRE",
  },

  footer: {
    pagePattern: "Page {current} / {total}",
  },
} as const;

