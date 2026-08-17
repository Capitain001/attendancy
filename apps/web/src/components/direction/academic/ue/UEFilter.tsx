import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

interface UEFilterProps {
  query: string;
  setQuery: (q: string) => void;
  departmentId: string;
  setDepartmentId: (id: string) => void;
  optionalFilter: string;
  setOptionalFilter: (v: string) => void;
  departments: { id: string; name: string; count: number }[];
}

export function UEFilter({
  query,
  setQuery,
  departmentId,
  setDepartmentId,
  optionalFilter,
  setOptionalFilter,
  departments,
}: UEFilterProps) {
  const hasActiveFilters = Boolean(query || departmentId || optionalFilter);

  const clearFilters = () => {
    setQuery("");
    setDepartmentId("");
    setOptionalFilter("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher une UE (nom, code)..."
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

      <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
        <select
          className={input.base}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Tous les départements</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.count})
            </option>
          ))}
        </select>

        <select
          className={input.base}
          value={optionalFilter}
          onChange={(e) => setOptionalFilter(e.target.value)}
        >
          <option value="">Toutes les UE</option>
          <option value="required">Obligatoires</option>
          <option value="optional">Optionnelles</option>
        </select>
      </div>
    </div>
  );
}

