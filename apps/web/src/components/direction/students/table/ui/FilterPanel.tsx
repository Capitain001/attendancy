import { cn } from "@/lib/utils";
import { sexLabel } from "@/components/direction/students/utils";
import { CLASS_LABEL } from "@/services/class/policy";
import type { useStudentsTable } from "../useStudentsTable";
import { SEX_OPTIONS } from "./TableHelpers";

export function FilterPanel({ t }: { t: ReturnType<typeof useStudentsTable> }) {
  const selectClass = "h-8 w-full rounded-md border bg-card-elevated text-foreground px-2 text-[13px] outline-none focus:border-ring transition-colors";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filtres</span>
        {t.activeFilterCount > 0 && (
          <button type="button" onClick={t.resetFilters} className="text-xs text-muted-foreground hover:text-foreground">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Filière</span>
          <select className={selectClass} value={t.colFilters.filiere} onChange={(e) => t.setFilter({ filiere: e.target.value })}>
            <option value="">Toutes</option>
            {t.filiereOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{CLASS_LABEL}</span>
          <select className={selectClass} value={t.colFilters.classe} onChange={(e) => t.setFilter({ classe: e.target.value })}>
            <option value="">Toutes</option>
            {t.classeOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sexe</span>
          <select className={selectClass} value={t.colFilters.sexe} onChange={(e) => t.setFilter({ sexe: e.target.value })}>
            <option value="">Tous</option>
            {SEX_OPTIONS.map((sx) => (
              <option key={sx} value={sx}>{sexLabel(sx)}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Présence min.</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={100}
              value={t.colFilters.presenceMin}
              onChange={(e) => t.setFilter({ presenceMin: e.target.value })}
              placeholder="0"
              className={cn(selectClass, "tabular-nums")}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </label>
      </div>
    </div>
  );
}
