// Dashboard étudiant — visuel porté de la V1 (section « anneau du jour » omise :
// getStudentStatsAction V2 ne fournit pas encore `today` — cf. specs/student-pages-v2 A-5).
import { connection } from "next/server";
import { addDays, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, BookOpen, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import {
  getStudentProfileAction,
  getStudentStatsAction,
  getStudentScheduleAction,
} from "@/services/student";
import { resolveScheduleUiStatus } from "@/services/schedule/policy";
import { formatTime } from "@/lib/utils";
import { ScheduleStatusBadge } from "@/components/student/ui/badges";
import { StudentStat, StudentStatGrid } from "@/components/student/ui/stat";
import {
  BackpackIllustration,
  CalendarRestIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";

/** Fenêtre de recherche du prochain cours (D14 : multi-jours, pas borné au jour). */
const NEXT_COURSE_WINDOW_DAYS = 14;
/** Au-delà, on n'affiche plus un compte à rebours mais l'heure/le jour. */
const COUNTDOWN_MAX_MIN = 180;

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
  const schedules = ("data" in scheduleRes ? scheduleRes.data ?? [] : []).map(
    (s) => ({ ...s, startTime: new Date(s.startTime), endTime: new Date(s.endTime) }),
  );
  const today = schedules.filter((s) => isSameDay(s.startTime, now));

  const todayCourses = Array.from(
    new Map(today.map((s) => [s.course.id, s.course])).values(),
  );

  const firstName = profile.user.firstName?.trim() || "Étudiant";

  const nowMs = now.getTime();
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
      nextLead = `${minutes} min`;
    } else if (isToday) {
      nextLead = formatTime(nextCourse.startTime);
    } else {
      nextLead = format(nextCourse.startTime, "EEE d MMM", { locale: fr });
    }
  }

  return (
    <div className="flex flex-col gap-16 pt-2 pb-16">
      {/* ── Header (zone d'impact, display) ── */}
      <header>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Bonjour, {firstName}
          </h1>
          <span className="font-serif text-2xl font-semibold tabular-nums text-muted-foreground">
            {formatTime(now, "h:")}
          </span>
        </div>
      </header>

      {/* ── Prochain cours : bloc d'accent plein ── */}
      {nextCourse && (
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {ongoing ? "En cours" : "Prochain cours"}
            </span>
            {nextLead && (
              <span className="font-display text-2xl font-bold tabular-nums">{nextLead}</span>
            )}
          </div>

          <h2 className="font-display mt-4 text-2xl font-bold leading-tight">
            {nextCourse.course.name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium opacity-90">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatTime(nextCourse.startTime)}–{formatTime(nextCourse.endTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {nextCourse.room.name}
            </span>
          </div>
        </section>
      )}

      {/* ── Ta journée ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ta journée
          </h3>
          <Link
            href="./student/planning"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Planning <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {today.length === 0 ? (
          <StudentEmpty
            illustration={<CalendarRestIllustration />}
            title="Pas de cours aujourd'hui"
            hint="Profite de ta journée — ton prochain cours est affiché plus haut."
            className=""
          />
        ) : (
          today.map((s) => {
            const uiStatus = resolveScheduleUiStatus(s, now);
            const done = uiStatus === "COMPLETED" || uiStatus === "MISSED";
            return (
              <div
                key={s.id}
                className={`flex items-center gap-4 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-accent/40 ${done ? "opacity-50" : ""}`}
              >
                <span className="font-display w-12 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                  {formatTime(s.startTime)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif truncate text-lg leading-snug">{s.course.name}</p>
                  <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {s.room.name}
                  </p>
                </div>
                <ScheduleStatusBadge status={uiStatus} />
              </div>
            );
          })
        )}
      </section>

      {/* ── Mon suivi (stats serif, factuel P-25) ── */}
      {stats && (
        <section className="space-y-2">
          <h3 className="font-display px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mon suivi
          </h3>
          <StudentStatGrid>
            <StudentStat value={`${stats.attendanceRate}%`} label="Présence" accent="text-emerald-600" />
            <StudentStat value={stats.todayCount} label="Aujourd'hui" />
            <StudentStat value={stats.totalCourses} label="Cours" />
          </StudentStatGrid>
        </section>
      )}

      {/* ── Mes cours du jour ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mes cours du jour
          </h3>
          <Link
            href="student/courses"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Tout voir <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {todayCourses.length === 0 ? (
          <StudentEmpty
            illustration={<BackpackIllustration />}
            title="Aucun cours aujourd'hui"
            hint="Retrouve l'ensemble de tes cours via « Tout voir »."
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {todayCourses.map((course) => (
              <Link
                key={course.id}
                href={`student/courses/${course.id}`}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-accent/40"
              >
                <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-serif truncate text-base">{course.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
