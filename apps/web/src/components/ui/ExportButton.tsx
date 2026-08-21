"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { runExport } from "@/lib/export/exporters";
import type { ExportConfig, ExportFormat } from "@/lib/export/types";
import { cn } from "@/lib/utils";
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

const FORMAT_META: Record<ExportFormat, { label: string; description: string; icon: React.ReactNode }> = {
  xlsx: { label: "Excel", description: "Tableau natif Excel (.xlsx)", icon: <IconXLSX /> },
  csv: { label: "CSV", description: "Tableau compatible Excel / Sheets", icon: <IconCSV /> },
  docx: { label: "Word", description: "Document Word structuré", icon: <IconPDF /> }, // Utilise l'icône PDF par défaut pour les documents
  json: { label: "JSON", description: "Données brutes structurées", icon: <IconJSON /> },
  print: { label: "Impression / PDF", description: "Document mis en page, prêt à imprimer", icon: <IconPDF /> },
};

const DEFAULT_FORMATS: ExportFormat[] = ["xlsx", "csv", "docx", "json", "print"];

interface ExportButtonProps<T> {
  getConfig: () => ExportConfig<T>;
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
  disabled?: boolean;
  className?: string;
}

export function ExportButton<T>({
  getConfig,
  formats = DEFAULT_FORMATS,
  defaultFormat,
  disabled = false,
  className = "",
}: ExportButtonProps<T>) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);
  
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    defaultFormat ?? formats[0]
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function run() {
    if (disabled || busy) return;
    setBusy(true);
    setDone(false);
    try {
      await runExport(selectedFormat, getConfig());
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      setOpen(false);
    } catch (error) {
      console.error("[ExportButton]", error);
      toast.error("Échec de l'export.");
    } finally {
      setBusy(false);
    }
  }

  const current = FORMAT_META[selectedFormat];
  const isError = false; 
  const isLoading = busy;
  const isDone = done;

  return (
    <div ref={dropdownRef} className={`relative inline-flex items-stretch ${className}`}>
      {/* Bouton principal — déclenche l'export */}
      <button
        onClick={run}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center gap-2 px-3 h-8 text-[12px] font-medium
          border border-dashed rounded-l-sm transition-colors
          ${isDone
            ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
            : isError
              ? "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30"
              : "border-foreground/25 text-foreground/70 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${disabled || isLoading ? "cursor-not-allowed opacity-70" : ""}
        `}
      >
        {isLoading ? <IconSpinner /> : isDone ? <IconCheck /> : <IconDownload />}
        <span>
          {isLoading ? "Génération…" : isDone ? "Téléchargé" : `Exporter ${current.label}`}
        </span>
      </button>

      {/* Bouton selector de format */}
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center gap-1 px-2 h-8
          border border-l-0 border-dashed rounded-r-sm transition-colors
          text-muted-foreground
          ${open
            ? "border-foreground/40 bg-foreground/[0.04]"
            : "border-foreground/25 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${disabled || isLoading ? "cursor-not-allowed opacity-70" : ""}
        `}
        aria-label="Choisir le format"
      >
        <IconChevron />
      </button>

      {/* Dropdown des formats et options */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 z-50 border border-dashed border-foreground/25 bg-background shadow-md rounded-sm overflow-hidden p-1 space-y-1">
          <div className="px-2 py-1 border-b border-dashed border-foreground/15">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Format d'export</span>
          </div>

          <div className="p-1 space-y-1">
            {formats.map((fmt) => {
              const meta = FORMAT_META[fmt];
              return (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-sm transition-colors
                    hover:bg-foreground/[0.04]
                    ${fmt === selectedFormat ? "bg-foreground/[0.04]" : ""}
                  `}
                >
                  <span className="text-muted-foreground">{meta.icon}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground leading-tight">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{meta.description}</p>
                  </div>

                  {fmt === selectedFormat && (
                    <svg className="size-3.5 text-foreground/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-dashed border-foreground/15 px-1 pb-1">
            <button
              onClick={run}
              disabled={disabled || isLoading}
              className={`
                w-full h-8 text-[12px] font-medium rounded-sm transition-opacity flex items-center justify-center gap-2
                ${disabled || isLoading ? "opacity-50 cursor-not-allowed bg-foreground/10 text-foreground/50" : "bg-foreground text-background hover:opacity-90"}
              `}
            >
              {current.icon}
              Télécharger l'export {current.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
