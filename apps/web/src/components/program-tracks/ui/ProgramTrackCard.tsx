import Link from "next/link";
import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProgramTrackDto } from "@/services/program-track/types";

type ProgramTrackCardProps = {
  programTrack: ProgramTrackDto;
  href: string;
  className?: string;
};

export function ProgramTrackCard({
  programTrack,
  href,
  className,
}: ProgramTrackCardProps) {
  const classCount = programTrack._count?.classes ?? 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-40 flex-col justify-between rounded-xl border bg-card p-4",
        "transition-colors hover:bg-card/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <GraduationCap className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {programTrack.name}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {programTrack.description || "Aucune description renseignee."}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed pt-3 text-xs text-muted-foreground">
        <span className="truncate">{programTrack.department.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
          <BookOpen className="size-3.5" />
          {classCount} classe{classCount > 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
