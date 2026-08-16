import Link from "next/link";
import { BackgroundPattern } from "@/components/design/BackgroundPattern";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GetProgramsDto } from "@/services/program/types";
import { Layers3, GraduationCap, Eye, Pencil, Trash2 } from "lucide-react";

interface ProgramCardProps {
  program: GetProgramsDto[number];
  slug: string;
  onDelete: (id: string) => void;
}

export function ProgramCard({
  program,
  slug,
  onDelete,
}: ProgramCardProps) {
  const viewHref = `/${slug}/direction/program/${program.id}`;
  const editHref = `/${slug}/direction/program/${program.id}/edit`;

  return (
    <Card
      className="flex h-full flex-col justify-between transition-shadow hover:shadow-md isolate relative z-20  pattern-noise"
      style={
        {
          "--pattern-opacity": 0.4,
        } as React.CSSProperties
      }
    >
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-base font-semibold">
              {program.name}
            </CardTitle>

            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {program.programTrack?.name ?? "Sans parcours"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>
              {program.classes.length} classe
              {program.classes.length > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="justify-end gap-2">
        <Link
          href={viewHref}
          title="Voir la fiche programme"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Voir
        </Link>

        <Link
          href={editHref}
          title="Modifier le programme"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Link>

        <button
          type="button"
          onClick={() => onDelete(program.id)}
          title="Supprimer le programme"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </button>
      </CardFooter>
    </Card>
  );
}
