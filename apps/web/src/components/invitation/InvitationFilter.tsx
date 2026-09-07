import { Search, X } from "lucide-react";
import { input } from "@/styles";
import { Button } from "@/components/ui/button";
import { Role } from "@/generated/prisma/client";
import { InvitationStatus } from "@/modules/invitation/status";

const FILTERS: { value: 'all' | InvitationStatus; label: string }[] = [
  { value: 'all', label: 'Toutes les invitations' },
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'expired', label: 'Expirées' },
];

const ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'TEACHER', label: 'Enseignant' },
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'PARENT', label: 'Parent' },
];

interface InvitationFilterProps {
  query: string;
  setQuery: (q: string) => void;
  role: Role | '';
  setRole: (r: Role | '') => void;
  status: InvitationStatus | 'all';
  setStatus: (s: InvitationStatus | 'all') => void;
}

export function InvitationFilter({
  query,
  setQuery,
  role,
  setRole,
  status,
  setStatus,
}: InvitationFilterProps) {
  const hasActiveFilters = Boolean(query || role || status !== 'all');

  const clearFilters = () => {
    setQuery("");
    setRole("");
    setStatus("all");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Rechercher par email..."
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

      <div className="flex gap-2 flex-nowrap items-center">
        <select
          className={input.base}
          value={role}
          onChange={(e) => setRole(e.target.value as Role | '')}
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {/* <select
          className={input.base}
          value={status}
          onChange={(e) => setStatus(e.target.value as InvitationStatus | 'all')}
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select> */}
      </div>
    </div>
  );
}
