"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { runExport } from "@/lib/export/exporters";
import type {
  ExportConfig,
  ExportFormat,
  ExportFormatMeta,
} from "@/lib/export/types";
import { cn } from "@/lib/utils";
import { ResourceIcon } from "../icons/ResourceIcon";

const FORMAT_META: Record<ExportFormat, ExportFormatMeta> = {
  xlsx: { label: "Excel", icon: "excel" },
  csv: { label: "CSV", icon: "csv" },
  docx: { label: "Word", icon: "word" },
  json: { label: "JSON", icon: "json" },
  print: { label: " PDF", icon: "pdf" },
};

const DEFAULT_FORMATS: ExportFormat[] = ["xlsx", "csv", "docx", "json", "print"];

interface ExportButtonProps<T> {
  /** Construit la config au moment de l'export (reflète la sélection courante). */
  getConfig: () => ExportConfig<T>;
  /** Formats proposés (ordre = ordre du menu). Défaut : tous. */
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
  className?: string;
}

/**
 * Bouton d'export générique (split : action + sélecteur de format).
 * Réutilisable sur n'importe quelle table via ExportConfig (cf. src/lib/export).
 */
export function ExportButton<T>({
  getConfig,
  formats = DEFAULT_FORMATS,
  defaultFormat,
  disabled = false,
  size = "sm",
  variant = "outline",
  className,
}: ExportButtonProps<T>) {
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<ExportFormat>(
    defaultFormat ?? formats[0],
  );

  const current = FORMAT_META[selected];


  async function run(fmt: ExportFormat) {
    setBusy(true);
    try {
      await runExport(fmt, getConfig());
    } catch (error) {
      console.error("[ExportButton]", error);
      toast.error("Échec de l'export.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Button
       
        variant={variant}
        size={size}
        className="gap-1.5 rounded-r-none bg-inherit/50 border-1.3"
        disabled={disabled || busy}
        onClick={() => run(selected)}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ResourceIcon name={current.icon} className="dark:invert-0" size={16} />
        )}

        <span className="hidden sm:inline"> Exporter</span>
        {/* {current.label} */}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            aria-label="Choisir le format d'export"
            className="rounded-l-none border-l px-2"
            disabled={disabled || busy}
          >
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {formats.map((fmt) => {
            const meta = FORMAT_META[fmt];

            return (
              <DropdownMenuItem className="gap-2" key={fmt} onClick={() => setSelected(fmt)}>

                <ResourceIcon name={meta.icon} size={16} className="dark:invert-0" />
                {meta.label}
                {selected === fmt && (
                  <Check className="ml-auto size-3.5 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
