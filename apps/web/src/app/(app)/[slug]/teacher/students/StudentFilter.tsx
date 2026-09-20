import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

export interface StudentFilterProps {
  query: string;
  setQuery: (q: string) => void;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  classes: { id: string; name: string; count: number }[];
  selectedGroupId?: string;
  setSelectedGroupId?: (id: string) => void;
  groups?: { id: string; name: string; count: number }[];
}

export function StudentFilter({
  query,
  setQuery,
  selectedClassId,
  setSelectedClassId,
  classes,
  selectedGroupId = "",
  setSelectedGroupId,
  groups = [],
}: StudentFilterProps) {
  const hasActiveFilters = Boolean(query || selectedClassId || selectedGroupId);

  const clearFilters = () => {
    setQuery("");
    setSelectedClassId("");
    if (setSelectedGroupId) setSelectedGroupId("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher un étudiant (nom, prénom, email, groupe)..."
          className={`${input.base} w-full pl-9 ${hasActiveFilters ? "pr-10" : ""}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-foreground"
            title="Effacer les filtres"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <select
          className={`${input.base} flex-1 sm:flex-initial`}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>

        {groups.length > 0 && setSelectedGroupId && (
          <select
            className={`${input.base} flex-1 sm:flex-initial`}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.count})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
