"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import type { AttendanceStatus } from "@/generated/prisma/client";
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

const LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Présent",
  LATE: "En retard",
  ABSENT: "Absent",
  EXCUSED: "Excusé",
  PENDING: "En attente",
};

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
  const denominator = attendances.length - pending;
  const rate = denominator > 0 ? Math.round((attended / denominator) * 100) : null;

  const filtered =
    filter === "TOUS" ? attendances : attendances.filter((a) => a.status === filter);

  return (
    <div className="flex flex-col gap-10 font-sans">
      {/* Résumé : un seul chiffre */}
      <section>
        <p className="text-5xl font-light tabular-nums tracking-tight">
          {rate !== null ? `${rate}%` : "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          de présence · {attended} cours suivis
          {pending > 0 && ` · ${pending} en attente de validation`}
        </p>
      </section>

      {/* Filtres : texte simple, passe à la ligne */}
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "text-sm transition-colors",
              filter === f
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "TOUS" ? "Tous" : LABEL[f]}
          </button>
        ))}
      </nav>

      {/* Historique */}
      {filtered.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">
          {filter === "TOUS"
            ? "Aucune présence enregistrée. Scanne le QR de ton enseignant en cours."
            : "Rien dans cette catégorie."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex items-baseline justify-between gap-4 border-b border-border/30 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {a.schedule.course.name}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {format(a.schedule.startTime, "EEE d MMM · HH:mm", { locale: fr })}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {LABEL[a.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}