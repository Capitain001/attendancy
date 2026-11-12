
import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

interface StudentFilterProps {
  query: string;
  setQuery: (q: string) => void;
  total: number;
}

export function StudentFilter({ query, setQuery, total }: StudentFilterProps) {
  const hasActiveFilters = Boolean(query);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={`Rechercher parmi ${total}…`}
        aria-label="Rechercher un étudiant"
        className={`${input.base} w-full pl-9 [&::-webkit-search-cancel-button]:hidden ${hasActiveFilters ? "pr-10" : ""}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuery("")}
          className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-foreground"
          title="Effacer la recherche"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}