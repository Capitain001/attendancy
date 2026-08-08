"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { AttendanceStatus } from "@/generated/prisma/client";

import {
  ATTENDANCE_META,
  AttendanceStatusBadge,
} from "@/components/student/ui/badges";
import { StudentStat, StudentStatGrid } from "@/components/student/ui/stat";
import {
  NotebookIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";
import { cn } from "@/lib/utils";

export type AttendanceRow = {
  id: string;
  status: AttendanceStatus;
  schedule: {
    startTime: Date;
    course: { name: string };
  };
};

const FILTERS = ["TOUS", "PRESENT", "ABSENT", "LATE", "EXCUSED", "PENDING"] as const;
const filterParser = parseAsStringLiteral(FILTERS).withDefault("TOUS");

/**
 * Mes présences (P-25) — cadrage « preuve/suivi », pas score-jugement :
 * stats factuelles, taux jamais alarmiste, PENDING = état transitoire normal.
 * Filtre statut persisté en URL (nuqs).
 */
export function AttendanceView({ attendances }: { attendances: AttendanceRow[] }) {
  const [filter, setFilter] = useQueryState("statut", filterParser);

  const counts = attendances.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<AttendanceStatus, number>>,
  );

  const attended = (counts.PRESENT ?? 0) + (counts.LATE ?? 0);
  const pending = counts.PENDING ?? 0;
  // Taux hors PENDING (D4)
  const denominator = attendances.length - pending;
  const rate = denominator > 0 ? Math.round((attended / denominator) * 100) : null;

  const filtered =
    filter === "TOUS"
      ? attendances
      : attendances.filter((a) => a.status === filter);

  return (
    <div className="flex flex-col gap-5">
      {/* Mon suivi — 3 stats factuelles (P-25) */}
      <section className="space-y-2">
        <StudentStatGrid>
          <StudentStat value={attended} label="Cours suivis" />
          <StudentStat
            value={rate !== null ? `${rate}%` : "—"}
            label="Présence"
            accent="text-emerald-600"
          />
          <StudentStat value={pending} label="En attente" accent="text-blue-600" />
        </StudentStatGrid>
        {pending > 0 && (
          <p className="px-1 text-xs text-blue-600">
            {pending} présence{pending > 1 ? "s" : ""} en attente de validation par
            l&apos;enseignant — c&apos;est normal juste après un scan.
          </p>
        )}
      </section>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f;
          const label = f === "TOUS" ? "Tous" : ATTENDANCE_META[f].label;
          const count = f === "TOUS" ? attendances.length : (counts[f] ?? 0);
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
              <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Historique */}
      {filtered.length === 0 ? (
        <StudentEmpty
          illustration={<NotebookIllustration />}
          title={
            filter === "TOUS"
              ? "Aucune présence enregistrée"
              : "Rien dans cette catégorie"
          }
          hint={
            filter === "TOUS"
              ? "Scanne le QR de ton enseignant en cours : chaque séance suivie apparaîtra ici."
              : undefined
          }
        />
      ) : (
        <ul className="space-y-1.5 animate-in fade-in duration-300">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <p className="font-serif truncate text-base leading-snug">
                  {a.schedule.course.name}
                </p>
                <p className="font-display text-xs tabular-nums text-muted-foreground">
                  {format(a.schedule.startTime, "EEE d MMM yyyy · HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>
              <AttendanceStatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
