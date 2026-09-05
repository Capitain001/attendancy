"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProgramExport, type ExportFormat } from "@/hooks/data/programs/useProgramExport";

import type { ProgramPageData } from "../types";

// ==================== TYPES ====================

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

import {
  IconDownload,
  IconChevron,
  IconCheck,
  IconSpinner,
  IconPDF,
  IconCSV,
  IconJSON,
  IconXLSX,
} from "@/components/ui/ExportIcons";

// ==================== FORMAT OPTIONS ====================

const FORMATS: FormatOption[] = [
  {
    value: "pdf",
    label: "PDF",
    description: "Document mis en page, prêt à imprimer",
    icon: <IconPDF />,
  },
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
];



// ==================== COMPONENT ====================

interface ProgramExportButtonProps {
  data: ProgramPageData;
  /** Format sélectionné par défaut */
  defaultFormat?: ExportFormat;
  className?: string;
  showType?: boolean;
}

export function ProgramExportButton({
  data,
  defaultFormat = "pdf",
  className = "",
  showType = true,
}: ProgramExportButtonProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [watermark, setWatermark] = useState<string>("Document Officiel");
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { status, exportAs } = useProgramExport(data);

  const isLoading = status === "loading";
  const isDone = status === "done";
  const isError = status === "error";

  const current = FORMATS.find(f => f.value === selectedFormat)!;

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(format: ExportFormat) {
    setSelectedFormat(format);
  }

  function handleExport() {
    if (isLoading) return;
    exportAs({
      format: selectedFormat,
      template: "official",
      watermark: selectedFormat === "pdf" && watermark ? watermark : undefined,
      showSignatures: selectedFormat === "pdf" ? showSignatures : false,
      showType,
    });
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative inline-flex items-stretch ${className}`}>

      {/* Bouton principal — déclenche l'export */}
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 px-3 h-8 text-[12px] font-medium
          border border-dashed rounded-l-sm transition-colors
          ${isDone
            ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
            : isError
              ? "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30"
              : "border-foreground/25 text-foreground/70 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${isLoading ? "cursor-wait opacity-70" : ""}
        `}
      >
        {isLoading ? <IconSpinner /> : isDone ? <IconCheck /> : <IconDownload />}
        <span>
          {isLoading ? "Génération…" : isDone ? "Téléchargé" : isError ? "Erreur" : `Exporter ${current.label}`}
        </span>
      </button>

      {/* Bouton selector de format */}
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-1 px-2 h-8
          border border-l-0 border-dashed rounded-r-sm transition-colors
          text-muted-foreground
          ${open
            ? "border-foreground/40 bg-foreground/[0.04]"
            : "border-foreground/25 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${isLoading ? "cursor-wait opacity-70" : ""}
        `}
        aria-label="Choisir le format"
      >
        {current.icon}
        <IconChevron />
      </button>

      {/* Dropdown des formats et options */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 z-50 border border-dashed border-foreground/25 bg-background shadow-md rounded-sm overflow-hidden p-1 space-y-1">
          <div className="px-2 py-1 border-b border-dashed border-foreground/15">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Format d'export</span>
          </div>

          {FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => handleSelect(fmt.value)}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-sm transition-colors
                hover:bg-foreground/[0.04]
                ${fmt.value === selectedFormat ? "bg-foreground/[0.04]" : ""}
              `}
            >
              <span className="text-muted-foreground">{fmt.icon}</span>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground leading-tight">{fmt.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{fmt.description}</p>
              </div>

              {fmt.value === selectedFormat && (
                <svg className="size-3.5 text-foreground/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}

          {selectedFormat === "pdf" && (
            <div className="pt-2 border-t border-dashed border-foreground/15 px-2 space-y-2 pb-1">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-medium text-muted-foreground tracking-widest">Filigrane PDF</label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="h-7 px-2 text-[11px] bg-background border border-dashed border-foreground/25 rounded-sm outline-none"
                >
                  <option value="">Aucun</option>
                  <option value="Document Officiel">Document Officiel</option>
                  <option value="Provisoire">Provisoire</option>
                  <option value="Projet de Maquette">Projet de Maquette</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-foreground/80 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="size-3.5 rounded border-foreground/30 accent-foreground"
                />
                Grille de signatures
              </label>
            </div>
          )}

          <div className="pt-2 border-t border-dashed border-foreground/15 px-1">
            <button
              onClick={handleExport}
              className="w-full h-8 text-[12px] font-medium bg-foreground text-background rounded-sm hover:opacity-90 transition-opacity"
            >
              Télécharger l'export {current.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
