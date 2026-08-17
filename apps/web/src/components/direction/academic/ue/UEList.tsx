"use client"

import { useState, useMemo } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { LayoutGrid, List, LibraryBig, Download, Plus } from "lucide-react"
import { card, typography } from "@/styles"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UEFilter } from "./UEFilter"
import { UEViews, type DeptGroup } from "./UEViews"
import { buildUEExportConfig } from "@/lib/export/ues/ue-export"
import { runExport } from "@/lib/export"
import type { ExportFormat } from "@/lib/export"
import type { GetUEsDto } from "@/services/ue"

type UEItem = GetUEsDto[number]
type ViewMode = "grid" | "list"

export function UEList({ ues }: { ues: UEItem[] }) {
  const [query, setQuery] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [optionalFilter, setOptionalFilter] = useState("")
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("attendancy-ue-view-mode", "grid")

  const departments = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>()
    ues.forEach((ue) => {
      if (!ue.department) return
      const existing = map.get(ue.department.id)
      if (existing) {
        existing.count++
      } else {
        map.set(ue.department.id, { name: ue.department.name, count: 1 })
      }
    })
    return Array.from(map.entries()).map(([id, value]) => ({
      id,
      name: value.name,
      count: value.count,
    }))
  }, [ues])

  const filteredUEs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ues.filter((ue) => {
      const matchesQuery =
        !q ||
        ue.name.toLowerCase().includes(q) ||
        (ue.code && ue.code.toLowerCase().includes(q))
      const matchesDepartment =
        !departmentId || ue.department?.id === departmentId
      const matchesOptional =
        !optionalFilter ||
        (optionalFilter === "optional" && ue.isOptional) ||
        (optionalFilter === "required" && !ue.isOptional)
      return matchesQuery && matchesDepartment && matchesOptional
    })
  }, [ues, query, departmentId, optionalFilter])

  const groupedByDept = useMemo<DeptGroup[]>(() => {
    const map = new Map<string, DeptGroup>()
    for (const ue of filteredUEs) {
      const key = ue.department?.id ?? "__none__"
      if (!map.has(key)) {
        map.set(key, {
          deptId: ue.department?.id ?? null,
          deptName: ue.department?.name ?? "Non rattachées",
          ues: [],
        })
      }
      map.get(key)!.ues.push(ue)
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.deptId === null) return 1
      if (b.deptId === null) return -1
      return a.deptName.localeCompare(b.deptName, "fr")
    })
  }, [filteredUEs])

  const hasActiveFilters = Boolean(query || departmentId || optionalFilter)

  const handleExport = (format: ExportFormat) => {
    const cfg = buildUEExportConfig(filteredUEs)
    runExport(format, cfg)
  }

  if (ues.length === 0) {
    return (
      <div className={cn(card.soft, "py-16 text-center flex flex-col items-center justify-center")}>
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-4">
          <LibraryBig className="size-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Aucune Unité d'Enseignement</h3>
        <p className={cn(typography.body, "text-muted-foreground max-w-sm mb-6")}>
          Commencez par créer votre première UE pour structurer les cours et les emplois du temps de votre établissement.
        </p>
        <Button className="gap-2">
          <Plus className="size-4" />
          Créer une UE
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtre + contrôles */}
      <div className="flex flex-col gap-3">
        <UEFilter
          query={query}
          setQuery={setQuery}
          departmentId={departmentId}
          setDepartmentId={setDepartmentId}
          optionalFilter={optionalFilter}
          setOptionalFilter={setOptionalFilter}
          departments={departments}
        />

        {/* Barre de contrôle : compteur + vue + export */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? `${filteredUEs.length} sur ${ues.length} UE`
              : `${ues.length} UE`}
          </span>

          <div className="flex items-center gap-2">
            {/* Toggle vue */}
            <div className="flex rounded-md border border-border/50 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center justify-center size-8 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title="Vue grille"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center justify-center size-8 transition-colors border-l border-border/50",
                  viewMode === "list"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title="Vue liste"
              >
                <List className="size-4" />
              </button>
            </div>

            {/* Export dropdown */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Exporter"
              >
                <Download className="size-4" />
              </Button>
              <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-md group-hover:block">
                <button
                  onClick={() => handleExport("xlsx")}
                  className="flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport("print")}
                  className="flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  Imprimer / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu groupé par département */}
      <UEViews
        groups={groupedByDept}
        viewMode={viewMode}
        totalFiltered={filteredUEs.length}
      />
    </div>
  )
}
