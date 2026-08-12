import { Layers } from "lucide-react";

import { CollapseSection } from "@/components/courses/pages/DirectionCoursePage";
import type { ProgramTrackByDepartment } from "@/services/program-track/types";

import { ProgramTrackCard } from "./ProgramTrackCard";

interface ProgramTrackListProps {
  programTracksByDepartment: ProgramTrackByDepartment[];
  baseHref: string;
}

export default function ProgramTrackList({
  programTracksByDepartment = [],
  baseHref,
}: ProgramTrackListProps) {
  if (programTracksByDepartment.length === 0) {
    return <ProgramTrackEmptyState />;
  }

  return (
    <div className="flex flex-col gap-y-4">
      {programTracksByDepartment.map((group) => (
        <CollapseSection
          key={group.department.id}
          label={group.department.name}
          count={group.tracks.length}
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.tracks.map((track) => (
              <ProgramTrackCard
                key={track.id}
                href={`${baseHref}/${track.id}`}
                programTrack={track}
              />
            ))}
          </div>
        </CollapseSection>
      ))}
    </div>
  );
}
function ProgramTrackEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card py-16 text-center">
      <Layers className="size-6 text-muted-foreground/40" />
      <p className="text-sm font-medium">Aucune filiere configuree</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Creez une filiere pour organiser les classes par departement.
      </p>
    </div>
  );
}
