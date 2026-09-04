import { Eye, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { useStudentsTable } from "../useStudentsTable";

export function AddColumnPopover({ t }: { t: ReturnType<typeof useStudentsTable> }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Ajouter une colonne"
        className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <Plus className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        {t.hiddenBaseColumns.length > 0 && (
          <div className="mb-1">
            <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Afficher un champ
            </p>
            {t.hiddenBaseColumns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => t.showColumn(c.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Eye className="size-3.5 text-muted-foreground" />
                {c.label}
              </button>
            ))}
            <div className="my-1 border-t" />
          </div>
        )}
        <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Nouveau champ
        </p>
        <div className="flex items-center gap-1.5 px-1">
          <input
            value={t.newFieldLabel}
            onChange={(e) => t.setNewFieldLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && t.addCustomColumn()}
            placeholder="Nom du champ"
            className="h-8 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:border-ring"
          />
          <button
            type="button"
            onClick={t.addCustomColumn}
            disabled={!t.newFieldLabel.trim()}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
