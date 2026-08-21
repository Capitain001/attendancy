"use client";

import { useRef, useEffect } from "react";

import {
  IconDownload,
  IconChevron,
  IconCheck,
  IconSpinner,
} from "@/components/ui/ExportIcons";
import { AXIS_LABEL, PERIOD_LABEL } from "./constants";
import type { Axis, Period } from "./constants";
import { FORMATS } from "./ui";
import { usePlanningExport } from "@/hooks/data/planning";
import type { PlanningResources } from "@/services/planning";

interface Props {
  classId: string;
  resources: NonNullable<PlanningResources>;
}

export function PlanningExportWidget({ classId, resources }: Props) {
  const {
    open, setOpen,
    axis, setAxis,
    entityId, setEntityId, entityOptions, needsEntity,
    period, setPeriod,
    custom, setCustom,
    periodLabel,
    exportFormat, setExportFormat,
    handleExport,
    rows, loading, busy, done,
  } = usePlanningExport({ classId, resources });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpen]);

  const currentFormat = FORMATS.find((f) => f.value === exportFormat) ?? FORMATS[0];
  const disabled = loading || busy || rows.length === 0;

  return (
    <div ref={dropdownRef} className="relative inline-flex items-stretch">
      {/* Bouton principal — déclenche l'export */}
      <button
        onClick={handleExport}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-3 h-8 text-[12px] font-medium
          border border-dashed rounded-l-sm transition-colors
          ${done
            ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "border-foreground/25 text-foreground/70 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${busy || loading ? "cursor-wait opacity-70" : ""}
        `}
      >
        {busy || loading ? <IconSpinner /> : done ? <IconCheck /> : <IconDownload />}
        <span>
          {busy ? "Génération…" : loading ? "Chargement…" : done ? "Téléchargé" : `Exporter ${currentFormat.label}`}
        </span>
      </button>

      {/* Bouton selector de format / params */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={`
          inline-flex items-center gap-1 px-2 h-8
          border border-l-0 border-dashed rounded-r-sm transition-colors
          text-muted-foreground
          ${open
            ? "border-foreground/40 bg-foreground/[0.04]"
            : "border-foreground/25 hover:border-foreground/40 hover:bg-foreground/[0.03]"
          }
          ${busy ? "cursor-wait opacity-70" : ""}
        `}
        aria-label="Configurer l'export"
      >
        <IconChevron />
      </button>

      {/* Dropdown des options */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 z-50 border border-dashed border-foreground/25 bg-background shadow-md rounded-sm overflow-hidden p-1 space-y-1">
          <div className="px-2 py-1 border-b border-dashed border-foreground/15">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Configuration de l'export</span>
          </div>

          <div className="p-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-medium text-muted-foreground tracking-widest">Périmètre</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(AXIS_LABEL) as Axis[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAxis(a)}
                    className={`
                      w-full flex items-center justify-center h-7 text-[11px] font-medium rounded-sm transition-colors
                      ${axis === a ? "bg-foreground text-background" : "hover:bg-foreground/[0.04] text-muted-foreground border border-dashed border-foreground/25"}
                    `}
                  >
                    {AXIS_LABEL[a]}
                  </button>
                ))}
              </div>
            </div>

            {needsEntity && (
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="w-full h-8 px-2 text-[11px] bg-background border border-dashed border-foreground/25 rounded-sm outline-none"
              >
                {entityOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-medium text-muted-foreground tracking-widest">Période</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`
                      w-full flex items-center justify-center h-7 text-[11px] font-medium rounded-sm transition-colors
                      ${period === p ? "bg-foreground text-background" : "hover:bg-foreground/[0.04] text-muted-foreground border border-dashed border-foreground/25"}
                    `}
                  >
                    {PERIOD_LABEL[p]}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="flex items-center gap-1.5 pt-1.5">
                  <input
                    type="date"
                    value={custom.start}
                    onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                    className="flex-1 h-7 px-2 text-[11px] bg-background border border-dashed border-foreground/25 rounded-sm outline-none"
                  />
                  <input
                    type="date"
                    value={custom.end}
                    onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                    className="flex-1 h-7 px-2 text-[11px] bg-background border border-dashed border-foreground/25 rounded-sm outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-2 pt-0 space-y-1.5">
            <label className="text-[9px] uppercase font-medium text-muted-foreground tracking-widest">Format</label>
            <div className="flex items-center gap-2 w-full h-8 px-2 text-[11px] bg-background border border-dashed border-foreground/25 rounded-sm focus-within:border-foreground/40 transition-colors">
              <span className="text-muted-foreground">{currentFormat.icon}</span>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                className="flex-1 bg-transparent outline-none cursor-pointer"
              >
                {FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="py-2 border-t border-dashed border-foreground/15 px-1 pb-1">
            <div className="px-2 pb-2 min-w-0 text-[10px] text-muted-foreground flex justify-between items-center">
              <span className="truncate">{periodLabel}</span>
              <span className="tabular-nums font-medium">
                {loading ? "Chargement…" : `${rows.length} séance${rows.length > 1 ? "s" : ""}`}
              </span>
            </div>

            <button
              onClick={handleExport}
              disabled={disabled}
              className={`
                w-full h-8 text-[12px] font-medium flex items-center justify-center gap-2
                border border-dashed rounded-sm transition-colors
                ${done
                  ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-foreground/25 text-foreground/70 hover:border-foreground/40 hover:bg-foreground/[0.03]"
                }
                ${disabled ? "opacity-50" : ""}
              `}
            >
              {busy ? <IconSpinner /> : done ? <IconCheck /> : currentFormat.icon}
              {busy ? "Génération…" : done ? "Téléchargé" : "Télécharger"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}