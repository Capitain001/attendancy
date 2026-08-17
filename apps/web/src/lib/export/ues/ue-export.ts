// src/lib/export/ues/ue-export.ts
//
// Configuration d'export pour les Unités d'Enseignement.
// Utilise le système d'export générique (ExportConfig<T>).

import type { ExportColumn } from "../types"
import type { GetUEsDto } from "@/services/ue"

type UEItem = GetUEsDto[number]

export const ueExportColumns: ExportColumn<UEItem>[] = [
  {
    header: "Code",
    value: (ue) => ue.code ?? "—",
    width: 14,
  },
  {
    header: "Intitulé",
    value: (ue) => ue.name || "Non renseigné",
    width: 40,
  },
  {
    header: "Département",
    value: (ue) => ue.department?.name ?? "Non rattachée",
    width: 25,
  },
  {
    header: "Type",
    value: (ue) => (ue.isOptional ? "Optionnelle" : "Obligatoire"),
    width: 14,
  },
  {
    header: "Nombre EC",
    value: (ue) => String(ue.ueCourses.length),
    width: 12,
  },
  {
    header: "Crédits totaux",
    value: (ue) => String(ue.ueCourses.reduce((s, c) => s + c.credits, 0)),
    width: 14,
  },
  {
    header: "Durée totale (h)",
    value: (ue) => String(ue.ueCourses.reduce((s, c) => s + c.duration, 0)),
    width: 16,
  },
]

export function buildUEExportConfig(ues: UEItem[], orgName?: string) {
  const date = new Date().toLocaleDateString("fr-FR")
  return {
    columns: ueExportColumns,
    rows: ues,
    filename: `ues-${date}`,
    title: "Liste des Unités d'Enseignement",
    subtitle: orgName ? `${orgName} — ${date}` : date,
    sheetName: "UEs",
  }
}
