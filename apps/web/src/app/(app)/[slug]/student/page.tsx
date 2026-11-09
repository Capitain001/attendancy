// src/app/(app)/[slug]/student/page.tsx
// Dashboard étudiant — sections plein écran, une responsabilité par section.
import { connection } from "next/server";
import type { ReactNode } from "react";
import { addDays, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

import {
  getStudentProfileAction,
  getStudentStatsAction,
  getStudentScheduleAction,
} from "@/services/student";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";
import { cn, formatTime } from "@/lib/utils";
import { BackpackIllustration, StudentEmpty } from "@/components/student/ui/illustrations";
import { SectionDots } from "@/components/student/ux/SectionDots";

const NEXT_COURSE_WINDOW_DAYS = 14;
const COUNTDOWN_MAX_MIN = 180;
const MAX_TODAY_ROWS = 6;
const SCROLLER_ID = "student-scroller";
const SECTIONS = [
  { id: "accueil", label: "Accueil" },
  { id: "prochain", label: "Prochain cours" },
  { id: "journee", label: "Aujourd'hui" },
  { id: "presence", label: "Présence" },
] as const;

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="flex h-full snap-center snap-always items-center justify-center px-6 pb-14"
    >
      <div className="w-full max-w-md">{children}</div>
    </section>
  );
}

export default async function StudentDashboardPage() {
  await connection();

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{profileRes.error}</p>
      </div>
    );
  }

  const profile = profileRes.data;
  const { classId, groupIds } = profile;

  if (!classId) {
    return (
      <StudentEmpty
        illustration={<BackpackIllustration />}
        title="Aucune classe associée"
        hint="Contacte ta direction pour être inscrit — ton tableau de bord apparaîtra ici."
        className="h-full"
      />
    );
  }

  const now = new Date();
  const nowMs = now.getTime();

  const [statsRes, scheduleRes] = await Promise.all([
    getStudentStatsAction({ classId, groupIds }),
    getStudentScheduleAction({
      classId,
      groupIds,
      rangeStart: startOfDay(now),
      rangeEnd: endOfDay(addDays(now, NEXT_COURSE_WINDOW_DAYS)),
    }),
  ]);

  const stats = "data" in statsRes ? statsRes.data : null;
  const schedules = ("data" in scheduleRes ? scheduleRes.data ?? [] : []).map((s) => ({
    ...s,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  }));
  const today = schedules.filter((s) => isSameDay(s.startTime, now));
  const coursesTodayCount = today.filter((s) => s.status !== "CANCELED").length;

  const firstName = profile.user.firstName?.trim() || "Étudiant";

  // ── Cours en cours, sinon prochain cours ──
  const candidates = schedules.filter((s) => s.status !== "CANCELED");
  const ongoing = candidates.find(
    (s) => s.startTime.getTime() <= nowMs && s.endTime.getTime() >= nowMs,
  );
  const upcoming = candidates
    .filter((s) => s.startTime.getTime() > nowMs)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const nextCourse = ongoing ?? upcoming[0] ?? null;

  let nextLead: string | null = null;
  if (nextCourse && !ongoing) {
    const isToday = isSameDay(nextCourse.startTime, now);
    const minutes = Math.round((nextCourse.startTime.getTime() - nowMs) / 60000);
    if (isToday && minutes >= 0 && minutes <= COUNTDOWN_MAX_MIN) {
      nextLead = `dans ${minutes} min`;
    } else if (isToday) {
      nextLead = `à ${formatTime(nextCourse.startTime)}`;
    } else {
      nextLead = format(nextCourse.startTime, "EEEE d MMMM", { locale: fr });
    }
  }

  const teacher = nextCourse
    ? [nextCourse.teacher.user.firstName, nextCourse.teacher.user.lastName]
        .filter(Boolean)
        .join(" ")
    : "";
  const att = stats?.attendance;

  return (
    <>
      <div
        id={SCROLLER_ID}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain motion-safe:scroll-smooth"
      >
        {/* 1 · Accueil : identité uniquement */}
        <Section id="accueil">
          <p className="text-sm capitalize text-muted-foreground">
            {format(now, "EEEE d MMMM", { locale: fr })}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Bonjour, {firstName}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {coursesTodayCount > 0
              ? `Tu as ${coursesTodayCount} cours aujourd'hui`
              : "Tu n'as pas de cours aujourd'hui"}
          </p>
        </Section>

        {/* 2 · Prochain cours : un seul cours */}
        <Section id="prochain">
          {nextCourse ? (
            <>
              <p className="text-sm text-muted-foreground">
                {ongoing ? "Actuellement tu as :" : `Prochain cours · ${nextLead}`}
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
                {nextCourse.course.name}
              </h2>
              <p className="mt-4 text-sm tabular-nums text-muted-foreground">
                <span className="text-lg font-semibold tabular-nums [word-spacing:0.25rem]">
                  {formatTime(nextCourse.startTime)} – {formatTime(nextCourse.endTime)} ·{" "}
                </span>
                {nextCourse.room.name}
              </p>
              {teacher && <p className="mt-1 text-sm text-muted-foreground">{teacher}</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Prochain cours</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">Aucun cours à venir.</p>
            </>
          )}
        </Section>

        {/* 3 · Journée : la liste du jour */}
        <Section id="journee">
          <h2 className="mb-4 text-sm text-muted-foreground">
            Aujourd&apos;hui
            {stats?.today && stats.today.totalSessions > 0 && (
              <span className="tabular-nums">
                {" "}· {stats.today.doneSessions}/{stats.today.totalSessions} terminés
              </span>
            )}
          </h2>

          {today.length === 0 ? (
            <p className="text-2xl font-medium">Pas de cours aujourd&apos;hui.</p>
          ) : (
            <>
              <ul className="divide-y">
                {today.slice(0, MAX_TODAY_ROWS).map((s) => {
                  const uiStatus = resolveScheduleUiStatus(s, now);
                  const done = uiStatus === "COMPLETED" || uiStatus === "MISSED";
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        "flex items-baseline gap-4 py-3.5",
                        (done || s.status === "CANCELED") && "opacity-50",
                        s.status === "CANCELED" && "line-through",
                      )}
                    >
                      <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {formatTime(s.startTime)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{s.course.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{s.room.name}</span>
                    </li>
                  );
                })}
              </ul>
              {today.length > MAX_TODAY_ROWS && (
                <p className="mt-3 text-xs text-muted-foreground">
                  +{today.length - MAX_TODAY_ROWS} autre(s)
                </p>
              )}
            </>
          )}
        </Section>

        {/* 4 · Présence du jour */}
        <Section id="presence">
          <p className="text-sm text-muted-foreground">Ta présence aujourd&apos;hui</p>
          <p className="mt-2 text-8xl font-semibold tabular-nums tracking-tight">
            {att?.today.rate ?? "—"}
            {att?.today.rate != null && (
              <span className="text-4xl text-muted-foreground">%</span>
            )}
          </p>
          <p className="mt-4 text-sm text-muted-foreground tabular-nums">
            {att && att.today.total > 0
              ? `${att.today.attended}/${att.today.total} séances complétées`
              : "Aucune séance terminée aujourd'hui."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {att && att.today.total > 0
              ? `${att.today.missed} séance${att.today.missed === 1 ? "" : "s"} manquée${att.today.missed === 1 ? "" : "s"}`
              : "Aucune séance manquée aujourd'hui."}
          </p>
        </Section>
      </div>

      <SectionDots sections={SECTIONS} scrollerId={SCROLLER_ID} />
    </>
  );
}