import { Filter, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { useStudentsTable } from "../useStudentsTable";
import { FilterPanel } from "./FilterPanel";

export function Toolbar({ t }: { t: ReturnType<typeof useStudentsTable> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <div className="relative w-52">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={t.search}
          onChange={(e) => t.setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="h-7.5 pl-8 text-xs"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7.5 gap-1.5 !px-1.5 text-xs">
            <Filter className="size-3.5" />
            {/* Filtres */}
            {t.activeFilterCount > 0 && (
              <span className="grid size-3.5 place-items-center rounded-full bg-primary text-[9.5px] text-primary-foreground">
                {t.activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[360px] bg-card-elevated border-border shadow-md">
          <FilterPanel t={t} />
        </PopoverContent>
      </Popover>

      <Button
        variant={t.editMode ? "default" : "outline"}
        size="sm"
        className="h-7.5 gap-1.5 !px-1.5 text-xs"
        onClick={() => t.setEditMode(!t.editMode)}
      >
        <Pencil className="size-3.5" />
        {/* Éditer */}
      </Button>


      {t.editMode && (
        <span className="text-[11px] text-muted-foreground">
          Modifications locales
        </span>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        {t.rows.length} étudiant{t.rows.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}
