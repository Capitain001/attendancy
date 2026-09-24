"use client";

import { ReactNode, useState } from "react";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carouselx";
import { Gauge } from "@/components/ui/gauge";
import { SessionQRDisplay } from "@/components/session/SessionQRDisplay";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { InfoSlide } from "@/components/session/ui/InfoSlide";
import type { TeacherNextSchedule } from "@/services/schedule";

type Schedule = NonNullable<TeacherNextSchedule>;

type SessionCarouselSchedule = Pick<
  Schedule,
  "id" | "notes" | "startTime" | "endTime" | "class" | "course" | "room" | "group"
> & { session: Pick<NonNullable<Schedule["session"]>, "id" | "status"> | null };

interface SessionCarouselProps {
  schedule: SessionCarouselSchedule;
  studentCount: number;
  progressPercent: number;
  gaugeLabel: string;
  className?: string;
}

function Slide({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-72 w-full flex-col items-center justify-center px-4 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}

function TimeSlide({
  progressPercent,
  gaugeLabel,
}: {
  progressPercent: number;
  gaugeLabel: string;
}) {
  return (
    <Slide>
      <Gauge
        value={Math.round(progressPercent)}
        size={200}
        strokeWidth={9}
        showPercentage
        unit="%"
        gradient
        label={gaugeLabel}
        primary="info"
      />
    </Slide>
  );
}

function QRSlide({ sessionId }: { sessionId: string | null }) {
  if (!sessionId) {
    return (
      <Slide>
        <QrCode className="size-8 text-muted-foreground/25" />
        <p className="mt-3 max-w-[22ch] text-center text-[11px] text-muted-foreground">
          Démarrez la session pour afficher le QR code
        </p>
      </Slide>
    );
  }

  return (
    <Slide>
      <SessionQRDisplay sessionId={sessionId} />
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
      <AttendanceSection
        scheduleId={scheduleId}
        studentCount={studentCount}
        triggerClassName="h-36 w-36 rounded-2xl"
      />
    </Slide>
  );
}

export function SessionCarousel({
  schedule,
  studentCount,
  progressPercent,
  gaugeLabel,
  className,
}: SessionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <div className={cn("w-full", className)}>
      <Carousel index={activeIndex} onIndexChange={setActiveIndex} className="w-full">
        <CarouselContent>
          {/* Index 0: Infos du cours (avec le drawer de Note) */}
          <CarouselItem className="px-1">
            <Slide>
              <InfoSlide schedule={schedule} studentCount={studentCount} />
            </Slide>
          </CarouselItem>

          {/* Index 1: Temps (Gauge) */}
          <CarouselItem className="px-1">
            <TimeSlide progressPercent={progressPercent} gaugeLabel={gaugeLabel} />
          </CarouselItem>

          {/* Index 2: QR Code */}
          <CarouselItem className="px-1">
            <QRSlide sessionId={schedule.session?.id ?? null} />
          </CarouselItem>

          {/* Index 3: Présences */}
          <CarouselItem className="px-1">
            <AttendanceSlide scheduleId={schedule.id} studentCount={studentCount} />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
}