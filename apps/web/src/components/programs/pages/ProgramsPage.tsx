"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrograms } from "@/hooks/data/programs/usePrograms";
import type { ProgramDto } from "@/services/program/types";
import type { ProgramTrackDto } from "@/services/program-track/types";
import { ProgramDialog } from "../modal/ProgramDialog";
import { ProgramCard } from "../ui/ProgramCard";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProgramsPageProps {
  classId?: string;
  programTrackId?: string;
  programTracks?: ProgramTrackDto[];
}

export function ProgramsPage({
  classId,
  programTrackId,
  programTracks = [],
}: ProgramsPageProps) {
  const {
    data,
    loading,
    delete: remove,
  } = usePrograms({ classId });

  const programs = data?.items ?? [];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>(programTrackId ?? "");

  const params = useParams<{ slug: string }>();
  const slug = (params?.slug as string | undefined) ?? "";

  const handleCreate = () => setOpen(true);

  const handleDelete = async (id: string) => {
    if (!remove) return;
    await remove(id);
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesQuery = [program.name, program.description ?? "", program.programTrack?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesTrack =
        !trackFilter || program.programTrack?.id === trackFilter;

      return matchesQuery && matchesTrack;
    });
  }, [programs, query, trackFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Gestion académique
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Programmes
          </h1>

          <p className="max-w-2xl text-muted-foreground">
            Gérez les programmes de formation et leur organisation.
          </p>
        </div>

        <Button size="lg" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau programme
        </Button>
      </div>

      {/* Toolbar */}
      <div className=" flex flex-col gap-3 rounded-md border md:flex-row md:items-center">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Rechercher un programme..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              h-11
              rounded-md
              border-border/60
              bg-background/70
              pl-10
              shadow-none
              transition-all
              focus-visible:border-primary
              focus-visible:ring-2
              focus-visible:ring-primary/20
            "
          />
        </div>

        {/* Filtre */}
        <div className="flex w-full items-center gap-2 md:w-72">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/60 bg-muted/40">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>

          <Select
            value={trackFilter}
            onValueChange={(value) =>
              setTrackFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-11 rounded-md border-border/60 bg-background/70">
              <SelectValue placeholder="Tous les parcours" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>

              {programTracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredPrograms.length} programme
          {filteredPrograms.length > 1 && "s"}
        </span>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-6 w-full">
        {filteredPrograms.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Aucun programme trouvé pour cette recherche.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                slug={slug}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <ProgramDialog
          open={open}
          onOpenChange={setOpen}
          classId={classId}
          programTrackId={programTrackId}
          programTracks={programTracks}
        />
      </div>
    </div>
  );
}
