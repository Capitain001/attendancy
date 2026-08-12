// src/components/programs/pages/ProgramDetailPage.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, GraduationCap, Layers3 } from "lucide-react";

import { ButtonX } from "@/components/design/ButtonX";
import { BackgroundPattern } from "@/components/design/BackgroundPattern";
import { GridDeco } from "@/components/programs/program/ui";
import { CollapseSection } from "@/components/programs/program/ui";

export type ProgramDetailData = {
  id: string;
  name: string;
  description: string | null;
  programTrack: {
    id: string;
    name: string;
    department: { id: string; name: string } | null;
  } | null;
  classes: {
    id: string;
    name: string;
    level: string;
    academicYear: { id: string; name: string } | null;
  }[];
};

interface ProgramDetailPageProps {
  program: ProgramDetailData;
  slug: string;
}

export function ProgramDetailPage({ program, slug }: ProgramDetailPageProps) {
  const backHref = `/${slug}/direction/program`;

  return (
    <section className="relative w-full pb-16 md:px-4">
      <BackgroundPattern pattern="pattern-noise" className="opacity-10" />

      <div className="relative mx-auto space-y-5">
        {/* Back */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour aux programmes
        </Link>

        {/* Hero */}
        <div className="relative overflow-hidden border border-dashed border-foreground/25 p-4 sm:p-5">
          <GridDeco />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest">
                Fiche programme
              </p>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight">
                {program.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {program.programTrack && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary rounded-sm border border-dashed border-primary/30">
                    <Layers3 className="h-3 w-3" />
                    {program.programTrack.name}
                  </span>
                )}
                {program.programTrack?.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-muted rounded-sm border border-dashed border-border">
                    <Building2 className="h-3 w-3" />
                    {program.programTrack.department.name}
                  </span>
                )}
              </div>
              {program.description && (
                <p className="text-sm text-muted-foreground max-w-2xl pt-2">
                  {program.description}
                </p>
              )}
            </div>

            <div className="flex gap-4 w-full justify-end">
              {[
                { val: program.classes.length, lbl: "Classes" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="text-center">
                  <div className="text-lg sm:text-xl font-medium leading-none">
                    {val}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                    {lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes liées */}
        <CollapseSection
          label="Classes liées"
          count={program.classes.length}
        >
          {program.classes.length === 0 ? (
            <div className="border border-dashed border-foreground/20 rounded-sm p-6 text-center text-xs text-muted-foreground">
              Aucune classe n'utilise encore ce programme.
            </div>
          ) : (
            <ul className="flex flex-col">
              {program.classes.map((c) => {
                const editHref = `/${slug}/direction/classes/${c.id}/program`;
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 sm:px-3 border-b border-dashed border-foreground/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-7 sm:size-8 rounded-sm bg-foreground/[0.04] flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          {c.level}
                          {c.academicYear ? ` · ${c.academicYear.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <ButtonX
                      href={editHref}
                      className="h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs flex items-center gap-1.5"
                      title="Éditer les UE de cette classe"
                    >
                      <BookOpen className="h-3 w-3" />
                      Éditer les UE
                    </ButtonX>
                  </li>
                );
              })}
            </ul>
          )}
        </CollapseSection>
      </div>
    </section>
  );
}
