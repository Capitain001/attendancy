"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  GraduationCap,
  Mail,
  Phone,
  School,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CLASS_LABEL } from "@/services/class/policy";
import { SexIcon } from "@/components/direction/students/ui/icons";
import {
  avatarColor,
  computeAge,
  fullName,
  initials,
  sexLabel,
} from "@/components/direction/students/utils";
import type { AttendanceRates, StudentRow } from "../types";

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

function StudentDetailContent({
  student,
  presenceRate,
  href,
}: {
  student: StudentRow;
  presenceRate: number | null;
  href?: string;
}) {
  const name = fullName(student);
  const age = computeAge(student.dateOfBirth);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 pt-1.5 sm:p-3.5 sm:pt-3 pb-2 sm:pb-2.5 border-b text-left space-y-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span
            className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full text-xs sm:text-sm font-semibold text-white"
            style={{ background: avatarColor(student.studentId) }}
          >
            {initials(student)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold truncate text-foreground leading-snug">
              {name}
            </h3>
            <p className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              <SexIcon sex={student.sex} className="size-3 sm:size-3.5" />
              <span>{sexLabel(student.sex)}</span>
              {age !== null && <span>• {age} ans</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 sm:space-y-3">
        {/* Parcours Académique */}
        <div className="space-y-1 sm:space-y-1.5">
          <h4 className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Parcours Académique
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 rounded-md border p-2 bg-card">
            <div className="space-y-0.5 min-w-0">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                <School className="size-3 sm:size-3.5 shrink-0" />
                Filière
              </span>
              <p className="text-xs font-medium text-foreground truncate">
                {student.programTrackName ?? "Non renseigné"}
              </p>
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                <GraduationCap className="size-3 sm:size-3.5 shrink-0" />
                {CLASS_LABEL}
              </span>
              <p className="text-xs font-medium text-foreground truncate">
                {student.className ?? "Non renseigné"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Assiduité */}
        <div className="space-y-1 sm:space-y-1.5">
          <h4 className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Assiduité
          </h4>
          <div className="flex items-center justify-between rounded-md border p-2 bg-card">
            <span className="text-xs font-medium text-foreground">Taux de présence</span>
            <span className="text-xs font-semibold tabular-nums">
              {presenceRate !== null ? `${presenceRate}%` : "—"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Coordonnées */}
        <div className="space-y-1 sm:space-y-1.5">
          <h4 className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Coordonnées
          </h4>
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between py-0.5 border-b last:border-b-0 gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 text-[11px] sm:text-xs">
                <Mail className="size-3 sm:size-3.5" />
                Email
              </span>
              <span className="font-medium text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                {student.email ?? "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b last:border-b-0 gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 text-[11px] sm:text-xs">
                <Phone className="size-3 sm:size-3.5" />
                Téléphone
              </span>
              <span className="font-mono font-medium text-foreground truncate">
                {student.phone ?? "—"}
              </span>
            </div>

            {student.dateOfBirth && (
              <div className="flex items-center justify-between py-0.5 border-b last:border-b-0 gap-2">
                <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 text-[11px] sm:text-xs">
                  <Calendar className="size-3 sm:size-3.5" />
                  Date de naissance
                </span>
                <span className="font-medium text-foreground">
                  {new Date(student.dateOfBirth).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-0.5 border-b last:border-b-0 gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 text-[11px] sm:text-xs">
                <Users className="size-3 sm:size-3.5" />
                Parents / Tuteurs
              </span>
              <span className="font-medium text-foreground">
                {student.parentCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {href && (
        <div className="p-2.5 pb-5 sm:p-2.5 sm:pb-2.5 border-t bg-card mt-auto">
          <Button asChild size="sm" className="w-full gap-2 text-xs h-7.5 sm:h-8">
            <Link href={href}>
              <span>Voir le profil étudiant</span>
              <ExternalLink className="size-3 sm:size-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function StudentDetailSheet({
  student,
  rate,
  open,
  onOpenChange,
  href,
}: {
  student: StudentRow | null;
  rate?: AttendanceRates[string];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  href?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (!student) return null;

  const presenceRate = rate?.rate ?? null;

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col gap-0 p-0">
          <StudentDetailContent student={student} presenceRate={presenceRate} href={href} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col gap-0 p-0">
        <StudentDetailContent student={student} presenceRate={presenceRate} href={href} />
      </DrawerContent>
    </Drawer>
  );
}
