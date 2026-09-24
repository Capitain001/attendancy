"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, MapPin, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import type { TeacherNextSchedule } from "@/services/schedule";

type Schedule = NonNullable<TeacherNextSchedule>;

type InfoSlideSchedule = Pick<
  Schedule,
  "notes" | "startTime" | "endTime" | "class" | "course" | "room" | "group"
>;

interface InfoSlideProps {
  schedule: InfoSlideSchedule;
  studentCount: number;
  className?: string;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className="text-[12px] font-medium text-foreground tabular-nums text-right">
        {value}
      </span>
    </div>
  );
}

export function InfoSlide({ schedule, studentCount, className }: InfoSlideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const startAt = new Date(schedule.startTime);
  const endAt = new Date(schedule.endTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const classLabel = schedule.group
    ? `${schedule.class.name} · ${schedule.group.name}`
    : `${schedule.class.name} · ${schedule.class.level}`;

  return (
    <div className={cn("relative grid grid-cols-1 grid-rows-1 w-full h-full overflow-hidden", className)}>
      
      {/* --- PANEL 1 : INFOS + BOUTON NOTE --- */}
      <div
        className={cn(
          "col-start-1 row-start-1 flex flex-col justify-center w-full h-full transition-transform duration-300 ease-in-out",
          isOpen ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
      >
        <div className="flex flex-col w-full">
          {schedule.course.ueCourse.code && (
            <InfoRow
              icon={BookOpen}
              label="Code UE"
              value={schedule.course.ueCourse.code}
            />
          )}
          <InfoRow icon={Users} label="Classe" value={classLabel} />
          <InfoRow icon={MapPin} label="Salle" value={schedule.room.name} />
          <InfoRow
            icon={Clock}
            label="Horaires"
            value={`${fmt(startAt)} – ${fmt(endAt)}`}
          />
          <InfoRow
            icon={Users}
            label="Effectif"
            value={`${studentCount} étudiant${studentCount > 1 ? "s" : ""}`}
          />
        </div>

        {/* Bouton "Note" + Poignée */}
        {schedule.notes && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-full group flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                Note
              </span>
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30 group-hover:bg-muted-foreground/60 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* --- PANEL 2 : CONTENU DE LA NOTE --- */}
      {schedule.notes && (
        <div
          className={cn(
            "col-start-1 row-start-1 flex flex-col w-full h-full rounded-xl p-3 bg-muted/20 border border-border/40 transition-transform duration-300 ease-in-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 shrink-0">
            <span className="text-foreground font-medium text-[12px]">Note du cours</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
            {schedule.notes}
          </div>
        </div>
      )}

    </div>
  );
}