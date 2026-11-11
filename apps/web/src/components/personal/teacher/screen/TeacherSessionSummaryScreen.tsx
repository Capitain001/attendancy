// src/components/personal/teacher/screen/TeacherSessionSummaryScreen.tsx
// apps/web/src/components/personal/teacher/screen/TeacherSessionSummaryScreen.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildAndDownloadSessionAttendancePDF,
  type SessionAttendanceReportData,
} from "@/lib/export/session-attendance/pdf";

interface TeacherSessionSummaryScreenProps {
  report: SessionAttendanceReportData;
  slug: string;
}

function fmtDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

function StatItem({
  value,
  unit,
  label,
}: {
  value: string | number;
  unit?: string;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
        {unit && <span className="ml-0.5 text-lg font-normal text-muted-foreground">{unit}</span>}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function TeacherSessionSummaryScreen({
  report,
  slug,
}: TeacherSessionSummaryScreenProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { schedule, session, summary } = report;
  const startAt = new Date(schedule.startTime);
  const endAt = new Date(schedule.endTime);

  const dateLabel = format(startAt, "EEEE d MMMM yyyy", { locale: fr });
  const slotLabel = `${format(startAt, "HH:mm")} – ${format(endAt, "HH:mm")}`;
  const checkInLabel = session?.checkIn ? format(new Date(session.checkIn), "HH:mm") : null;
  const checkOutLabel = session?.checkOut ? format(new Date(session.checkOut), "HH:mm") : null;

  const audienceLabel = schedule.groupName
    ? `${schedule.className} · ${schedule.groupName}`
    : schedule.className;

  const backHref = `/personal/${encodeURIComponent(slug)}/teacher`;

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await buildAndDownloadSessionAttendancePDF(report);
      toast.success("Rapport de présence téléchargé en PDF.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de générer le rapport PDF.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between bg-background px-6 py-8 text-foreground">
      {/* ── En-tête discret ── */}
      <header className="flex items-center justify-between">
        <Link
          href={backHref}
          aria-label="Retour"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Séance terminée
        </span>
      </header>

      {/* ── Corps : Infos séance & Chiffres clés ── */}
      <main className="my-auto space-y-10 py-8">
        <section className="space-y-2">
          <p className="text-xs capitalize text-muted-foreground">{dateLabel}</p>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">
            {schedule.courseName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {audienceLabel}
            {schedule.roomName ? ` · ${schedule.roomName}` : ""}
          </p>
        </section>

        {/* Grille de statistiques minimaliste */}
        <section className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border/60 py-6">
          <StatItem
            value={`${summary.attended}/${summary.total}`}
            label="Étudiants présents"
          />
          <StatItem
            value={summary.rate}
            unit="%"
            label="Taux de présence"
          />
          <StatItem
            value={fmtDuration(session?.durationMinutes)}
            label="Durée effective"
          />
          <StatItem
            value={slotLabel}
            label={
              checkInLabel && checkOutLabel
                ? `Pointé ${checkInLabel} – ${checkOutLabel}`
                : "Créneau horaire"
            }
          />
        </section>

        {/* Détail discret par statut */}
        <section className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>Présents : {summary.present}</span>
          <span>Retards : {summary.late}</span>
          <span>Excusés : {summary.excused}</span>
          <span>Absents : {summary.absent}</span>
        </section>
      </main>

      {/* ── Actions ── */}
      <footer className="space-y-2.5">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl gap-2 text-[13px] font-medium"
          disabled={isExporting}
          onClick={handleExportPdf}
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Génération du PDF…</span>
            </>
          ) : (
            <>
              <FileDown className="size-4" />
              <span>Exporter le rapport PDF</span>
            </>
          )}
        </Button>

        <Button
          asChild
          size="lg"
          variant="ghost"
          className="h-11 w-full rounded-xl text-[13px] text-muted-foreground"
        >
          <Link href={backHref}>Retour à l&apos;accueil</Link>
        </Button>
      </footer>
    </div>
  );
}

