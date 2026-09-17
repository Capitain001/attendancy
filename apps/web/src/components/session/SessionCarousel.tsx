"use client";

import { ReactNode, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, MapPin, Users, QrCode, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carouselx";
import { Gauge } from "@/components/ui/gauge";
import { SessionQRDisplay } from "@/components/session/SessionQRDisplay";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { useAttendanceStats } from "@/hooks/data/attendances/use-attendance-stats";
import type { TeacherNextSchedule } from "@/services/schedule";

type Schedule = NonNullable<TeacherNextSchedule>;

type SessionCarouselSchedule = Pick<
  Schedule,
  "id" | "notes" | "startTime" | "endTime" | "class" | "course" | "room" | "group"
> & { session: Pick<NonNullable<Schedule["session"]>, "id" | "status"> | null };

interface SessionCarouselProps {
  schedule: SessionCarouselSchedule;
  studentCount: number;
  /** Pourcentage écoulé de la séance (0–100), calculé par la page appelante. */
  progressPercent: number;
  /** Libellé affiché sous la gauge — ex. "1h 56m" ou la durée totale hors session active. */
  gaugeLabel: string;
  className?: string;
}

// --- une seule slide à la fois, hauteur fixe pour que rien ne saute au swipe ---
function Slide({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-72 w-full flex-col items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
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
        size={172}
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

function InfoSlide({
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
    <Slide className="items-stretch justify-start">
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

      {schedule.notes && (
        <div className="mt-4 rounded-lg bg-muted/40 px-3.5 py-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Note du cours
          </p>
          <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
            {schedule.notes}
          </p>
        </div>
      )}
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

// --- nav en icônes, pilote directement l'index contrôlé du carrousel ---
const TABS: { label: string; Icon: LucideIcon }[] = [
  { label: "Temps", Icon: Clock },
  { label: "Cours", Icon: BookOpen },
  { label: "QR code", Icon: QrCode },
  { label: "Présences", Icon: UserCheck },
];

export function SessionCarousel({
  schedule,
  studentCount,
  progressPercent,
  gaugeLabel,
  className,
}: SessionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // pour le badge sur l'onglet Présences — même source que le bouton du modal
  const { checkedCount, isStale } = useAttendanceStats(schedule.id);

  return (
    <div className={cn("w-full", className)}>
      <Carousel index={activeIndex} onIndexChange={setActiveIndex} className="w-full">
        <CarouselContent>
          <CarouselItem className="px-1">
            <div className="px-4 py-4">
              <TimeSlide progressPercent={progressPercent} gaugeLabel={gaugeLabel} />
            </div>
          </CarouselItem>
          <CarouselItem className="px-1">
            <div className="px-4 py-4">
              <InfoSlide schedule={schedule} studentCount={studentCount} />
            </div>
          </CarouselItem>
          <CarouselItem className="px-1">
            <div className="px-4 py-4">
              <QRSlide sessionId={schedule.session?.id ?? null} />
            </div>
          </CarouselItem>
          <CarouselItem className="px-1">
            <div className="px-4 py-4">
              <AttendanceSlide scheduleId={schedule.id} studentCount={studentCount} />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {/* <nav className="flex border-t border-border/60 px-2 pb-1 pt-1.5">
        {TABS.map(({ label, Icon }, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={activeIndex === i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-muted-foreground transition-colors",
              activeIndex === i && "text-primary"
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            {label === "Présences" && !isStale && checkedCount > 0 && (
              <span className="absolute right-[22%] top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {checkedCount}
              </span>
            )}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav> */}


    </div>
  );
}


/* mise  a jour prevu :
nav a gauche de la gauge :
info cours => click sur note remplace le contenue info cours par note 
nav a droite => qr code


swiper en bas (new interface )
UI liste students 


NOTE: session qr doit etre plus epurer :
-le button session en cours devien un indicateur visuel :
liquide de progression (visuel gauche droite , si button remplis => temps fini )  en fond sur le button
effet suggestif pas intrusif 


- le temps avant epuration doit etre purement visuel : dashed opblique lign sur le button regenerer 
- plus de texte pr les action share ( juste icon )

- gauge a besoin de bg pattern (motif )

- coter etudiant lorsqu on scan le qr code ca doit emetre un bruit 


plus besoin de la ligne cours dans info cours , puisque que stable dans le header
*/

/* setting profile :
les donner douvent  nourrir un hook client et le changement de nom doit etre optimist ds l ui
a retrester avec une meilleur conexion mais : actuelement l operation prend trop de temps 
*/

/* 
user button :

si aniversaire de l user afficher des confetie dans son user menu 
en fond 

ajouter un icon gateau sur ton user Icon ( header)
et user icon des chats et commentaires


*/