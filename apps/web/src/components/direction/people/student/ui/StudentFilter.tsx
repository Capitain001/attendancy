import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

interface StudentFilterProps {
  query: string;
  setQuery: (q: string) => void;
  groupId: string;
  setGroupId: (id: string) => void;
  groups: { id: string; name: string }[];
}

export function StudentFilter({
  query,
  setQuery,
  groupId,
  setGroupId,
  groups,
}: StudentFilterProps) {
  const hasActiveFilters = Boolean(query || groupId);

  const clearFilters = () => {
    setQuery("");
    setGroupId("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher un étudiant (nom, prénom, email)..."
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

      {groups.length > 0 && (
        <div className="flex flex-row gap-2 items-center">
          <select
            className={`${input.base} flex-1 sm:w-auto`}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
