"use client";

import { ReactNode } from "react";
import { BookOpen, Clock, MapPin, Users, StickyNote, QrCode, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselIndicator,
} from "@/components/ui/carouselx";
import { SessionQRDisplay } from "@/components/session/SessionQRDisplay";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import type { TeacherNextSchedule } from "@/services/schedule";

type Schedule = NonNullable<TeacherNextSchedule>;

type SessionCarouselSchedule = Pick<
  Schedule,
  "id" | "notes" | "startTime" | "endTime" | "class" | "course" | "room" | "group"
> & { session: Pick<NonNullable<Schedule["session"]>, "id" | "status"> | null };

interface SessionCarouselProps {
  schedule: SessionCarouselSchedule;
  studentCount: number;
  className?: string;
}

function Slide({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col h-full w-full", className)}>{children}</div>;
}

function SlideLabel({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5 mb-1", className)}>
      <div className="flex items-center justify-center gap-1.5">
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="h-px w-10 rounded-full bg-border/50" />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className="text-[12px] font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function ScheduleInfoSlide({
  schedule,
  studentCount,
}: Pick<SessionCarouselProps, "schedule" | "studentCount">) {
  const startAt = new Date(schedule.startTime);
  const endAt = new Date(schedule.endTime);
  const fmt = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const classLabel = schedule.group
    ? `${schedule.class.name} · ${schedule.group.name}`
    : `${schedule.class.name} · ${schedule.class.level}`;

  return (
    <Slide>
      <SlideLabel icon={BookOpen} label="Informations" />
      <div className="flex flex-col">
        <InfoRow icon={BookOpen} label="Cours" value={schedule.course.name} />
        {schedule.course.ueCourse.code && (
          <InfoRow icon={BookOpen} label="Code UE" value={schedule.course.ueCourse.code} />
        )}
        <InfoRow icon={Users} label="Classe" value={classLabel} />
        <InfoRow icon={MapPin} label="Salle" value={schedule.room.name} />
        <InfoRow icon={Clock} label="Horaires" value={`${fmt(startAt)} – ${fmt(endAt)}`} />
        <InfoRow
          icon={Users}
          label="Effectif"
          value={`${studentCount} étudiant${studentCount > 1 ? "s" : ""}`}
        />
      </div>
    </Slide>
  );
}

function NotesSlide({ notes }: { notes: string }) {
  return (
    <Slide className="gap-y-10">
      <SlideLabel icon={StickyNote} label="Notes du cours" />
      <div className="flex-1 flex rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
        <p className="text-[12px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {notes}
        </p>
      </div>
    </Slide>
  );
}

function QRSlide({ sessionId }: { sessionId: string }) {
  return (
    <Slide className="items-center">
      <SlideLabel icon={QrCode} label="QR Code" />
      <div className="flex-1 flex items-center justify-center">
        <SessionQRDisplay sessionId={sessionId} />
      </div>
    </Slide>
  );
}

function QREmptySlide() {
  return (
    <Slide className="items-center">
      <SlideLabel icon={QrCode} label="QR Code" />
      <div className="flex-1 min-h-40 my-5 flex flex-col items-center justify-center gap-2 text-center">
        <QrCode className="size-8 text-muted-foreground/25" />
        <p className="text-[11px] text-muted-foreground">
          Démarrez la session pour afficher le QR code
        </p>
      </div>
    </Slide>
  );
}

function AttendanceSlide({
  scheduleId,
  studentCount,
}: {
  scheduleId: string;
  studentCount: number;
}) {
  return (
    <Slide>
      <SlideLabel icon={UserCheck} label="Présences" />
      <div className="flex-1 py-10 flex items-center justify-center">
        <AttendanceSection
          scheduleId={scheduleId}
          studentCount={studentCount}
          triggerClassName="rounded-full aspect-square"
        />
      </div>
    </Slide>
  );
}

export function SessionCarousel({ schedule, studentCount, className }: SessionCarouselProps) {
  const slides: ReactNode[] = [
    <ScheduleInfoSlide key="info" schedule={schedule} studentCount={studentCount} />,
  ];

  if (schedule.notes) {
    slides.push(<NotesSlide key="notes" notes={schedule.notes} />);
  }

  if (schedule.session?.id) {
    slides.push(<QRSlide key="qr" sessionId={schedule.session.id} />);
  } else {
    slides.push(<QREmptySlide key="qr-empty" />);
  }

  slides.push(
    <AttendanceSlide key="attendance" scheduleId={schedule.id} studentCount={studentCount} />
  );

  return (
    <div className={cn("relative w-full", className)}>
      <Carousel className="w-full">
        <CarouselContent>
          {slides.map((slide, i) => (
            <CarouselItem key={i} className="px-1">
              <div className="min-h-50 h-full px-4 py-4">{slide}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselIndicator className="bottom-2" />
      </Carousel>
    </div>
  );
}
