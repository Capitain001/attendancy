import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";

export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Actif", cls: "bg-green-500/15 text-green-600" },
  INACTIVE: { label: "Inactif", cls: "bg-muted text-text-subtle" },
  INVITED: { label: "Invité", cls: "bg-primary/10 text-primary" },
};

interface TeacherFilterProps {
  query: string;
  setQuery: (q: string) => void;
  departmentId: string;
  setDepartmentId: (id: string) => void;
  status: string;
  setStatus: (status: string) => void;
  departments: { id: string; name: string }[];
}

export function TeacherFilter({
  query,
  setQuery,
  departmentId,
  setDepartmentId,
  status,
  setStatus,
  departments,
}: TeacherFilterProps) {
  const hasActiveFilters = Boolean(query || departmentId || status);

  const clearFilters = () => {
    setQuery("");
    setDepartmentId("");
    setStatus("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher un enseignant..."
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
              {d.name}
            </option>
          ))}
        </select>

        <select
          className={input.base}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}