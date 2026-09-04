"use client";

import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

interface CourseFilterProps {
  query: string;
  setQuery: (q: string) => void;
  selectedUeCode: string;
  setSelectedUeCode: (code: string) => void;
  ueCodes: string[];
}

export function CourseFilter({
  query,
  setQuery,
  selectedUeCode,
  setSelectedUeCode,
  ueCodes,
}: CourseFilterProps) {
  const hasActiveFilters = Boolean(query || selectedUeCode);

  const clearFilters = () => {
    setQuery("");
    setSelectedUeCode("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher un cours (nom, UE, enseignant)..."
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

      {ueCodes.length > 0 && (
        <div className="flex gap-2 items-center">
          <select
            className={input.base}
            value={selectedUeCode}
            onChange={(e) => setSelectedUeCode(e.target.value)}
          >
            <option value="">Toutes les UE</option>
            {ueCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
