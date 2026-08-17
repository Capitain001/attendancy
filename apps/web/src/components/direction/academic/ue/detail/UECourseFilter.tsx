import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

interface UECourseFilterProps {
  query: string;
  setQuery: (q: string) => void;
}

export function UECourseFilter({ query, setQuery }: UECourseFilterProps) {
  const hasActiveFilters = Boolean(query);

  const clearFilters = () => {
    setQuery("");
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

      <input
        type="text"
        placeholder="Rechercher un EC (nom, code)..."
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
          title="Effacer la recherche"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
